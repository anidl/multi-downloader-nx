import { AuthData, CheckTokenResponse, DownloadData, EpisodeListResponse, MessageHandler, ResolveItemsData, SearchData, SearchResponse } from '../../../@types/messageHandler';
import AnimationDigitalNetwork from '../../../adn';
import { getDefault } from '../../../modules/module.args';
import { languages } from '../../../modules/module.langsData';
import WebSocketHandler from '../websocket';
import Base from './base';
import { console } from '../../../modules/log';
import * as yargs from '../../../modules/module.app-args';

class ADNHandler extends Base implements MessageHandler {
	private adn: AnimationDigitalNetwork;
	public name = 'adn';
	constructor(ws: WebSocketHandler) {
		super(ws);
		this.adn = new AnimationDigitalNetwork();
		this.initState();
		this.getDefaults();
	}

	public getDefaults() {
		const _default = yargs.appArgv(this.adn.cfg.cli, true);
		if (['fr', 'de'].includes(_default.locale)) this.adn.locale = _default.locale;
	}

	public async auth(data: AuthData) {
		return this.adn.doAuth(data);
	}

	public async checkToken(): Promise<CheckTokenResponse> {
		//TODO: implement proper method to check token
		return { isOk: true, value: undefined };
	}

	public async search(data: SearchData): Promise<SearchResponse> {
		console.debug(`Got search options: ${JSON.stringify(data)}`);
		const search = await this.adn.doSearch(data);
		if (!search.isOk) {
			return search;
		}
		return { isOk: true, value: search.value };
	}

	public async handleDefault(name: string) {
		return getDefault(name, this.adn.cfg.cli);
	}

	public async availableDubCodes(): Promise<string[]> {
		const dubLanguageCodesArray: string[] = [];
		for (const language of languages) {
			if (language.adn_locale) dubLanguageCodesArray.push(language.code);
		}
		return [...new Set(dubLanguageCodesArray)];
	}

	public async availableSubCodes(): Promise<string[]> {
		const subLanguageCodesArray: string[] = [];
		for (const language of languages) {
			if (language.adn_locale) subLanguageCodesArray.push(language.locale);
		}
		return ['all', 'none', ...new Set(subLanguageCodesArray)];
	}

	public async resolveItems(data: ResolveItemsData): Promise<boolean> {
		const parse = parseInt(data.id);
		if (isNaN(parse) || parse <= 0) return false;
		console.debug(`Got resolve options: ${JSON.stringify(data)}`);
		const res = await this.adn.selectShow(parseInt(data.id), data.e, data.but, data.all);
		if (!res.isOk || !res.value) return res.isOk;
		this.addToQueue(
			res.value.map((a) => {
				return {
					...data,
					ids: [a.id],
					title: a.title,
					parent: {
						title: a.show.shortTitle,
						season: a.season
					},
					e: a.shortNumber,
					image: a.image,
					episode: a.shortNumber
				};
			})
		);
		return true;
	}

	public async listEpisodes(id: string): Promise<EpisodeListResponse> {
		const parse = parseInt(id);
		if (isNaN(parse) || parse <= 0) return { isOk: false, reason: new Error('The ID is invalid') };

		const request = await this.adn.listShow(parse);
		if (!request.isOk || !request.value) return { isOk: false, reason: new Error('Unknown upstream error, check for additional logs') };

		return {
			isOk: true,
			value: request.value.videos.map(function (item) {
				return {
					e: item.shortNumber,
					lang: [],
					name: item.title,
					season: item.season,
					seasonTitle: item.show.title,
					episode: item.shortNumber,
					id: item.id + '',
					img: item.image,
					description: item.summary,
					time: item.duration + ''
				};
			})
		};
	}

	public async downloadItem(data: DownloadData) {
		this.setDownloading(true);
		console.debug(`Got download options: ${JSON.stringify(data)}`);
		const _default = yargs.appArgv(this.adn.cfg.cli, true);
		const res = await this.adn.selectShow(parseInt(data.id), data.e, false, false);
		if (res.isOk) {
			for (const select of res.value) {
				if (
					!(await this.adn.getEpisode(select, {
						..._default,
						skipsubs: false,
						callbackMaker: this.makeProgressHandler.bind(this),
						q: data.q,
						fileName: data.fileName,
						dlsubs: data.dlsubs,
						dlVideoOnce: data.dlVideoOnce,
						force: 'y',
						novids: data.novids,
						noaudio: data.noaudio,
						hslang: data.hslang || 'none',
						dubLang: data.dubLang
					}))
				) {
					const er = new Error(`Unable to download episode ${data.e} from ${data.id}`);
					er.name = 'Download error';
					this.alertError(er);
				}
			}
		} else {
			this.alertError(new Error('Failed to download episode, check for additional logs.'));
		}
		this.sendMessage({ name: 'finish', data: undefined });
		this.setDownloading(false);
		this.onFinish();
	}
}

export default ADNHandler;
