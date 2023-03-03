// build-in
import child_process from 'child_process';
import fs from 'fs-extra';
import { Headers } from 'got';
import path from 'path';
import { console } from './log';

export type CurlOptions = {
  headers?: Headers,
  curlProxy?: boolean,
  curlProxyAuth?: string,
  minVersion?: string,
  http2?: boolean,
  body?: unknown,
  curlDebug?: boolean
} | undefined;

export type Res = {
  httpVersion: string,
  statusCode: string,
  statusMessage: string,
  rawHeaders: string,
  headers: Record<string, string[]|string>,
  rawBody: Buffer,
  body: string,
}

// req
const curlReq = async (curlBin: string, url: string, options: CurlOptions, cache: string) => {
    
  const curlOpt = [
    `"${curlBin}"`,
    `"${url}"`,
  ];
    
  options = options || {};
    
  if(options.headers && Object.keys(options.headers).length > 0){
    for(const h of Object.keys(options.headers)){
      const hC = options.headers[h];
      curlOpt.push('-H', `"${h}: ${hC}"`);
    }
  }
    
  if(options.curlProxy){
    curlOpt.push('--proxy-insecure', '-x', `"${options.curlProxy}"`);
    if(options.curlProxyAuth && typeof options.curlProxyAuth == 'string' && options.curlProxyAuth.match(':')){
      curlOpt.push('-U', `"${options.curlProxyAuth}"`);
    }
  }
    
  const reqId = uuidv4();
  const headFile = path.join(cache, `/res-headers-${reqId}`);
  const bodyFile = path.join(cache, `/res-body-${reqId}`);
  const errFile = path.join(cache, `/res-err-${reqId}`);
    
  curlOpt.push('-D', `"${headFile}"`);
  curlOpt.push('-o', `"${bodyFile}"`);
  curlOpt.push('--stderr', `"${errFile}"`);
  curlOpt.push('-L', '-s', '-S');
    
  if(options.minVersion == 'TLSv1.3'){
    curlOpt.push('--tlsv1.3');
  }
  if(options.http2){
    curlOpt.push('--http2');
  }
    
  if(options.body){
    curlOpt.push('--data-urlencode', `"${options.body}"`);
  }
    
  const curlComm = curlOpt.join(' ');
    
  try{
    if(options.curlDebug){
      console.info(curlComm, '\n');
    }
    child_process.execSync(curlComm, { stdio: 'inherit', windowsHide: true });
  }
  catch(next){
    const errData = { name: 'RequestError', message: 'EACCES' };
    try{ 
      fs.unlinkSync(headFile);
    }
    catch(e){
      // ignore it...
    }
    try{
      errData.message = 
                fs.readFileSync(errFile, 'utf8')
                  .replace(/^curl: /, '');
      fs.unlinkSync(errFile);
    }
    catch(e){
      // ignore it...
    }
    throw errData;
  }
    
  const rawHeaders = fs.readFileSync(headFile, 'utf8');
  const rawBody    = fs.readFileSync(bodyFile);
  fs.unlinkSync(headFile);
  fs.unlinkSync(bodyFile);
  fs.unlinkSync(errFile);
    
  const res: Res = {
    httpVersion: '',
    statusCode: '',
    statusMessage: '',
    rawHeaders: rawHeaders,
    headers: {},
    rawBody: rawBody,
    body: rawBody.toString(),
  };
    
  const headersCont = rawHeaders.replace(/\r/g, '').split('\n');
    
  for(const h of headersCont){
    if( h == '' ){ continue; }
    if(!h.match(':')){
      const statusRes = h.split(' ');
      res.httpVersion = statusRes[0].split('/')[1];
      res.statusCode = statusRes[1];
      res.statusMessage = statusRes.slice(2).join(' ');
    }
    else{
      const resHeader = h.split(': ');
      const resHeadName = resHeader[0].toLowerCase();
      const resHeadCont = resHeader.slice(1).join(': ');
      if(resHeadName == 'set-cookie'){
        if(!Object.prototype.hasOwnProperty.call(res.headers, resHeadName)){
          res.headers[resHeadName] = [];
        }
        (res.headers[resHeadName] as string[]).push(resHeadCont);
      }
      else{
        res.headers[resHeadName] = resHeadCont;
      }
    }
  }
    
  if(!res.statusCode.match(/^(2|3)\d\d$/)){
    const httpStatusMessage = res.statusMessage ? ` (${res.statusMessage})` : '';
    throw { 
      name: 'HTTPError',
      message: `Response code ${res.statusCode}${httpStatusMessage}`,
      response: res
    };
  }
    
  return res;
    
};

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default curlReq;
