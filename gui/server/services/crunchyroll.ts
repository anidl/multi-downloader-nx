import { AuthData, CheckTokenResponse, DownloadData, EpisodeListResponse, MessageHandler, ResolveItemsData, SearchData, SearchResponse } from '../../../@types/messageHandler';
import Crunchy from '../../../crunchy';
import { getDefault } from '../../../modules/module.args';
import { languages, subtitleLanguagesFilter } from '../../../modules/module.langsData';
import WebSocketHandler from '../websocket';
import Base from './base';
import { console } from '../../../modules/log';
import * as yargs from '../../../modules/module.app-args';

class CrunchyHandler extends Base implements MessageHandler {
  private crunchy: Crunchy;
  public name = 'crunchy';
  constructor(ws: WebSocketHandler) {
    super(ws);
    this.crunchy = new Crunchy();
    this.crunchy.refreshToken();
    this.initState();
    this.getDefaults();
  }

  public getDefaults() {
    const _default = yargs.appArgv(this.crunchy.cfg.cli, true);
    this.crunchy.locale = _default.locale;
  }
  
  public async listEpisodes (id: string): Promise<EpisodeListResponse> {
    this.getDefaults();
    await this.crunchy.refreshToken(true);
    return { isOk: true, value: (await this.crunchy.listSeriesID(id)).list };
  }
  
  public async handleDefault(name: string) {
    return getDefault(name, this.crunchy.cfg.cli);
  }

  public async availableDubCodes(): Promise<string[]> {
    const dubLanguageCodesArray: string[] = [];
    for(const language of languages){
      if (language.cr_locale)
        dubLanguageCodesArray.push(language.code);
    }
    return [...new Set(dubLanguageCodesArray)];
  }

  public async availableSubCodes(): Promise<string[]> {
    return subtitleLanguagesFilter;
  }

  public async resolveItems(data: ResolveItemsData): Promise<boolean> {
    this.getDefaults();
    await this.crunchy.refreshToken(true);
    console.debug(`Got resolve options: ${JSON.stringify(data)}`);
    const res = await this.crunchy.downloadFromSeriesID(data.id, data);
    if (!res.isOk)
      return res.isOk;
    this.addToQueue(res.value.map(a => {
      return {
        ...data,
        
        ids: a.data.map(a => a.mediaId),
        title: a.episodeTitle,
        parent: {
          title: a.seasonTitle,
          season: a.season.toString()
        },
        e: a.e,
        image: a.image,
        episode: a.episodeNumber
      };
    }));
    return true;
  }

  public async search(data: SearchData): Promise<SearchResponse> {
    this.getDefaults();
    await this.crunchy.refreshToken(true);
    if (!data['search-type']) data['search-type'] = 'series';
    console.debug(`Got search options: ${JSON.stringify(data)}`);
    const crunchySearch = await this.crunchy.doSearch(data);
    if (!crunchySearch.isOk) {
      this.crunchy.refreshToken();
      return crunchySearch;
    }
    return { isOk: true, value: crunchySearch.value };
  }

  public async checkToken(): Promise<CheckTokenResponse> {
    if (await this.crunchy.getProfile()) {
      return { isOk: true, value: undefined };
    } else {
      return { isOk: false, reason: new Error('') };
    }
  }

  public auth(data: AuthData) {
    return this.crunchy.doAuth(data);
  }

  public async downloadItem(data: DownloadData) {
    this.getDefaults();
    await this.crunchy.refreshToken(true);
    console.debug(`Got download options: ${JSON.stringify(data)}`);
    this.setDownloading(true);
    const _default = yargs.appArgv(this.crunchy.cfg.cli, true);
    const res = await this.crunchy.downloadFromSeriesID(data.id, {
      dubLang: data.dubLang,
      e: data.e
    });
    if (res.isOk) {
      for (const select of res.value) {
        if (!(await this.crunchy.downloadEpisode(select, {..._default, skipsubs: false, callbackMaker: this.makeProgressHandler.bind(this), q: data.q, fileName: data.fileName, dlsubs: data.dlsubs, dlVideoOnce: data.dlVideoOnce, force: 'y', 
          novids: data.novids, noaudio: data.noaudio, hslang: data.hslang || 'none'  }))) {
          const er = new Error(`Unable to download episode ${data.e} from ${data.id}`);
          er.name = 'Download error';
          this.alertError(er);
        }
      }
    } else {
      this.alertError(res.reason);
    }
    this.sendMessage({ name: 'finish', data: undefined });
    this.setDownloading(false);
    this.onFinish();
  }
}

export default CrunchyHandler;