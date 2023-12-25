import { KeyContainer, Session } from './license';
import fs from 'fs';
import { console } from './log';
import got from 'got';
import { workingDir } from './module.cfg-loader';
import path from 'path';

//read cdm files located in the same directory
const privateKey = fs.readFileSync(path.join(workingDir, 'widevine', 'device_private_key'));
const identifierBlob = fs.readFileSync(path.join(workingDir, 'widevine', 'device_client_id_blob'));

export default async function getKeys(pssh: string | undefined, licenseServer: string, authData: Record<string, string>): Promise<KeyContainer[]> {
  if (!pssh) return [];
  //pssh found in the mpd manifest
  const psshBuffer = Buffer.from(
    pssh,
    'base64'
  );

  //Create a new widevine session
  const session = new Session({ privateKey, identifierBlob }, psshBuffer);

  //Generate license
  const response = await got(licenseServer, {
    method: 'POST',
    body: session.createLicenseRequest(),
    headers: authData,
    responseType: 'text'
  });

  if (response.statusCode === 200) {
    //Parse License and return keys
    const json = JSON.parse(response.body);
    const keys = session.parseLicense(Buffer.from(json['license'], 'base64'));
    return keys;
  } else {
    console.info('License request failed:', response.statusMessage);
    return [];
  }
}
