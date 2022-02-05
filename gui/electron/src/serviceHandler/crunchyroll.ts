import { BrowserWindow } from 'electron';
import { CrunchyDownloadOptions } from '../../../../@types/crunchyTypes';
import { AuthData, CheckTokenResponse, DownloadData, EpisodeListResponse, MessageHandler, QueueItem, ResolveItemsData, ResponseBase, SearchData, SearchResponse } from '../../../../@types/messageHandler';
import Crunchy from '../../../../crunchy';
import Funimation from '../../../../funi';
import { ArgvType } from '../../../../modules/module.app-args';
import { buildDefault, getDefault } from '../../../../modules/module.args';
import { dubLanguageCodes } from '../../../../modules/module.langsData';
import Base from './base';

class CrunchyHandler extends Base implements MessageHandler {
  private crunchy: Crunchy;
  constructor(window: BrowserWindow) {
    super(window);
    this.crunchy = new Crunchy();
  }
  
  public async listEpisodes (id: string): Promise<EpisodeListResponse> {
    return { isOk: true, value: (await this.crunchy.listSeriesID(id)).list };
  }
  
  public async handleDefault(name: string) {
    return getDefault(name, this.crunchy.cfg.cli);
  }

  public async availableDubCodes(): Promise<string[]> {
    return dubLanguageCodes;
  }

  public async resolveItems(data: ResolveItemsData): Promise<ResponseBase<QueueItem[]>> {
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
        e: a.e
      };
    }) };
  }

  public async search(data: SearchData): Promise<SearchResponse> {
    this.crunchy.refreshToken();
    const crunchySearch = await this.crunchy.doSearch(data);
    if (!crunchySearch.isOk)
      return crunchySearch;
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
    this.setDownloading(true);
    const _default = buildDefault() as ArgvType;
    await this.crunchy.refreshToken();
    const res = await this.crunchy.downloadFromSeriesID(data.id, {
      dubLang: data.dubLang,
      e: data.e
    });
    if (res.isOk) {
      for (const select of res.value) {
        if (!(await this.crunchy.downloadEpisode(select, {..._default, skipsubs: false, callbackMaker: this.makeProgressHandler.bind(this), q: data.q, fileName: data.fileName }))) {
          const er = new Error(`Unable to download episode ${data.e} from ${data.id}`);
          er.name = 'Download error';
          this.alertError(er);
        }
      }
    } else {
      this.alertError(res.reason);
    }
    this.sendMessage({ name: 'finish', data: undefined })
    this.setDownloading(false);
  }
}

export default CrunchyHandler;