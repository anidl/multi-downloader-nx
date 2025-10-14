import fs from 'fs';
import { console } from './log';
import { workingDir } from './module.cfg-loader';
import path from 'path';
import { Device } from './playready/device';
import Cdm from './playready/cdm';
import { PSSH } from './playready/pssh';
import { KeyContainer, Session } from './widevine/license';
import * as reqModule from './module.fetch';

const req = new reqModule.Req();

//read cdm files located in the same directory
let privateKey: Buffer = Buffer.from([]),
	identifierBlob: Buffer = Buffer.from([]),
	prd: Buffer = Buffer.from([]),
	prd_cdm: Cdm | undefined;
export let cdm: 'widevine' | 'playready';
export let canDecrypt: boolean;
try {
	const files_prd = fs.readdirSync(path.join(workingDir, 'playready'));
	const prd_file_found = files_prd.find((f) => f.includes('.prd'));
	try {
		if (prd_file_found) {
			const file_prd = path.join(workingDir, 'playready', prd_file_found);
			const stats = fs.statSync(file_prd);
			if (stats.size < 1024 * 8 && stats.isFile()) {
				const fileContents = fs.readFileSync(file_prd, {
					encoding: 'utf8'
				});
				if (fileContents.includes('CERT')) {
					prd = fs.readFileSync(file_prd);
					const device = Device.loads(prd);
					prd_cdm = Cdm.fromDevice(device);
				}
			}
		}
	} catch (e) {
		console.error('Error loading Playready CDM, ensure the CDM is provisioned as a V3 Device and not malformed. For more informations read the readme.');
		prd = Buffer.from([]);
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
	} else if (prd.length !== 0) {
		cdm = 'playready';
		canDecrypt = true;
	} else if (privateKey.length === 0 && identifierBlob.length !== 0) {
		console.warn('Private key missing');
		canDecrypt = false;
	} else if (identifierBlob.length === 0 && privateKey.length !== 0) {
		console.warn('Identifier blob missing');
		canDecrypt = false;
	} else if (prd.length == 0) {
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
	//pssh found in the mpd manifest
	const psshBuffer = Buffer.from(pssh, 'base64');

	//Create a new widevine session
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
	const pssh_parsed = new PSSH(pssh);

	//Create a new playready session
	const session = prd_cdm.getLicenseChallenge(pssh_parsed.get_wrm_headers(true)[0]);

	//Generate license
	const licReq = await req.getData(licenseServer, {
		method: 'POST',
		body: session,
		headers: authData
	});

	if (!licReq.ok || !licReq.res) {
		console.error('License fetch Failed!');
		return [];
	}

	//Parse License and return keys
	try {
		const keys = prd_cdm.parseLicense(await licReq.res.text());

		return keys.map((k) => {
			return {
				kid: k.key_id,
				key: k.key
			};
		});
	} catch {
		console.error('License parsing failed');
		return [];
	}
}
