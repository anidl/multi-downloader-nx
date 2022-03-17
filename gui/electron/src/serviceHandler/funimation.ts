import { BrowserWindow } from 'electron';
import { AuthData, CheckTokenResponse, DownloadData, EpisodeListResponse, MessageHandler, QueueItem, ResolveItemsData, ResponseBase, SearchData, SearchResponse } from '../../../../@types/messageHandler';
import Funimation from '../../../../funi';
import { ArgvType } from '../../../../modules/module.app-args';
import { buildDefault, getDefault } from '../../../../modules/module.args';
import { languages, subtitleLanguagesFilter } from '../../../../modules/module.langsData';
import Base from './base';

class FunimationHandler extends Base implements MessageHandler {
  private funi: Funimation;
  constructor(window: BrowserWindow) {
    super(window);
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
      name: item.title,
      season: item.seasonNum ?? item.seasonTitle ?? item.item.seasonNum ?? item.item.seasonTitle,
      seasonTitle: item.seasonTitle,
      episode: item.episodeNum,
      id: item.id,
      img: item.thumb,
      description: item.synopsis,
      time: item.runtime ?? item.item.runtime
    })) };
  }
  
  public async handleDefault(name: string) {
    return getDefault(name, this.funi.cfg.cli);
  }

  public async availableDubCodes(): Promise<string[]> {
    const dubLanguageCodesArray = [];
    for(const language of languages){
      if (language.funi_locale)
        dubLanguageCodesArray.push(language.code);
    }
    return [...new Set(dubLanguageCodesArray)];
  }

  public async availableSubCodes(): Promise<string[]> {
    return subtitleLanguagesFilter;
  }

  public async resolveItems(data: ResolveItemsData): Promise<ResponseBase<QueueItem[]>> {
    console.log(`[DEBUG] Got resolve options: ${JSON.stringify(data)}`)
    const res = await this.funi.getShow(false, { ...data, id: parseInt(data.id) });
    if (!res.isOk)
      return res;
    return { isOk: true, value: res.value.map(a => {
      return {
        ...data,
        ids: [a.episodeID],
        title: a.title,
        parent: {
          title: a.seasonTitle,
          season: a.seasonNumber
        },
        e: a.episodeID,
        episode: a.epsiodeNumber,
      };
    }) };
  }

  public async search(data: SearchData): Promise<SearchResponse> {
    console.log(`[DEBUG] Got search options: ${JSON.stringify(data)}`)
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

  public async downloadItem(data: DownloadData) {
    this.setDownloading(true);
    console.log(`[DEBUG] Got download options: ${JSON.stringify(data)}`)
    const res = await this.funi.getShow(false, { all: false, but: false, id: parseInt(data.id), e: data.e });
    const _default = buildDefault() as ArgvType;
    if (!res.isOk)
      return this.alertError(res.reason);

    for (const ep of res.value) {
      await this.funi.getEpisode(false, { dubLang: data.dubLang, fnSlug: ep, s: data.id, subs: { dlsubs: data.dlsubs, sub: false } }, { ..._default, callbackMaker: this.makeProgressHandler.bind(this), ass: true, fileName: data.fileName, q: data.q });
    }
    this.sendMessage({ name: 'finish', data: undefined });
    this.setDownloading(false);
  }
}

export default FunimationHandler;