import { KeyContainer, Session } from './license';
import fs from 'fs';
import { console } from './log';
import got from 'got';
import { workingDir } from './module.cfg-loader';
import path from 'path';
import { ReadError, Response } from 'got';

//read cdm files located in the same directory
let privateKey: Buffer = Buffer.from([]), identifierBlob: Buffer = Buffer.from([]);
export let canDecrypt: boolean;
try {
  const files = fs.readdirSync(path.join(workingDir, 'widevine'));
  files.forEach(function(file) {
    file = path.join(workingDir, 'widevine', file);
    const stats = fs.statSync(file);
    if (stats.size < 1024*8 && stats.isFile()) {
      const fileContents = fs.readFileSync(file, {'encoding': 'utf8'});
      if (fileContents.includes('-BEGIN PRIVATE KEY-') || fileContents.includes('-BEGIN RSA PRIVATE KEY-')) {
        privateKey = fs.readFileSync(file);
      }
      if (fileContents.includes('widevine_cdm_version')) {
        identifierBlob = fs.readFileSync(file);
      }
    }
  });

  if (privateKey.length !== 0 && identifierBlob.length !== 0) {
    canDecrypt = true;
  } else if (privateKey.length == 0) {
    console.warn('Private key missing');
    canDecrypt = false;
  } else if (identifierBlob.length == 0) {
    console.warn('Identifier blob missing');
    canDecrypt = false;
  }
} catch (e) {
  console.error(e);
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
