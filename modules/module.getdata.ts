import got, { OptionsOfUnknownResponseBody, ReadError, Response, ResponseType } from 'got';
import { console } from './log';

// Used for future updates
// const argv = require('../funi').argv;
// 
// const lang = {
// 'ptBR': {
// langCode: 'pt-BR',
// regionCode: 'BR'
// },
// 'esLA': {
// langCode: 'es-LA',
// regionCode: 'MX'
// }
// };


export type Options = {
  url: string,
  responseType?: ResponseType,
  baseUrl?: string,
  querystring?: Record<string, any>,
  auth?: {
    user: string,
    pass: string
  },
  useToken?: boolean,
  token?: string|boolean,
  dinstid?: boolean|string,
  debug?: boolean
}
// TODO convert to class
const getData = async <T = string>(options: Options) => {
  const regionHeaders = {};


  const gOptions = { 
    url: options.url, 
    http2: true,
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:70.0) Gecko/20100101 Firefox/70.0',
      'Accept-Encoding': 'gzip',
      ...regionHeaders
    }
  } as OptionsOfUnknownResponseBody;
  if(options.responseType) {
    gOptions.responseType = options.responseType;
  }
  if(options.baseUrl){
    gOptions.prefixUrl = options.baseUrl;
    gOptions.url = gOptions.url?.toString().replace(/^\//,'');
  }
  if(options.querystring){
    gOptions.url += `?${new URLSearchParams(options.querystring).toString()}`;
  }
  if(options.auth){
    gOptions.method = 'POST';
    const newHeaders = {
      ...gOptions.headers,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Origin': 'https://ww.funimation.com',
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'Accept-Encoding': 'gzip, deflate, br',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
    };
    gOptions.headers = newHeaders;
    gOptions.body = `username=${encodeURIComponent(options.auth.user)}&password=${encodeURIComponent(options.auth.pass)}`;
  }
  if(options.useToken && options.token){
    gOptions.headers = {
      ...gOptions.headers,
      Authorization: `Token ${options.token}`
    };
  }
  if(options.dinstid){
    gOptions.headers = {
      ...gOptions.headers,
      devicetype: 'Android Phone'
    };
  }
  // debug
  gOptions.hooks = {
    beforeRequest: [
      (gotOpts) => {
        if(options.debug){
          console.debug('GOT OPTIONS:');
          console.debug(gotOpts);
        }
      }
    ]
  };
  try {
    const res = await got(gOptions);
    if(res.body && (options.responseType !== 'buffer' && (res.body as string).match(/^</))){
      throw { name: 'HTMLError', res };
    }
    return {
      ok: true,
      res: {
        ...res,
        body: res.body as T
      },
    };
  }
  catch(_error){
    const error = _error as {
          name: string,
        } & ReadError & {
          res: Response<unknown>
        };
    if(options.debug){
      console.debug(error);
    }
    if(error.response && error.response.statusCode && error.response.statusMessage){
      console.error(`${error.name} ${error.response.statusCode}: ${error.response.statusMessage}`);
    }
    else if(error.name && error.name == 'HTMLError' && error.res && error.res.body){
      console.error(`${error.name}:`);
      console.error(error.res.body);
    }
    else{
      console.error(`${error.name}: ${error.code||error.message}`);
    }
    return {
      ok: false,
      error,
    };
  }
};

export default getData;
