import * as yamlCfg from './module.cfg-loader';
import { console } from './log';

export type Params = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  headers?: Record<string, string>,
  body?: string | Buffer,
  binary?: boolean,
  followRedirect?: 'follow' | 'error' | 'manual'
}

// req
export class Req {
  private sessCfg: string;
  private service: 'cr'|'hd'|'ao'|'adn';
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
  
  constructor(private domain: Record<string, unknown>, private debug: boolean, private nosess = false, private type: 'cr'|'hd'|'ao'|'adn') {
    this.sessCfg = yamlCfg.sessCfgFile[type];
    this.service = type;
  }

  async getData(durl: string, params?: RequestInit) {
    params = params || {};
    // options
    const options: RequestInit = {
      method: params.method ? params.method : 'GET',
    };
    // additional params
    if(params.headers){
      options.headers = params.headers;
    }
    if(params.body){
      options.body = params.body;
    }
    if(typeof params.redirect == 'string'){
      options.redirect = params.redirect;
    }
    // debug
    if(this.debug){
      console.debug('[DEBUG] FETCH OPTIONS:');
      console.debug(options);
    }
    // try do request
    try {
      const res = await fetch(durl, options);
      if (!res.ok) {
        console.error(`${res.status}: ${res.statusText}`);
        const body = await res.text();
        const docTitle = body.match(/<title>(.*)<\/title>/);
        if(body && docTitle){
          console.error(docTitle[1]);
        } else {
          console.error(body);
        }
      }
      return {
        ok: res.ok,
        res
      };
    }
    catch(_error){
      const error = _error as {
        name: string
      } & TypeError & {
        res: Response
      };
      if (error.res && error.res.status && error.res.statusText) {
        console.error(`${error.name} ${error.res.status}: ${error.res.statusText}`);
      } else {
        console.error(`${error.name}: ${error.res?.statusText || error.message}`);
      }
      if(error.res) {
        const body = await error.res.text();
        const docTitle = body.match(/<title>(.*)<\/title>/);
        if(body && docTitle){
          console.error(docTitle[1]);
        }
      }
      return {
        ok: false,
        error,
      };
    }
  }
}
    
export function buildProxy(proxyBaseUrl: string, proxyAuth: string){
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
    