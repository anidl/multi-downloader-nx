const path = require('path');
const fs = require('fs-extra');

const shlp       = require('sei-helper');
const got        = require('got');
const cookieFile = require('./module.cookieFile');
const yamlCfg    = require('./module.cfg-loader');
const curlReq    = require('./module.curl-req');

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
const Req = class {
  constructor(domain, argv, is_beta){
    // settings and cookies
    this.is_beta = Boolean(is_beta);
    this.loadSessTxt = this.is_beta ? false : true;
    // main cfg
    this.domain  = domain;
    this.argv    = argv;
    // session cfg
    this.sessCfg = yamlCfg.sessCfgFile,
    this.session = this.is_beta ? {} : yamlCfg.loadCRSession();
    this.cfgDir  = yamlCfg.cfgFolder;
    this.curl = false;
  }
  async getData (durl, params) {
    params = params || {};
    // options
    let options = {
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
      options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
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
    // check if cookies.txt exists
    const sessTxtFile = path.join(this.cfgDir, 'cookies.txt');
    if(!this.is_beta && this.loadSessTxt && fs.existsSync(sessTxtFile)){
      const cookiesTxtName = path.basename(sessTxtFile);
      try{
        // console.log(`[INFO] Loading custom ${cookiesTxtName} file...`);
        const netcookie = fs.readFileSync(sessTxtFile, 'utf8');
        fs.unlinkSync(sessTxtFile);
        this.setNewCookie('', true, netcookie);
      }
      catch(e){
        console.log(`[ERROR] Cannot load ${cookiesTxtName} file!`);
      }
    }
    this.loadSessTxt = false;
    // proxy
    if(params.useProxy && this.argv.proxy && this.argv.curl){
      try{
        options.curlProxy =  buildProxy(this.argv.proxy);
        options.curlProxyAuth = this.argv['proxy-auth'];
      }
      catch(e){
        console.log(`[WARN] Not valid proxy URL${e.input?' ('+e.input+')':''}!`);
        console.log('[WARN] Skipping...\n');
        this.argv.proxy = false;
      }
    }
    // if auth
    let cookie = [];
    const loc = new URL(durl);
    if(!this.is_beta && Object.values(this.domain).includes(loc.origin)){
      for(let uCookie of usefulCookies.auth){
        const checkedCookie = this.checkCookieVal(this.session[uCookie]);
        if(checkedCookie){
          cookie.push(uCookie);
        }
      }
      for(let uCookie of usefulCookies.sess){
        if(this.checkSessId(this.session[uCookie]) && !this.argv.nosess){
          cookie.push(uCookie);
        }
      }
      if(!params.skipCookies){
        cookie.push('c_locale');
        options.headers.Cookie = shlp.cookie.make({
          ...{ c_locale : { value: 'enUS' } },
          ...this.session,
        }, cookie);
      }
    }
    // avoid cloudflare protection
    if(loc.origin == this.domain.www){
      options.minVersion = 'TLSv1.3';
      options.maxVersion = 'TLSv1.3';
      options.http2 = true;
    }
    // debug
    options.hooks = {
      beforeRequest: [
        (options) => {
          if(this.argv.debug){
            console.log('[DEBUG] GOT OPTIONS:');
            console.log(options);
          }
        }
      ]
    };
    if(this.argv.debug){ 
      options.curlDebug = true;
    }
    // try do request
    try {
      let res;
      if(this.curl && this.argv.curl &&  Object.values(this.domain).includes(loc.origin)){
        res = await curlReq(this.curl, durl.toString(), options, this.cfgDir);
      }
      else{
        res = await got(durl.toString(), options);
      }
      if(!this.is_beta && !params.skipCookies && res && res.headers && res.headers['set-cookie']){
        this.setNewCookie(res.headers['set-cookie'], false);
        for(let uCookie of usefulCookies.sess){
          if(this.session[uCookie] && this.argv.nosess){
            this.argv.nosess = false;
          }
        }
      }
      return {
        ok: true,
        res,
      };
    }
    catch(error){
      if(error.response && error.response.statusCode && error.response.statusMessage){
        console.log(`[ERROR] ${error.name} ${error.response.statusCode}: ${error.response.statusMessage}`);
      }
      else{
        console.log(`[ERROR] ${error.name}: ${error.code || error.message}`);
      }
      if(error.response && !error.res){
        error.res = error.response;
        const docTitle = error.res.body.match(/<title>(.*)<\/title>/);
        if(error.res.body && docTitle){
          console.log('[ERROR]', docTitle[1]);
        }
      }
      if(error.res && error.res.body && error.response.statusCode 
                && error.response.statusCode != 404 && error.response.statusCode != 403){
        console.log('[ERROR] Body:', error.res.body);
      }
      return {
        ok: false,
        error,
      };
    }
  }
  setNewCookie(setCookie, isAuth, fileData){
    let cookieUpdated = [], lastExp = 0;
    setCookie = fileData ? cookieFile(fileData) : shlp.cookie.parse(setCookie);
    for(let cookieName of Object.keys(setCookie)){
      if(setCookie[cookieName] && setCookie[cookieName].value && setCookie[cookieName].value == 'deleted'){
        delete setCookie[cookieName];
      }
    }
    for(let uCookie of usefulCookies.auth){
      const cookieForceExp = 60*60*24*7;
      const cookieExpCur = this.session[uCookie] ? this.session[uCookie] : { expires: 0 };
      const cookieExp = new Date(cookieExpCur.expires).getTime() - cookieForceExp;
      if(cookieExp > lastExp){
        lastExp = cookieExp;
      }
    }
    for(let uCookie of usefulCookies.auth){
      if(!setCookie[uCookie]){
        continue;
      }
      if(isAuth || setCookie[uCookie] && Date.now() > lastExp){
        this.session[uCookie] = setCookie[uCookie];
        cookieUpdated.push(uCookie);
      }
    }
    for(let uCookie of usefulCookies.sess){
      if(!setCookie[uCookie]){
        continue;
      }
      if(
        isAuth 
                || this.argv.nosess && setCookie[uCookie]
                || setCookie[uCookie] && !this.checkSessId(this.session[uCookie])
      ){
        const sessionExp = 60*60;
        this.session[uCookie]            = setCookie[uCookie];
        this.session[uCookie].expires    = new Date(Date.now() + sessionExp*1000);
        this.session[uCookie]['Max-Age'] = sessionExp.toString();
        cookieUpdated.push(uCookie);
      }
    }
    if(cookieUpdated.length > 0){
      if(this.argv.debug){
        console.log('[SAVING FILE]',`${this.sessCfg}.yml`);
      }
      yamlCfg.saveCRSession(this.session);
      console.log(`[INFO] Cookies were updated! (${cookieUpdated.join(', ')})\n`);
    }
  }
  checkCookieVal(chcookie){
    return     chcookie
                && chcookie.toString()   == '[object Object]'
                && typeof chcookie.value == 'string'
      ?  true : false;
  }
  checkSessId(session_id){
    if(session_id && typeof session_id.expires == 'string'){
      session_id.expires = new Date(session_id.expires);
    }
    return     session_id
                && session_id.toString()     == '[object Object]'
                && typeof session_id.expires == 'object'
                && Date.now() < new Date(session_id.expires).getTime()
                && typeof session_id.value   == 'string'
      ?  true : false;
  }
  uuidv4(){
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
};

function buildProxy(proxyBaseUrl, proxyAuth){
  if(!proxyBaseUrl.match(/^(https?|socks4|socks5):/)){
    proxyBaseUrl = 'http://' + proxyBaseUrl;
  }
    
  let proxyCfg = new URL(proxyBaseUrl);
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

module.exports = {
  buildProxy,
  usefulCookies,
  Req,
};
