import fs from 'fs';
import { console } from './log';
import { workingDir } from './module.cfg-loader';
import path from 'path';
import * as reqModule from './module.fetch';
import Playready from 'node-playready';
import Widevine, { KeyContainer, LicenseType } from 'widevine';

const req = new reqModule.Req();

//read cdm files located in the same directory
let widevine: Widevine | undefined, playready: Playready | undefined;
export let cdm: 'widevine' | 'playready';
export let canDecrypt: boolean;
try {
	const files_prd = fs.readdirSync(path.join(workingDir, 'playready'));
	const bgroup_file_found = files_prd.find((f) => f.includes('bgroupcert'));
	const zgpriv_file_found = files_prd.find((f) => f.includes('zgpriv'));
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
				playready = Playready.init(bgroup, zgpriv);
			}
		} else if (prd_file_found) {
			const file_prd = path.join(workingDir, 'playready', prd_file_found);
			const prd = fs.readFileSync(file_prd);

			// Init Playready Client with PRD file
			playready = Playready.initPRD(prd);
		}
	} catch (e) {
		console.error('Error loading Playready CDM. For more informations read the readme.');
		console.error(e);
	}

	const files_wvd = fs.readdirSync(path.join(workingDir, 'widevine'));
	try {
		let identifierBlob: Buffer = Buffer.from([]);
		let privateKey: Buffer = Buffer.from([]);
		let wvd: Buffer = Buffer.from([]);

		// Searching files for client id blob and private key
		files_wvd.forEach(function (file) {
			file = path.join(workingDir, 'widevine', file);
			const stats = fs.statSync(file);
			if (stats.size < 1024 * 8 && stats.isFile()) {
				const fileContents = fs.readFileSync(file, { encoding: 'utf8' });
				// Handle client id blob
				if (fileContents.includes('widevine_cdm_version') && fileContents.includes('oem_crypto_security_patch_level') && !fileContents.startsWith('WVD')) {
					identifierBlob = fs.readFileSync(file);
				}
				// Handle private key
				if (
					(fileContents.includes('-----BEGIN RSA PRIVATE KEY-----') && fileContents.includes('-----END RSA PRIVATE KEY-----')) ||
					(fileContents.includes('-----BEGIN PRIVATE KEY-----') && fileContents.includes('-----END PRIVATE KEY-----'))
				) {
					privateKey = fs.readFileSync(file);
				}
				// Handle WVD file
				if (fileContents.startsWith('WVD')) {
					wvd = fs.readFileSync(file);
				}
			}
		});

		// Error if no client blob but private key
		if (identifierBlob.length === 0 && privateKey.length !== 0 && wvd.length === 0) {
			console.error('Widevine initialization failed, found private key but not the client id blob!');
		}

		// Error if no private key but client blob
		if (identifierBlob.length !== 0 && privateKey.length === 0 && wvd.length === 0) {
			console.error('Widevine initialization failed, found client id blob but not the private key!');
		}

		// Init Widevine Client
		if (identifierBlob.length !== 0 && privateKey.length !== 0) {
			widevine = Widevine.init(identifierBlob, privateKey);
		} else if (wvd.length !== 0) {
			widevine = Widevine.initWVD(wvd);
		}
	} catch (e) {
		console.error('Error loading Widevine CDM, malformed client blob or private key.');
	}

	if (widevine) {
		cdm = 'widevine';
		canDecrypt = true;
	} else if (playready) {
		cdm = 'playready';
		canDecrypt = true;
	} else {
		canDecrypt = false;
	}
} catch (e) {
	console.error(e);
	canDecrypt = false;
}

export async function getKeysWVD(pssh: string | undefined, licenseServer: string, authData: Record<string, string>): Promise<KeyContainer[]> {
	if (!pssh || !canDecrypt || !widevine) return [];
	// pssh found in the mpd manifest
	const psshBuffer = Buffer.from(pssh, 'base64');

	// Create a new widevine session
	const session = widevine.createSession(psshBuffer, LicenseType.STREAMING);

	// Request License
	const licReq = await req.getData(licenseServer, {
		method: 'POST',
		body: session.generateChallenge(),
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
	if (!pssh || !canDecrypt || !playready) return [];

	// Generate Playready challenge
	const session = playready.generateChallenge(pssh);

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
		const keys = playready.parseLicense(Buffer.from(await licReq.res.text(), 'utf-8'));
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
