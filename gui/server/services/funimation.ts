import { AuthData, CheckTokenResponse, EpisodeListResponse, MessageHandler, QueueItem, ResolveItemsData, SearchData, SearchResponse } from '../../../@types/messageHandler';
import Funimation from '../../../funi';
import { getDefault } from '../../../modules/module.args';
import { languages, subtitleLanguagesFilter } from '../../../modules/module.langsData';
import WebSocketHandler from '../websocket';
import Base from './base';
import { console } from '../../../modules/log';
import * as yargs from '../../../modules/module.app-args';

class FunimationHandler extends Base implements MessageHandler {
  private funi: Funimation;
  public name = 'funi';
  constructor(ws: WebSocketHandler) {
    super(ws);
    this.funi = new Funimation();
    this.initState();
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
    const dubLanguageCodesArray: string[] = [];
    for(const language of languages){
      if (language.funi_locale)
        dubLanguageCodesArray.push(language.code);
    }
    return [...new Set(dubLanguageCodesArray)];
  }

  public async availableSubCodes(): Promise<string[]> {
    return subtitleLanguagesFilter;
  }

  public async resolveItems(data: ResolveItemsData): Promise<boolean> {
    console.debug(`Got resolve options: ${JSON.stringify(data)}`);
    const res = await this.funi.getShow(false, { ...data, id: parseInt(data.id) });
    if (!res.isOk)
      return res.isOk;
    this.addToQueue(res.value.map(a => {
      return {
        ...data,
        ids: [a.episodeID],
        title: a.title,
        parent: {
          title: a.seasonTitle,
          season: a.seasonNumber
        },
        image: a.image,
        e: a.episodeID,
        episode: a.epsiodeNumber,
      };
    }));
    return true;
  }

  public async search(data: SearchData): Promise<SearchResponse> {
    console.debug(`Got search options: ${JSON.stringify(data)}`);
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

  public async downloadItem(data: QueueItem) {
    this.setDownloading(true);
    console.debug(`Got download options: ${JSON.stringify(data)}`);
    const res = await this.funi.getShow(false, { all: false, but: false, id: parseInt(data.id), e: data.e });
    const _default = yargs.appArgv(this.funi.cfg.cli, true);
    if (!res.isOk)
      return this.alertError(res.reason);

    for (const ep of res.value) {
      await this.funi.getEpisode(false, { dubLang: data.dubLang, fnSlug: ep, s: data.id, subs: { dlsubs: data.dlsubs, sub: false, ccTag: _default.ccTag } }, { ..._default, callbackMaker: this.makeProgressHandler.bind(this), ass: true, fileName: data.fileName, q: data.q, force: 'y',
        noaudio: data.noaudio, novids: data.novids });
    }
    this.sendMessage({ name: 'finish', data: undefined });
    this.setDownloading(false);
    this.onFinish();
  }
}

export default FunimationHandler;