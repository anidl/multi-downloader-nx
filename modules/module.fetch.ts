import * as yamlCfg from './module.cfg-loader';
import { console } from './log';
import { connect } from 'puppeteer-real-browser';

export type Params = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: BodyInit | undefined;
  binary?: boolean;
  followRedirect?: 'follow' | 'error' | 'manual';
};

type GetDataResponse = {
  ok: boolean;
  res?: Response;
  headers?: Record<string, string>;
  error?: {
    name: string;
  } & TypeError & {
      res?: Response;
    };
};

function hasDisplay(): boolean {
  if (process.platform === 'linux') {
    return !!process.env.DISPLAY || !!process.env.WAYLAND_DISPLAY;
  }
  // Win and Mac true by default
  return true;
}

// req
export class Req {
  private sessCfg: string;
  private service: 'cr' | 'hd' | 'ao' | 'adn';
  private session: Record<
    string,
    {
      value: string;
      expires: Date;
      path: string;
      domain: string;
      secure: boolean;
      'Max-Age'?: string;
    }
  > = {};
  private cfgDir = yamlCfg.cfgDir;
  private curl: boolean | string = false;

  constructor(private domain: Record<string, unknown>, private debug: boolean, private nosess = false, private type: 'cr' | 'hd' | 'ao' | 'adn') {
    this.sessCfg = yamlCfg.sessCfgFile[type];
    this.service = type;
  }

  async getData(durl: string, params?: RequestInit): Promise<GetDataResponse> {
    params = params || {};
    // options
    const options: RequestInit = {
      method: params.method ? params.method : 'GET'
    };
    // additional params
    if (params.headers) {
      options.headers = params.headers;
    }
    if (params.body) {
      options.body = params.body;
    }
    if (typeof params.redirect == 'string') {
      options.redirect = params.redirect;
    }
    // debug
    if (this.debug) {
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
        if (body && docTitle) {
          if (docTitle[1] === 'Just a moment...' && durl.includes('crunchyroll') && hasDisplay()) {
            console.warn('Cloudflare triggered, trying to get cookies...');

            const { page } = await connect({
              headless: false,
              turnstile: true
            });

            await page.goto('https://www.crunchyroll.com/', {
              waitUntil: 'networkidle2'
            });

            await page.waitForRequest('https://www.crunchyroll.com/auth/v1/token');

            const cookies = await page.cookies();

            await page.close();

            params.headers = {
              ...params.headers,
              Cookie: cookies.map((c) => `${c.name}=${c.value}`).join('; '),
              'Set-Cookie': cookies.map((c) => `${c.name}=${c.value}`).join('; ')
            };

            (params as any).headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36';

            return await this.getData(durl, params);
          } else {
            console.error(docTitle[1]);
          }
        } else {
          console.error(body);
        }
      }
      return {
        ok: res.ok,
        res,
        headers: params.headers as Record<string, string>
      };
    } catch (_error) {
      const error = _error as {
        name: string;
      } & TypeError & {
          res: Response;
        };
      if (error.res && error.res.status && error.res.statusText) {
        console.error(`${error.name} ${error.res.status}: ${error.res.statusText}`);
      } else {
        console.error(`${error.name}: ${error.res?.statusText || error.message}`);
      }
      if (error.res) {
        const body = await error.res.text();
        const docTitle = body.match(/<title>(.*)<\/title>/);
        if (body && docTitle) {
          console.error(docTitle[1]);
        }
      }
      return {
        ok: false,
        error
      };
    }
  }
}

export function buildProxy(proxyBaseUrl: string, proxyAuth: string) {
  if (!proxyBaseUrl.match(/^(https?|socks4|socks5):/)) {
    proxyBaseUrl = 'http://' + proxyBaseUrl;
  }

  const proxyCfg = new URL(proxyBaseUrl);
  let proxyStr = `${proxyCfg.protocol}//`;

  if (typeof proxyCfg.hostname != 'string' || proxyCfg.hostname == '') {
    throw new Error('[ERROR] Hostname and port required for proxy!');
  }

  if (proxyAuth && typeof proxyAuth == 'string' && proxyAuth.match(':')) {
    proxyCfg.username = proxyAuth.split(':')[0];
    proxyCfg.password = proxyAuth.split(':')[1];
    proxyStr += `${proxyCfg.username}:${proxyCfg.password}@`;
  }

  proxyStr += proxyCfg.hostname;

  if (!proxyCfg.port && proxyCfg.protocol == 'http:') {
    proxyStr += ':80';
  } else if (!proxyCfg.port && proxyCfg.protocol == 'https:') {
    proxyStr += ':443';
  }

  return proxyStr;
}
