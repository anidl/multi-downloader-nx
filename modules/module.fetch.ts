import * as yamlCfg from './module.cfg-loader';
import * as yargs from './module.app-args';
import { console } from './log';
import { argvC } from './module.app-args';
import { ProxyAgent, fetch, RequestInit } from 'undici';

export type FetchParams = Partial<RequestInit & CustomParams>;

export type Params = {
	method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	headers?: Record<string, string>;
	body?: BodyInit | undefined;
	binary?: boolean;
	followRedirect?: 'follow' | 'error' | 'manual';
};

type CustomParams = {
	useProxy: boolean;
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

// function hasDisplay(): boolean {
// 	if (process.platform === 'linux') {
// 		return !!process.env.DISPLAY || !!process.env.WAYLAND_DISPLAY;
// 	}
// 	// Win and Mac true by default
// 	return true;
// }

// req
export class Req {
	private debug: boolean;
	public argv: typeof argvC;

	constructor() {
		const cfg = yamlCfg.loadCfg();
		this.argv = yargs.appArgv(cfg.cli, process.env.isGUI ? true : false);
		this.debug = this.argv.debug ?? false;
	}

	async getData(durl: string, params: Partial<RequestInit & CustomParams> = {}): Promise<GetDataResponse> {
		const options: RequestInit = {
			method: params.method ? params.method : 'GET'
		};
		if (params.headers) {
			options.headers = params.headers;
		}
		if (params.body) {
			options.body = params.body;
		}
		if (typeof params.redirect == 'string') {
			options.redirect = params.redirect;
		}

		// Proxy Handler
		let dispatcher: ProxyAgent | undefined;
		const validProxy = this.argv.proxy ? this.isValidProxyUrl(this.argv.proxy) : false;
		if ((params.useProxy || this.argv.proxyAll) && this.argv.proxy && validProxy) {
			dispatcher = new ProxyAgent(this.argv.proxy);
		} else if ((params.useProxy || this.argv.proxyAll) && this.argv.proxy && !validProxy) {
			console.warn('[Fetch] Provided invalid Proxy URL, not proxying traffic.');
		}

		// Debug
		if (this.debug) {
			console.debug('[DEBUG] FETCH OPTIONS:');
			console.debug(options);
		}

		try {
			const res = await fetch(durl, { ...options, dispatcher: dispatcher });
			if (!res.ok) {
				console.error(`${res.status}: ${res.statusText}`);
				const body = await res.text();
				const docTitle = body.match(/<title>(.*)<\/title>/);
				if (body && docTitle) {
					// if (docTitle[1] === 'Just a moment...' && durl.includes('crunchyroll') && hasDisplay()) {
					// 	console.warn('Cloudflare triggered, trying to get cookies...');

					// 	const { page } = await connect({
					// 		headless: false,
					// 		turnstile: true
					// 	});

					// 	await page.goto('https://www.crunchyroll.com/', {
					// 		waitUntil: 'networkidle2'
					// 	});

					// 	await page.waitForRequest('https://www.crunchyroll.com/auth/v1/token');

					// 	const cookies = await page.cookies();

					// 	await page.close();

					// 	params.headers = {
					// 		...params.headers,
					// 		Cookie: cookies.map((c) => `${c.name}=${c.value}`).join('; '),
					// 		'Set-Cookie': cookies.map((c) => `${c.name}=${c.value}`).join('; ')
					// 	};

					// 	(params as any).headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36';

					// 	return await this.getData(durl, params);
					// } else {
					// 	console.error(docTitle[1]);
					// }

					console.error(docTitle[1]);
				} else {
					console.error(body);
				}
			}
			return {
				ok: res.ok,
				res: res as any,
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

	private isValidProxyUrl(proxyUrl: string): boolean {
		try {
			if (!proxyUrl.match(/^(https?|socks4|socks5):\/\//)) {
				return false;
			}

			const url = new URL(proxyUrl);

			if (!url.hostname) return false;

			if (!['http:', 'https:'].includes(url.protocol)) {
				return false;
			}

			if (url.port && (!/^\d+$/.test(url.port) || Number(url.port) < 1 || Number(url.port) > 65535)) {
				return false;
			}

			return true;
		} catch {
			return false;
		}
	}
}
