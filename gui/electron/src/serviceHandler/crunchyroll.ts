import { AuthData, CheckTokenResponse, EpisodeListResponse, MessageHandler, QueueItem, ResolveItemsData, ResponseBase, SearchData, SearchResponse } from '../../../../@types/messageHandler';
import Crunchy from '../../../../crunchy';
import Funimation from '../../../../funi';
import { getDefault } from '../../../../modules/module.args';
import { dubLanguageCodes } from '../../../../modules/module.langsData';
import Base from './base';

class CrunchyHandler extends Base implements MessageHandler {
  private crunchy: Crunchy;
  constructor() {
    super();
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
        ids: a.data.map(a => a.mediaId),
        title: a.episodeTitle,
        parent: {
          title: a.seasonTitle,
          season: a.season.toString()
        },
        ...data
      };
    }) };
  }

  public async search(data: SearchData): Promise<SearchResponse> {
    this.crunchy.refreshToken();
    const funiSearch = await this.crunchy.doSearch(data);
    if (!funiSearch.isOk)
      return funiSearch;
    return { isOk: true, value: funiSearch.value };
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
}

export default CrunchyHandler;