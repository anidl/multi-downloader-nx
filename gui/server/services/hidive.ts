import { AuthData, CheckTokenResponse, DownloadData, EpisodeListResponse, MessageHandler, ResolveItemsData, SearchData, SearchResponse } from '../../../@types/messageHandler';
import Hidive from '../../../hidive';
import { getDefault } from '../../../modules/module.args';
import { languages } from '../../../modules/module.langsData';
import WebSocketHandler from '../websocket';
import Base from './base';
import { console } from '../../../modules/log';
import * as yargs from '../../../modules/module.app-args';

class HidiveHandler extends Base implements MessageHandler {
  private hidive: Hidive;
  public name = 'hidive';
  constructor(ws: WebSocketHandler) {
    super(ws);
    this.hidive = new Hidive();
    this.hidive.doInit();
    this.initState();
  }

  public async auth(data: AuthData) {
    await this.getAPIVersion();
    return this.hidive.doAuth(data);
  }

  public async checkToken(): Promise<CheckTokenResponse> {
    //TODO: implement proper method to check token
    return { isOk: true, value: undefined };
  }

  public async getAPIVersion() {
    const _default = yargs.appArgv(this.hidive.cfg.cli, true);
    this.hidive.api = _default.hdapi;
  }

  public async search(data: SearchData): Promise<SearchResponse> {
    await this.getAPIVersion();
    console.debug(`Got search options: ${JSON.stringify(data)}`);
    const hidiveSearch = await this.hidive.doSearch(data);
    if (!hidiveSearch.isOk) {
      return hidiveSearch;
    }
    return { isOk: true, value: hidiveSearch.value };
  }

  public async handleDefault(name: string) {
    return getDefault(name, this.hidive.cfg.cli);
  }

  public async availableDubCodes(): Promise<string[]> {
    const dubLanguageCodesArray: string[] = [];
    for(const language of languages){
      if (language.new_hd_locale)
        dubLanguageCodesArray.push(language.code);
    }
    return [...new Set(dubLanguageCodesArray)];
  }

  public async availableSubCodes(): Promise<string[]> {
    const subLanguageCodesArray: string[] = [];
    for(const language of languages){
      if (language.new_hd_locale)
        subLanguageCodesArray.push(language.locale);
    }
    return ['all', 'none', ...new Set(subLanguageCodesArray)];
  }

  public async resolveItems(data: ResolveItemsData): Promise<boolean> {
    const parse = parseInt(data.id);
    if (isNaN(parse) || parse <= 0)
      return false;
    console.debug(`Got resolve options: ${JSON.stringify(data)}`);
    await this.getAPIVersion();
    if (this.hidive.api == 'old') {
      const res = await this.hidive.getShow(parseInt(data.id), data.e, data.but, data.all);
      if (!res.isOk || !res.value)
        return res.isOk;
      this.addToQueue(res.value.map(item => {
        return {
          ...data,
          ids: [item.Id],
          title: item.Name,
          parent: {
            title: item.seriesTitle,
            season: parseFloat(item.SeasonNumberValue+'')+''
          },
          image: item.ScreenShotSmallUrl,
          e: parseFloat(item.EpisodeNumberValue+'')+'',
          episode: parseFloat(item.EpisodeNumberValue+'')+'',
        };
      }));
      return true;
    } else {
      const res = await this.hidive.selectSeries(parseInt(data.id), data.e, data.but, data.all);
      if (!res.isOk || !res.value)
        return res.isOk;
      this.addToQueue(res.value.map(item => {
        return {
          ...data,
          ids: [item.id],
          title: item.title,
          parent: {
            title: item.seriesTitle,
            season: item.episodeInformation.seasonNumber+''
          },
          image: item.thumbnailUrl,
          e: item.episodeInformation.episodeNumber+'',
          episode: item.episodeInformation.episodeNumber+'',
        };
      }));
      return true;
    }
  }

  public async listEpisodes(id: string): Promise<EpisodeListResponse> {
    const parse = parseInt(id);
    if (isNaN(parse) || parse <= 0)
      return { isOk: false, reason: new Error('The ID is invalid') };

    await this.getAPIVersion();
    if (this.hidive.api == 'old') {
      const request = await this.hidive.listShow(parse);
      if (!request.isOk || !request.value)
        return {isOk: false, reason: new Error('Unknown upstream error, check for additional logs')};

      return { isOk: true, value: request.value.Episodes.map(function(item) {
        const language = item.Summary.match(/^Audio: (.*)/m);
        language?.shift();
        const description = item.Summary.split('\r\n');
        return {
          e: parseFloat(item.EpisodeNumberValue+'')+'',
          lang: language ? language[0].split(', ') : [],
          name: item.Name,
          season: parseFloat(item.SeasonNumberValue+'')+'',
          seasonTitle: request.value.Name,
          episode: parseFloat(item.EpisodeNumberValue+'')+'',
          id: item.Id+'',
          img: item.ScreenShotSmallUrl,
          description: description ? description[0] : '',
          time: ''
        };
      })};
    } else {
      const request = await this.hidive.listSeries(parse);
      if (!request.isOk || !request.value)
        return {isOk: false, reason: new Error('Unknown upstream error, check for additional logs')};

      return { isOk: true, value: request.value.map(function(item) {
        const description = item.description.split('\r\n');
        return {
          e: item.episodeInformation.episodeNumber+'',
          lang: [],
          name: item.title,
          season: item.episodeInformation.seasonNumber+'',
          seasonTitle: request.series.seasons[item.episodeInformation.seasonNumber-1].title,
          episode: item.episodeInformation.episodeNumber+'',
          id: item.id+'',
          img: item.thumbnailUrl,
          description: description ? description[0] : '',
          time: ''
        };
      })};
    }
  }

  public async downloadItem(data: DownloadData) {
    this.setDownloading(true);
    console.debug(`Got download options: ${JSON.stringify(data)}`);
    const _default = yargs.appArgv(this.hidive.cfg.cli, true);
    this.hidive.api = _default.hdapi;
    if (this.hidive.api == 'old') {
      const res = await this.hidive.getShow(parseInt(data.id), data.e, false, false);
      if (!res.isOk || !res.showData)
        return this.alertError(new Error('Download failed upstream, check for additional logs'));

      for (const ep of res.value) {
        await this.hidive.getEpisode(ep, {..._default, callbackMaker: this.makeProgressHandler.bind(this), dubLang: data.dubLang, dlsubs: data.dlsubs, fileName: data.fileName, q: data.q, force: 'y', noaudio: data.noaudio, novids: data.novids });
      }
    } else {
      const res = await this.hidive.selectSeries(parseInt(data.id), data.e, false, false);
      if (!res.isOk || !res.showData)
        return this.alertError(new Error('Download failed upstream, check for additional logs'));

      for (const ep of res.value) {
        await this.hidive.downloadEpisode(ep, {..._default, callbackMaker: this.makeProgressHandler.bind(this), dubLang: data.dubLang, dlsubs: data.dlsubs, fileName: data.fileName, q: data.q, force: 'y', noaudio: data.noaudio, novids: data.novids });
      }
    }
    this.sendMessage({ name: 'finish', data: undefined });
    this.setDownloading(false);
    this.onFinish();
  }
}

export default HidiveHandler;