import fs from 'fs';
import { console } from './log';
import { workingDir } from './module.cfg-loader';
import path from 'path';
import { KeyContainer, Session } from './widevine/license';
import * as reqModule from './module.fetch';
import Playready from 'node-playready';

const req = new reqModule.Req();

//read cdm files located in the same directory
let privateKey: Buffer = Buffer.from([]),
	identifierBlob: Buffer = Buffer.from([]),
	prd_cdm: Playready | undefined;
export let cdm: 'widevine' | 'playready';
export let canDecrypt: boolean;
try {
	const files_prd = fs.readdirSync(path.join(workingDir, 'playready'));
	const bgroup_file_found = files_prd.find((f) => f === 'bgroupcert.dat');
	const zgpriv_file_found = files_prd.find((f) => f === 'zgpriv.dat');
	const prd_file_found = files_prd.find((f) => f.endsWith('.prd'));
	try {
		const file_bgroup = path.join(workingDir, 'playready', 'bgroupcert.dat');
		const file_zgpriv = path.join(workingDir, 'playready', 'zgpriv.dat');

		if (bgroup_file_found && zgpriv_file_found) {
			const bgroup_stats = fs.statSync(file_bgroup);
			const zgpriv_stats = fs.statSync(file_zgpriv);

			// Zgpriv is always 32 bytes long
			if (bgroup_stats.isFile() && zgpriv_stats.isFile() && zgpriv_stats.size === 32) {
				const bgroup = fs.readFileSync(file_bgroup);
				const zgpriv = fs.readFileSync(file_zgpriv);

				// Init Playready Client
				prd_cdm = Playready.init(bgroup, zgpriv);
			}
		} else if ((!bgroup_file_found || !zgpriv_file_found) && prd_file_found) {
			const file_prd = path.join(workingDir, 'playready', prd_file_found);

			// Parse PRD file
			const parsed = Playready.unpackV3PRD(fs.readFileSync(file_prd));

			// Write bgroupcert.dat
			fs.writeFileSync(file_bgroup, parsed.bgroupcert);
			// Write zgpriv.dat
			fs.writeFileSync(file_zgpriv, parsed.zgpriv);

			// Delete PRD file
			try {
				fs.rmSync(file_prd, { recursive: true, force: true });
			} catch (e) {
				console.warn('Failed to delete unused .prd file.');
			}

			console.warn('Converted deprecated .prd file into bgroupcert.dat and zgpriv.dat.');

			prd_cdm = Playready.init(parsed.bgroupcert, parsed.zgpriv);
		}
	} catch (e) {
		console.error('Error loading Playready CDM. For more informations read the readme.');
		console.error(e);
	}

	const files_wvd = fs.readdirSync(path.join(workingDir, 'widevine'));
	try {
		files_wvd.forEach(function (file) {
			file = path.join(workingDir, 'widevine', file);
			const stats = fs.statSync(file);
			if (stats.size < 1024 * 8 && stats.isFile()) {
				const fileContents = fs.readFileSync(file, { encoding: 'utf8' });
				if (
					(fileContents.includes('-----BEGIN RSA PRIVATE KEY-----') && fileContents.includes('-----END RSA PRIVATE KEY-----')) ||
					(fileContents.includes('-----BEGIN PRIVATE KEY-----') && fileContents.includes('-----END PRIVATE KEY-----'))
				) {
					privateKey = fs.readFileSync(file);
				}
				if (fileContents.includes('widevine_cdm_version') && fileContents.includes('oem_crypto_security_patch_level') && !fileContents.startsWith('WVD')) {
					identifierBlob = fs.readFileSync(file);
				}
				if (fileContents.startsWith('WVD')) {
					console.warn(
						'Found WVD file in folder, AniDL currently only supports device_client_id_blob and device_private_key, make sure to have them in the widevine folder.'
					);
				}
			}
		});
	} catch (e) {
		console.error('Error loading Widevine CDM, malformed client blob or private key.');
		privateKey = Buffer.from([]);
		identifierBlob = Buffer.from([]);
	}

	if (privateKey.length !== 0 && identifierBlob.length !== 0) {
		cdm = 'widevine';
		canDecrypt = true;
	} else if (prd_cdm) {
		cdm = 'playready';
		canDecrypt = true;
	} else if (privateKey.length === 0 && identifierBlob.length !== 0) {
		console.warn('Private key missing');
		canDecrypt = false;
	} else if (identifierBlob.length === 0 && privateKey.length !== 0) {
		console.warn('Identifier blob missing');
		canDecrypt = false;
	} else {
		canDecrypt = false;
	}
} catch (e) {
	console.error(e);
	canDecrypt = false;
}

export async function getKeysWVD(pssh: string | undefined, licenseServer: string, authData: Record<string, string>): Promise<KeyContainer[]> {
	if (!pssh || !canDecrypt) return [];
	// pssh found in the mpd manifest
	const psshBuffer = Buffer.from(pssh, 'base64');

	// Create a new widevine session
	const session = new Session({ privateKey, identifierBlob }, psshBuffer);

	// Request License
	const licReq = await req.getData(licenseServer, {
		method: 'POST',
		body: session.createLicenseRequest(),
		headers: authData
	});

	if (!licReq.ok || !licReq.res) {
		console.error('License fetch Failed!');
		return [];
	}

	const lic = await licReq.res.arrayBuffer();
	const lictext = new TextDecoder().decode(lic);
	try {
		const json = JSON.parse(lictext);
		return session.parseLicense(Buffer.from(json['license'], 'base64')) as KeyContainer[];
	} catch {
		return session.parseLicense(Buffer.from(new Uint8Array(lic))) as KeyContainer[];
	}
}

export async function getKeysPRD(pssh: string | undefined, licenseServer: string, authData: Record<string, string>): Promise<KeyContainer[]> {
	if (!pssh || !canDecrypt || !prd_cdm) return [];

	// Generate Playready challenge
	const session = await prd_cdm.generateChallenge(pssh);

	// Fetch license
	const licReq = await req.getData(licenseServer, {
		method: 'POST',
		body: session,
		headers: authData
	});

	if (!licReq.ok || !licReq.res) {
		console.error('License fetch Failed!');
		return [];
	}

	// Parse License and return keys
	try {
		const keys = await prd_cdm.parseLicense(Buffer.from(await licReq.res.text(), 'utf-8'));
		return keys.map((k) => {
			return {
				kid: k.kid,
				key: k.key
			};
		});
	} catch {
		console.error('License parsing failed');
		return [];
	}
}
