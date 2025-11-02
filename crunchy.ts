// build-in
import path from 'path';
import fs from 'fs-extra';

// package program
import packageJson from './package.json';

// plugins
import { console } from './modules/log';
import m3u8 from 'm3u8-parsed';
import streamdl, { M3U8Json } from './modules/hls-download';
import Helper from './modules/module.helper';

// custom modules
import * as fontsData from './modules/module.fontsData';
import * as langsData from './modules/module.langsData';
import * as yamlCfg from './modules/module.cfg-loader';
import * as yargs from './modules/module.app-args';
import Merger, { Font, MergerInput, SubtitleInput } from './modules/module.merger';
import { canDecrypt, getKeysPRD, getKeysWVD, cdm } from './modules/cdm';

// load req
import { domain, api } from './modules/module.api-urls';
import * as reqModule from './modules/module.fetch';
import { CrunchySearch } from './@types/crunchySearch';
import { CrunchyEpisodeList, CrunchyEpisode } from './@types/crunchyEpisodeList';
import { CrunchyDownloadOptions, CrunchyEpMeta, CrunchyMuxOptions, CrunchyMultiDownload, DownloadedMedia, ParseItem, SeriesSearch, SeriesSearchItem } from './@types/crunchyTypes';
import { ObjectInfo } from './@types/objectInfo';
import parseFileName, { Variable } from './modules/module.filename';
import { CrunchyStreams, PlaybackData, Subtitles } from './@types/playbackData';
import { downloaded } from './modules/module.downloadArchive';
import parseSelect from './modules/module.parseSelect';
import { AvailableFilenameVars, getDefault } from './modules/module.args';
import { AuthData, AuthResponse, Episode, ResponseBase, SearchData, SearchResponse, SearchResponseItem } from './@types/messageHandler';
import { ServiceClass } from './@types/serviceClassInterface';
import { CrunchyAndroidEpisodes } from './@types/crunchyAndroidEpisodes';
import { parse } from './modules/module.transform-mpd';
import { AndroidObject, CrunchyAndroidObject, CrunchyMVObject } from './@types/crunchyAndroidObject';
import { CrunchyChapters, CrunchyChapter, CrunchyOldChapter } from './@types/crunchyChapters';
import vtt2ass from './modules/module.vtt2ass';
import { CrunchyPlayStream } from './@types/crunchyPlayStreams';
import { CrunchyVideoPlayStreams, CrunchyAudioPlayStreams } from './@types/enums';
import { randomUUID } from 'node:crypto';
import { FetchParams } from './modules/module.fetch';

export type sxItem = {
	language: langsData.LanguageItem;
	path: string;
	file: string;
	title: string;
	fonts: Font[];
};

export default class Crunchy implements ServiceClass {
	public cfg: yamlCfg.ConfigObject;
	public locale: string;
	private token: Record<string, any>;
	private req: reqModule.Req;
	private cmsToken: {
		cms?: Record<string, string>;
		cms_beta?: Record<string, string>;
		cms_web?: Record<string, string>;
	} = {};

	constructor(private debug = false) {
		this.cfg = yamlCfg.loadCfg();
		this.token = yamlCfg.loadCRToken();
		this.req = new reqModule.Req();
		this.locale = 'en-US';
	}

	public checkToken(): boolean {
		return Object.keys(this.cmsToken.cms_web ?? {}).length > 0;
	}

	public async cli() {
		console.info(`\n=== Multi Downloader NX ${packageJson.version} ===\n`);
		const argv = yargs.appArgv(this.cfg.cli);
		this.locale = argv.locale;
		if (argv.debug) this.debug = true;

		// load binaries
		this.cfg.bin = await yamlCfg.loadBinCfg();
		if (argv.allDubs) {
			argv.dubLang = langsData.dubLanguageCodes;
		}
		// select mode
		if (argv.silentAuth && !argv.auth) {
			await this.doAuth({
				username: argv.username ?? (await Helper.question('[Q] LOGIN/EMAIL: ')),
				password: argv.password ?? (await Helper.question('[Q] PASSWORD: '))
			});
		}
		if (argv.dlFonts) {
			await this.getFonts();
		} else if (argv.auth) {
			await this.doAuth({
				username: argv.username ?? (await Helper.question('[Q] LOGIN/EMAIL: ')),
				password: argv.password ?? (await Helper.question('[Q] PASSWORD: '))
			});
		} else if (argv.token) {
			await this.loginWithToken(argv.token);
		} else if (argv.cmsindex) {
			await this.refreshToken();
			await this.getCmsData();
		} else if (argv.new) {
			await this.refreshToken();
			await this.getNewlyAdded(argv.page, argv['search-type'], argv.raw, argv.rawoutput);
		} else if (argv.search && argv.search.length > 2) {
			await this.refreshToken();
			await this.doSearch({ ...argv, search: argv.search as string });
		} else if (argv.series && argv.series.match(/^[0-9A-Z]{9,}$/)) {
			await this.refreshToken();
			await this.logSeriesById(argv.series as string);
			const selected = await this.downloadFromSeriesID(argv.series, { ...argv });
			if (selected.isOk) {
				for (const select of selected.value) {
					if (!(await this.downloadEpisode(select, { ...argv, skipsubs: false }, true))) {
						console.error(`Unable to download selected episode ${select.episodeNumber}`);
						return false;
					}
				}
			}
			return true;
		} else if (argv['movie-listing'] && argv['movie-listing'].match(/^[0-9A-Z]{9,}$/)) {
			await this.refreshToken();
			await this.logMovieListingById(argv['movie-listing'] as string);
		} else if (argv['show-raw'] && argv['show-raw'].match(/^[0-9A-Z]{9,}$/)) {
			await this.refreshToken();
			await this.logShowRawById(argv['show-raw'] as string);
		} else if (argv['season-raw'] && argv['season-raw'].match(/^[0-9A-Z]{9,}$/)) {
			await this.refreshToken();
			await this.logSeasonRawById(argv['season-raw'] as string);
		} else if (argv['show-list-raw']) {
			await this.refreshToken();
			await this.logShowListRaw();
		} else if (argv.s && argv.s.match(/^[0-9A-Z]{9,}$/)) {
			await this.refreshToken();
			if (argv.dubLang.length > 1) {
				console.info('One show can only be downloaded with one dub. Use --srz instead.');
			}
			argv.dubLang = [argv.dubLang[0]];
			const selected = await this.getSeasonById(argv.s, argv.numbers, argv.e, argv.but, argv.all);
			if (selected.isOk) {
				for (const select of selected.value) {
					if (!(await this.downloadEpisode(select, { ...argv, skipsubs: false }))) {
						console.error(`Unable to download selected episode ${select.episodeNumber}`);
						return false;
					}
				}
			}
			return true;
		} else if (argv.e) {
			await this.refreshToken();
			if (argv.dubLang.length > 1) {
				console.info('One show can only be downloaded with one dub. Use --srz instead.');
			}
			argv.dubLang = [argv.dubLang[0]];
			const selected = await this.getObjectById(argv.e, false);
			for (const select of selected as Partial<CrunchyEpMeta>[]) {
				if (!(await this.downloadEpisode(select as CrunchyEpMeta, { ...argv, skipsubs: false }))) {
					console.error(`Unable to download selected episode ${select.episodeNumber}`);
					return false;
				}
			}
			return true;
		} else if (argv.extid) {
			await this.refreshToken();
			if (argv.dubLang.length > 1) {
				console.info('One show can only be downloaded with one dub. Use --srz instead.');
			}
			argv.dubLang = [argv.dubLang[0]];
			const selected = await this.getObjectById(argv.extid, false, true);
			for (const select of selected as Partial<CrunchyEpMeta>[]) {
				if (!(await this.downloadEpisode(select as CrunchyEpMeta, { ...argv, skipsubs: false }))) {
					console.error(`Unable to download selected episode ${select.episodeNumber}`);
					return false;
				}
			}
			return true;
		} else {
			console.info('No option selected or invalid value entered. Try --help.');
		}
	}

	public async logShowRawById(id: string) {
		// check token
		if (!this.cmsToken.cms_web) {
			console.error('Authentication required!');
			return;
		}
		// opts
		const AuthHeaders = {
			headers: {
				Authorization: `Bearer ${this.token.access_token}`,
				...api.crunchyDefHeader
			}
		};
		// seasons list
		const seriesSeasonListReq = await this.req.getData(
			`${api.content_cms}/series/${id}/seasons?force_locale=&preferred_audio_language=ja-JP&locale=${this.locale}`,
			AuthHeaders
		);
		if (!seriesSeasonListReq.ok || !seriesSeasonListReq.res) {
			console.error('Series Request FAILED!');
			return;
		}
		const seriesData = await seriesSeasonListReq.res.json();
		for (const item of seriesData.data) {
			// stringify each object, then a newline
			console.log(JSON.stringify(item));
		}
		return seriesData.data;
	}

	public async logSeasonRawById(id: string) {
		// check token
		if (!this.cmsToken.cms_web) {
			console.error('Authentication required!');
			return;
		}
		// opts
		const AuthHeaders = {
			headers: {
				Authorization: `Bearer ${this.token.access_token}`,
				...api.crunchyDefHeader
			}
		};
		// seasons list
		let episodeList = { total: 0, data: [], meta: {} } as CrunchyEpisodeList;
		//get episode info
		const reqEpsListOpts = [
			api.cms_bucket,
			this.cmsToken.cms_web.bucket,
			'/episodes?',
			new URLSearchParams({
				force_locale: '',
				preferred_audio_language: 'ja-JP',
				locale: this.locale,
				season_id: id,
				Policy: this.cmsToken.cms_web.policy,
				Signature: this.cmsToken.cms_web.signature,
				'Key-Pair-Id': this.cmsToken.cms_web.key_pair_id
			})
		].join('');
		const reqEpsList = await this.req.getData(reqEpsListOpts, AuthHeaders);
		if (!reqEpsList.ok || !reqEpsList.res) {
			console.error('Episode List Request FAILED!');
			return { isOk: false, reason: new Error('Episode List request failed. No more information provided.') };
		}
		//CrunchyEpisodeList
		const episodeListAndroid = (await reqEpsList.res.json()) as CrunchyAndroidEpisodes;
		episodeList = {
			total: episodeListAndroid.total,
			data: episodeListAndroid.items,
			meta: {}
		};
		for (const item of episodeList.data) {
			// stringify each object, then a newline
			console.log(JSON.stringify(item));
		}

		// Return the data directly if this function is called by other code
		return episodeList.data;
	}

	public async logShowListRaw() {
		// check token
		if (!this.cmsToken.cms_web) {
			console.error('Authentication required!');
			return;
		}

		// opts
		const AuthHeaders = {
			headers: {
				Authorization: `Bearer ${this.token.access_token}`,
				...api.crunchyDefHeader
			}
		};

		const allShows: any[] = [];
		let page = 1;
		let hasMorePages = true;

		if (this.debug) {
			console.info('Retrieving complete show list...');
		}

		while (hasMorePages) {
			const searchStart = (page - 1) * 50;
			const params = new URLSearchParams({
				preferred_audio_language: 'ja-JP',
				locale: this.locale,
				ratings: 'true',
				sort_by: 'alphabetical',
				n: '50',
				start: searchStart.toString()
			}).toString();

			const showListReq = await this.req.getData(`${api.browse_all_series}?${params}`, AuthHeaders);

			if (!showListReq.ok || !showListReq.res) {
				console.error(`Show List Request FAILED on page ${page}!`);
				return allShows;
			}

			const showListData = await showListReq.res.json();

			// Add current page data
			for (const item of showListData.data) {
				// stringify each object, then a newline
				console.log(JSON.stringify(item));
				allShows.push(item);
			}

			// Calculate pagination info
			const totalItems = showListData.total;
			const totalPages = Math.ceil(totalItems / 50);
			if (this.debug) {
				console.info(`Retrieved page ${page}/${totalPages} (${allShows.length}/${totalItems} items)`);
			}

			// Check if we need to fetch more pages
			if (page >= totalPages) {
				hasMorePages = false;
			} else {
				page++;
				// Add a small delay to avoid rate limiting
				await this.sleep(1000);
			}
		}

		if (this.debug) {
			console.info(`Complete show list retrieved: ${allShows.length} items`);
		}
		return allShows;
	}

	public async getFonts() {
		console.info('Downloading fonts...');
		const fonts = Object.values(fontsData.fontFamilies).reduce((pre, curr) => pre.concat(curr));
		for (const f of fonts) {
			const fontLoc = path.join(this.cfg.dir.fonts, f);
			if (fs.existsSync(fontLoc) && fs.statSync(fontLoc).size != 0) {
				console.info(`${f} already downloaded!`);
			} else {
				const fontFolder = path.dirname(fontLoc);
				if (fs.existsSync(fontLoc) && fs.statSync(fontLoc).size == 0) {
					fs.unlinkSync(fontLoc);
				}
				try {
					fs.ensureDirSync(fontFolder);
				} catch (e) {
					console.info('');
				}
				const fontUrl = fontsData.root + f;
				const getFont = await this.req.getData(fontUrl, {
					headers: api.crunchyDefHeader
				});
				if (getFont.ok && getFont.res) {
					fs.writeFileSync(fontLoc, Buffer.from(await getFont.res.arrayBuffer()));
					console.info(`Downloaded: ${f}`);
				} else {
					console.warn(`Failed to download: ${f}`);
				}
			}
		}
		console.info('All required fonts downloaded!');
	}

	// private async productionToken() {
	//   const tokenReq = await this.req.getData(api.bundlejs);

	//   if (!tokenReq.ok || !tokenReq.res) {
	//     console.error('Failed to get Production Token!');
	//     return { isOk: false, reason: new Error('Failed to get Production Token') };
	//   }

	//   const rawjs = await tokenReq.res.text();

	//   const tokens = rawjs.match(/prod="([\w-]+:[\w-]+)"/);

	//   if (!tokens) {
	//     console.error('Failed to find Production Token in js!');
	//     return { isOk: false, reason: new Error('Failed to find Production Token in js') };
	//   }

	//   return Buffer.from(tokens[1], 'latin1').toString('base64');
	// }

	public async doAuth(data: AuthData): Promise<AuthResponse> {
		const uuid = randomUUID();
		const authData = new URLSearchParams({
			username: data.username,
			password: data.password,
			grant_type: 'password',
			scope: 'offline_access',
			device_id: uuid,
			device_name: 'iPhone',
			device_type: 'iPhone 13'
		}).toString();
		const authReqOpts: FetchParams = {
			method: 'POST',
			headers: { ...api.crunchyAuthHeader, 'ETP-Anonymous-ID': uuid },
			body: authData,
			useProxy: true
		};
		const authReq = await this.req.getData(api.auth, authReqOpts);
		if (!authReq.ok || !authReq.res) {
			console.error('Authentication failed!');
			return { isOk: false, reason: new Error('Authentication failed') };
		}
		// To prevent any Cloudflare errors in the future
		if (authReq.res.headers.get('Set-Cookie')) {
			api.crunchyDefHeader['Cookie'] = authReq.res.headers.get('Set-Cookie') as string;
			api.crunchyAuthHeader['Cookie'] = authReq.res.headers.get('Set-Cookie') as string;
		}
		if (authReq.headers && authReq.headers['Set-Cookie']) {
			api.crunchyDefHeader['Cookie'] = authReq.headers['Set-Cookie'];
			api.crunchyAuthHeader['Cookie'] = authReq.headers['Set-Cookie'];
			api.crunchyDefHeader['User-Agent'] = authReq.headers['User-Agent'];
			api.crunchyAuthHeader['User-Agent'] = authReq.headers['User-Agent'];
		}
		this.token = await authReq.res.json();
		this.token.device_id = uuid;
		this.token.expires = new Date(Date.now() + this.token.expires_in * 1000);
		yamlCfg.saveCRToken(this.token);
		await this.getProfile();
		console.info('Your Country: %s', this.token.country);
		return { isOk: true, value: undefined };
	}

	public async doAnonymousAuth() {
		const uuid = randomUUID();
		const authData = new URLSearchParams({
			grant_type: 'client_id',
			scope: 'offline_access',
			device_id: uuid,
			device_name: 'iPhone',
			device_type: 'iPhone 13'
		}).toString();
		const authReqOpts: FetchParams = {
			method: 'POST',
			headers: { ...api.crunchyAuthHeader, 'ETP-Anonymous-ID': uuid },
			body: authData,
			useProxy: true
		};
		const authReq = await this.req.getData(api.auth, authReqOpts);
		if (!authReq.ok || !authReq.res) {
			console.error('Anonymous Authentication failed!');
			return;
		}
		// To prevent any Cloudflare errors in the future
		if (authReq.res.headers.get('Set-Cookie')) {
			api.crunchyDefHeader['Cookie'] = authReq.res.headers.get('Set-Cookie') as string;
			api.crunchyAuthHeader['Cookie'] = authReq.res.headers.get('Set-Cookie') as string;
		}
		if (authReq.headers && authReq.headers['Set-Cookie']) {
			api.crunchyDefHeader['Cookie'] = authReq.headers['Set-Cookie'];
			api.crunchyAuthHeader['Cookie'] = authReq.headers['Set-Cookie'];
			api.crunchyDefHeader['User-Agent'] = authReq.headers['User-Agent'];
			api.crunchyAuthHeader['User-Agent'] = authReq.headers['User-Agent'];
		}
		this.token = await authReq.res.json();
		this.token.device_id = uuid;
		this.token.expires = new Date(Date.now() + this.token.expires_in * 1000);
		yamlCfg.saveCRToken(this.token);
	}

	public async getProfile(silent = false): Promise<boolean> {
		if (!this.token.access_token) {
			console.error('No access token!');
			return false;
		}
		const profileReqOptions = {
			headers: {
				...api.crunchyDefHeader,
				Authorization: `Bearer ${this.token.access_token}`
			}
		};
		const profileReq = await this.req.getData(api.profile, profileReqOptions);
		if (!profileReq.ok || !profileReq.res) {
			console.error('Get profile failed!');
			return false;
		}
		const profile = await profileReq.res.json();
		if (!silent) {
			console.info('USER: %s (%s)', profile.username, profile.email);
		}
		return true;
	}

	public sleep(ms: number) {
		return new Promise((resolve) => {
			setTimeout(resolve, ms);
		});
	}

	public async loginWithToken(refreshToken: string) {
		const uuid = randomUUID();
		const authData = new URLSearchParams({
			refresh_token: this.token.refresh_token,
			grant_type: 'refresh_token',
			//'grant_type': 'etp_rt_cookie',
			scope: 'offline_access',
			device_id: uuid,
			device_name: 'iPhone',
			device_type: 'iPhone 13'
		}).toString();
		const authReqOpts: FetchParams = {
			method: 'POST',
			headers: { ...api.crunchyAuthHeader, 'ETP-Anonymous-ID': uuid, Cookie: `etp_rt=${refreshToken}` },
			body: authData,
			useProxy: true
		};
		const authReq = await this.req.getData(api.auth, authReqOpts);
		if (!authReq.ok || !authReq.res) {
			console.error('Token Authentication failed!');
			if (authReq.res?.status == 400) {
				console.warn('Token is likely wrong (Or invalid for given API), please login again!');
			}
			return;
		}
		// To prevent any Cloudflare errors in the future
		if (authReq.res.headers.get('Set-Cookie')) {
			api.crunchyDefHeader['Cookie'] = authReq.res.headers.get('Set-Cookie') as string;
			api.crunchyAuthHeader['Cookie'] = authReq.res.headers.get('Set-Cookie') as string;
		}
		if (authReq.headers && authReq.headers['Set-Cookie']) {
			api.crunchyDefHeader['Cookie'] = authReq.headers['Set-Cookie'];
			api.crunchyAuthHeader['Cookie'] = authReq.headers['Set-Cookie'];
			api.crunchyDefHeader['User-Agent'] = authReq.headers['User-Agent'];
			api.crunchyAuthHeader['User-Agent'] = authReq.headers['User-Agent'];
		}
		this.token = await authReq.res.json();
		this.token.device_id = uuid;
		this.token.expires = new Date(Date.now() + this.token.expires_in * 1000);
		yamlCfg.saveCRToken(this.token);
		await this.getProfile(false);
		await this.getCMStoken(true);
	}

	public async refreshToken(ifNeeded = false, silent = false) {
		if ((!this.token.access_token && !this.token.refresh_token) || (this.token.access_token && !this.token.refresh_token)) {
			await this.doAnonymousAuth();
		} else {
			/*if (ifNeeded)
        return;*/
			if (!(Date.now() > new Date(this.token.expires).getTime()) && ifNeeded) {
				return;
			} else {
				//console.info('[WARN] The token has expired compleatly. I will try to refresh the token anyway, but you might have to reauth.');
			}
			const uuid = this.token.device_id || randomUUID();
			const authData = new URLSearchParams({
				refresh_token: this.token.refresh_token,
				grant_type: 'refresh_token',
				device_id: uuid,
				device_name: 'iPhone',
				device_type: 'iPhone 13'
			}).toString();
			const authReqOpts: FetchParams = {
				method: 'POST',
				headers: { ...api.crunchyAuthHeader, 'ETP-Anonymous-ID': uuid },
				body: authData,
				useProxy: true
			};
			const authReq = await this.req.getData(api.auth, authReqOpts);
			if (!authReq.ok || !authReq.res) {
				console.error('Token Refresh Failed!');
				if (authReq.res?.status == 400) {
					console.warn('Token is likely wrong, please login again!');
				}
				return;
			}
			// To prevent any Cloudflare errors in the future
			if (authReq.res.headers.get('Set-Cookie')) {
				api.crunchyDefHeader['Cookie'] = authReq.res.headers.get('Set-Cookie') as string;
				api.crunchyAuthHeader['Cookie'] = authReq.res.headers.get('Set-Cookie') as string;
			}
			if (authReq.headers && authReq.headers['Set-Cookie']) {
				api.crunchyDefHeader['Cookie'] = authReq.headers['Set-Cookie'];
				api.crunchyAuthHeader['Cookie'] = authReq.headers['Set-Cookie'];
				api.crunchyDefHeader['User-Agent'] = authReq.headers['User-Agent'];
				api.crunchyAuthHeader['User-Agent'] = authReq.headers['User-Agent'];
			}
			this.token = await authReq.res.json();
			this.token.device_id = uuid;
			this.token.expires = new Date(Date.now() + this.token.expires_in * 1000);
			yamlCfg.saveCRToken(this.token);
		}
		if (this.token.refresh_token) {
			await this.getProfile(silent);
		} else {
			console.info('USER: Anonymous');
		}
		await this.getCMStoken(ifNeeded);
	}

	public async getCMStoken(ifNeeded = false) {
		if (!this.token.access_token) {
			console.error('No access token!');
			return;
		}

		if (ifNeeded && this.cmsToken.cms_web) {
			if (!(Date.now() >= new Date(this.cmsToken.cms_web.expires).getTime())) {
				return;
			}
		}

		const cmsTokenReqOpts = {
			headers: {
				Authorization: `Bearer ${this.token.access_token}`,
				...api.crunchyDefHeader
			}
		};
		const cmsTokenReq = await this.req.getData(api.cms_auth, cmsTokenReqOpts);
		if (!cmsTokenReq.ok || !cmsTokenReq.res) {
			console.error('Authentication CMS token failed!');
			return;
		}
		this.cmsToken = await cmsTokenReq.res.json();
		console.info('Your Country: %s\n', this.cmsToken.cms_web?.bucket.split('/')[1]);
	}

	public async getCmsData() {
		// check token
		if (!this.cmsToken.cms_web) {
			console.error('Authentication required!');
			return;
		}
		// opts
		const indexReqOpts = [
			api.cms_bucket,
			this.cmsToken.cms_web.bucket,
			'/index?',
			new URLSearchParams({
				force_locale: '',
				preferred_audio_language: 'ja-JP',
				locale: this.locale,
				Policy: this.cmsToken.cms_web.policy,
				Signature: this.cmsToken.cms_web.signature,
				'Key-Pair-Id': this.cmsToken.cms_web.key_pair_id
			})
		].join('');
		const indexReq = await this.req.getData(indexReqOpts, {
			headers: {
				'User-Agent': api.crunchyDefUserAgent
			}
		});
		if (!indexReq.ok || !indexReq.res) {
			console.error('Get CMS index FAILED!');
			return;
		}
		console.info(await indexReq.res.json());
	}

	public async doSearch(data: SearchData): Promise<SearchResponse> {
		if (!this.token.access_token) {
			console.error('Authentication required!');
			return { isOk: false, reason: new Error('Not authenticated') };
		}
		const searchReqOpts = {
			headers: {
				Authorization: `Bearer ${this.token.access_token}`,
				...api.crunchyDefHeader
			}
		};
		const searchStart = data.page ? (data.page - 1) * 5 : 0;
		const searchParams = new URLSearchParams({
			q: data.search,
			n: '5',
			start: data.page ? `${(data.page - 1) * 5}` : '0',
			type: data['search-type'] ?? getDefault('search-type', this.cfg.cli),
			locale: this.locale
		}).toString();
		const searchReq = await this.req.getData(`${api.search}?${searchParams}`, searchReqOpts);
		if (!searchReq.ok || !searchReq.res) {
			console.error('Search FAILED!');
			return { isOk: false, reason: new Error('Search failed. No more information provided') };
		}
		const searchResults = (await searchReq.res.json()) as CrunchySearch;
		if (searchResults.total < 1) {
			console.info('Nothing Found!');
			return { isOk: true, value: [] };
		}

		const searchTypesInfo = {
			top_results: 'Top results',
			series: 'Found series',
			movie_listing: 'Found movie lists',
			episode: 'Found episodes'
		};
		for (const search_item of searchResults.data) {
			console.info('%s:', searchTypesInfo[search_item.type as keyof typeof searchTypesInfo]);
			// calculate pages
			const pageCur = searchStart > 0 ? Math.ceil(searchStart / 5) + 1 : 1;
			const pageMax = Math.ceil(search_item.count / 5);
			// pages per category
			if (search_item.count < 1) {
				console.info('  Nothing Found...');
			}
			if (search_item.count > 0) {
				if (pageCur > pageMax) {
					console.info('  Last page is %s...', pageMax);
					continue;
				}
				for (const item of search_item.items) {
					await this.logObject(item);
				}
				console.info(`  Total results: ${search_item.count} (Page: ${pageCur}/${pageMax})`);
			}
		}
		const toSend = searchResults.data.filter((a) => a.type === 'series' || a.type === 'movie_listing');
		return {
			isOk: true,
			value: toSend
				.map((a) => {
					return a.items.map((a): SearchResponseItem => {
						const images = (a.images.poster_tall ?? [[{ source: '/notFound.png' }]])[0];
						return {
							id: a.id,
							image: images[Math.floor(images.length / 2)].source,
							name: a.title,
							rating: -1,
							desc: a.description
						};
					});
				})
				.reduce((pre, cur) => pre.concat(cur))
		};
	}

	public async logObject(item: ParseItem, pad?: number, getSeries?: boolean, getMovieListing?: boolean) {
		if (this.debug) {
			console.info(item);
		}
		pad = pad ?? 2;
		getSeries = getSeries === undefined ? true : getSeries;
		getMovieListing = getMovieListing === undefined ? true : getMovieListing;
		item.isSelected = item.isSelected === undefined ? false : item.isSelected;
		if (!item.type) {
			item.type = item.__class__;
		}

		//guess item type
		//TODO: look into better methods of getting item type
		let iType = item.type;
		if (!iType) {
			if (item.episode_number) {
				iType = 'episode';
			} else if (item.season_number) {
				iType = 'season';
			} else if (item.season_count) {
				iType = 'series';
			} else if (item.media_type == 'movie') {
				iType = 'movie';
			} else if (item.movie_release_year) {
				iType = 'movie_listing';
			} else if (item.type && item.type === 'musicVideo') {
				iType = 'music_video';
			} else {
				if (item.identifier !== '') {
					const iTypeCheck = item.identifier?.split('|');
					if (iTypeCheck) {
						if (iTypeCheck[1] == 'M') {
							iType = 'movie';
						} else if (!iTypeCheck[2]) {
							iType = 'season';
						} else {
							iType = 'episode';
						}
					} else {
						iType = 'series';
					}
				} else {
					iType = 'movie_listing';
				}
			}
			item.type = iType;
		}

		const oTypes = {
			series: 'Z', // SRZ
			season: 'S', // VOL
			episode: 'E', // EPI
			movie_listing: 'F', // FLM
			movie: 'M', // MED
			musicVideo: 'MV' // MVD
		};
		// check title
		item.title = item.title != '' ? item.title : 'NO_TITLE';
		// static data
		const oMetadata: string[] = [],
			oBooleans: string[] = [],
			tMetadata = item.type + '_metadata',
			iMetadata = (Object.prototype.hasOwnProperty.call(item, tMetadata) ? item[tMetadata as keyof ParseItem] : item) as Record<string, any>,
			iTitle = [item.title];

		const audio_languages: string[] = [];

		// set object booleans
		if (iMetadata.duration_ms) {
			oBooleans.push(Helper.formatTime(iMetadata.duration_ms / 1000));
		}
		if (iMetadata.is_simulcast) {
			oBooleans.push('SIMULCAST');
		}
		if (iMetadata.is_mature) {
			oBooleans.push('MATURE');
		}
		if (item.versions) {
			for (const version of item.versions) {
				audio_languages.push(version.audio_locale);
				if (version.original) {
					oBooleans.push('SUB');
				} else {
					if (!oBooleans.includes('DUB')) {
						oBooleans.push('DUB');
					}
				}
			}
		} else {
			if (iMetadata.is_subbed) {
				oBooleans.push('SUB');
			}
			if (iMetadata.is_dubbed) {
				oBooleans.push('DUB');
			}
		}
		if (item.playback && item.type != 'movie_listing') {
			oBooleans.push('STREAM');
		}
		// set object metadata
		if (iMetadata.season_count) {
			oMetadata.push(`Seasons: ${iMetadata.season_count}`);
		}
		if (iMetadata.episode_count) {
			oMetadata.push(`EPs: ${iMetadata.episode_count}`);
		}
		if (item.season_number && !iMetadata.hide_season_title && !iMetadata.hide_season_number) {
			oMetadata.push(`Season: ${item.season_number}`);
		}
		if (item.type == 'episode') {
			if (iMetadata.episode) {
				iTitle.unshift(iMetadata.episode);
			}
			if (!iMetadata.hide_season_title && iMetadata.season_title) {
				iTitle.unshift(iMetadata.season_title);
			}
		}
		if (item.is_premium_only) {
			iTitle[0] = `☆ ${iTitle[0]}`;
		}
		// display metadata
		if (item.hide_metadata) {
			iMetadata.hide_metadata = item.hide_metadata;
		}
		const showObjectMetadata = oMetadata.length > 0 && !iMetadata.hide_metadata;
		const showObjectBooleans = oBooleans.length > 0 && !iMetadata.hide_metadata;
		// make obj ids
		const objects_ids: string[] = [];
		objects_ids.push(oTypes[item.type as keyof typeof oTypes] + ':' + item.id);
		if (item.seq_id) {
			objects_ids.unshift(item.seq_id);
		}
		if (item.f_num) {
			objects_ids.unshift(item.f_num);
		}
		if (item.s_num) {
			objects_ids.unshift(item.s_num);
		}
		if (item.external_id) {
			objects_ids.push(item.external_id);
		}
		if (item.ep_num) {
			objects_ids.push(item.ep_num);
		}

		// show entry
		console.info(
			'%s%s[%s] %s%s%s',
			''.padStart(item.isSelected ? pad - 1 : pad, ' '),
			item.isSelected ? '✓' : '',
			objects_ids.join('|'),
			iTitle.join(' - '),
			showObjectMetadata ? ` (${oMetadata.join(', ')})` : '',
			showObjectBooleans ? ` [${oBooleans.join(', ')}]` : ''
		);
		if (item.last_public) {
			console.info(''.padStart(pad + 1, ' '), '- Last updated:', item.last_public);
		}
		if (item.subtitle_locales) {
			iMetadata.subtitle_locales = item.subtitle_locales;
		}
		if (item.versions && audio_languages.length > 0) {
			console.info('%s- Versions: %s', ''.padStart(pad + 2, ' '), langsData.parseSubtitlesArray(audio_languages));
		}
		if (iMetadata.subtitle_locales && iMetadata.subtitle_locales.length > 0) {
			console.info('%s- Subtitles: %s', ''.padStart(pad + 2, ' '), langsData.parseSubtitlesArray(iMetadata.subtitle_locales));
		}
		if (item.availability_notes) {
			console.info('%s- Availability notes: %s', ''.padStart(pad + 2, ' '), item.availability_notes.replace(/\[[^\]]*]?/gm, ''));
		}
		if (item.type == 'series' && getSeries) {
			await this.logSeriesById(item.id, pad, true);
			console.info('');
		}
		if (item.type == 'movie_listing' && getMovieListing) {
			await this.logMovieListingById(item.id, pad + 2);
			console.info('');
		}
	}

	public async logSeriesById(id: string, pad?: number, hideSeriesTitle?: boolean) {
		// parse
		pad = pad || 0;
		hideSeriesTitle = hideSeriesTitle !== undefined ? hideSeriesTitle : false;
		// check token
		if (!this.cmsToken.cms_web) {
			console.error('Authentication required!');
			return;
		}
		// opts
		const AuthHeaders = {
			headers: {
				Authorization: `Bearer ${this.token.access_token}`,
				...api.crunchyDefHeader
			}
		};
		// reqs
		if (!hideSeriesTitle) {
			const seriesReq = await this.req.getData(`${api.content_cms}/series/${id}?force_locale=&preferred_audio_language=ja-JP&locale=${this.locale}`, AuthHeaders);
			if (!seriesReq.ok || !seriesReq.res) {
				console.error('Series Request FAILED!');
				return;
			}
			const seriesData = await seriesReq.res.json();
			await this.logObject(seriesData.data[0], pad, false);
		}
		// seasons list
		const seriesSeasonListReq = await this.req.getData(
			`${api.content_cms}/series/${id}/seasons?force_locale=&preferred_audio_language=ja-JP&locale=${this.locale}`,
			AuthHeaders
		);
		if (!seriesSeasonListReq.ok || !seriesSeasonListReq.res) {
			console.error('Series Request FAILED!');
			return;
		}
		// parse data
		const seasonsList = (await seriesSeasonListReq.res.json()) as SeriesSearch;
		if (seasonsList.total < 1) {
			console.info('Series is empty!');
			return;
		}
		for (const item of seasonsList.data) {
			await this.logObject(item, pad + 2);
		}
	}

	public async logMovieListingById(id: string, pad?: number) {
		pad = pad || 2;
		if (!this.cmsToken.cms_web) {
			console.error('Authentication required!');
			return;
		}

		// opts
		const AuthHeaders = {
			headers: {
				Authorization: `Bearer ${this.token.access_token}`,
				...api.crunchyDefHeader
			}
		};

		//Movie Listing
		const movieListingReq = await this.req.getData(`${api.content_cms}/movie_listings/${id}?force_locale=&preferred_audio_language=ja-JP&locale=${this.locale}`, AuthHeaders);
		if (!movieListingReq.ok || !movieListingReq.res) {
			console.error('Movie Listing Request FAILED!');
			return;
		}
		const movieListing = await movieListingReq.res.json();
		if (movieListing.total < 1) {
			console.info('Movie Listing is empty!');
			return;
		}
		for (const item of movieListing.data) {
			await this.logObject(item, pad, false, false);
		}

		//Movies
		const moviesListReq = await this.req.getData(
			`${api.content_cms}/movie_listings/${id}/movies?force_locale=&preferred_audio_language=ja-JP&locale=${this.locale}`,
			AuthHeaders
		);
		if (!moviesListReq.ok || !moviesListReq.res) {
			console.error('Movies List Request FAILED!');
			return;
		}
		const moviesList = await moviesListReq.res.json();
		for (const item of moviesList.data) {
			await this.logObject(item, pad + 2);
		}
	}

	public async getNewlyAdded(page: number = 1, type: string, raw: boolean = false, rawoutput?: string) {
		if (!this.token.access_token) {
			console.error('Authentication required!');
			return;
		}
		const newlyAddedReqOpts = {
			headers: {
				Authorization: `Bearer ${this.token.access_token}`,
				...api.crunchyDefHeader
			}
		};
		const newlyAddedParams = new URLSearchParams({
			sort_by: 'newly_added',
			type: type || 'series',
			n: '50',
			start: (page ? (page - 1) * 25 : 0).toString(),
			preferred_audio_language: 'ja-JP',
			force_locale: '',
			locale: this.locale
		}).toString();
		const newlyAddedReq = await this.req.getData(`${api.browse}?${newlyAddedParams}`, newlyAddedReqOpts);
		if (!newlyAddedReq.ok || !newlyAddedReq.res) {
			console.error('Get newly added FAILED!');
			return;
		}
		const newlyAddedResults = await newlyAddedReq.res.json();

		if (raw) {
			console.info(JSON.stringify(newlyAddedResults, null, 2));
			if (rawoutput) {
				try {
					fs.writeFileSync(rawoutput, JSON.stringify(newlyAddedResults), { encoding: 'utf-8' });
					console.info(`Raw output saved to ${rawoutput}`);
				} catch (e) {
					console.error(`Failed to save raw output to ${rawoutput}:`, e);
				}
			}
			return;
		}

		console.info('Newly added:');
		for (const i of newlyAddedResults.items) {
			await this.logObject(i, 2);
		}
		// calculate pages
		const itemPad = parseInt(new URL(newlyAddedResults.__href__, domain.cr_www).searchParams.get('start') as string);
		const pageCur = itemPad > 0 ? Math.ceil(itemPad / 25) + 1 : 1;
		const pageMax = Math.ceil(newlyAddedResults.total / 25);
		console.info(`  Total results: ${newlyAddedResults.total} (Page: ${pageCur}/${pageMax})`);
	}

	public async getSeasonById(id: string, numbers: number, e: string | undefined, but: boolean, all: boolean): Promise<ResponseBase<CrunchyEpMeta[]>> {
		if (!this.cmsToken.cms_web) {
			console.error('Authentication required!');
			return { isOk: false, reason: new Error('Authentication required') };
		}

		const AuthHeaders = {
			headers: {
				Authorization: `Bearer ${this.token.access_token}`,
				...api.crunchyDefHeader
			}
		};

		//get show info
		const showInfoReq = await this.req.getData(`${api.content_cms}/seasons/${id}?force_locale=&preferred_audio_language=ja-JP&locale=${this.locale}`, AuthHeaders);
		if (!showInfoReq.ok || !showInfoReq.res) {
			console.error('Show Request FAILED!');
			return { isOk: false, reason: new Error('Show request failed. No more information provided.') };
		}
		const showInfo = await showInfoReq.res.json();
		await this.logObject(showInfo.data[0], 0);

		let episodeList = { total: 0, data: [], meta: {} } as CrunchyEpisodeList;
		//get episode info
		const reqEpsListOpts = [
			api.cms_bucket,
			this.cmsToken.cms_web.bucket,
			'/episodes?',
			new URLSearchParams({
				force_locale: '',
				preferred_audio_language: 'ja-JP',
				locale: this.locale,
				season_id: id,
				Policy: this.cmsToken.cms_web.policy,
				Signature: this.cmsToken.cms_web.signature,
				'Key-Pair-Id': this.cmsToken.cms_web.key_pair_id
			})
		].join('');
		const reqEpsList = await this.req.getData(reqEpsListOpts, AuthHeaders);
		if (!reqEpsList.ok || !reqEpsList.res) {
			console.error('Episode List Request FAILED!');
			return { isOk: false, reason: new Error('Episode List request failed. No more information provided.') };
		}
		//CrunchyEpisodeList
		const episodeListAndroid = (await reqEpsList.res.json()) as CrunchyAndroidEpisodes;
		episodeList = {
			total: episodeListAndroid.total,
			data: episodeListAndroid.items,
			meta: {}
		};

		const epNumList: {
			ep: number[];
			sp: number;
		} = { ep: [], sp: 0 };
		const epNumLen = numbers;

		if (episodeList.total < 1) {
			console.info('  Season is empty!');
			return { isOk: true, value: [] };
		}

		const doEpsFilter = parseSelect(e as string);
		const selectedMedia: CrunchyEpMeta[] = [];

		episodeList.data.forEach((item) => {
			item.hide_season_title = true;
			if (item.season_title == '' && item.series_title != '') {
				item.season_title = item.series_title;
				item.hide_season_title = false;
				item.hide_season_number = true;
			}
			if (item.season_title == '' && item.series_title == '') {
				item.season_title = 'NO_TITLE';
				item.series_title = 'NO_TITLE';
			}
			const epNum = item.episode;
			let isSpecial = false;
			item.isSelected = false;
			if (!epNum.match(/^\d+$/) || epNumList.ep.indexOf(parseInt(epNum, 10)) > -1) {
				isSpecial = true;
				epNumList.sp++;
			} else {
				epNumList.ep.push(parseInt(epNum, 10));
			}
			const selEpId = isSpecial ? 'S' + epNumList.sp.toString().padStart(epNumLen, '0') : '' + parseInt(epNum, 10).toString().padStart(epNumLen, '0');
			// set data
			const images = (item.images.thumbnail ?? [[{ source: '/notFound.png' }]])[0];
			const epMeta: CrunchyEpMeta = {
				data: [
					{
						mediaId: item.id,
						versions: null,
						lang: langsData.languages.find((a) => a.code == yargs.appArgv(this.cfg.cli).dubLang[0]),
						isSubbed: item.is_subbed,
						isDubbed: item.is_dubbed
					}
				],
				seriesTitle: item.series_title,
				seasonTitle: item.season_title,
				episodeNumber: item.episode,
				episodeTitle: item.title,
				seasonID: item.season_id,
				season: item.season_number,
				showID: id,
				e: selEpId,
				image: images[Math.floor(images.length / 2)].source
			};
			// Check for streams_link and update playback var if needed
			if (item.__links__?.streams?.href) {
				epMeta.data[0].playback = item.__links__.streams.href;
				if (!item.playback) {
					item.playback = item.__links__.streams.href;
				}
			}
			if (item.streams_link) {
				epMeta.data[0].playback = item.streams_link;
				if (!item.playback) {
					item.playback = item.streams_link;
				}
			}
			if (item.versions) {
				epMeta.data[0].versions = item.versions;
			}
			// find episode numbers
			if (
				(but && item.playback && !doEpsFilter.isSelected([selEpId, item.id])) ||
				(all && item.playback) ||
				(!but && doEpsFilter.isSelected([selEpId, item.id]) && !item.isSelected && item.playback)
			) {
				selectedMedia.push(epMeta);
				item.isSelected = true;
			}
			// show ep
			item.seq_id = selEpId;
			this.logObject(item);
		});

		// display
		if (selectedMedia.length < 1) {
			console.info('\nEpisodes not selected!\n');
		}

		console.info('');
		return { isOk: true, value: selectedMedia };
	}

	public async downloadEpisode(data: CrunchyEpMeta, options: CrunchyDownloadOptions, isSeries?: boolean): Promise<boolean> {
		const res = await this.downloadMediaList(data, options);
		if (res === undefined || res.error) {
			return false;
		} else {
			if (!options.skipmux) {
				await this.muxStreams(res.data, { ...options, output: res.fileName });
			} else {
				console.info('Skipping mux');
			}
			if (!isSeries) {
				downloaded(
					{
						service: 'crunchy',
						type: 's'
					},
					data.seasonID,
					[data.e]
				);
			} else {
				downloaded(
					{
						service: 'crunchy',
						type: 'srz'
					},
					data.showID,
					[data.e]
				);
			}
		}
		return true;
	}

	public async getObjectById(e?: string, earlyReturn?: boolean, external_id?: boolean): Promise<ObjectInfo | Partial<CrunchyEpMeta>[] | undefined> {
		if (!this.cmsToken.cms_web) {
			console.error('Authentication required!');
			return [];
		}

		let convertedObjects;
		if (external_id) {
			const epFilter = parseSelect(e as string);
			const objectIds = [];
			for (const ob of epFilter.values) {
				const extIdReqOpts = [
					api.cms_bucket,
					this.cmsToken.cms_web.bucket,
					'/channels/crunchyroll/objects',
					'?',
					new URLSearchParams({
						force_locale: '',
						preferred_audio_language: 'ja-JP',
						locale: this.locale,
						external_id: ob,
						Policy: this.cmsToken.cms_web.policy,
						Signature: this.cmsToken.cms_web.signature,
						'Key-Pair-Id': this.cmsToken.cms_web.key_pair_id
					})
				].join('');

				const extIdReq = await this.req.getData(extIdReqOpts, {
					headers: {
						'User-Agent': api.crunchyDefUserAgent
					}
				});
				if (!extIdReq.ok || !extIdReq.res) {
					console.error('Objects Request FAILED!');
					if (extIdReq.error && extIdReq.error.res && extIdReq.error.res.body) {
						console.info('[INFO] Body:', extIdReq.error.res.body);
					}
					continue;
				}

				const oldObjectInfo = (await extIdReq.res.json()) as Record<any, any>;
				for (const object of oldObjectInfo.items) {
					objectIds.push(object.id);
				}
			}
			convertedObjects = objectIds.join(',');
		}

		const doEpsFilter = parseSelect(convertedObjects ?? (e as string));

		if (doEpsFilter.values.length < 1) {
			console.info('\nObjects not selected!\n');
			return [];
		}

		// node index.js --service crunchy -e G6497Z43Y,GRZXCMN1W,G62PEZ2E6,G25FVGDEK,GZ7UVPVX5
		console.info('Requested object ID: %s', doEpsFilter.values.join(', '));

		const AuthHeaders = {
			headers: {
				Authorization: `Bearer ${this.token.access_token}`,
				...api.crunchyDefHeader
			}
		};

		// reqs
		let objectInfo: ObjectInfo = { total: 0, data: [], meta: {} };

		// Music Videos handling
		if (doEpsFilter.values.filter((e) => e.startsWith('MV')).length > 0) {
			const toFetch = doEpsFilter.values.filter((e) => e.startsWith('MV'));
			const AuthHeaders = {
				headers: {
					Authorization: `Bearer ${this.token.access_token}`,
					...api.crunchyDefHeader
				}
			};

			const mvInfoReq = await this.req.getData(
				`${api.content_music}/music_videos/${toFetch.join(',')}?force_locale=&preferred_audio_language=ja-JP&locale=${this.locale}`,
				AuthHeaders
			);
			if (!mvInfoReq.ok || !mvInfoReq.res) {
				console.error('Music Video Request FAILED!');
				return [];
			}

			const mvInfo = (await mvInfoReq.res.json()) as { data: CrunchyMVObject[]; total: number };
			if (mvInfo.data.length === 0) return [];

			objectInfo = {
				total: objectInfo.total + mvInfo.total,
				data: [...objectInfo.data, ...mvInfo.data],
				meta: {}
			};

			doEpsFilter.values = doEpsFilter.values.filter((e) => !e.startsWith('MV'));
		}

		// Media ID handling
		if (doEpsFilter.values.length > 0) {
			const objectReqOpts = [
				api.cms_bucket,
				this.cmsToken.cms_web.bucket,
				'/objects/',
				doEpsFilter.values.join(','),
				'?',
				new URLSearchParams({
					force_locale: '',
					preferred_audio_language: 'ja-JP',
					locale: this.locale,
					Policy: this.cmsToken.cms_web.policy,
					Signature: this.cmsToken.cms_web.signature,
					'Key-Pair-Id': this.cmsToken.cms_web.key_pair_id
				})
			].join('');
			const objectReq = await this.req.getData(objectReqOpts, AuthHeaders);
			if (!objectReq.ok || !objectReq.res) {
				console.error('Objects Request FAILED!');
				if (objectReq.error && objectReq.error.res && objectReq.error.res.body) {
					const objectInfo = await objectReq.error.res.json();
					console.info('Body:', JSON.stringify(objectInfo, null, '\t'));
					objectInfo.error = true;
					return objectInfo;
				}
				return [];
			}
			const objectInfoAndroid = (await objectReq.res.json()) as CrunchyAndroidObject;

			objectInfo = {
				total: objectInfo.total + objectInfoAndroid.total,
				data: [...objectInfo.data, ...objectInfoAndroid.items],
				meta: {}
			};
		}

		if (earlyReturn) {
			return objectInfo;
		}

		const selectedMedia: Partial<CrunchyEpMeta>[] = [];
		// Non MV handling
		for (const item of objectInfo.data.filter((i) => i.type !== 'musicVideo') as AndroidObject[]) {
			if (item.type != 'episode' && item.type != 'movie') {
				await this.logObject(item, 2, true, false);
				continue;
			}
			const epMeta: Partial<CrunchyEpMeta> = {};

			epMeta.data = [];
			if (item.episode_metadata) {
				item.s_num = 'S:' + item.episode_metadata.season_id;
				epMeta.data = [
					{
						mediaId: 'E:' + item.id,
						versions: item.episode_metadata.versions,
						isSubbed: item.episode_metadata.is_subbed,
						isDubbed: item.episode_metadata.is_dubbed
					}
				];
				epMeta.seriesTitle = item.episode_metadata.series_title;
				epMeta.seasonTitle = item.episode_metadata.season_title;
				epMeta.episodeNumber = item.episode_metadata.episode;
				epMeta.episodeTitle = item.title;
				epMeta.season = item.episode_metadata.season_number;
			} else if (item.movie_listing_metadata) {
				item.f_num = 'F:' + item.id;
				epMeta.data = [
					{
						mediaId: 'M:' + item.id,
						isSubbed: item.movie_listing_metadata.is_subbed,
						isDubbed: item.movie_listing_metadata.is_dubbed
					}
				];
				epMeta.seriesTitle = item.title;
				epMeta.seasonTitle = item.title;
				epMeta.episodeNumber = 'Movie';
				epMeta.episodeTitle = item.title;
			} else if (item.movie_metadata) {
				item.f_num = 'F:' + item.id;
				epMeta.data = [
					{
						mediaId: 'M:' + item.id,
						isSubbed: item.movie_metadata.is_subbed,
						isDubbed: item.movie_metadata.is_dubbed
					}
				];
				epMeta.season = 0;
				epMeta.seriesTitle = item.title;
				epMeta.seasonTitle = item.title;
				epMeta.episodeNumber = 'Movie';
				epMeta.episodeTitle = item.title;
			}
			if (item.streams_link) {
				epMeta.data[0].playback = item.streams_link;
				if (!item.playback) {
					item.playback = item.streams_link;
				}
				selectedMedia.push(epMeta);
				item.isSelected = true;
			} else if (item.__links__) {
				epMeta.data[0].playback = item.__links__.streams.href;
				if (!item.playback) {
					item.playback = item.__links__.streams.href;
				}
				selectedMedia.push(epMeta);
				item.isSelected = true;
			}
			await this.logObject(item, 2);
		}

		// MV handling
		for (const item of objectInfo.data.filter((i) => i.type === 'musicVideo') as CrunchyMVObject[]) {
			const epMeta: Partial<CrunchyEpMeta> = {};

			epMeta.data = [
				{
					mediaId: 'V:' + item.id,
					isSubbed: false,
					isDubbed: false
				}
			];
			epMeta.season = 0;
			epMeta.seriesTitle = item.title;
			epMeta.seasonTitle = item.title;
			epMeta.episodeNumber = 'MV';
			epMeta.episodeTitle = item.title;

			if (item.streams_link) {
				epMeta.data[0].playback = item.streams_link;
				if (!item.playback) {
					item.playback = item.streams_link;
				}
				selectedMedia.push(epMeta);
				item.isSelected = true;
			}

			await this.logObject(item, 2);
		}
		console.info('');
		return selectedMedia;
	}

	private convertDownloadToPlayback(audioUrl: string, videoUrl: string): string {
		try {
			const url = new URL(audioUrl);
			const urla = new URL(videoUrl);
			url.pathname = url.pathname.replace('/manifest/download/', '/manifest/');
			url.searchParams.delete('downloadGuid');
			url.searchParams.set('playbackGuid', urla.searchParams.get('playbackGuid') as string);

			return url.toString();
		} catch (err) {
			return audioUrl;
		}
	}

	public async downloadMediaList(
		medias: CrunchyEpMeta,
		options: CrunchyDownloadOptions
	): Promise<
		| {
				data: DownloadedMedia[];
				fileName: string;
				error: boolean;
		  }
		| undefined
	> {
		if (!this.cmsToken.cms_web) {
			console.error('Authentication required!');
			return;
		}

		if (!this.cfg.bin.ffmpeg) this.cfg.bin = await yamlCfg.loadBinCfg();

		let mediaName = '...';
		let fileName;
		const variables: Variable[] = [];
		if (medias.seasonTitle && medias.episodeNumber && medias.episodeTitle) {
			mediaName = `${medias.seasonTitle} - ${medias.episodeNumber} - ${medias.episodeTitle}`;
		}

		const files: DownloadedMedia[] = [];

		if (medias.data.every((a) => !a.playback)) {
			console.warn('Video not available!');
			return undefined;
		}

		let dlFailed = false;
		let dlVideoOnce = false; // Variable to save if best selected video quality was downloaded

		for (const mMeta of medias.data) {
			console.info(`Requesting: [${mMeta.mediaId}] ${mediaName}`);

			// Make sure we have a media id without a : in it
			const currentMediaId = mMeta.mediaId.includes(':') ? mMeta.mediaId.split(':')[1] : mMeta.mediaId;

			//Make sure token is up-to-date
			await this.refreshToken(true, true);
			let currentVersion;
			let isPrimary = mMeta.isSubbed;
			const AuthHeaders: FetchParams = {
				headers: {
					Authorization: `Bearer ${this.token.access_token}`,
					...api.crunchyDefHeader
				}
			};

			//Get Media GUID
			let mediaId = mMeta.mediaId;
			if (mMeta.versions) {
				if (mMeta.lang) {
					currentVersion = mMeta.versions.find((a) => a.audio_locale == mMeta.lang?.cr_locale);
				} else if (options.dubLang.length == 1) {
					const currentLang = langsData.languages.find((a) => a.code == options.dubLang[0]);
					currentVersion = mMeta.versions.find((a) => a.audio_locale == currentLang?.cr_locale);
				} else if (mMeta.versions.length == 1) {
					currentVersion = mMeta.versions[0];
				}
				if (!currentVersion?.media_guid) {
					console.error('Selected language not found in versions.');
					continue;
				}
				isPrimary = currentVersion.original;
				mediaId = currentVersion?.media_guid;
			}

			// If for whatever reason mediaId has a :, return the ID only
			if (mediaId.includes(':')) mediaId = mediaId.split(':')[1];

			const compiledChapters: string[] = [];
			if (options.chapters) {
				//Make Chapter Request
				const chapterRequest = await this.req.getData(`https://static.crunchyroll.com/skip-events/production/${currentMediaId}.json`, {
					headers: api.crunchyDefHeader
				});
				if (!chapterRequest.ok || !chapterRequest.res) {
					//Old Chapter Request Fallback
					console.warn('Chapter request failed, attempting old API');
					const oldChapterRequest = await this.req.getData(`https://static.crunchyroll.com/datalab-intro-v2/${currentMediaId}.json`, {
						headers: api.crunchyDefHeader
					});
					if (!oldChapterRequest.ok || !oldChapterRequest.res) {
						console.warn('Old Chapter API request failed');
					} else {
						console.info('Old Chapter request successful');
						const chapterData = (await oldChapterRequest.res.json()) as CrunchyOldChapter;

						//Generate Timestamps
						const startTime = new Date(0),
							endTime = new Date(0);
						startTime.setSeconds(chapterData.startTime);
						endTime.setSeconds(chapterData.endTime);
						const startTimeMS = String(chapterData.startTime).split('.')[1],
							endTimeMS = String(chapterData.endTime).split('.')[1];
						const startMS = startTimeMS ? startTimeMS : '00',
							endMS = endTimeMS ? endTimeMS : '00';
						const startFormatted = startTime.toISOString().substring(11, 19) + '.' + startMS;
						const endFormatted = endTime.toISOString().substring(11, 19) + '.' + endMS;

						//Push Generated Chapters
						if (chapterData.startTime > 1) {
							compiledChapters.push(`CHAPTER${compiledChapters.length / 2 + 1}=00:00:00.00`, `CHAPTER${compiledChapters.length / 2 + 1}NAME=Prologue`);
						}
						compiledChapters.push(`CHAPTER${compiledChapters.length / 2 + 1}=${startFormatted}`, `CHAPTER${compiledChapters.length / 2 + 1}NAME=Intro`);
						compiledChapters.push(`CHAPTER${compiledChapters.length / 2 + 1}=${endFormatted}`, `CHAPTER${compiledChapters.length / 2 + 1}NAME=Episode`);
					}
				} else {
					//Chapter request succeeded, now let's parse them
					console.info('Chapter request successful');
					const chapterData = (await chapterRequest.res.json()) as CrunchyChapters;
					const chapters: CrunchyChapter[] = [];

					//Make a format more usable for the crunchy chapters
					for (const chapter in chapterData) {
						if (typeof chapterData[chapter] == 'object') {
							chapters.push(chapterData[chapter]);
						}
					}

					if (chapters.length > 0) {
						chapters.sort((a, b) => a.start - b.start);
						//Check if chapters has an intro
						//if (!(chapters.find(c => c.type === 'intro') || chapters.find(c => c.type === 'recap'))) {
						if (!chapters.find((c) => c.type === 'intro')) {
							compiledChapters.push(`CHAPTER${compiledChapters.length / 2 + 1}=00:00:00.00`, `CHAPTER${compiledChapters.length / 2 + 1}NAME=Episode`);
						}

						//Loop through all the chapters
						for (const chapter of chapters) {
							if (typeof chapter.start == 'undefined' || typeof chapter.end == 'undefined') continue;
							//Generate timestamps
							const startTime = new Date(0),
								endTime = new Date(0);
							startTime.setSeconds(chapter.start);
							endTime.setSeconds(chapter.end);
							const startFormatted = startTime.toISOString().substring(11, 19) + '.00';
							const endFormatted = endTime.toISOString().substring(11, 19) + '.00';
							//Find the max start time from the chapters
							const maxStart = Math.max(...chapters.map((obj) => obj.start).filter((start): start is number => start !== null && start !== undefined));
							//We need the duration of the ep
							let epDuration: number | undefined;
							const epiMeta = await this.req.getData(
								`${api.content_cms}/objects/${currentMediaId}?force_locale=&preferred_audio_language=ja-JP&locale=${this.locale}`,
								AuthHeaders
							);
							if (!epiMeta.ok || !epiMeta.res) {
								epDuration = 7200;
							} else {
								epDuration = Math.floor((await epiMeta.res.json()).data[0].episode_metadata.duration_ms / 1000 - 3);
							}

							//Push generated chapters
							if (chapter.type == 'intro') {
								if (chapter.start > 0) {
									compiledChapters.push(`CHAPTER${compiledChapters.length / 2 + 1}=00:00:00.00`, `CHAPTER${compiledChapters.length / 2 + 1}NAME=Episode`);
								}
								compiledChapters.push(
									`CHAPTER${compiledChapters.length / 2 + 1}=${startFormatted}`,
									`CHAPTER${compiledChapters.length / 2 + 1}NAME=${chapter.type.charAt(0).toUpperCase() + chapter.type.slice(1)}`
								);
								if (chapter.end < epDuration && chapter.end != maxStart) {
									compiledChapters.push(`CHAPTER${compiledChapters.length / 2 + 1}=${endFormatted}`, `CHAPTER${compiledChapters.length / 2 + 1}NAME=Episode`);
								}
							} else {
								if (chapter.type !== 'recap') {
									compiledChapters.push(
										`CHAPTER${compiledChapters.length / 2 + 1}=${startFormatted}`,
										`CHAPTER${compiledChapters.length / 2 + 1}NAME=${chapter.type.charAt(0).toUpperCase() + chapter.type.slice(1)}`
									);
									if (chapter.end < epDuration && chapter.end != maxStart) {
										compiledChapters.push(`CHAPTER${compiledChapters.length / 2 + 1}=${endFormatted}`, `CHAPTER${compiledChapters.length / 2 + 1}NAME=Episode`);
									}
								}
							}
						}
					}
				}
			}

			const pbData = { total: 0, vpb: {}, apb: {}, meta: {} } as PlaybackData;

			let videoStream: CrunchyPlayStream | null = null;
			let audioStream: CrunchyPlayStream | null = null;
			let isDLVideoBypass: boolean = options.vstream === 'android' || options.vstream === 'androidtab' ? true : false;
			let isDLAudioBypass: boolean = options.astream === 'android' || options.astream === 'androidtab' ? true : false;
			let isDLBypassCapable: boolean = true;

			if (isDLVideoBypass || isDLAudioBypass) {
				const me = await this.req.getData(api.me, AuthHeaders);
				if (me.ok && me.res) {
					const data_me = await me.res.json();
					const benefits = await this.req.getData(`https://www.crunchyroll.com/subs/v1/subscriptions/${data_me.external_id}/benefits`, AuthHeaders);
					if (benefits.ok && benefits.res) {
						const data_benefits = (await benefits.res.json()) as { items: { benefit: string }[] };
						if (data_benefits?.items && !data_benefits.items.find((i) => i.benefit === 'offline_viewing')) {
							isDLBypassCapable = false;
						}
					} else {
						isDLBypassCapable = false;
					}
				} else {
					isDLBypassCapable = false;
				}
			}

			if (isDLVideoBypass && !isDLBypassCapable) {
				isDLVideoBypass = false;
				options.vstream = 'androidtv';
				console.warn(
					'VBR video downloads are not available on your current Crunchyroll plan. Please upgrade to the "Mega Fan" plan to enable this feature. Falling back to CBR video stream.'
				);
			}

			if (isDLAudioBypass && !isDLBypassCapable) {
				isDLAudioBypass = false;
				options.astream = 'androidtv';
				console.warn(
					'192 kb/s audio downloads are not available on your current Crunchyroll plan. Please upgrade to the "Mega Fan" plan to enable this feature. Falling back to 128 kb/s CBR stream.'
				);
			}

			if (options.tsd) {
				console.warn('Total Session Death Active');
				const activeStreamsReq = await this.req.getData(api.streaming_sessions, AuthHeaders);
				if (activeStreamsReq.ok && activeStreamsReq.res) {
					const data = await activeStreamsReq.res.json();
					for (const s of data.items) {
						await this.req.getData(`https://www.crunchyroll.com/playback/v1/token/${s.contentId}/${s.token}`, { ...{ method: 'DELETE' }, ...AuthHeaders });
					}
					console.warn(`Killed ${data.items?.length ?? 0} Sessions`);
				}
			}

			const videoPlaybackReq = await this.req.getData(
				`https://www.crunchyroll.com/playback/v3/${currentVersion ? currentVersion.guid : currentMediaId}/${CrunchyVideoPlayStreams['androidtv']}/play?queue=0`,
				AuthHeaders
			);
			if (!videoPlaybackReq.ok || !videoPlaybackReq.res) {
				console.warn('Request Video Stream URLs FAILED!');
			} else {
				videoStream = (await videoPlaybackReq.res.json()) as CrunchyPlayStream;
				const derivedPlaystreams = {} as CrunchyStreams;
				for (const hardsub in videoStream.hardSubs) {
					const stream = videoStream.hardSubs[hardsub];
					derivedPlaystreams[hardsub] = {
						url: stream.url,
						hardsub_locale: stream.hlang
					};
				}
				if (isDLVideoBypass) {
					const videoDLReq = await this.req.getData(
						`https://www.crunchyroll.com/playback/v3/${currentVersion ? currentVersion.guid : currentMediaId}/${CrunchyVideoPlayStreams[options.vstream]}/download`,
						AuthHeaders
					);
					if (videoDLReq.ok && videoDLReq.res) {
						const data = (await videoDLReq.res.json()) as CrunchyPlayStream;
						derivedPlaystreams[''] = {
							url: this.convertDownloadToPlayback(data.url, videoStream.url),
							hardsub_locale: ''
						};
					} else {
						derivedPlaystreams[''] = {
							url: videoStream.url,
							hardsub_locale: ''
						};
					}
				} else {
					derivedPlaystreams[''] = {
						url: videoStream.url,
						hardsub_locale: ''
					};
				}
				pbData.meta = {
					audio_locale: videoStream.audioLocale,
					bifs: [videoStream.bifs],
					captions: videoStream.captions,
					closed_captions: videoStream.captions,
					media_id: videoStream.assetId,
					subtitles: videoStream.subtitles,
					versions: videoStream.versions
				};
				pbData.vpb[`adaptive_${options.vstream}_${videoStream.url.includes('m3u8') ? 'hls' : 'dash'}_drm`] = {
					...derivedPlaystreams
				};
			}

			if (!options.cstream && options.vstream !== options.astream && videoStream) {
				const audioPlaybackReq = await this.req.getData(
					`https://www.crunchyroll.com/playback/v3/${currentVersion ? currentVersion.guid : currentMediaId}/${CrunchyAudioPlayStreams[options.astream]}/${isDLAudioBypass ? 'download' : 'play?queue=1'}`,
					AuthHeaders
				);
				if (!audioPlaybackReq.ok || !audioPlaybackReq.res) {
					console.warn('Request Audio Stream URLs FAILED!');
				} else {
					audioStream = (await audioPlaybackReq.res.json()) as CrunchyPlayStream;
					const derivedPlaystreams = {} as CrunchyStreams;
					// Give Audiostream the Videostream hardsubs if undefined or empty array
					if (!audioStream.hardSubs || Object.values(audioStream.hardSubs).length === 0) audioStream.hardSubs = videoStream.hardSubs;
					for (const hardsub in audioStream.hardSubs) {
						const stream = audioStream.hardSubs[hardsub];
						derivedPlaystreams[hardsub] = {
							url: stream.url,
							hardsub_locale: stream.hlang
						};
					}
					if (isDLAudioBypass) {
						audioStream.token = videoStream.token;
						derivedPlaystreams[''] = {
							url: this.convertDownloadToPlayback(audioStream.url, videoStream.url),
							hardsub_locale: ''
						};
					} else {
						derivedPlaystreams[''] = {
							url: audioStream.url,
							hardsub_locale: ''
						};
					}
					pbData.meta = {
						audio_locale: audioStream.audioLocale,
						bifs: [audioStream.bifs],
						captions: audioStream.captions,
						closed_captions: audioStream.captions,
						media_id: audioStream.assetId,
						subtitles: audioStream.subtitles,
						versions: audioStream.versions
					};
					pbData.apb[`adaptive_${options.astream}_${audioStream.url.includes('m3u8') ? 'hls' : 'dash'}_drm`] = {
						...derivedPlaystreams
					};
				}
			} else {
				pbData.apb = pbData.vpb;
			}

			variables.push(
				...(
					[
						['title', medias.episodeTitle, true],
						['episode', isNaN(parseFloat(medias.episodeNumber)) ? medias.episodeNumber : parseFloat(medias.episodeNumber), false],
						['service', 'CR', false],
						['seriesTitle', medias.seriesTitle, true],
						['showTitle', medias.seriesTitle ?? medias.seasonTitle, true],
						['season', medias.season, false]
					] as [AvailableFilenameVars, string | number, boolean][]
				).map((a): Variable => {
					return {
						name: a[0],
						replaceWith: a[1],
						type: typeof a[1],
						sanitize: a[2]
					} as Variable;
				})
			);

			let vstreams: any[] = [];
			let astreams: any[] = [];
			let hsLangs: string[] = [];
			const vpbStreams = pbData.vpb;
			const apbStreams = pbData.apb;

			if (!canDecrypt && (!options.novids || !options.noaudio)) {
				console.error('No valid Widevine or PlayReady CDM detected. Please ensure a supported and functional CDM is installed.');
				return undefined;
			}

			if (!this.cfg.bin.mp4decrypt && !this.cfg.bin.shaka && (!options.novids || !options.noaudio)) {
				console.error('Neither Shaka nor MP4Decrypt found. Please ensure at least one of them is installed.');
				return undefined;
			}

			for (const s of Object.keys(pbData.vpb)) {
				if ((s.match(/hls/) || s.match(/dash/)) && !(s.match(/hls/) && s.match(/drm/)) && !s.match(/trailer/)) {
					const pb = Object.values(vpbStreams[s]).map((v) => {
						v.hardsub_lang = v.hardsub_locale ? langsData.fixAndFindCrLC(v.hardsub_locale).locale : v.hardsub_locale;
						if (v.hardsub_lang && hsLangs.indexOf(v.hardsub_lang) < 0) {
							hsLangs.push(v.hardsub_lang);
						}
						return {
							...v,
							...{ format: s }
						};
					});
					vstreams.push(...pb);
				}
			}

			for (const s of Object.keys(pbData.apb)) {
				if ((s.match(/hls/) || s.match(/dash/)) && !(s.match(/hls/) && s.match(/drm/)) && !s.match(/trailer/)) {
					const pb = Object.values(apbStreams[s]).map((v) => {
						v.hardsub_lang = v.hardsub_locale ? langsData.fixAndFindCrLC(v.hardsub_locale).locale : v.hardsub_locale;
						if (v.hardsub_lang && hsLangs.indexOf(v.hardsub_lang) < 0) {
							hsLangs.push(v.hardsub_lang);
						}
						return {
							...v,
							...{ format: s }
						};
					});
					astreams.push(...pb);
				}
			}

			if (vstreams.length < 1) {
				console.warn('No full video streams found!');
				return undefined;
			}

			if (astreams.length < 1) {
				console.warn('No full audio streams found!');
				return undefined;
			}

			const audDub = langsData.findLang(langsData.fixLanguageTag(pbData.meta.audio_locale as string) || '').code;
			hsLangs = langsData.sortTags(hsLangs);

			vstreams = vstreams.map((s) => {
				s.audio_lang = audDub;
				s.hardsub_lang = s.hardsub_lang ? s.hardsub_lang : '-';
				s.type = `${s.format}/${s.audio_lang}/${s.hardsub_lang}`;
				return s;
			});

			vstreams = vstreams.sort((a, b) => {
				if (a.type < b.type) {
					return -1;
				}
				return 0;
			});

			astreams = astreams.map((s) => {
				s.audio_lang = audDub;
				s.hardsub_lang = s.hardsub_lang ? s.hardsub_lang : '-';
				s.type = `${s.format}/${s.audio_lang}/${s.hardsub_lang}`;
				return s;
			});

			astreams = astreams.sort((a, b) => {
				if (a.type < b.type) {
					return -1;
				}
				return 0;
			});

			if (options.hslang != 'none') {
				if (hsLangs.indexOf(options.hslang) > -1) {
					console.info('Selecting stream with %s hardsubs', langsData.locale2language(options.hslang).language);
					vstreams = vstreams.filter((s) => {
						if (s.hardsub_lang == '-') {
							return false;
						}
						return s.hardsub_lang == options.hslang;
					});
					astreams = astreams.filter((s) => {
						if (s.hardsub_lang == '-') {
							return false;
						}
						return s.hardsub_lang == options.hslang;
					});
					if (astreams.length < 1) {
						console.warn('No audio streams found, using video audio streams instead');
						astreams = vstreams;
					}
					if (vstreams.length < 1) {
						console.error('Raw video streams not available!');
						dlFailed = true;
					}
				} else {
					console.warn('Selected stream with %s hardsubs not available', langsData.locale2language(options.hslang).language);
					if (hsLangs.length > 0) {
						console.warn('Try other hardsubs stream:', hsLangs.join(', '));
					}
					dlFailed = true;
				}
			} else {
				vstreams = vstreams.filter((s) => {
					return s.hardsub_lang == '-';
				});
				astreams = astreams.filter((s) => {
					return s.hardsub_lang == '-';
				});
				if (astreams.length < 1) {
					console.warn('No audio streams found, using video audio streams instead');
					astreams = vstreams;
				}
				if (vstreams.length < 1) {
					console.error('Raw video streams not available!');
					if (hsLangs.length > 0) {
						console.warn('Try hardsubs stream:', hsLangs.join(', '));
					}
					dlFailed = true;
				}
				console.info('Selecting raw stream');
			}

			let vcurStream: undefined | (typeof vstreams)[0] = undefined;
			let acurStream: undefined | (typeof astreams)[0] = undefined;

			if (!dlFailed) {
				console.info('Downloading...');
				vcurStream = vstreams[0];
				acurStream = astreams[0];

				console.info('Video Playlists URL: %s (%s)', vcurStream.url, vcurStream.type);
				console.info('Audio Playlists URL: %s (%s)', acurStream.url, acurStream.type);
			}

			let tsFile = undefined;

			// Delete the stream if it's not needed
			if (options.novids && options.noaudio) {
				if (videoStream) {
					await this.refreshToken(true, true);
					await this.req.getData(`https://www.crunchyroll.com/playback/v1/token/${currentVersion ? currentVersion.guid : currentMediaId}/${videoStream.token}`, {
						...{ method: 'DELETE' },
						...AuthHeaders
					});
				}
				if (audioStream && videoStream?.token !== audioStream.token) {
					await this.req.getData(`https://www.crunchyroll.com/playback/v1/token/${currentVersion ? currentVersion.guid : currentMediaId}/${audioStream.token}`, {
						...{ method: 'DELETE' },
						...AuthHeaders
					});
				}
			}

			if (!dlFailed && vcurStream && acurStream && vcurStream !== undefined && acurStream !== undefined && !(options.novids && options.noaudio)) {
				const vstreamPlaylistsReq = await this.req.getData(vcurStream.url, AuthHeaders);
				const astreamPlaylistsReq = vcurStream.url !== acurStream.url ? await this.req.getData(acurStream.url, AuthHeaders) : vstreamPlaylistsReq;
				if (!vstreamPlaylistsReq.ok || !vstreamPlaylistsReq.res || !astreamPlaylistsReq.ok || !astreamPlaylistsReq.res) {
					console.error("CAN'T FETCH VIDEO PLAYLISTS!");
					dlFailed = true;
				} else {
					const vstreamPlaylistBody = await vstreamPlaylistsReq.res.text();
					const astreamPlaylistBody = vcurStream.url !== acurStream.url ? await astreamPlaylistsReq.res.text() : vstreamPlaylistBody;
					if (vstreamPlaylistBody.match('MPD') && astreamPlaylistBody.match('MPD')) {
						//Parse MPD Playlists
						const vstreamPlaylists = await parse(
							vstreamPlaylistBody,
							langsData.findLang(langsData.fixLanguageTag(pbData.meta.audio_locale as string) || ''),
							vcurStream.url.match(/.*\.urlset\//)?.[0]
						);
						const astreamPlaylists =
							vcurStream.url !== acurStream.url
								? await parse(
										astreamPlaylistBody,
										langsData.findLang(langsData.fixLanguageTag(pbData.meta.audio_locale as string) || ''),
										acurStream.url.match(/.*\.urlset\//)?.[0]
									)
								: vstreamPlaylists;

						//Get name of CDNs/Servers
						const vstreamServers = Object.keys(vstreamPlaylists);
						const astreamServers = Object.keys(astreamPlaylists);

						options.x = options.x > vstreamServers.length ? 1 : options.x;

						const vselectedServer = vstreamServers[options.x - 1];
						const vselectedList = vstreamPlaylists[vselectedServer];

						const aselectedServer = astreamServers[options.x - 1];
						const aselectedList = astreamPlaylists[aselectedServer];

						//set Video Qualities
						const videos = vselectedList.video.map((item) => {
							return {
								...item,
								resolutionText: `${item.quality.width}x${item.quality.height} (${Math.round(item.bandwidth / 1024)}KiB/s)`
							};
						});

						const audios = aselectedList.audio.map((item) => {
							return {
								...item,
								resolutionText: `${Math.round(item.bandwidth / 1000)}kB/s`
							};
						});

						videos.sort((a, b) => {
							return a.quality.width - b.quality.width;
						});

						audios.sort((a, b) => {
							return a.bandwidth - b.bandwidth;
						});

						let chosenVideoQuality = options.q === 0 ? videos.length : options.q;
						if (chosenVideoQuality > videos.length) {
							console.warn(
								`The requested quality of ${options.q} is greater than the maximum ${videos.length}.\n[WARN] Therefor the maximum will be capped at ${videos.length}.`
							);
							chosenVideoQuality = videos.length;
						}
						chosenVideoQuality--;

						let chosenAudioQuality = options.q === 0 ? audios.length : options.q;
						if (chosenAudioQuality > audios.length) {
							chosenAudioQuality = audios.length;
						}
						chosenAudioQuality--;

						const chosenVideoSegments = videos[chosenVideoQuality];
						const chosenAudioSegments = audios[chosenAudioQuality];

						console.info(`Available Video Qualities:\n\t${videos.map((a, ind) => `[${ind + 1}] ${a.resolutionText}`).join('\n\t')}`);
						console.info(`Available Audio Qualities:\n\t${audios.map((a, ind) => `[${ind + 1}] ${a.resolutionText}`).join('\n\t')}`);

						variables.push(
							{
								name: 'height',
								type: 'number',
								replaceWith: chosenVideoSegments.quality.height
							},
							{
								name: 'width',
								type: 'number',
								replaceWith: chosenVideoSegments.quality.width
							}
						);

						const lang = langsData.languages.find((a) => a.code === acurStream?.audio_lang);
						if (!lang) {
							console.error(`Unable to find language for code ${acurStream.audio_lang}`);
							return;
						}
						console.info(
							`Selected quality: \n\tVideo: ${chosenVideoSegments.resolutionText}\n\tAudio: ${chosenAudioSegments.resolutionText}\n\tVideo Server: ${vselectedServer}\n\tAudio Server: ${aselectedServer}`
						);
						console.info('Stream URL:', chosenVideoSegments.segments[0].uri.split(',.urlset')[0]);
						// TODO check filename
						fileName = parseFileName(options.fileName, variables, options.numbers, options.override).join(path.sep);
						const outFile = parseFileName(options.fileName + '.' + (mMeta.lang?.name || lang.name), variables, options.numbers, options.override).join(path.sep);
						const tempFile = parseFileName(`temp-${currentVersion ? currentVersion.guid : currentMediaId}`, variables, options.numbers, options.override).join(
							path.sep
						);
						const tempTsFile = path.isAbsolute(tempFile as string) ? tempFile : path.join(this.cfg.dir.content, tempFile);

						let encryptionKeysVideo;
						let encryptionKeysAudio;

						//Handle Getting Decryption Keys if needed
						if (chosenVideoSegments.pssh_wvd || chosenVideoSegments.pssh_prd || chosenAudioSegments.pssh_wvd || chosenAudioSegments.pssh_prd) {
							await this.refreshToken(true, true);
							if (videoStream) {
								await this.req.getData(
									`https://www.crunchyroll.com/playback/v1/token/${currentVersion ? currentVersion.guid : currentMediaId}/${videoStream.token}/keepAlive?playhead=1`,
									{ ...{ method: 'PATCH' }, ...AuthHeaders }
								);
							}
							if (audioStream && videoStream?.token !== audioStream.token) {
								await this.req.getData(
									`https://www.crunchyroll.com/playback/v1/token/${currentVersion ? currentVersion.guid : currentMediaId}/${audioStream.token}/keepAlive?playhead=1`,
									{ ...{ method: 'PATCH' }, ...AuthHeaders }
								);
							}

							console.info(`Getting decryption keys with ${cdm}`);
							// New Crunchyroll DRM endpoint for Widevine
							if (cdm === 'widevine') {
								encryptionKeysVideo = await getKeysWVD(chosenVideoSegments.pssh_wvd, api.drm_widevine, {
									Authorization: `Bearer ${this.token.access_token}`,
									...api.crunchyDefHeader,
									Pragma: 'no-cache',
									'Cache-Control': 'no-cache',
									'content-type': 'application/octet-stream',
									'x-cr-content-id': currentVersion ? currentVersion.guid : currentMediaId,
									'x-cr-video-token': videoStream!.token
								});

								// Check if the audio pssh is different since Crunchyroll started to have different dec keys for audio tracks
								if (chosenAudioSegments.pssh_wvd && chosenAudioSegments.pssh_wvd !== chosenVideoSegments.pssh_wvd) {
									encryptionKeysAudio = await getKeysWVD(chosenAudioSegments.pssh_wvd, api.drm_widevine, {
										Authorization: `Bearer ${this.token.access_token}`,
										...api.crunchyDefHeader,
										Pragma: 'no-cache',
										'Cache-Control': 'no-cache',
										'content-type': 'application/octet-stream',
										'x-cr-content-id': currentVersion ? currentVersion.guid : currentMediaId,
										'x-cr-video-token': audioStream!.token
									});
								} else {
									encryptionKeysAudio = encryptionKeysVideo;
								}
							}

							// New Crunchyroll DRM endpoint for Playready
							if (cdm === 'playready') {
								encryptionKeysVideo = await getKeysPRD(chosenVideoSegments.pssh_prd, api.drm_playready, {
									Authorization: `Bearer ${this.token.access_token}`,
									...api.crunchyDefHeader,
									Pragma: 'no-cache',
									'Cache-Control': 'no-cache',
									'content-type': 'application/octet-stream',
									'x-cr-content-id': currentVersion ? currentVersion.guid : currentMediaId,
									'x-cr-video-token': videoStream!.token
								});

								// Check if the audio pssh is different since Crunchyroll started to have different dec keys for audio tracks
								if (chosenAudioSegments.pssh_prd && chosenAudioSegments.pssh_prd !== chosenVideoSegments.pssh_prd) {
									encryptionKeysAudio = await getKeysPRD(chosenAudioSegments.pssh_prd, api.drm_playready, {
										Authorization: `Bearer ${this.token.access_token}`,
										...api.crunchyDefHeader,
										Pragma: 'no-cache',
										'Cache-Control': 'no-cache',
										'content-type': 'application/octet-stream',
										'x-cr-content-id': currentVersion ? currentVersion.guid : currentMediaId,
										'x-cr-video-token': audioStream!.token
									});
								} else {
									encryptionKeysAudio = encryptionKeysVideo;
								}
							}

							if (!encryptionKeysVideo || encryptionKeysVideo.length == 0 || !encryptionKeysAudio || encryptionKeysAudio.length == 0) {
								console.error('Failed to get encryption keys');
								return undefined;
							}

							console.info('Got decryption keys');
						}

						if (videoStream) {
							await this.refreshToken(true, true);
							await this.req.getData(`https://www.crunchyroll.com/playback/v1/token/${currentVersion ? currentVersion.guid : currentMediaId}/${videoStream.token}`, {
								...{ method: 'DELETE' },
								...AuthHeaders
							});
						}
						if (audioStream && videoStream?.token !== audioStream.token) {
							await this.req.getData(`https://www.crunchyroll.com/playback/v1/token/${currentVersion ? currentVersion.guid : currentMediaId}/${audioStream.token}`, {
								...{ method: 'DELETE' },
								...AuthHeaders
							});
						}

						let [audioDownloaded, videoDownloaded] = [false, false];

						// When best selected video quality is already downloaded
						if (dlVideoOnce && options.dlVideoOnce) {
							console.info('Already downloaded video, skipping video download...');
						} else if (options.novids) {
							console.info('Skipping video download...');
						} else {
							//Download Video
							const totalParts = chosenVideoSegments.segments.length;
							const mathParts = Math.ceil(totalParts / options.partsize);
							const mathMsg = `(${mathParts}*${options.partsize})`;
							console.info('Total parts in video stream:', totalParts, mathMsg);
							tsFile = path.isAbsolute(outFile as string) ? outFile : path.join(this.cfg.dir.content, outFile);
							const dirName = path.dirname(tsFile);
							if (!fs.existsSync(dirName)) {
								fs.mkdirSync(dirName, { recursive: true });
							}
							const videoJson: M3U8Json = {
								segments: chosenVideoSegments.segments
							};
							const videoDownload = await new streamdl({
								output: chosenVideoSegments.pssh_wvd || chosenVideoSegments.pssh_prd ? `${tempTsFile}.video.enc.m4s` : `${tsFile}.video.m4s`,
								timeout: options.timeout,
								m3u8json: videoJson,
								// baseurl: chunkPlaylist.baseUrl,
								threads: options.partsize,
								fsRetryTime: options.fsRetryTime * 1000,
								override: options.force,
								callback: options.callbackMaker
									? options.callbackMaker({
											fileName: `${path.isAbsolute(outFile) ? outFile.slice(this.cfg.dir.content.length) : outFile}`,
											image: medias.image,
											parent: {
												title: medias.seasonTitle
											},
											title: medias.episodeTitle,
											language: lang
										})
									: undefined
							}).download();
							if (!videoDownload.ok) {
								console.error(`DL Stats: ${JSON.stringify(videoDownload.parts)}\n`);
								dlFailed = true;
							}
							dlVideoOnce = true;
							videoDownloaded = true;
						}

						if (chosenAudioSegments && !options.noaudio) {
							//Download Audio (if available)
							const totalParts = chosenAudioSegments.segments.length;
							const mathParts = Math.ceil(totalParts / options.partsize);
							const mathMsg = `(${mathParts}*${options.partsize})`;
							console.info('Total parts in audio stream:', totalParts, mathMsg);
							tsFile = path.isAbsolute(outFile as string) ? outFile : path.join(this.cfg.dir.content, outFile);
							const dirName = path.dirname(tsFile);
							if (!fs.existsSync(dirName)) {
								fs.mkdirSync(dirName, { recursive: true });
							}
							const audioJson: M3U8Json = {
								segments: chosenAudioSegments.segments
							};
							const audioDownload = await new streamdl({
								output: chosenVideoSegments.pssh_wvd || chosenVideoSegments.pssh_prd ? `${tempTsFile}.audio.enc.m4s` : `${tsFile}.audio.m4s`,
								timeout: options.timeout,
								m3u8json: audioJson,
								// baseurl: chunkPlaylist.baseUrl,
								threads: options.partsize,
								fsRetryTime: options.fsRetryTime * 1000,
								override: options.force,
								callback: options.callbackMaker
									? options.callbackMaker({
											fileName: `${path.isAbsolute(outFile) ? outFile.slice(this.cfg.dir.content.length) : outFile}`,
											image: medias.image,
											parent: {
												title: medias.seasonTitle
											},
											title: medias.episodeTitle,
											language: lang
										})
									: undefined
							}).download();
							if (!audioDownload.ok) {
								console.error(`DL Stats: ${JSON.stringify(audioDownload.parts)}\n`);
								dlFailed = true;
							}
							audioDownloaded = true;
						} else if (options.noaudio) {
							console.info('Skipping audio download...');
						}

						//Handle Decryption if needed
						if (
							(chosenVideoSegments.pssh_wvd || chosenVideoSegments.pssh_prd || chosenAudioSegments.pssh_wvd || chosenAudioSegments.pssh_prd) &&
							(videoDownloaded || audioDownloaded) &&
							!dlFailed
						) {
							console.info('Decryption Needed, attempting to decrypt');
							if (this.cfg.bin.mp4decrypt || this.cfg.bin.shaka) {
								let commandBaseVideo = `--show-progress --key ${encryptionKeysVideo?.[0].kid}:${encryptionKeysVideo?.[0].key} `;
								let commandBaseAudio = `--show-progress --key ${encryptionKeysAudio?.[0].kid}:${encryptionKeysAudio?.[0].key} `;
								let commandVideo = commandBaseVideo + `"${tempTsFile}.video.enc.m4s" "${tempTsFile}.video.m4s"`;
								let commandAudio = commandBaseAudio + `"${tempTsFile}.audio.enc.m4s" "${tempTsFile}.audio.m4s"`;

								if (this.cfg.bin.shaka) {
									commandBaseVideo = ` --enable_raw_key_decryption ${encryptionKeysVideo?.map((kb) => '--keys key_id=' + kb.kid + ':key=' + kb.key).join(' ')}`;
									commandBaseAudio = ` --enable_raw_key_decryption ${encryptionKeysAudio?.map((kb) => '--keys key_id=' + kb.kid + ':key=' + kb.key).join(' ')}`;
									commandVideo = `input="${tempTsFile}.video.enc.m4s",stream=video,output="${tempTsFile}.video.m4s"` + commandBaseVideo;
									commandAudio = `input="${tempTsFile}.audio.enc.m4s",stream=audio,output="${tempTsFile}.audio.m4s"` + commandBaseAudio;
								}

								if (videoDownloaded) {
									console.info('Started decrypting video,', this.cfg.bin.shaka ? 'using shaka' : 'using mp4decrypt');
									const decryptVideo = Helper.exec(
										this.cfg.bin.shaka ? 'shaka-packager' : 'mp4decrypt',
										this.cfg.bin.shaka ? `"${this.cfg.bin.shaka}"` : `"${this.cfg.bin.mp4decrypt}"`,
										commandVideo
									);
									if (!decryptVideo.isOk) {
										console.error(decryptVideo.err);
										console.error(`Decryption failed with exit code ${decryptVideo.err.code}`);
										if (this.cfg.bin.shaka) {
											console.error(`Downgrade to Shaka-Packager v2.6.1 (https://github.com/shaka-project/shaka-packager/releases/tag/v2.6.1) and try again`);
										}
										fs.renameSync(`${tempTsFile}.video.enc.m4s`, `${tsFile}.video.enc.m4s`);
										return undefined;
									} else {
										console.info('Decryption done for video');
										if (!options.nocleanup) {
											fs.removeSync(`${tempTsFile}.video.enc.m4s`);
										}
										fs.copyFileSync(`${tempTsFile}.video.m4s`, `${tsFile}.video.m4s`);
										fs.unlinkSync(`${tempTsFile}.video.m4s`);
										files.push({
											type: 'Video',
											path: `${tsFile}.video.m4s`,
											lang: lang,
											isPrimary: isPrimary
										});
									}
								}

								if (audioDownloaded) {
									console.info('Started decrypting audio,', this.cfg.bin.shaka ? 'using shaka' : 'using mp4decrypt');
									const decryptAudio = Helper.exec(
										this.cfg.bin.shaka ? 'shaka-packager' : 'mp4decrypt',
										this.cfg.bin.shaka ? `"${this.cfg.bin.shaka}"` : `"${this.cfg.bin.mp4decrypt}"`,
										commandAudio
									);
									if (!decryptAudio.isOk) {
										console.error(decryptAudio.err);
										console.error(`Decryption failed with exit code ${decryptAudio.err.code}`);
										if (this.cfg.bin.shaka) {
											console.error(`Downgrade to Shaka-Packager v2.6.1 (https://github.com/shaka-project/shaka-packager/releases/tag/v2.6.1) and try again`);
										}
										fs.renameSync(`${tempTsFile}.audio.enc.m4s`, `${tsFile}.audio.enc.m4s`);
										return undefined;
									} else {
										if (!options.nocleanup) {
											fs.removeSync(`${tempTsFile}.audio.enc.m4s`);
										}
										fs.copyFileSync(`${tempTsFile}.audio.m4s`, `${tsFile}.audio.m4s`);
										fs.unlinkSync(`${tempTsFile}.audio.m4s`);
										files.push({
											type: 'Audio',
											path: `${tsFile}.audio.m4s`,
											lang: lang,
											isPrimary: isPrimary
										});
										console.info('Decryption done for audio');
									}
								}
							} else {
								console.warn('mp4decrypt/shaka not found, files need decryption. Decryption Keys:', encryptionKeysVideo, encryptionKeysAudio);
							}
						} else if (dlFailed) {
							console.error('Download failed, skipping decryption');
						} else {
							if (videoDownloaded) {
								files.push({
									type: 'Video',
									path: `${tsFile}.video.m4s`,
									lang: lang,
									isPrimary: isPrimary
								});
							}
							if (audioDownloaded) {
								files.push({
									type: 'Audio',
									path: `${tsFile}.audio.m4s`,
									lang: lang,
									isPrimary: isPrimary
								});
							}
						}
					} else if (!options.novids) {
						const streamPlaylists = m3u8(vstreamPlaylistBody);
						const plServerList: string[] = [],
							plStreams: Record<string, Record<string, string>> = {},
							plQuality: {
								str: string;
								dim: string;
								CODECS: string;
								RESOLUTION: {
									width: number;
									height: number;
								};
							}[] = [];
						for (const pl of streamPlaylists.playlists) {
							// set quality
							const plResolution = pl.attributes.RESOLUTION;
							const plResolutionText = `${plResolution.width}x${plResolution.height}`;
							// set codecs
							const plCodecs = pl.attributes.CODECS;
							// parse uri
							const plUri = new URL(pl.uri);
							let plServer = plUri.hostname;
							// set server list
							if (plUri.searchParams.get('cdn')) {
								plServer += ` (${plUri.searchParams.get('cdn')})`;
							}
							if (!plServerList.includes(plServer)) {
								plServerList.push(plServer);
							}
							// add to server
							if (!Object.keys(plStreams).includes(plServer)) {
								plStreams[plServer] = {};
							}
							if (
								plStreams[plServer][plResolutionText] &&
								plStreams[plServer][plResolutionText] != pl.uri &&
								typeof plStreams[plServer][plResolutionText] != 'undefined'
							) {
								console.error(`Non duplicate url for ${plServer} detected, please report to developer!`);
							} else {
								plStreams[plServer][plResolutionText] = pl.uri;
							}
							// set plQualityStr
							const plBandwidth = Math.round(pl.attributes.BANDWIDTH / 1024);
							const qualityStrAdd = `${plResolutionText} (${plBandwidth}KiB/s)`;
							const qualityStrRegx = new RegExp(qualityStrAdd.replace(/([:()/])/g, '\\$1'), 'm');
							const qualityStrMatch = !plQuality
								.map((a) => a.str)
								.join('\r\n')
								.match(qualityStrRegx);
							if (qualityStrMatch) {
								plQuality.push({
									str: qualityStrAdd,
									dim: plResolutionText,
									CODECS: plCodecs,
									RESOLUTION: plResolution
								});
							}
						}

						const plSelectedServer = plServerList[0];
						const plSelectedList = plStreams[plSelectedServer];
						plQuality.sort((a, b) => {
							const aMatch: RegExpMatchArray | never[] = a.dim.match(/[0-9]+/) || [];
							const bMatch: RegExpMatchArray | never[] = b.dim.match(/[0-9]+/) || [];
							return parseInt(aMatch[0]) - parseInt(bMatch[0]);
						});
						let quality = options.q === 0 ? plQuality.length : options.q;
						if (quality > plQuality.length) {
							console.warn(
								`The requested quality of ${options.q} is greater than the maximum ${plQuality.length}.\n[WARN] Therefor the maximum will be capped at ${plQuality.length}.`
							);
							quality = plQuality.length;
						}
						// When best selected video quality is already downloaded
						if (dlVideoOnce && options.dlVideoOnce) {
							// Select the lowest resolution with the same codecs
							while (quality != 1 && plQuality[quality - 1].CODECS == plQuality[quality - 2].CODECS) {
								quality--;
							}
						}
						const selPlUrl = plSelectedList[plQuality.map((a) => a.dim)[quality - 1]] ? plSelectedList[plQuality.map((a) => a.dim)[quality - 1]] : '';
						console.info(`Servers available:\n\t${plServerList.join('\n\t')}`);
						console.info(`Available qualities:\n\t${plQuality.map((a, ind) => `[${ind + 1}] ${a.str}`).join('\n\t')}`);

						if (selPlUrl != '') {
							variables.push(
								{
									name: 'height',
									type: 'number',
									replaceWith: quality === 0 ? (plQuality[plQuality.length - 1].RESOLUTION.height as number) : plQuality[quality - 1].RESOLUTION.height
								},
								{
									name: 'width',
									type: 'number',
									replaceWith: quality === 0 ? (plQuality[plQuality.length - 1].RESOLUTION.width as number) : plQuality[quality - 1].RESOLUTION.width
								}
							);
							const lang = langsData.languages.find((a) => a.code === vcurStream?.audio_lang);
							if (!lang) {
								console.error(`Unable to find language for code ${vcurStream.audio_lang}`);
								return;
							}
							console.info(`Selected quality: ${Object.keys(plSelectedList).find((a) => plSelectedList[a] === selPlUrl)} @ ${plSelectedServer}`);
							console.info('Stream URL:', selPlUrl);
							// TODO check filename
							fileName = parseFileName(options.fileName, variables, options.numbers, options.override).join(path.sep);
							const outFile = parseFileName(options.fileName + '.' + (mMeta.lang?.name || lang.name), variables, options.numbers, options.override).join(path.sep);
							console.info(`Output filename: ${outFile}`);
							const chunkPage = await this.req.getData(selPlUrl, {
								headers: api.crunchyDefHeader
							});
							if (!chunkPage.ok || !chunkPage.res) {
								console.error("CAN'T FETCH VIDEO PLAYLIST!");
								dlFailed = true;
							} else {
								// We have the stream, so go ahead and delete the active stream
								if (videoStream) {
									await this.refreshToken(true, true);
									await this.req.getData(
										`https://www.crunchyroll.com/playback/v1/token/${currentVersion ? currentVersion.guid : currentMediaId}/${videoStream.token}`,
										{ ...{ method: 'DELETE' }, ...AuthHeaders }
									);
								}
								if (audioStream && videoStream?.token !== audioStream.token) {
									await this.req.getData(
										`https://www.crunchyroll.com/playback/v1/token/${currentVersion ? currentVersion.guid : currentMediaId}/${audioStream.token}`,
										{ ...{ method: 'DELETE' }, ...AuthHeaders }
									);
								}

								const chunkPageBody = await chunkPage.res.text();
								const chunkPlaylist = m3u8(chunkPageBody);
								const totalParts = chunkPlaylist.segments.length;
								const mathParts = Math.ceil(totalParts / options.partsize);
								const mathMsg = `(${mathParts}*${options.partsize})`;
								console.info('Total parts in stream:', totalParts, mathMsg);
								tsFile = path.isAbsolute(outFile as string) ? outFile : path.join(this.cfg.dir.content, outFile);
								const dirName = path.dirname(tsFile);
								if (!fs.existsSync(dirName)) {
									fs.mkdirSync(dirName, { recursive: true });
								}
								const dlStreamByPl = await new streamdl({
									output: `${tsFile}.ts`,
									timeout: options.timeout,
									m3u8json: chunkPlaylist,
									// baseurl: chunkPlaylist.baseUrl,
									threads: options.partsize,
									fsRetryTime: options.fsRetryTime * 1000,
									override: options.force,
									callback: options.callbackMaker
										? options.callbackMaker({
												fileName: `${path.isAbsolute(outFile) ? outFile.slice(this.cfg.dir.content.length) : outFile}`,
												image: medias.image,
												parent: {
													title: medias.seasonTitle
												},
												title: medias.episodeTitle,
												language: lang
											})
										: undefined
								}).download();
								if (!dlStreamByPl.ok) {
									console.error(`DL Stats: ${JSON.stringify(dlStreamByPl.parts)}\n`);
									dlFailed = true;
								}
								files.push({
									type: 'Video',
									path: `${tsFile}.ts`,
									lang: lang,
									isPrimary: isPrimary
								});
								dlVideoOnce = true;
							}
						} else {
							console.error('Quality not selected!\n');
							dlFailed = true;
						}
					} else if (options.novids) {
						fileName = parseFileName(options.fileName, variables, options.numbers, options.override).join(path.sep);
						console.info('Downloading skipped!');
					}
				}
			} else if (options.novids && options.noaudio) {
				fileName = parseFileName(options.fileName, variables, options.numbers, options.override).join(path.sep);
			}

			if (compiledChapters.length > 0) {
				try {
					fileName = parseFileName(options.fileName, variables, options.numbers, options.override).join(path.sep);
					const outFile = parseFileName(options.fileName + '.' + mMeta.lang?.name, variables, options.numbers, options.override).join(path.sep);
					tsFile = path.isAbsolute(outFile as string) ? outFile : path.join(this.cfg.dir.content, outFile);
					const dirName = path.dirname(tsFile);
					if (!fs.existsSync(dirName)) {
						fs.mkdirSync(dirName, { recursive: true });
					}
					const lang = langsData.languages.find((a) => a.code === vcurStream?.audio_lang);
					if (!lang) {
						console.error(`Unable to find language for code ${vcurStream.audio_lang}`);
						return;
					}
					fs.writeFileSync(`${tsFile}.txt`, compiledChapters.join('\r\n'));
					files.push({
						path: `${tsFile}.txt`,
						lang: lang,
						type: 'Chapters'
					});
				} catch {
					console.error('Failed to write chapter file');
				}
			}

			if (options.dlsubs.indexOf('all') > -1) {
				options.dlsubs = ['all'];
			}

			if (options.hslang != 'none') {
				console.warn('Subtitles downloading disabled for hardsubs streams.');
				options.skipsubs = true;
			}

			if (options.nosubs) {
				console.info('Subtitles downloading disabled from nosubs flag.');
				options.skipsubs = true;
			}

			if (!options.skipsubs && options.dlsubs.indexOf('none') == -1) {
				if (
					(pbData.meta.subtitles && Object.values(pbData.meta.subtitles).length) ||
					(pbData.meta.closed_captions && Object.values(pbData.meta.closed_captions).length > 0)
				) {
					const subsData = Object.values(pbData.meta.subtitles);
					const capsData = Object.values(pbData.meta.closed_captions);
					const subsDataMapped = subsData
						.map((s) => {
							const subLang = langsData.fixAndFindCrLC(s.language);
							return {
								...s,
								isCC: false,
								locale: subLang,
								language: subLang.locale
							};
						})
						.concat(
							capsData.map((s) => {
								const subLang = langsData.fixAndFindCrLC(s.language);
								return {
									...s,
									isCC: true,
									locale: subLang,
									language: subLang.locale
								};
							})
						);
					const subsArr = langsData.sortSubtitles<(typeof subsDataMapped)[0]>(subsDataMapped, 'language');
					for (const subsIndex in subsArr) {
						const subsItem = subsArr[subsIndex];
						const langItem = subsItem.locale;
						const sxData: Partial<sxItem> = {};
						sxData.language = langItem;
						const isSigns = langItem.code === audDub && !subsItem.isCC;
						const isCC = subsItem.isCC;
						sxData.file = langsData.subsFile(fileName as string, subsIndex, langItem, isCC, options.ccTag, isSigns, subsItem.format);
						if (path.isAbsolute(sxData.file)) {
							sxData.path = sxData.file;
						} else {
							sxData.path = path.join(this.cfg.dir.content, sxData.file);
						}
						const dirName = path.dirname(sxData.path);
						if (!fs.existsSync(dirName)) {
							fs.mkdirSync(dirName, { recursive: true });
						}
						if (
							files.some(
								(a) =>
									a.type === 'Subtitle' &&
									(a.language.cr_locale == langItem.cr_locale || a.language.locale == langItem.locale) &&
									a.cc === isCC &&
									a.signs === isSigns
							)
						)
							continue;
						if ((options.dlsubs.includes('all') || options.dlsubs.includes(langItem.locale)) && subsItem?.url) {
							const subsAssReq = await this.req.getData(subsItem.url, {
								headers: api.crunchyDefHeader
							});
							if (subsAssReq.ok && subsAssReq.res) {
								let sBody = await subsAssReq.res.text();
								if (subsItem.format == 'vtt') {
									if (!options.noASSConv) {
										const chosenFontSize = options.originalFontSize ? undefined : options.fontSize;
										if (!options.originalFontSize) sBody = sBody.replace(/( font-size:.+?;)/g, '').replace(/(font-size:.+?;)/g, '');
										sBody = vtt2ass(undefined, chosenFontSize, sBody, '', undefined, options.fontName);
										sxData.fonts = fontsData.assFonts(sBody) as Font[];
										sxData.file = sxData.file.replace('.vtt', '.ass');
									} else {
										// Yeah, whatever
										sxData.fonts = [];
									}
								} else {
									// Extract PlayRes
									const mX = sBody.match(/^PlayResX:\s*(\d+)/m);
									const mY = sBody.match(/^PlayResY:\s*(\d+)/m);
									let playResX = Number(mX?.[1]);
									let playResY = Number(mY?.[1]);

									// Fix for Crunchyroll CCC SRT ASS
									if (sBody.includes('www.closedcaptionconverter.com') && options.srtAssFix && !options.noSubFix) {
										playResX = 640;
										playResY = 360;

										// Fix invalid Dialogue and remove PlayDepth
										sBody = sBody.replace(/,,,,25.00,,/g, ',,0,0,0,,').replace('PlayDepth: 0\n', '');

										// Fix fonts
										switch (langItem.cr_locale) {
											case 'de-DE':
												sBody = sBody.replace(/^Style:\s*([^,]+),[^,]+\s*,\s*[\d.]+(?:,[^,]+){15},(\d+)(?:,[^,]+){3},(\d+)$/gm, (match, name, align) => {
													return `Style: ${name},Arial,23,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,2,0,${align},0,0,20,1`;
												});
												break;
											case 'id-ID':
												sBody = sBody.replace(/^Style:\s*([^,]+),[^,]+\s*,\s*[\d.]+(?:,[^,]+){15},(\d+)(?:,[^,]+){3},(\d+)$/gm, (match, name, align) => {
													return `Style: ${name},Arial,20,&H00FFFFFF,&H0000FFFF,&H00000000,&H7F404040,-1,0,0,0,100,100,0,0,1,2,1,${align},0020,0020,0022,0`;
												});
												break;
											case 'hi-IN':
												sBody = sBody.replace(/^Style:\s*([^,]+),[^,]+\s*,\s*[\d.]+(?:,[^,]+){15},(\d+)(?:,[^,]+){3},(\d+)$/gm, (match, name, align) => {
													return `Style: ${name},Mangal,24,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,1,${align},0010,0010,0018,0`;
												});
												break;
											case 'ta-IN':
												sBody = sBody.replace(/^Style:\s*([^,]+),[^,]+\s*,\s*[\d.]+(?:,[^,]+){15},(\d+)(?:,[^,]+){3},(\d+)$/gm, (match, name, align) => {
													return `Style: ${name},Noto Sans Tamil,24,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,1,${align},0010,0010,0018,0`;
												});
												break;
											case 'te-IN':
												sBody = sBody.replace(/^Style:\s*([^,]+),[^,]+\s*,\s*[\d.]+(?:,[^,]+){15},(\d+)(?:,[^,]+){3},(\d+)$/gm, (match, name, align) => {
													return `Style: ${name},Noto Sans Telugu,24,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,1,${align},0010,0010,0018,0`;
												});
												break;
											case 'vi-VN':
												sBody = sBody.replace(/^Style:\s*([^,]+),[^,]+\s*,\s*[\d.]+(?:,[^,]+){15},(\d+)(?:,[^,]+){3},(\d+)$/gm, (match, name, align) => {
													return `Style: ${name},Arial Unicode MS,20,&H00FFFFFF,&H0000FFFF,&H00000000,&H7F404040,-1,0,0,0,100,100,0,0,1,2,1,${align},0020,0020,0022,0`;
												});
												break;
											case 'ms-MY':
												sBody = sBody.replace(/^Style:\s*([^,]+),[^,]+\s*,\s*[\d.]+(?:,[^,]+){15},(\d+)(?:,[^,]+){3},(\d+)$/gm, (match, name, align) => {
													return `Style: ${name},Arial,20,&H00FFFFFF,&H0000FFFF,&H00000000,&H7F404040,-1,0,0,0,100,100,0,0,1,2,1,${align},0020,0020,0022,0`;
												});
												break;
											case 'th-TH':
												sBody = sBody.replace(/^Style:\s*([^,]+),[^,]+\s*,\s*[\d.]+(?:,[^,]+){15},(\d+)(?:,[^,]+){3},(\d+)$/gm, (match, name, align) => {
													return `Style: ${name},Noto Sans Thai,30,&H00FFFFFF,&H0000FFFF,&H00000000,&H7F404040,-1,0,0,0,100,100,0,0,1,2,1,${align},0020,0020,0022,0`;
												});
												break;
											case 'zh-CN':
											case 'zh-HK':
												sBody = sBody.replace(/^Style:\s*([^,]+),[^,]+\s*,\s*[\d.]+(?:,[^,]+){15},(\d+)(?:,[^,]+){3},(\d+)$/gm, (match, name, align) => {
													return `Style: ${name},Arial Unicode MS,20,&H00FFFFFF,&H0000FFFF,&H00000000,&H7F404040,-1,0,0,0,100,100,0,0,1,2,1,${align},0020,0020,0022,0`;
												});
												break;
											case 'ru-RU':
												sBody = sBody.replace(/^Style:\s*([^,]+),[^,]+\s*,\s*[\d.]+(?:,[^,]+){15},(\d+)(?:,[^,]+){3},(\d+)$/gm, (match, name, align) => {
													return `Style: ${name},Tahoma,22,&H00FFFFFF,&H000000FF,&H00000000,&H96000000,0,0,0,0,100,100,0,0,1,2,1,${align},0010,0010,0025,204`;
												});
												break;
											case 'it-IT':
												sBody = sBody.replace(/^Style:\s*([^,]+),[^,]+\s*,\s*[\d.]+(?:,[^,]+){15},(\d+)(?:,[^,]+){3},(\d+)$/gm, (match, name, align) => {
													return `Style: ${name},Trebuchet MS,22,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0,${align},0010,0010,0015,1`;
												});
												break;
											case 'ar-SA':
												sBody = sBody.replace(/^Style:\s*([^,]+),[^,]+\s*,\s*[\d.]+(?:,[^,]+){15},(\d+)(?:,[^,]+){3},(\d+)$/gm, (match, name, align) => {
													return `Style: ${name},Adobe Arabic,26,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,1,0,${align},0010,0010,0018,0`;
												});
												break;
											case 'fr-FR':
												sBody = sBody.replace(/^Style:\s*([^,]+),[^,]+\s*,\s*[\d.]+(?:,[^,]+){15},(\d+)(?:,[^,]+){3},(\d+)$/gm, (match, name, align) => {
													return `Style: ${name},Trebuchet MS,22,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,1,1,${align},0002,0002,0025,1`;
												});
												break;
											case 'pt-BR':
												sBody = sBody.replace(/^Style:\s*([^,]+),[^,]+\s*,\s*[\d.]+(?:,[^,]+){15},(\d+)(?:,[^,]+){3},(\d+)$/gm, (match, name, align) => {
													return `Style: ${name},Trebuchet MS,22,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,2,1,${align},0040,0040,0015,0`;
												});
												break;
											default:
												sBody = sBody.replace(/^Style:\s*([^,]+),[^,]+\s*,\s*[\d.]+(?:,[^,]+){15},(\d+)(?:,[^,]+){3},(\d+)$/gm, (match, name, align) => {
													return `Style: ${name},Trebuchet MS,24,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,1,${align},0010,0010,0018,0`;
												});
												break;
										}

										const lines = sBody.split('\n');

										// Add PlayResX, PlayResY, Timer and WrapStyle
										const idx = lines.findIndex((l) => l.trim() === '[Script Info]');
										if (idx !== -1) {
											const hasPlayResX = lines.some((l) => l.match(/^PlayResX:/));
											const hasPlayResY = lines.some((l) => l.match(/^PlayResY:/));
											const hasTimer = lines.some((l) => l.match(/^Timer:/));
											const hasWrapStyle = lines.some((l) => l.match(/^WrapStyle:/));

											const toInsert = [`SubtitleLanguage: ${langItem.name}`];

											if (!hasPlayResX) toInsert.push(`PlayResX: ${playResX}`);
											if (!hasPlayResY) toInsert.push(`PlayResY: ${playResY}`);
											if (!hasTimer) toInsert.push('Timer: 0.0000');
											if (!hasWrapStyle) toInsert.push('WrapStyle: 0');

											lines.splice(idx + 3, 0, ...toInsert);
										}

										sBody = lines.join('\n');
									}

									if (!options.noSubFix) {
										// LayoutRes Fix
										if (options.layoutResFix && !sBody.includes('LayoutResX') && !sBody.includes('LayoutResY')) {
											sBody = sBody.replace(/^(PlayResY:\s*\d+)/m, `$1\nLayoutResX: ${playResX}\nLayoutResY: ${playResY}`);
										}

										// ScaleBorderAndShadow Fix
										if (options.scaledBorderAndShadowFix && !sBody.includes('ScaledBorderAndShadow')) {
											sBody = sBody.replace(/^(WrapStyle:.*)$/m, `$1\nScaledBorderAndShadow: ${options.scaledBorderAndShadow}`);
										}

										// Fix VLC wrong parsing if URL not avaiable
										if (options.originalScriptFix) {
											sBody = sBody.replace(/^Original Script:.*$/gm, 'Original Script: Crunchyroll');
										}

										// Remove All Comments
										sBody = sBody.replace(/^[ \t]*;.*\r?\n?/gm, '');

										// Remove Aegisub Project Garbage
										sBody = sBody.replace(/\[Aegisub Project Garbage\][\s\S]*?(?:\r?\n(?=\[)|$)/, '');

										// Remove YCbCr
										sBody = sBody.replace(/^[ \t]*YCbCr Matrix:\s*.*\r?\n?/m, '');

										// Force outline thickness for ru-RU: if the 17th field (Outline) equals 2.6 → 2
										if (langItem.cr_locale === 'ru-RU') {
											sBody = sBody.replace(/^[ \t]*(Style:\s*[^,\n]*(?:,[^,\n]*){15}),\s*2(?:[.,]6(?:0+)?)?(\s*,)/gm, '$1,2$2');
										}
									}

									sxData.title = langItem.language;
									sxData.fonts = fontsData.assFonts(sBody) as Font[];
								}
								fs.writeFileSync(sxData.path, sBody);
								console.info(`Subtitle downloaded: ${sxData.file}`);
								files.push({
									type: 'Subtitle',
									...(sxData as sxItem),
									cc: isCC,
									signs: isSigns
								});
							} else {
								console.warn(`Failed to download subtitle: ${sxData.file}`);
								options.subdlfailed = true;
							}
						}
					}
				} else {
					console.warn("Can't find urls for subtitles!");
					options.subdlfailed = true;
				}
			} else {
				console.info('Subtitles downloading skipped!');
			}

			await this.sleep(options.waittime);
		}
		return {
			error: dlFailed,
			data: files,
			fileName: fileName ? (path.isAbsolute(fileName) ? fileName : path.join(this.cfg.dir.content, fileName)) || './unknown' : './unknown'
		};
	}

	public async muxStreams(data: DownloadedMedia[], options: CrunchyMuxOptions) {
		this.cfg.bin = await yamlCfg.loadBinCfg();
		let hasAudioStreams = false;
		if (options.novids || data.filter((a) => a.type === 'Video').length === 0) return console.info('Skip muxing since no vids are downloaded');
		if (options.subdlfailed && options.skipMuxOnSubFail) return console.info('Skip muxing since some subtitles failed to download');
		if (data.some((a) => a.type === 'Audio')) {
			hasAudioStreams = true;
		}
		const merger = new Merger({
			onlyVid: hasAudioStreams
				? data
						.filter((a) => a.type === 'Video')
						.map((a): MergerInput => {
							return {
								lang: a.lang,
								path: a.path
							};
						})
				: [],
			skipSubMux: options.skipSubMux,
			onlyAudio: hasAudioStreams
				? data
						.filter((a) => a.type === 'Audio')
						.map((a): MergerInput => {
							return {
								lang: a.lang,
								path: a.path
							};
						})
				: [],
			output: `${options.output}.${options.mp4 ? 'mp4' : 'mkv'}`,
			subtitles: data
				.filter((a) => a.type === 'Subtitle')
				.map((a): SubtitleInput => {
					return {
						file: a.path,
						language: a.language,
						closedCaption: a.cc,
						signs: a.signs
					};
				}),
			simul: false,
			keepAllVideos: options.keepAllVideos,
			fonts: Merger.makeFontsList(this.cfg.dir.fonts, data.filter((a) => a.type === 'Subtitle') as sxItem[]),
			videoAndAudio: hasAudioStreams
				? []
				: data
						.filter((a) => a.type === 'Video')
						.map((a): MergerInput => {
							return {
								lang: a.lang,
								path: a.path
							};
						}),
			chapters: data
				.filter((a) => a.type === 'Chapters')
				.map((a): MergerInput => {
					return {
						path: a.path,
						lang: a.lang
					};
				}),
			videoTitle: options.videoTitle,
			options: {
				ffmpeg: options.ffmpegOptions,
				mkvmerge: options.mkvmergeOptions
			},
			defaults: {
				audio: options.defaultAudio,
				sub: options.defaultSub
			},
			ccTag: options.ccTag
		});
		const bin = Merger.checkMerger(this.cfg.bin, options.mp4, options.forceMuxer);
		// collect fonts info
		// mergers
		let isMuxed = false;
		if (options.syncTiming) {
			await merger.createDelays();
		}
		if (bin.MKVmerge) {
			await merger.merge('mkvmerge', bin.MKVmerge);
			isMuxed = true;
		} else if (bin.FFmpeg) {
			await merger.merge('ffmpeg', bin.FFmpeg);
			isMuxed = true;
		} else {
			console.info('\nDone!\n');
			return;
		}
		if (isMuxed && !options.nocleanup) merger.cleanUp();
	}

	public async listSeriesID(
		id: string,
		data?: CrunchyMultiDownload
	): Promise<{
		list: Episode[];
		data: Record<
			string,
			{
				items: CrunchyEpisode[];
				langs: langsData.LanguageItem[];
			}
		>;
	}> {
		await this.refreshToken(true, true);
		let serieshasversions = true;
		const parsed = await this.parseSeriesById(id);
		if (!parsed) return { data: {}, list: [] };
		const result = this.parseSeriesResult(parsed);
		const episodes: Record<
			string,
			{
				items: CrunchyEpisode[];
				langs: langsData.LanguageItem[];
			}
		> = {};
		for (const season of Object.keys(result) as unknown as number[]) {
			for (const key of Object.keys(result[season])) {
				const s = result[season][key];
				if (data?.s && s.id !== data.s) continue;
				(await this.getSeasonDataById(s))?.data?.forEach((episode) => {
					//TODO: Make sure the below code is ok
					//Prepare the episode array
					let item;
					const seasonIdentifier = s.identifier ? s.identifier.split('|')[1] : `S${episode.season_number}`;
					if (!Object.prototype.hasOwnProperty.call(episodes, `${seasonIdentifier}E${episode.episode || episode.episode_number}`)) {
						item = episodes[`${seasonIdentifier}E${episode.episode || episode.episode_number}`] = {
							items: [] as CrunchyEpisode[],
							langs: [] as langsData.LanguageItem[]
						};
					} else {
						item = episodes[`${seasonIdentifier}E${episode.episode || episode.episode_number}`];
					}

					if (episode.versions) {
						//Iterate over episode versions for audio languages
						for (const version of episode.versions) {
							//Make sure there is only one of the same language
							if (!item.langs.find((a) => a?.cr_locale == version.audio_locale)) {
								//Push to arrays if there is no duplicates of the same language.
								item.items.push(episode);
								item.langs.push(langsData.languages.find((a) => a.cr_locale == version.audio_locale) as langsData.LanguageItem);
							}
						}
						//Sort audio tracks according to the order of languages passed to the 'dubLang' option
						const argv = yargs.appArgv(this.cfg.cli);
						if (!argv.allDubs) {
							item.langs.sort((a, b) => argv.dubLang.indexOf(a.code) - argv.dubLang.indexOf(b.code));
						}
					} else {
						//Episode didn't have versions, mark it as such to be logged.
						serieshasversions = false;
						//Make sure there is only one of the same language
						if (!item.langs.find((a) => a?.cr_locale == episode.audio_locale)) {
							//Push to arrays if there is no duplicates of the same language.
							item.items.push(episode);
							item.langs.push(langsData.languages.find((a) => a.cr_locale == episode.audio_locale) as langsData.LanguageItem);
						}
					}
				});
			}
		}

		const itemIndexes = {
			sp: 1,
			no: 1
		};

		for (const key of Object.keys(episodes)) {
			const item = episodes[key];
			const isSpecial = !item.items[0].episode.match(/^\d+$/);
			episodes[`${isSpecial ? 'S' : 'E'}${itemIndexes[isSpecial ? 'sp' : 'no']}`] = item;
			if (isSpecial) itemIndexes.sp++;
			else itemIndexes.no++;
			delete episodes[key];
		}

		// Sort episodes to have specials at the end
		const specials = Object.entries(episodes).filter((a) => a[0].startsWith('S')),
			normal = Object.entries(episodes).filter((a) => a[0].startsWith('E')),
			sortedEpisodes = Object.fromEntries([...normal, ...specials]);

		for (const key of Object.keys(sortedEpisodes)) {
			const item = sortedEpisodes[key];
			const epNum = key.startsWith('E') ? `E${data?.absolute ? item.items[0].episode_number?.toString() || item.items[0].episode : key.slice(1)}` : key;
			console.info(`[${data?.absolute ? epNum : key}] [${item.items[0].upload_date ? new Date(item.items[0].upload_date).toISOString().slice(0, 10) : '0000-00-00'}] ${
				item.items.find((a) => !a.season_title.match(/\(\w+ Dub\)/))?.season_title ?? item.items[0].season_title.replace(/\(\w+ Dub\)/g, '').trimEnd()
			} - Season ${item.items[0].season_number} - ${item.items[0].title}
            \r\t- Versions: ${item.items
				.map((a, index) => {
					return `${a.is_premium_only ? '☆ ' : ''}${item.langs?.[index]?.name ?? 'Unknown'}`;
				})
				.join(', ')}
            \r\t- Subtitles: ${[...new Set(item.items.flatMap((a) => a.subtitle_locales ?? 'None'))].join(', ')}`);
		}

		if (!serieshasversions) {
			console.warn("Couldn't find versions on some episodes, fell back to old method.");
		}

		return {
			data: sortedEpisodes,
			list: Object.entries(sortedEpisodes).map(([key, value]) => {
				const images = (value.items[0].images.thumbnail ?? [[{ source: '/notFound.png' }]])[0];
				const seconds = Math.floor(value.items[0].duration_ms / 1000);
				let epNum;
				if (data?.absolute) {
					epNum =
						value.items[0].episode_number !== null && value.items[0].episode_number !== undefined
							? value.items[0].episode_number.toString()
							: value.items[0].episode !== null && value.items[0].episode !== undefined
								? value.items[0].episode
								: key.startsWith('E')
									? key.slice(1)
									: key;
				} else {
					epNum = key.startsWith('E') ? key.slice(1) : key;
				}
				return {
					e: epNum,
					lang: value.langs.map((a) => a?.code),
					name: value.items[0].title,
					season: value.items[0].season_number.toString(),
					seriesTitle: value.items[0].series_title.replace(/\(\w+ Dub\)/g, '').trimEnd(),
					seasonTitle: value.items[0].season_title.replace(/\(\w+ Dub\)/g, '').trimEnd(),
					episode: value.items[0].episode_number?.toString() ?? value.items[0].episode ?? '?',
					id: value.items[0].season_id,
					img: images[Math.floor(images.length / 2)].source,
					description: value.items[0].description,
					time: `${Math.floor(seconds / 60)}:${seconds % 60}`
				};
			})
		};
	}

	public async downloadFromSeriesID(id: string, data: CrunchyMultiDownload): Promise<ResponseBase<CrunchyEpMeta[]>> {
		const { data: episodes } = await this.listSeriesID(id, data);
		console.info('');
		console.info('-'.repeat(30));
		console.info('');
		const selected = this.itemSelectMultiDub(episodes, data.dubLang, data.but, data.all, data.e, data.absolute);
		for (const key of Object.keys(selected)) {
			const item = selected[key];
			console.info(
				`[S${item.season}E${item.episodeNumber}] - ${item.episodeTitle} [${item.data
					.map((a) => {
						return `✓ ${a.lang?.name || 'Unknown Language'}`;
					})
					.join(', ')}]`
			);
		}
		return { isOk: true, value: Object.values(selected) };
	}

	public itemSelectMultiDub(
		eps: Record<
			string,
			{
				items: CrunchyEpisode[];
				langs: langsData.LanguageItem[];
			}
		>,
		dubLang: string[],
		but?: boolean,
		all?: boolean,
		e?: string,
		absolute?: boolean
	) {
		const doEpsFilter = parseSelect(e as string);

		const ret: Record<string, CrunchyEpMeta> = {};

		for (const key of Object.keys(eps)) {
			const itemE = eps[key];
			itemE.items.forEach((item, index) => {
				if (!dubLang.includes(itemE.langs[index]?.code)) return;
				item.hide_season_title = true;
				if (item.season_title == '' && item.series_title != '') {
					item.season_title = item.series_title;
					item.hide_season_title = false;
					item.hide_season_number = true;
				}
				if (item.season_title == '' && item.series_title == '') {
					item.season_title = 'NO_TITLE';
					item.series_title = 'NO_TITLE';
				}

				let epNum;
				if (absolute) {
					epNum =
						item.episode_number !== null && item.episode_number !== undefined
							? item.episode_number.toString()
							: item.episode !== null && item.episode !== undefined
								? item.episode
								: key.startsWith('E')
									? key.slice(1)
									: key;
				} else {
					epNum = key.startsWith('E') ? key.slice(1) : key;
				}

				// set data
				const images = (item.images.thumbnail ?? [[{ source: '/notFound.png' }]])[0];
				const epMeta: CrunchyEpMeta = {
					data: [
						{
							mediaId: item.id,
							versions: item.versions,
							isSubbed: item.is_subbed,
							isDubbed: item.is_dubbed
						}
					],
					seriesTitle: itemE.items.find((a) => !a.series_title.match(/\(\w+ Dub\)/))?.series_title ?? itemE.items[0].series_title.replace(/\(\w+ Dub\)/g, '').trimEnd(),
					seasonTitle: itemE.items.find((a) => !a.season_title.match(/\(\w+ Dub\)/))?.season_title ?? itemE.items[0].season_title.replace(/\(\w+ Dub\)/g, '').trimEnd(),
					episodeNumber: item.episode,
					episodeTitle: item.title,
					seasonID: item.season_id,
					season: item.season_number,
					showID: item.series_id,
					e: epNum,
					image: images[Math.floor(images.length / 2)].source
				};
				if (item.__links__?.streams?.href) {
					epMeta.data[0].playback = item.__links__.streams.href;
					if (!item.playback) {
						item.playback = item.__links__.streams.href;
					}
				}
				if (item.streams_link) {
					epMeta.data[0].playback = item.streams_link;
					if (!item.playback) {
						item.playback = item.streams_link;
					}
				}

				if (item.playback && ((but && !doEpsFilter.isSelected([epNum, item.id])) || all || (doEpsFilter.isSelected([epNum, item.id]) && !but))) {
					if (Object.prototype.hasOwnProperty.call(ret, key)) {
						const epMe = ret[key];
						epMe.data.push({
							lang: itemE.langs[index],
							...epMeta.data[0]
						});
					} else {
						epMeta.data[0].lang = itemE.langs[index];
						ret[key] = {
							...epMeta
						};
					}
				}
				// show ep
				item.seq_id = epNum;
			});
		}
		return ret;
	}

	public parseSeriesResult(seasonsList: SeriesSearch): Record<number, Record<string, SeriesSearchItem>> {
		const ret: Record<number, Record<string, SeriesSearchItem>> = {};
		let i = 0;
		for (const item of seasonsList.data) {
			i++;
			for (const lang of langsData.languages) {
				//TODO: Make sure the below code is fine
				let season_number = item.season_number;
				if (item.versions) {
					season_number = i;
				}
				if (!Object.prototype.hasOwnProperty.call(ret, season_number)) ret[season_number] = {};
				if (item.title.includes(`(${lang.name} Dub)`) || item.title.includes(`(${lang.name})`)) {
					ret[season_number][lang.code] = item;
				} else if (item.is_subbed && !item.is_dubbed && lang.code == 'jpn') {
					ret[season_number][lang.code] = item;
				} else if (
					item.is_dubbed &&
					lang.code === 'eng' &&
					!langsData.languages.some((a) => item.title.includes(`(${a.name})`) || item.title.includes(`(${a.name} Dub)`))
				) {
					// Dubbed with no more infos will be treated as eng dubs
					ret[season_number][lang.code] = item;
					//TODO: look into if below is stable
				} else if (item.audio_locale == lang.cr_locale) {
					ret[season_number][lang.code] = item;
				}
			}
		}
		return ret;
	}

	public async parseSeriesById(id: string) {
		if (!this.cmsToken.cms_web) {
			console.error('Authentication required!');
			return;
		}

		const AuthHeaders = {
			headers: {
				Authorization: `Bearer ${this.token.access_token}`,
				...api.crunchyDefHeader
			}
		};

		// seasons list
		const seriesSeasonListReq = await this.req.getData(
			`${api.content_cms}/series/${id}/seasons?force_locale=&preferred_audio_language=ja-JP&locale=${this.locale}`,
			AuthHeaders
		);
		if (!seriesSeasonListReq.ok || !seriesSeasonListReq.res) {
			console.error('Series Request FAILED!');
			return;
		}
		// parse data
		const seasonsList = (await seriesSeasonListReq.res.json()) as SeriesSearch;
		if (seasonsList.total < 1) {
			console.info('Series is empty!');
			return;
		}
		return seasonsList;
	}

	public async getSeasonDataById(item: SeriesSearchItem, log = false) {
		if (!this.cmsToken.cms_web) {
			console.error('Authentication required!');
			return;
		}

		const AuthHeaders = {
			headers: {
				Authorization: `Bearer ${this.token.access_token}`,
				...api.crunchyDefHeader
			}
		};

		//get show info
		const showInfoReq = await this.req.getData(`${api.content_cms}/seasons/${item.id}?force_locale=&preferred_audio_language=ja-JP&locale=${this.locale}`, AuthHeaders);
		if (!showInfoReq.ok || !showInfoReq.res) {
			console.error('Show Request FAILED!');
			return;
		}
		const showInfo = await showInfoReq.res.json();
		if (log) await this.logObject(showInfo, 0);

		let episodeList = { total: 0, data: [], meta: {} } as CrunchyEpisodeList;
		//get episode info
		for (const s of showInfo.data) {
			const original_id = s.versions?.find((v: { original: boolean }) => v.original)?.guid;
			const id = original_id ? original_id : s.id;

			const reqEpsListOpts = [
				api.cms_bucket,
				this.cmsToken.cms_web.bucket,
				'/episodes?',
				new URLSearchParams({
					force_locale: '',
					preferred_audio_language: 'ja-JP',
					locale: this.locale,
					season_id: id,
					Policy: this.cmsToken.cms_web.policy,
					Signature: this.cmsToken.cms_web.signature,
					'Key-Pair-Id': this.cmsToken.cms_web.key_pair_id
				})
			].join('');
			const reqEpsList = await this.req.getData(reqEpsListOpts, AuthHeaders);
			if (!reqEpsList.ok || !reqEpsList.res) {
				console.error('Episode List Request FAILED!');
				return;
			}

			const episodeListAndroid = (await reqEpsList.res.json()) as CrunchyAndroidEpisodes;
			episodeList = {
				total: episodeList.total + episodeListAndroid.total,
				data: [...episodeList.data, ...episodeListAndroid.items],
				meta: {}
			};
		}

		if (episodeList.total < 1) {
			console.info('  Season is empty!');
			return;
		}
		return episodeList;
	}
}
