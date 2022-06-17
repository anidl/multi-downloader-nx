import { BrowserWindow } from 'electron';
import { AuthData, CheckTokenResponse, DownloadData, EpisodeListResponse, MessageHandler, QueueItem, ResolveItemsData, ResponseBase, SearchData, SearchResponse } from '../../../../@types/messageHandler';
import Crunchy from '../../../../crunchy';
import { ArgvType } from '../../../../modules/module.app-args';
import { buildDefault, getDefault } from '../../../../modules/module.args';
import { languages, subtitleLanguagesFilter } from '../../../../modules/module.langsData';
import Base from './base';

class CrunchyHandler extends Base implements MessageHandler {
  private crunchy: Crunchy;
  constructor(window: BrowserWindow) {
    super(window);
    this.crunchy = new Crunchy();
    this.crunchy.refreshToken();
  }
  
  public async listEpisodes (id: string): Promise<EpisodeListResponse> {
    await this.crunchy.refreshToken(true);
    return { isOk: true, value: (await this.crunchy.listSeriesID(id)).list };
  }
  
  public async handleDefault(name: string) {
    return getDefault(name, this.crunchy.cfg.cli);
  }

  public async availableDubCodes(): Promise<string[]> {
    const dubLanguageCodesArray = [];
    for(const language of languages){
      if (language.cr_locale)
        dubLanguageCodesArray.push(language.code);
    }
    return [...new Set(dubLanguageCodesArray)];
  }

  public async availableSubCodes(): Promise<string[]> {
    return subtitleLanguagesFilter;
  }

  public async resolveItems(data: ResolveItemsData): Promise<ResponseBase<QueueItem[]>> {
    await this.crunchy.refreshToken(true);
    console.log(`[DEBUG] Got resolve options: ${JSON.stringify(data)}`);
    const res = await this.crunchy.downloadFromSeriesID(data.id, data);
    if (!res.isOk)
      return res;
    return { isOk: true, value: res.value.map(a => {
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
    }) };
  }

  public async search(data: SearchData): Promise<SearchResponse> {
    await this.crunchy.refreshToken(true);
    console.log(`[DEBUG] Got search options: ${JSON.stringify(data)}`);
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
    await this.crunchy.refreshToken(true);
    console.log(`[DEBUG] Got download options: ${JSON.stringify(data)}`);
    this.setDownloading(true);
    const _default = buildDefault() as ArgvType;
    const res = await this.crunchy.downloadFromSeriesID(data.id, {
      dubLang: data.dubLang,
      e: data.e
    });
    if (res.isOk) {
      for (const select of res.value) {
        if (!(await this.crunchy.downloadEpisode(select, {..._default, skipsubs: false, callbackMaker: this.makeProgressHandler.bind(this), q: data.q, fileName: data.fileName, dlsubs: data.dlsubs, force: 'y', 
          novids: data.novids  }))) {
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
  }
}

export default CrunchyHandler;