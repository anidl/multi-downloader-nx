import { AuthData, CheckTokenResponse, DownloadData, Episode, EpisodeListResponse, MessageHandler, ResolveItemsData, SearchData, SearchResponse } from '../../../@types/messageHandler';
import AnimeOnegai from '../../../ao';
import { getDefault } from '../../../modules/module.args';
import { languages } from '../../../modules/module.langsData';
import WebSocketHandler from '../websocket';
import Base from './base';
import { console } from '../../../modules/log';
import * as yargs from '../../../modules/module.app-args';

class AnimeOnegaiHandler extends Base implements MessageHandler {
  private ao: AnimeOnegai;
  public name = 'ao';
  constructor(ws: WebSocketHandler) {
    super(ws);
    this.ao = new AnimeOnegai();
    this.initState();
    this.getDefaults();
  }

  public getDefaults() {
    const _default = yargs.appArgv(this.ao.cfg.cli, true);
    if (['es', 'pt'].includes(_default.locale))
      this.ao.locale = _default.locale;
  }

  public async auth(data: AuthData) {
    return this.ao.doAuth(data);
  }

  public async checkToken(): Promise<CheckTokenResponse> {
    //TODO: implement proper method to check token
    return { isOk: true, value: undefined };
  }

  public async search(data: SearchData): Promise<SearchResponse> {
    console.debug(`Got search options: ${JSON.stringify(data)}`);
    const search = await this.ao.doSearch(data);
    if (!search.isOk) {
      return search;
    }
    return { isOk: true, value: search.value };
  }

  public async handleDefault(name: string) {
    return getDefault(name, this.ao.cfg.cli);
  }

  public async availableDubCodes(): Promise<string[]> {
    const dubLanguageCodesArray: string[] = [];
    for(const language of languages){
      if (language.ao_locale)
        dubLanguageCodesArray.push(language.code);
    }
    return [...new Set(dubLanguageCodesArray)];
  }

  public async availableSubCodes(): Promise<string[]> {
    const subLanguageCodesArray: string[] = [];
    for(const language of languages){
      if (language.ao_locale)
        subLanguageCodesArray.push(language.locale);
    }
    return ['all', 'none', ...new Set(subLanguageCodesArray)];
  }

  public async resolveItems(data: ResolveItemsData): Promise<boolean> {
    const parse = parseInt(data.id);
    if (isNaN(parse) || parse <= 0)
      return false;
    console.debug(`Got resolve options: ${JSON.stringify(data)}`);
    const _default = yargs.appArgv(this.ao.cfg.cli, true);
    const res = await this.ao.selectShow(parseInt(data.id), data.e, data.but, data.all, _default);
    if (!res.isOk || !res.value)
      return res.isOk;
    this.addToQueue(res.value.map(a => {
      return {
        ...data,
        ids: a.data.map(a => a.videoId),
        title: a.episodeTitle,
        parent: {
          title: a.seasonTitle,
          season: a.seasonTitle
        },
        e: a.episodeNumber+'',
        image: a.image,
        episode: a.episodeNumber+''
      };
    }));
    return true;
  }

  public async listEpisodes(id: string): Promise<EpisodeListResponse> {
    const parse = parseInt(id);
    if (isNaN(parse) || parse <= 0)
      return { isOk: false, reason: new Error('The ID is invalid') };

    const request = await this.ao.listShow(parse);
    if (!request.isOk || !request.value)
      return {isOk: false, reason: new Error('Unknown upstream error, check for additional logs')};

    const episodes: Episode[] = [];
    const seasonNumberTitleParse = request.series.data.title.match(/\d+$/);
    const seasonNumber = seasonNumberTitleParse ? parseInt(seasonNumberTitleParse[0]) : 1;
    //request.value
    for (const episodeKey in request.value) {
      const episode = request.value[episodeKey][0];
      const langs = Array.from(new Set(request.value[episodeKey].map(a=>a.lang)));
      episodes.push({
        e: episode.number+'',
        lang: langs as string[],
        name: episode.name,
        season: seasonNumber+'',
        seasonTitle: '',
        episode: episode.number+'',
        id: episode.video_entry+'',
        img: episode.thumbnail,
        description: episode.description,
        time: ''
      });
    }
    return { isOk: true, value: episodes };
  }

  public async downloadItem(data: DownloadData) {
    this.setDownloading(true);
    console.debug(`Got download options: ${JSON.stringify(data)}`);
    const _default = yargs.appArgv(this.ao.cfg.cli, true);
    const res = await this.ao.selectShow(parseInt(data.id), data.e, false, false, {
      ..._default,
      dubLang: data.dubLang,
      e: data.e
    });
    if (res.isOk) {
      for (const select of res.value) {
        if (!(await this.ao.downloadEpisode(select, {..._default, skipsubs: false, callbackMaker: this.makeProgressHandler.bind(this), q: data.q, fileName: data.fileName, dlsubs: data.dlsubs, dlVideoOnce: data.dlVideoOnce, force: 'y', 
          novids: data.novids, noaudio: data.noaudio, hslang: data.hslang || 'none', dubLang: data.dubLang }))) {
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

export default AnimeOnegaiHandler;