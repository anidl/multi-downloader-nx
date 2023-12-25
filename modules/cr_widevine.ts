import { KeyContainer, Session } from './license';
import fs from 'fs';
import { console } from './log';

//read cdm files located in the same directory
const privateKey = fs.readFileSync('./widevine/device_private_key');
const identifierBlob = fs.readFileSync('./widevine/device_client_id_blob');

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
  const response = await fetch(licenseServer, {
    method: 'POST',
    body: session.createLicenseRequest(),
    headers: authData
  });

  if (response.ok) {
    //Parse License and return keys
    const json = await response.json();
    const keys = session.parseLicense(Buffer.from(json['license'], 'base64'));
    return keys;
  } else {
    console.info('License request failed:', response.statusText);
    return [];
  }
}