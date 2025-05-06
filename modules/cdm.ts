import { KeyContainer, Session } from './license';
import fs from 'fs';
import { console } from './log';
import got from 'got';
import { workingDir } from './module.cfg-loader';
import path from 'path';
import { ReadError, Response } from 'got';
import { Device } from './playready/device';
import Cdm from './playready/cdm';
import { PSSH } from './playready/pssh';

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
          encoding: 'utf8',
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
          fileContents.includes('-BEGIN PRIVATE KEY-') ||
          fileContents.includes('-BEGIN RSA PRIVATE KEY-')
        ) {
          privateKey = fs.readFileSync(file);
        }
        if (fileContents.includes('widevine_cdm_version')) {
          identifierBlob = fs.readFileSync(file);
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

export async function getKeysWVD(
  pssh: string | undefined,
  licenseServer: string,
  authData: Record<string, string>
): Promise<KeyContainer[]> {
  if (!pssh || !canDecrypt) return [];
  //pssh found in the mpd manifest
  const psshBuffer = Buffer.from(pssh, 'base64');

  //Create a new widevine session
  const session = new Session({ privateKey, identifierBlob }, psshBuffer);

  //Generate license
  let response;
  try {
    response = await fetch(licenseServer, {
      method: 'POST',
      body: session.createLicenseRequest(),
      headers: authData
    });
  } catch (_error) {
    const error = _error as {
      name: string;
    } & ReadError & {
        res: Response<unknown>;
      };
    if (
      error.response &&
      error.response.statusCode &&
      error.response.statusMessage
    ) {
      console.error(
        `${error.name} ${error.response.statusCode}: ${error.response.statusMessage}`
      );
    } else {
      console.error(`${error.name}: ${error.code || error.message}`);
    }
    if (error.response && !error.res) {
      error.res = error.response;
      const docTitle = (error.res.body as string).match(/<title>(.*)<\/title>/);
      if (error.res.body && docTitle) {
        console.error(docTitle[1]);
      }
    }
    if (
      error.res &&
      error.res.body &&
      error.response.statusCode &&
      error.response.statusCode != 404 &&
      error.response.statusCode != 403
    ) {
      console.error('Body:', error.res.body);
    }
    return [];
  }

  if (response.status === 200) {
    //Parse License and return keys
    const buffer = await response.arrayBuffer();
    const text = new TextDecoder().decode(buffer);
    try {
      const json = JSON.parse(text);
      return session.parseLicense(Buffer.from(json['license'], 'base64'));
    } catch {
      return session.parseLicense(Buffer.from(new Uint8Array(buffer)));
    }
  } else {
    console.info(
      'License request failed:',
      response.status,
      await response.text()
    );
    return [];
  }
}

export async function getKeysPRD(
  pssh: string | undefined,
  licenseServer: string,
  authData: Record<string, string>
): Promise<KeyContainer[]> {
  if (!pssh || !canDecrypt || !prd_cdm) return [];
  const pssh_parsed = new PSSH(pssh);

  //Create a new playready session
  const session = prd_cdm.getLicenseChallenge(
    pssh_parsed.get_wrm_headers(true)[0]
  );

  //Generate license
  let response;
  try {
    response = await got(licenseServer, {
      method: 'POST',
      body: session,
      headers: authData,
      responseType: 'text',
    });
  } catch (_error) {
    const error = _error as {
      name: string;
    } & ReadError & {
        res: Response<unknown>;
      };
    if (
      error.response &&
      error.response.statusCode &&
      error.response.statusMessage
    ) {
      console.error(
        `${error.name} ${error.response.statusCode}: ${error.response.statusMessage}`
      );
    } else {
      console.error(`${error.name}: ${error.code || error.message}`);
    }
    if (error.response && !error.res) {
      error.res = error.response;
      const docTitle = (error.res.body as string).match(/<title>(.*)<\/title>/);
      if (error.res.body && docTitle) {
        console.error(docTitle[1]);
      }
    }
    if (
      error.res &&
      error.res.body &&
      error.response.statusCode &&
      error.response.statusCode != 404 &&
      error.response.statusCode != 403
    ) {
      console.error('Body:', error.res.body);
    }
    return [];
  }

  if (response.statusCode === 200) {
    //Parse License and return keys
    try {
      const keys = prd_cdm.parseLicense(response.body);

      return keys.map((k) => {
        return {
          kid: k.key_id,
          key: k.key,
        };
      });
    } catch {
      return [];
    }
  } else {
    console.info(
      'License request failed:',
      response.statusMessage,
      response.body
    );
    return [];
  }
}
