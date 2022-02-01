import { AuthData, CheckTokenResponse, EpisodeListResponse, MessageHandler, QueueItem, ResolveItemsData, ResponseBase, SearchData, SearchResponse } from '../../../../@types/messageHandler';
import Funimation from '../../../../funi';
import { getDefault } from '../../../../modules/module.args';
import { dubLanguageCodes } from '../../../../modules/module.langsData';
import Base from './base';

class FunimationHandler extends Base implements MessageHandler {
  private funi: Funimation;
  constructor() {
    super();
    this.funi = new Funimation();
  }

  public async listEpisodes (id: string) : Promise<EpisodeListResponse> {
    const parse = parseInt(id);
    if (isNaN(parse) || parse <= 0)
      return { isOk: false, reason: new Error('The ID is invalid') };
    const request = await this.funi.listShowItems(parse);
    if (!request.isOk)
      return request;
    return { isOk: true, value: request.value.map(item => ({
      e: item.id_split.join(''),
      lang: item.audio ?? [],
      name: item.episodeSlug,
      season: item.seasonNum,
      seasonTitle: item.seasonTitle,
      episode: item.episodeNum,
      id: item.id
    })) }
  }
  
  public async handleDefault(name: string) {
    return getDefault(name, this.funi.cfg.cli);
  }

  public async availableDubCodes(): Promise<string[]> {
    return dubLanguageCodes;
  }

  public async resolveItems(data: ResolveItemsData): Promise<ResponseBase<QueueItem[]>> {
    const res = await this.funi.getShow(false, { ...data, id: parseInt(data.id) });
    if (!res.isOk)
      return res;
    return { isOk: true, value: res.value.map(a => {
      return {
        ids: [a.episodeID],
        title: a.title,
        parent: {
          title: a.seasonTitle,
          season: a.seasonNumber
        },
        ...data
      };
    }) };
  }

  public async search(data: SearchData): Promise<SearchResponse> {
    const funiSearch = await this.funi.searchShow(false, data);
    if (!funiSearch.isOk)
      return funiSearch;
    return { isOk: true, value: funiSearch.value.items.hits.map(a => ({
      image: a.image.showThumbnail,
      name: a.title,
      desc: a.description,
      id: a.id,
      lang: a.languages,
      rating: a.starRating
    })) };
  }

  public async checkToken(): Promise<CheckTokenResponse> {
    return this.funi.checkToken();
  }

  public auth(data: AuthData) {
    return this.funi.auth(data);
  }
}

export default FunimationHandler;