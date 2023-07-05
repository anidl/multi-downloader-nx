import shlp from 'sei-helper';
import got, { Headers, Method, Options, ReadError, Response } from 'got';
import cookieFile from './module.cookieFile';
import * as yamlCfg from './module.cfg-loader';
import { console } from './log';
//import curlReq from './module.curl-req';

export type Params = {
  method?: Method,
  headers?: Headers,
  body?: string | Buffer,
  binary?: boolean,
  followRedirect?: boolean
}

// set usable cookies
const usefulCookies = {
  auth: [
    'etp_rt',
    'c_visitor',
  ],
  sess: [ 
    'session_id',
  ],
};

// req
class Req {
  private sessCfg: string;
  private service: 'cr'|'funi'|'hd';
  private session: Record<string, {
    value: string;
    expires: Date;
    path: string;
    domain: string;
    secure: boolean;
    'Max-Age'?: string
  }> = {};
  private cfgDir = yamlCfg.cfgDir;
  private curl: boolean|string = false;
  
  constructor(private domain: Record<string, unknown>, private debug: boolean, private nosess = false, private type: 'cr'|'funi'|'hd') {
    this.sessCfg = yamlCfg.sessCfgFile[type];
    this.service = type;
  }
  async getData<T = string> (durl: string, params?: Params) {
    params = params || {};
    // options
    const options: Options & {
      minVersion?: string,
      maxVersion?: string
      curlDebug?: boolean
    } = {
      method: params.method ? params.method : 'GET',
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:90.0) Gecko/20100101 Firefox/90.0',
      },
    };
    // additional params
    if(params.headers){
      options.headers = {...options.headers, ...params.headers};
    }
    if(options.method == 'POST'){
      (options.headers as Headers)['Content-Type'] = 'application/x-www-form-urlencoded';
    }
    if(params.body){
      options.body = params.body;
    }
    if(params.binary == true){
      options.responseType = 'buffer';
    }
    if(typeof params.followRedirect == 'boolean'){
      options.followRedirect = params.followRedirect;
    }
    // if auth
    //const loc = new URL(durl);
    // avoid cloudflare protection
    // debug
    options.hooks = {
      beforeRequest: [
        (options) => {
          if(this.debug){
            console.debug('[DEBUG] GOT OPTIONS:');
            console.debug(options);
          }
        }
      ]
    };
    if(this.debug){ 
      options.curlDebug = true;
    }
    // try do request
    try {
      const res = await got(durl.toString(), options) as unknown as Response<T>;
      return {
        ok: true,
        res
      };
    }
    catch(_error){
      const error = _error as {
        name: string
      } & ReadError & {
        res: Response<unknown>
      };
      if(error.response && error.response.statusCode && error.response.statusMessage){
        console.error(`${error.name} ${error.response.statusCode}: ${error.response.statusMessage}`);
      }
      else{
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
      return {
        ok: false,
        error,
      };
    }
  }
  setNewCookie(setCookie: Record<string, string>, isAuth: boolean, fileData?: string){
    const cookieUpdated: string[] = []; let lastExp = 0;
    console.trace('Type of setCookie:', typeof setCookie, setCookie);
    const parsedCookie = fileData ? cookieFile(fileData) : shlp.cookie.parse(setCookie);
    for(const cookieName of Object.keys(parsedCookie)){
      if(parsedCookie[cookieName] && parsedCookie[cookieName].value && parsedCookie[cookieName].value == 'deleted'){
        delete parsedCookie[cookieName];
      }
    }
    for(const uCookie of usefulCookies.auth){
      const cookieForceExp = 60*60*24*7;
      const cookieExpCur = this.session[uCookie] ? this.session[uCookie] : { expires: 0 };
      const cookieExp = new Date(cookieExpCur.expires).getTime() - cookieForceExp;
      if(cookieExp > lastExp){
        lastExp = cookieExp;
      }
    }
    for(const uCookie of usefulCookies.auth){
      if(!parsedCookie[uCookie]){
        continue;
      }
      if(isAuth || parsedCookie[uCookie] && Date.now() > lastExp){
        this.session[uCookie] = parsedCookie[uCookie];
        cookieUpdated.push(uCookie);
      }
    }
    for(const uCookie of usefulCookies.sess){
      if(!parsedCookie[uCookie]){
        continue;
      }
      if(
        isAuth 
          || this.nosess && parsedCookie[uCookie]
          || parsedCookie[uCookie] && !this.checkSessId(this.session[uCookie])
      ){
        const sessionExp = 60*60;
        this.session[uCookie]            = parsedCookie[uCookie];
        this.session[uCookie].expires    = new Date(Date.now() + sessionExp*1000);
        this.session[uCookie]['Max-Age'] = sessionExp.toString();
        cookieUpdated.push(uCookie);
      }
    }
    if(cookieUpdated.length > 0){
      if(this.debug){
        console.info('[SAVING FILE]',`${this.sessCfg}.yml`);
      }
      if (this.type === 'cr') {
        yamlCfg.saveCRSession(this.session);
      } else if (this.type === 'hd') {
        yamlCfg.saveHDSession(this.session);
      }
      console.info(`Cookies were updated! (${cookieUpdated.join(', ')})\n`);
    }
  }
  checkCookieVal(chcookie: Record<string, string>){
    return     chcookie
        && chcookie.toString()   == '[object Object]'
        && typeof chcookie.value == 'string'
      ?  true : false;
  }
  checkSessId(session_id: Record<string, unknown>){
    if(session_id && typeof session_id.expires == 'string'){
      session_id.expires = new Date(session_id.expires);
    }
    return     session_id
        && session_id.toString()     == '[object Object]'
        && typeof session_id.expires == 'object'
        && Date.now() < new Date(session_id.expires as any).getTime()
        && typeof session_id.value   == 'string'
      ?  true : false;
  }
  uuidv4(){
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
    
function buildProxy(proxyBaseUrl: string, proxyAuth: string){
  if(!proxyBaseUrl.match(/^(https?|socks4|socks5):/)){
    proxyBaseUrl = 'http://' + proxyBaseUrl;
  }
      
  const proxyCfg = new URL(proxyBaseUrl);
  let proxyStr = `${proxyCfg.protocol}//`;
      
  if(typeof proxyCfg.hostname != 'string' || proxyCfg.hostname == ''){
    throw new Error('[ERROR] Hostname and port required for proxy!');
  }
      
  if(proxyAuth && typeof proxyAuth == 'string' && proxyAuth.match(':')){
    proxyCfg.username = proxyAuth.split(':')[0];
    proxyCfg.password = proxyAuth.split(':')[1];
    proxyStr += `${proxyCfg.username}:${proxyCfg.password}@`;
  }
      
  proxyStr += proxyCfg.hostname;
      
  if(!proxyCfg.port && proxyCfg.protocol == 'http:'){
    proxyStr += ':80';
  }
  else if(!proxyCfg.port && proxyCfg.protocol == 'https:'){
    proxyStr += ':443';
  }
      
  return proxyStr;
}
    
export {
  buildProxy,
  usefulCookies,
  Req,
};
    