import { KeyContainer, Session } from './license';
import fs from 'fs';
import { console } from './log';
import got from 'got';
import { workingDir } from './module.cfg-loader';
import path from 'path';
import { ReadError, Response } from 'got';

//read cdm files located in the same directory
let privateKey: Buffer, identifierBlob: Buffer;
export let canDecrypt: boolean;
try {
  privateKey = fs.readFileSync(path.join(workingDir, 'widevine', 'device_private_key'));
  identifierBlob = fs.readFileSync(path.join(workingDir, 'widevine', 'device_client_id_blob'));
  canDecrypt = true;
} catch (e) {
  canDecrypt = false;
}

export default async function getKeys(pssh: string | undefined, licenseServer: string, authData: Record<string, string>): Promise<KeyContainer[]> {
  if (!pssh || !canDecrypt) return [];
  //pssh found in the mpd manifest
  const psshBuffer = Buffer.from(
    pssh,
    'base64'
  );

  //Create a new widevine session
  const session = new Session({ privateKey, identifierBlob }, psshBuffer);

  //Generate license
  let response;
  try {
    response = await got(licenseServer, {
      method: 'POST',
      body: session.createLicenseRequest(),
      headers: authData,
      responseType: 'text'
    });
  } catch(_error){
    const error = _error as {
      name: string
    } & ReadError & {
      res: Response<unknown>
    };
    if(error.response && error.response.statusCode && error.response.statusMessage){
      console.error(`${error.name} ${error.response.statusCode}: ${error.response.statusMessage}`);
    } else{
      console.error(`${error.name}: ${error.code || error.message}`);
    }
    if(error.response && !error.res){
      error.res = error.response;
      const docTitle = (error.res.body as string).match(/<title>(.*)<\/title>/);
      if(error.res.body && docTitle){
        console.error(docTitle[1]);
      }
    }
    if(error.res && error.res.body && error.response.statusCode 
      && error.response.statusCode != 404 && error.response.statusCode != 403){
      console.error('Body:', error.res.body);
    }
    return [];
  }

  if (response.statusCode === 200) {
    //Parse License and return keys
    try {
      const json = JSON.parse(response.body);
      return session.parseLicense(Buffer.from(json['license'], 'base64'));
    } catch {
      return session.parseLicense(response.rawBody);
    }
  } else {
    console.info('License request failed:', response.statusMessage, response.body);
    return [];
  }
}
