// build-in
import path from 'path';
import fs from 'fs-extra';

// package program
import packageJson from './package.json';

// plugins
import { console } from './modules/log';
import streamdl, { M3U8Json } from './modules/hls-download';

// custom modules
import * as fontsData from './modules/module.fontsData';
import * as langsData from './modules/module.langsData';
import * as yamlCfg from './modules/module.cfg-loader';
import * as yargs from './modules/module.app-args';
import Merger, { Font, MergerInput, SubtitleInput } from './modules/module.merger';
import vtt2ass from './modules/module.vtt2ass';
import Helper from './modules/module.helper';

// load req
import { domain, api } from './modules/module.api-urls';
import * as reqModule from './modules/module.fetch';
import { DownloadedMedia } from './@types/hidiveTypes';
import parseFileName, { Variable } from './modules/module.filename';
import { downloaded } from './modules/module.downloadArchive';
import parseSelect from './modules/module.parseSelect';
import { AvailableFilenameVars } from './modules/module.args';
import { AuthData, AuthResponse, SearchData, SearchResponse, SearchResponseItem } from './@types/messageHandler';
import { ServiceClass } from './@types/serviceClassInterface';
import { sxItem } from './crunchy';
import { Hit, NewHidiveSearch } from './@types/newHidiveSearch';
import { NewHidiveSeries } from './@types/newHidiveSeries';
import { Episode, NewHidiveEpisodeExtra, NewHidiveSeason, NewHidiveSeriesExtra } from './@types/newHidiveSeason';
import { NewHidiveEpisode } from './@types/newHidiveEpisode';
import { NewHidivePlayback, Subtitle } from './@types/newHidivePlayback';
import { MPDParsed, parse } from './modules/module.transform-mpd';
import { canDecrypt, getKeysWVD, cdm, getKeysPRD } from './modules/cdm';
import { KeyContainer } from './modules/widevine/license';

export default class Hidive implements ServiceClass { 
  public cfg: yamlCfg.ConfigObject;
  private token: Record<string, any>;
  private req: reqModule.Req;

  constructor(private debug = false) {
    this.cfg = yamlCfg.loadCfg();
    this.token = yamlCfg.loadNewHDToken();
    this.req = new reqModule.Req(domain, debug, false, 'hd');
  }

  public async cli() {
    console.info(`\n=== Multi Downloader NX ${packageJson.version} ===\n`);
    const argv = yargs.appArgv(this.cfg.cli);
    if (argv.debug)
      this.debug = true;

    //below is for quickly testing API calls
    /*const apiTest = await this.apiReq('/v4/season/18871', '', 'auth', 'GET');
      if(!apiTest.ok || !apiTest.res){return;}
      console.info(apiTest.res.body);
      fs.writeFileSync('apitest.json', JSON.stringify(JSON.parse(apiTest.res.body), null, 2));
      return console.info('test done');*/

    // load binaries
    this.cfg.bin = await yamlCfg.loadBinCfg();
    if (argv.allDubs) {
      argv.dubLang = langsData.dubLanguageCodes;
    }
    if (argv.auth) {
      //Authenticate
      await this.doAuth({
        username: argv.username ?? await Helper.question('[Q] LOGIN/EMAIL: '),
        password: argv.password ?? await Helper.question('[Q] PASSWORD: ')
      });
    } else if (argv.search && argv.search.length > 2){
      await this.doSearch({ ...argv, search: argv.search as string });
    } else if (argv.s && !isNaN(parseInt(argv.s,10)) && parseInt(argv.s,10) > 0) {
      const selected = await this.selectSeason(parseInt(argv.s), argv.e, argv.but, argv.all);
      if (selected.isOk && selected.showData) {
        for (const select of selected.value) {
          //download episode
          if (!(await this.downloadEpisode(select, {...argv}))) {
            console.error(`Unable to download selected episode ${select.episodeInformation.episodeNumber}`);
            return false;
          }
        }
      }
      return true;
    } else if (argv.srz && !isNaN(parseInt(argv.srz,10)) && parseInt(argv.srz,10) > 0) {
      const selected = await this.selectSeries(parseInt(argv.srz), argv.e, argv.but, argv.all);
      if (selected.isOk && selected.showData) {
        for (const select of selected.value) {
          //download episode
          if (!(await this.downloadEpisode(select, {...argv}))) {
            console.error(`Unable to download selected episode ${select.episodeInformation.episodeNumber}`);
            return false;
          }
        }
      }
    } else if (argv.new) {
      console.error('--new is not yet implemented in the new API');
    } else if(argv.e) { 
      if (!(await this.downloadSingleEpisode(parseInt(argv.e), {...argv}))) {
        console.error(`Unable to download selected episode ${argv.e}`);
        return false;
      }
    } else {
      console.info('No option selected or invalid value entered. Try --help.');
    }
  }


  public async apiReq(endpoint: string, body: string | object = '', authType: 'refresh' | 'auth' | 'both' | 'other' | 'none' = 'none', method: 'GET' | 'POST' = 'POST', authHeader?: string) {
    const options = { 
      headers: {
        'X-Api-Key': api.hd_new_apiKey,
        'X-App-Var': api.hd_new_version,
        'realm': 'dce.hidive',
        'Referer': 'https://www.hidive.com/',
        'Origin': 'https://www.hidive.com'
      } as Record<string, unknown>,
      method: method as 'GET'|'POST',
      url: api.hd_new_api+endpoint as string,
      body: body,
      useProxy: true
    };
    // get request type
    const isGet = method == 'GET';
    if(!isGet){
      options.body = body == '' ? body : JSON.stringify(body);
      options.headers['Content-Type'] = 'application/json';
    }
    if (authType == 'other') {
      options.headers['Authorization'] = authHeader;
    } else if (authType == 'auth') {
      options.headers['Authorization'] = `Bearer ${this.token.authorisationToken}`;
    } else if (authType == 'refresh') {
      options.headers['Authorization'] = `Bearer ${this.token.refreshToken}`;
    } else if (authType == 'both') {
      options.headers['Authorization'] = `Mixed ${this.token.authorisationToken} ${this.token.refreshToken}`;
    }
    if (this.debug) {
      console.debug('[DEBUG] Request params:');
      console.debug(options);
    }
    const apiReqOpts: reqModule.Params = {
      method: options.method,
      headers: options.headers as Record<string, string>,
      body: options.body as string
    };
    let apiReq = await this.req.getData(options.url, apiReqOpts);
    if(!apiReq.ok || !apiReq.res){
      if (apiReq.error && apiReq.error.res?.status == 401) {
        console.warn('Token expired, refreshing token and retrying.');
        if (await this.refreshToken()) {
          if (authType == 'other') {
            options.headers['Authorization'] = authHeader;
          } else if (authType == 'auth') {
            options.headers['Authorization'] = `Bearer ${this.token.authorisationToken}`;
          } else if (authType == 'refresh') {
            options.headers['Authorization'] = `Bearer ${this.token.refreshToken}`;
          } else if (authType == 'both') {
            options.headers['Authorization'] = `Mixed ${this.token.authorisationToken} ${this.token.refreshToken}`;
          }
          apiReq = await this.req.getData(options.url, apiReqOpts);
          if(!apiReq.ok || !apiReq.res) {
            console.error('API Request Failed!');
            return {
              ok: false,
              res: apiReq.res,
              error: apiReq.error
            };
          }
        } else {
          console.error('Failed to refresh token...');
          return {
            ok: false,
            res: apiReq.res,
            error: apiReq.error
          };
        }
      } else {
        console.error('API Request Failed!');
        return {
          ok: false,
          res: apiReq.res,
          error: apiReq.error
        };
      }
    }
    return {
      ok: true,
      res: apiReq.res,
    };
  }

  public async doAuth(data: AuthData): Promise<AuthResponse>  {
    if (!this.token.refreshToken || !this.token.authorisationToken) {
      await this.doAnonymousAuth();
    }
    const authReq = await this.apiReq('/v2/login', {
      id: data.username,
      secret: data.password
    }, 'auth');
    if(!authReq.ok || !authReq.res){
      console.error('Authentication failed!');
      return { isOk: false, reason: new Error('Authentication failed') };
    }
    const tokens: Record<string, string> = JSON.parse(await authReq.res.text());
    for (const token in tokens) {
      this.token[token] = tokens[token];
    }
    this.token.guest = false;
    yamlCfg.saveNewHDToken(this.token);
    console.info('Auth complete!');
    return { isOk: true, value: undefined };
  }
  
  public async doAnonymousAuth() {
    const authReq = await this.apiReq('/v2/login/guest/checkin');
    if(!authReq.ok || !authReq.res){
      console.error('Authentication failed!');
      return false;
    }
    const tokens: Record<string, string> = JSON.parse(await authReq.res.text());
    for (const token in tokens) {
      this.token[token] = tokens[token];
    }
    //this.token.expires = new Date(Date.now() + 300);
    this.token.guest = true;
    yamlCfg.saveNewHDToken(this.token);
    return true;
  }

  public async refreshToken() {
    if (!this.token.refreshToken || !this.token.authorisationToken) {
      return await this.doAnonymousAuth();
    } else {
      const authReq = await this.apiReq('/v2/token/refresh', {
        'refreshToken': this.token.refreshToken
      }, 'auth');
      if(!authReq.ok || !authReq.res){
        console.error('Token refresh failed, reinitializing session...');
        return this.initSession();
      }
      const tokens: Record<string, string> = JSON.parse(await authReq.res.text());
      for (const token in tokens) {
        this.token[token] = tokens[token];
      }
      yamlCfg.saveNewHDToken(this.token);
      return true;
    }
  }

  public async initSession() {
    const authReq = await this.apiReq('/v1/init/', '', 'both', 'GET');
    if(!authReq.ok || !authReq.res){
      console.error('Failed to initialize session.');
      return false;
    }
    const tokens: Record<string, string> = JSON.parse(await authReq.res.text()).authentication;
    for (const token in tokens) {
      this.token[token] = tokens[token];
    }
    yamlCfg.saveNewHDToken(this.token);
    return true;
  }

  public async doSearch(data: SearchData): Promise<SearchResponse> {
    const searchReq = await this.req.getData('https://h99xldr8mj-dsn.algolia.net/1/indexes/*/queries?x-algolia-agent=Algolia%20for%20JavaScript%20(3.35.1)%3B%20Browser&x-algolia-application-id=H99XLDR8MJ&x-algolia-api-key=e55ccb3db0399eabe2bfc37a0314c346', {
      method: 'POST',
      body: JSON.stringify({'requests':
        [
          {'indexName':'prod-dce.hidive-livestreaming-events','params':'query='+encodeURIComponent(data.search)+'&facetFilters=%5B%22type%3ALIVE_EVENT%22%5D&hitsPerPage=25'+(data.page ? '&page='+(data.page-1) : '')},
          {'indexName':'prod-dce.hidive-livestreaming-events','params':'query='+encodeURIComponent(data.search)+'&facetFilters=%5B%22type%3AVOD_VIDEO%22%5D&hitsPerPage=25'+(data.page ? '&page='+(data.page-1) : '')},
          {'indexName':'prod-dce.hidive-livestreaming-events','params':'query='+encodeURIComponent(data.search)+'&facetFilters=%5B%22type%3AVOD_PLAYLIST%22%5D&hitsPerPage=25'+(data.page ? '&page='+(data.page-1) : '')},
          {'indexName':'prod-dce.hidive-livestreaming-events','params':'query='+encodeURIComponent(data.search)+'&facetFilters=%5B%22type%3AVOD_SERIES%22%5D&hitsPerPage=25'+(data.page ? '&page='+(data.page-1) : '')}
        ]
      })
    });
    if(!searchReq.ok || !searchReq.res){
      console.error('Search FAILED!');
      return { isOk: false, reason: new Error('Search failed. No more information provided') };
    }
    const searchData = JSON.parse(await searchReq.res.text()) as NewHidiveSearch;
    const searchItems: Hit[] = [];
    console.info('Search Results:');
    for (const category of searchData.results) {
      for (const hit of category.hits) {
        searchItems.push(hit);
        let fullType: string;
        if (hit.type == 'VOD_SERIES') {
          fullType = `Z.${hit.id}`;
        } else if (hit.type == 'VOD_VIDEO') {
          fullType = `E.${hit.id}`;
        } else {
          fullType = `${hit.type} #${hit.id}`;
        }
        console.log(`[${fullType}] ${hit.name} ${hit.seasonsCount ? '('+hit.seasonsCount+' Seasons)' : ''}`);
      }
    }
    return { isOk: true, value: searchItems.filter(a => a.type == 'VOD_SERIES').flatMap((a): SearchResponseItem => {
      return {
        id: a.id+'',
        image: a.coverUrl ?? '/notFound.png',
        name: a.name,
        rating: -1,
        desc: a.description
      };
    })};
  }

  public async getSeries(id: number) {
    const getSeriesData = await this.apiReq(`/v4/series/${id}?rpp=20`, '', 'auth', 'GET');
    if (!getSeriesData.ok || !getSeriesData.res) { 
      console.error('Failed to get Series Data');
      return { isOk: false };
    }
    const seriesData = JSON.parse(await getSeriesData.res.text()) as NewHidiveSeries;
    return { isOk: true, value: seriesData };
  }

  /**
   * Function to get the season data from the API
   * @param id ID of the season
   * @param lastSeen Last episode ID seen, used for paging
   * @returns 
   */
  public async getSeason(id: number, lastSeen?: number) {
    const getSeasonData = await this.apiReq(`/v4/season/${id}?rpp=20${lastSeen ? '&lastSeen='+lastSeen : ''}`, '', 'auth', 'GET');
    if (!getSeasonData.ok || !getSeasonData.res) { 
      console.error('Failed to get Season Data');
      return { isOk: false };
    }
    const seasonData = JSON.parse(await getSeasonData.res.text()) as NewHidiveSeason;
    return { isOk: true, value: seasonData };
  }

  public async listSeries(id: number) {
    const series = await this.getSeries(id);
    if (!series.isOk || !series.value) {
      console.error('Failed to list series data: Failed to get series');
      return { isOk: false };
    }
    console.info(`[Z.${series.value.id}] ${series.value.title} (${series.value.seasons.length} Seasons)`);
    if (series.value.seasons.length === 0) {
      console.info('  No Seasons found!');
      return { isOk: false };
    }
    const episodes: Episode[] = [];
    for (const seasonData of series.value.seasons) {
      const season = await this.getSeason(seasonData.id);
      if (!season.isOk || !season.value) {
        console.error('Failed to list series data: Failed to get season '+seasonData.id);
        return { isOk: false };
      }
      console.info(`  [S.${season.value.id}] ${season.value.title} (${season.value.episodeCount} Episodes)`);
      while (season.value.paging.moreDataAvailable) {
        const seasonPage = await this.getSeason(seasonData.id, season.value.paging.lastSeen);
        if (!seasonPage.isOk || !seasonPage.value) break;
        season.value.episodes = season.value.episodes.concat(seasonPage.value.episodes);
        season.value.paging.lastSeen = seasonPage.value.paging.lastSeen;
        season.value.paging.moreDataAvailable = seasonPage.value.paging.moreDataAvailable;
      }
      for (const episode of season.value.episodes) {
        const datePattern = /\d{1,2}\/\d{1,2}\/\d{2,4} \d{1,2}:\d{2} UTC/;
        if (episode.title.includes(' - ')) {
          episode.episodeInformation.episodeNumber = parseFloat(episode.title.split(' - ')[0].replace('E', ''));
          episode.title = episode.title.split(' - ')[1];
        }
        //S${episode.episodeInformation.seasonNumber}E${episode.episodeInformation.episodeNumber} - 
        if (!datePattern.test(episode.title) && episode.duration !== 10) {
          episodes.push(episode);
        }
        console.info(`    [E.${episode.id}] ${episode.title}`);
      }
    }
    return { isOk: true, value: episodes, series: series.value };
  }

  public async listSeason(id: number) {
    const season = await this.getSeason(id);
    if (!season.isOk || !season.value) {
      console.error('Failed to list series data: Failed to get season '+id);
      return { isOk: false };
    }
    console.info(`  [S.${season.value.id}] ${season.value.title} (${season.value.episodeCount} Episodes)`);
    while (season.value.paging.moreDataAvailable) {
      const seasonPage = await this.getSeason(id, season.value.paging.lastSeen);
      if (!seasonPage.isOk || !seasonPage.value) break;
      season.value.episodes = season.value.episodes.concat(seasonPage.value.episodes);
      season.value.paging.lastSeen = seasonPage.value.paging.lastSeen;
      season.value.paging.moreDataAvailable = seasonPage.value.paging.moreDataAvailable;
    }
    const episodes: Episode[] = [];
    for (const episode of season.value.episodes) {
      const datePattern = /\d{1,2}\/\d{1,2}\/\d{2,4} \d{1,2}:\d{2} UTC/;
      if (episode.title.includes(' - ')) {
        episode.episodeInformation.episodeNumber = parseFloat(episode.title.split(' - ')[0].replace('E', ''));
        episode.title = episode.title.split(' - ')[1];
      }
      //S${episode.episodeInformation.seasonNumber}E${episode.episodeInformation.episodeNumber} - 
      if (!datePattern.test(episode.title) && episode.duration !== 10) {
        episodes.push(episode);
      }
      console.info(`    [E.${episode.id}] ${episode.title}`);
    }
    const series: NewHidiveSeriesExtra = {...season.value.series, season: season.value};
    return { isOk: true, value: episodes, series: series };
  }

  /**
   * Lists the requested series, and returns the selected episodes
   * @param id Series ID
   * @param e Selector
   * @param but Download all but selected videos
   * @param all Whether to download all available videos
   * @returns 
   */
  public async selectSeries(id: number, e: string | undefined, but: boolean, all: boolean) {
    const getShowData = await this.listSeries(id);
    if (!getShowData.isOk || !getShowData.value) {
      return { isOk: false, value: [] };
    }
    const showData = getShowData.value;
    const doEpsFilter = parseSelect(e as string);
    // build selected episodes
    const selEpsArr: NewHidiveEpisodeExtra[] = []; let ovaSeq = 1; let movieSeq = 1;
    for (let i = 0; i < showData.length; i++) {
      const titleId = showData[i].id;
      const seriesTitle = getShowData.series.title;
      const seasonTitle = getShowData.series.seasons[showData[i].episodeInformation.seasonNumber-1]?.title ?? seriesTitle;
      let nameLong = showData[i].title;
      if (nameLong.match(/OVA/i)) {
        nameLong = 'ova' + (('0' + ovaSeq).slice(-2)); ovaSeq++;
      } else if (nameLong.match(/Theatrical/i)) {
        nameLong = 'movie' + (('0' + movieSeq).slice(-2)); movieSeq++;
      }
      let selMark = '';
      if (all || 
      but && !doEpsFilter.isSelected([parseFloat(showData[i].episodeInformation.episodeNumber+'')+'', showData[i].id+'']) || 
      !but && doEpsFilter.isSelected([parseFloat(showData[i].episodeInformation.episodeNumber+'')+'', showData[i].id+''])
      ) {
        selEpsArr.push({ isSelected: true, titleId, nameLong, seasonTitle, seriesTitle, ...showData[i] });
        selMark = '✓ ';
      }
      console.info('%s[%s] %s',
        selMark,
        'S'+parseFloat(showData[i].episodeInformation.seasonNumber+'')+'E'+parseFloat(showData[i].episodeInformation.episodeNumber+''),
        showData[i].title,
      );
    }
    return { isOk: true, value: selEpsArr, showData: getShowData.series };
  }

  /**
   * Lists the requested season, and returns the selected episodes
   * @param id Season ID
   * @param e Selector
   * @param but Download all but selected videos
   * @param all Whether to download all available videos
   * @returns 
   */
  public async selectSeason(id: number, e: string | undefined, but: boolean, all: boolean) {
    const getShowData = await this.listSeason(id);
    if (!getShowData.isOk || !getShowData.value) {
      return { isOk: false, value: [] };
    }
    const showData = getShowData.value;
    const doEpsFilter = parseSelect(e as string);
    // build selected episodes
    const selEpsArr: NewHidiveEpisodeExtra[] = []; let ovaSeq = 1; let movieSeq = 1;
    for (let i = 0; i < showData.length; i++) {
      const titleId = showData[i].id;
      const seriesTitle = getShowData.series.title;
      const seasonTitle = getShowData.series.season.title;
      let nameLong = showData[i].title;
      if (nameLong.match(/OVA/i)) {
        nameLong = 'ova' + (('0' + ovaSeq).slice(-2)); ovaSeq++;
      } else if (nameLong.match(/Theatrical/i)) {
        nameLong = 'movie' + (('0' + movieSeq).slice(-2)); movieSeq++;
      }
      let selMark = '';
      if (all || 
        but && !doEpsFilter.isSelected([parseFloat(showData[i].episodeInformation.episodeNumber+'')+'', showData[i].id+'']) || 
        !but && doEpsFilter.isSelected([parseFloat(showData[i].episodeInformation.episodeNumber+'')+'', showData[i].id+''])
      ) {
        selEpsArr.push({ isSelected: true, titleId, nameLong, seasonTitle, seriesTitle, ...showData[i] });
        selMark = '✓ ';
      }
      console.info('%s[%s] %s',
        selMark,
        'S'+parseFloat(showData[i].episodeInformation.seasonNumber+'')+'E'+parseFloat(showData[i].episodeInformation.episodeNumber+''),
        showData[i].title,
      );
    }
    return { isOk: true, value: selEpsArr, showData: getShowData.series };
  }

  public async downloadEpisode(selectedEpisode: NewHidiveEpisodeExtra, options: Record<any, any>) {
    //Get Episode data
    const episodeDataReq = await this.apiReq(`/v4/vod/${selectedEpisode.id}?includePlaybackDetails=URL`, '', 'auth', 'GET');
    if (!episodeDataReq.ok || !episodeDataReq.res) { 
      console.error('Failed to get episode data');
      return { isOk: false, reason: new Error('Failed to get Episode Data') };
    }
    const episodeData = JSON.parse(await episodeDataReq.res.text()) as NewHidiveEpisode;

    if (!episodeData.playerUrlCallback) {
      console.error('Failed to download episode: You do not have access to this');
      return { isOk: false, reason: new Error('You do not have access to this') };
    }

    //Get Playback data
    const playbackReq = await this.req.getData(episodeData.playerUrlCallback);
    if(!playbackReq.ok || !playbackReq.res){
      console.error('Playback Request Failed');
      return { isOk: false, reason: new Error('Playback request failed') };
    }
    const playbackData = JSON.parse(await playbackReq.res.text()) as NewHidivePlayback;

    //Get actual MPD
    const mpdRequest = await this.req.getData(playbackData.dash[0].url);
    if(!mpdRequest.ok || !mpdRequest.res){
      console.error('MPD Request Failed');
      return { isOk: false, reason: new Error('MPD request failed') };
    }
    const mpd = await mpdRequest.res.text() as string;

    selectedEpisode.jwtToken = playbackData.dash[0].drm.jwtToken;

    //Output metadata and prepare for download
    const availableSubs = playbackData.dash[0].subtitles.filter(a => a.format === 'vtt');
    const showTitle = `${selectedEpisode.seriesTitle} S${selectedEpisode.episodeInformation.seasonNumber}`;
    console.info(`[INFO] ${showTitle} - ${selectedEpisode.episodeInformation.episodeNumber}`);
    console.info('[INFO] Available dubs and subtitles:');
    console.info('\tAudios: ' + episodeData.offlinePlaybackLanguages.map(a => langsData.languages.find(b => b.code == a)?.name).join('\n\t\t'));
    console.info('\tSubs  : ' + availableSubs.map(a => langsData.languages.find(b => b.new_hd_locale == a.language)?.name).join('\n\t\t'));
    console.info(`[INFO] Selected dub(s): ${options.dubLang.join(', ')}`);
    const baseUrl = playbackData.dash[0].url.split('master')[0];
    const parsedmpd = await parse(mpd, undefined, baseUrl);
    const res = await this.downloadMPD(parsedmpd, availableSubs, selectedEpisode, options);
    if (res === undefined || res.error) {
      console.error('Failed to download media list');
      return { isOk: false, reason: new Error('Failed to download media list') };
    } else {
      if (!options.skipmux) {
        await this.muxStreams(res.data, { ...options, output: res.fileName }, false);
      } else {
        console.info('Skipping mux');
      }
      downloaded({
        service: 'hidive',
        type: 's'
      }, selectedEpisode.titleId+'', [selectedEpisode.episodeInformation.episodeNumber+'']);
      return { isOk: res, value: undefined };
    }
  }

  public async downloadSingleEpisode(id: number, options: Record<any, any>) {
    //Get Episode data
    const episodeDataReq = await this.apiReq(`/v4/vod/${id}?includePlaybackDetails=URL`, '', 'auth', 'GET');
    if (!episodeDataReq.ok || !episodeDataReq.res) { 
      console.error('Failed to get episode data');
      return { isOk: false, reason: new Error('Failed to get Episode Data') };
    }
    const episodeData = JSON.parse(await episodeDataReq.res.text()) as NewHidiveEpisode;

    if (episodeData.title.includes(' - ') && episodeData.episodeInformation) {
      episodeData.episodeInformation.episodeNumber = parseFloat(episodeData.title.split(' - ')[0].replace('E', ''));
      episodeData.title = episodeData.title.split(' - ')[1];
    }

    if (!episodeData.playerUrlCallback) {
      console.error('Failed to download episode: You do not have access to this');
      return { isOk: false, reason: new Error('You do not have access to this') };
    }

    let seasonData: Awaited<ReturnType<typeof this.getSeason>> | undefined = undefined;
    if (episodeData.episodeInformation) { 
      seasonData = await this.getSeason(episodeData.episodeInformation.season);
      if (!seasonData.isOk || !seasonData.value) { 
        console.error('Failed to get season data');
        return { isOk: false, reason: new Error('Failed to get season data') };
      }
    } else {
      episodeData.episodeInformation = {
        season: 0,
        seasonNumber: 0,
        episodeNumber: 0,
      };
    }

    //Get Playback data
    const playbackReq = await this.req.getData(episodeData.playerUrlCallback);
    if(!playbackReq.ok || !playbackReq.res){
      console.error('Playback Request Failed');
      return { isOk: false, reason: new Error('Playback request failed') };
    }
    const playbackData = JSON.parse(await playbackReq.res.text()) as NewHidivePlayback;

    //Get actual MPD
    const mpdRequest = await this.req.getData(playbackData.dash[0].url);
    if(!mpdRequest.ok || !mpdRequest.res){
      console.error('MPD Request Failed');
      return { isOk: false, reason: new Error('MPD request failed') };
    }
    const mpd = await mpdRequest.res.text() as string;

    const selectedEpisode: NewHidiveEpisodeExtra = {
      ...episodeData,
      nameLong: episodeData.title,
      titleId: episodeData.id,
      seasonTitle: seasonData?.value.title ?? episodeData.title,
      seriesTitle: seasonData?.value.series.title ?? episodeData.title,
      isSelected: true
    };
    
    selectedEpisode.jwtToken = playbackData.dash[0].drm.jwtToken;

    //Output metadata and prepare for download
    const availableSubs = playbackData.dash[0].subtitles.filter(a => a.format === 'vtt');
    const showTitle = `${selectedEpisode.seriesTitle} S${selectedEpisode.episodeInformation.seasonNumber}`;
    console.info(`[INFO] ${showTitle} - ${selectedEpisode.episodeInformation.episodeNumber}`);
    console.info('[INFO] Available dubs and subtitles:');
    console.info('\tAudios: ' + episodeData.offlinePlaybackLanguages.map(a => langsData.languages.find(b => b.code == a)?.name).join('\n\t\t'));
    console.info('\tSubs  : ' + availableSubs.map(a => langsData.languages.find(b => b.new_hd_locale == a.language)?.name).join('\n\t\t'));
    console.info(`[INFO] Selected dub(s): ${options.dubLang.join(', ')}`);
    const baseUrl = playbackData.dash[0].url.split('master')[0];
    const parsedmpd = await parse(mpd, undefined, baseUrl);
    const res = await this.downloadMPD(parsedmpd, availableSubs, selectedEpisode, options);
    if (res === undefined || res.error) {
      console.error('Failed to download media list');
      return { isOk: false, reason: new Error('Failed to download media list') };
    } else {
      if (!options.skipmux) {
        await this.muxStreams(res.data, { ...options, output: res.fileName }, false);
      } else {
        console.info('Skipping mux');
      }
      downloaded({
        service: 'hidive',
        type: 's'
      }, selectedEpisode.titleId+'', [selectedEpisode.episodeInformation.episodeNumber+'']);
      return { isOk: res, value: undefined };
    }
  }

  public async downloadMPD(streamPlaylists: MPDParsed, subs: Subtitle[], selectedEpisode: NewHidiveEpisodeExtra, options: Record<any, any>) {
    //let fileName: string;
    const files: DownloadedMedia[] = [];
    const variables: Variable[] = [];
    let dlFailed = false;
    const subsMargin = 0;
    const chosenFontSize = options.originalFontSize ? undefined : options.fontSize;
    let encryptionKeys: KeyContainer[] = [];
    if (!canDecrypt && (!options.novids || !options.noaudio)) {
      console.error('No valid Widevine or PlayReady CDM detected. Please ensure a supported and functional CDM is installed.');
      return undefined;
    }

    if (!this.cfg.bin.ffmpeg) 
      this.cfg.bin = await yamlCfg.loadBinCfg();

    if (!this.cfg.bin.mp4decrypt && !this.cfg.bin.shaka && (!options.novids || !options.noaudio)) {
      console.error('Neither Shaka nor MP4Decrypt found. Please ensure at least one of them is installed.');
      return undefined;
    }

    variables.push(...([
      ['title', selectedEpisode.title, true],
      ['episode', selectedEpisode.episodeInformation.episodeNumber, false],
      ['service', 'HD', false],
      ['seriesTitle', selectedEpisode.seasonTitle, true],
      ['showTitle', selectedEpisode.seriesTitle, true],
      ['season', selectedEpisode.episodeInformation.seasonNumber, false]
    ] as [AvailableFilenameVars, string|number, boolean][]).map((a): Variable => {
      return {
        name: a[0],
        replaceWith: a[1],
        type: typeof a[1],
        sanitize: a[2]
      } as Variable;
    }));

    //Get name of CDNs/Servers
    const streamServers = Object.keys(streamPlaylists);

    options.x = options.x > streamServers.length ? 1 : options.x;

    const selectedServer = streamServers[options.x - 1];
    const selectedList = streamPlaylists[selectedServer];

    //set Video Qualities
    const videos = selectedList.video.map(item => {
      return {
        ...item,
        resolutionText: `${item.quality.width}x${item.quality.height} (${Math.round(item.bandwidth/1024)}KiB/s)`
      };
    });

    const audios = selectedList.audio.map(item => {
      return {
        ...item,
        resolutionText: `${Math.round(item.bandwidth/1000)}kB/s`
      };
    });


    videos.sort((a, b) => {
      return a.bandwidth - b.bandwidth;
    });

    videos.sort((a, b) => {
      return a.quality.width - b.quality.width;
    });

    audios.sort((a, b) => {
      return a.bandwidth - b.bandwidth;
    });

    let chosenVideoQuality = options.q === 0 ? videos.length : options.q;
    if(chosenVideoQuality > videos.length) {
      console.warn(`The requested quality of ${options.q} is greater than the maximum ${videos.length}.\n[WARN] Therefor the maximum will be capped at ${videos.length}.`);
      chosenVideoQuality = videos.length;
    }
    chosenVideoQuality--;

    const chosenVideoSegments = videos[chosenVideoQuality];

    console.info(`Servers available:\n\t${streamServers.join('\n\t')}`);
    console.info(`Available Video Qualities:\n\t${videos.map((a, ind) => `[${ind+1}] ${a.resolutionText}`).join('\n\t')}`);
    console.info(`Available Audio Qualities:\n\t${audios.map((a, ind) => `[${ind+1}] ${a.resolutionText}`).join('\n\t')}`);

    variables.push({
      name: 'height',
      type: 'number',
      replaceWith: chosenVideoSegments.quality.height
    }, {
      name: 'width',
      type: 'number',
      replaceWith: chosenVideoSegments.quality.width
    });

    const chosenAudios: typeof audios[0][] = [];
    const audioByLanguage: Record<string,typeof audios[0][]> = {};
    for (const audio of audios) {
      if (!audioByLanguage[audio.language.code]) audioByLanguage[audio.language.code] = [];
      audioByLanguage[audio.language.code].push(audio);
    }
    for (const dubLang of options.dubLang as string[]) {
      if (audioByLanguage[dubLang]) {
        let chosenAudioQuality = options.q === 0 ? audios.length : options.q;
        if(chosenAudioQuality > audioByLanguage[dubLang].length) {
          chosenAudioQuality = audioByLanguage[dubLang].length;
        }
        chosenAudioQuality--;
        chosenAudios.push(audioByLanguage[dubLang][chosenAudioQuality]);
      }
    }
    if (chosenAudios.length == 0) {
      console.error(`Chosen audio language(s) does not exist for episode ${selectedEpisode.episodeInformation.episodeNumber}`);
      return undefined;
    }

    const fileName = parseFileName(options.fileName, variables, options.numbers, options.override).join(path.sep);

    console.info(`Selected quality: \n\tVideo: ${chosenVideoSegments.resolutionText}\n\tAudio: ${chosenAudios[0].resolutionText}\n\tServer: ${selectedServer}`);
    console.info(`Selected (Available) Audio Languages: ${chosenAudios.map(a => a.language.name).join(', ')}`);
    console.info('Stream URL:', chosenVideoSegments.segments[0].map.uri.split('/init.mp4')[0]);

    if (chosenAudios[0].pssh_wvd && cdm === 'widevine' || chosenVideoSegments.pssh_wvd && cdm === 'widevine') {
      encryptionKeys = await getKeysWVD(chosenVideoSegments.pssh_wvd, 'https://shield-drm.imggaming.com/api/v2/license', {
        'Authorization': `Bearer ${selectedEpisode.jwtToken}`,
        'X-Drm-Info': 'eyJzeXN0ZW0iOiJjb20ud2lkZXZpbmUuYWxwaGEifQ==',
      });
    }

    if (chosenAudios[0].pssh_prd && cdm === 'playready' || chosenVideoSegments.pssh_prd && cdm === 'playready') {
      encryptionKeys = await getKeysPRD(chosenVideoSegments.pssh_prd, 'https://shield-drm.imggaming.com/api/v2/license', {
        'Authorization': `Bearer ${selectedEpisode.jwtToken}`,
        'X-Drm-Info': 'eyJzeXN0ZW0iOiJjb20ubWljcm9zb2Z0LnBsYXlyZWFkeSJ9',
      });
    }
          
    if (!options.novids) {
      //Download Video
      const totalParts = chosenVideoSegments.segments.length;
      const mathParts  = Math.ceil(totalParts / options.partsize);
      const mathMsg    = `(${mathParts}*${options.partsize})`;
      console.info('Total parts in video stream:', totalParts, mathMsg);
      const tsFile = path.isAbsolute(fileName) ? fileName : path.join(this.cfg.dir.content, fileName);
      const tempFile = parseFileName(`temp-${selectedEpisode.id}`, variables, options.numbers, options.override).join(path.sep);
      const tempTsFile = path.isAbsolute(tempFile as string) ? tempFile : path.join(this.cfg.dir.content, tempFile);
      const dirName = path.dirname(tsFile);
      if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, { recursive: true });
      }
      const videoJson: M3U8Json = {
        segments: chosenVideoSegments.segments
      };
      const videoDownload = await new streamdl({
        output: `${tempTsFile}.video.enc.m4s`,
        timeout: options.timeout,
        m3u8json: videoJson,
        // baseurl: chunkPlaylist.baseUrl,
        threads: options.partsize,
        fsRetryTime: options.fsRetryTime * 1000,
        override: options.force,
        callback: options.callbackMaker ? options.callbackMaker({
          fileName: `${path.isAbsolute(fileName) ? fileName.slice(this.cfg.dir.content.length) : fileName}`,
          image: selectedEpisode.thumbnailUrl,
          parent: {
            title: selectedEpisode.seriesTitle
          },
          title: selectedEpisode.title,
          language: chosenAudios[0].language
        }) : undefined
      }).download();
      if(!videoDownload.ok){
        console.error(`DL Stats: ${JSON.stringify(videoDownload.parts)}\n`);
        dlFailed = true;
      } else {
        if (chosenVideoSegments.pssh_wvd || chosenVideoSegments.pssh_prd) {
          console.info('Decryption Needed, attempting to decrypt');
          if (encryptionKeys.length == 0) {
            console.error('Failed to get encryption keys');
            return undefined;
          }
          if (this.cfg.bin.mp4decrypt || this.cfg.bin.shaka) {
            let commandBase = `--show-progress --key ${encryptionKeys[cdm === 'playready' ? 0 : 1].kid}:${encryptionKeys[cdm === 'playready' ? 0 : 1].key} `;
            let commandVideo = commandBase+`"${tempTsFile}.video.enc.m4s" "${tempTsFile}.video.m4s"`;

            if (this.cfg.bin.shaka) {
              commandBase = ` --enable_raw_key_decryption ${encryptionKeys.map(kb => '--keys key_id='+kb.kid+':key='+kb.key).join(' ')}`;
              commandVideo = `input="${tempTsFile}.video.enc.m4s",stream=video,output="${tempTsFile}.video.m4s"`+commandBase;
            }

            console.info('Started decrypting video,', this.cfg.bin.shaka ? 'using shaka' : 'using mp4decrypt');
            const decryptVideo = Helper.exec(this.cfg.bin.shaka ? 'shaka-packager' : 'mp4decrypt', this.cfg.bin.shaka ? `"${this.cfg.bin.shaka}"` : `"${this.cfg.bin.mp4decrypt}"`, commandVideo);
            if (!decryptVideo.isOk) {
              console.error(decryptVideo.err);
              console.error(`Decryption failed with exit code ${decryptVideo.err.code}`);
              fs.renameSync(`${tempTsFile}.video.enc.m4s`, `${tsFile}.video.enc.m4s`);
              return undefined;
            } else {
              console.info('Decryption done for video');
              if (!options.nocleanup) {
                fs.removeSync(`${tempTsFile}.video.enc.m4s`);
              }
              fs.copyFileSync(`${tempTsFile}.video.m4s`, `${tsFile}.video.m4s`);
              fs.unlinkSync(`${tempTsFile}.video.m4s`);
              files.push({
                type: 'Video',
                path: `${tsFile}.video.m4s`,
                lang: chosenAudios[0].language,
                isPrimary: true
              });
            }
          } else {
            console.warn('mp4decrypt/shaka not found, files need decryption. Decryption Keys:', encryptionKeys);
          }
        }
      }
    } else {
      console.info('Skipping Video');
    }

    if (!options.noaudio) {
      for (const audio of chosenAudios) {
        const chosenAudioSegments = audio;
        //Download Audio (if available)
        const totalParts = chosenAudioSegments.segments.length;
        const mathParts  = Math.ceil(totalParts / options.partsize);
        const mathMsg    = `(${mathParts}*${options.partsize})`;
        console.info('Total parts in audio stream:', totalParts, mathMsg);
        const tempFile = parseFileName(`temp-${selectedEpisode.id}.${chosenAudioSegments.language.name}`, variables, options.numbers, options.override).join(path.sep);
        const tempTsFile = path.isAbsolute(tempFile as string) ? tempFile : path.join(this.cfg.dir.content, tempFile);
        const outFile = parseFileName(options.fileName + '.' + (chosenAudioSegments.language.name), variables, options.numbers, options.override).join(path.sep);
        const tsFile = path.isAbsolute(outFile as string) ? outFile : path.join(this.cfg.dir.content, outFile);
        const dirName = path.dirname(tsFile);
        if (!fs.existsSync(dirName)) {
          fs.mkdirSync(dirName, { recursive: true });
        }
        const audioJson: M3U8Json = {
          segments: chosenAudioSegments.segments
        };
        const audioDownload = await new streamdl({
          output: `${tempTsFile}.audio.enc.m4s`,
          timeout: options.timeout,
          m3u8json: audioJson,
          // baseurl: chunkPlaylist.baseUrl,
          threads: options.partsize,
          fsRetryTime: options.fsRetryTime * 1000,
          override: options.force,
          callback: options.callbackMaker ? options.callbackMaker({
            fileName: `${path.isAbsolute(outFile) ? outFile.slice(this.cfg.dir.content.length) : outFile}`,
            image: selectedEpisode.thumbnailUrl,
            parent: {
              title: selectedEpisode.seriesTitle
            },
            title: selectedEpisode.title,
            language: chosenAudioSegments.language
          }) : undefined
        }).download();
        if(!audioDownload.ok){
          console.error(`DL Stats: ${JSON.stringify(audioDownload.parts)}\n`);
          dlFailed = true;
        }
        if (chosenAudioSegments.pssh_wvd || chosenAudioSegments.pssh_prd) {
          console.info('Decryption Needed, attempting to decrypt');
          if (encryptionKeys.length == 0) {
            console.error('Failed to get encryption keys');
            return undefined;
          }
          if (this.cfg.bin.mp4decrypt || this.cfg.bin.shaka) {
            let commandBase = `--show-progress --key ${encryptionKeys[cdm === 'playready' ? 0 : 1].kid}:${encryptionKeys[cdm === 'playready' ? 0 : 1].key} `;
            let commandAudio = commandBase+`"${tempTsFile}.audio.enc.m4s" "${tempTsFile}.audio.m4s"`;

            if (this.cfg.bin.shaka) {
              commandBase = ` --enable_raw_key_decryption ${encryptionKeys.map(kb => '--keys key_id='+kb.kid+':key='+kb.key).join(' ')}`;
              commandAudio = `input="${tempTsFile}.audio.enc.m4s",stream=audio,output="${tempTsFile}.audio.m4s"`+commandBase;
            }

            console.info('Started decrypting audio');
            const decryptAudio = Helper.exec(this.cfg.bin.shaka ? 'shaka-packager' : 'mp4decrypt', this.cfg.bin.shaka ? `"${this.cfg.bin.shaka}"` : `"${this.cfg.bin.mp4decrypt}"`, commandAudio);
            if (!decryptAudio.isOk) {
              console.error(decryptAudio.err);
              console.error(`Decryption failed with exit code ${decryptAudio.err.code}`);
              fs.renameSync(`${tempTsFile}.audio.enc.m4s`, `${tsFile}.audio.enc.m4s`);
              return undefined;
            } else {
              if (!options.nocleanup) {
                fs.removeSync(`${tempTsFile}.audio.enc.m4s`);
              }
              fs.copyFileSync(`${tempTsFile}.audio.m4s`, `${tsFile}.audio.m4s`);
              fs.unlinkSync(`${tempTsFile}.audio.m4s`);
              files.push({
                type: 'Audio',
                path: `${tsFile}.audio.m4s`,
                lang: chosenAudioSegments.language,
                isPrimary: chosenAudioSegments.default
              });
              console.info('Decryption done for audio');
            }
          } else {
            console.warn('mp4decrypt not found, files need decryption. Decryption Keys:', encryptionKeys);
          }
        }
      }
    } else {
      console.info('Skipping Audio');
    }

    if(options.dlsubs.indexOf('all') > -1){
      options.dlsubs = ['all'];
    }

    if (options.nosubs) {
      console.info('Subtitles downloading disabled from nosubs flag.');
      options.skipsubs = true;
    }

    if(!options.skipsubs && options.dlsubs.indexOf('none') == -1) {
      if(subs.length > 0) {
        let subIndex = 0;
        for(const sub of subs) {
          const subLang = langsData.languages.find(a => a.new_hd_locale === sub.language);
          if (!subLang) {
            console.warn(`Language not found for subtitle language: ${sub.language}, Skipping`);
            continue;
          }
          const sxData: Partial<sxItem> = {};
          sxData.file = langsData.subsFile(fileName as string, subIndex+'', subLang, false, options.ccTag);
          if (path.isAbsolute(sxData.file)) {
            sxData.path = sxData.file;
          } else {
            sxData.path = path.join(this.cfg.dir.content, sxData.file);
          }
          const dirName = path.dirname(sxData.path);
          if (!fs.existsSync(dirName)) {
            fs.mkdirSync(dirName, { recursive: true });
          }
          sxData.language = subLang;
          if(options.dlsubs.includes('all') || options.dlsubs.includes(subLang.locale)) {
            const getVttContent = await this.req.getData(sub.url);
            if (getVttContent.ok && getVttContent.res) {
              console.info(`Subtitle Downloaded: ${sub.url}`);
              //vttConvert(getVttContent.res.body, false, subLang.name, fontSize);
              const sBody = vtt2ass(undefined, chosenFontSize, await getVttContent.res.text(), '', subsMargin, options.fontName, options.combineLines);
              sxData.title = `${subLang.language} / ${sxData.title}`;
              sxData.fonts = fontsData.assFonts(sBody) as Font[];
              fs.writeFileSync(sxData.path, sBody);
              console.info(`Subtitle converted: ${sxData.file}`);
              files.push({
                type: 'Subtitle',
                ...sxData as sxItem,
                cc: false
              });
            } else{
              console.warn(`Failed to download subtitle: ${sxData.file}`);
            }
          }
          subIndex++;
        }
      } else{
        console.warn('Can\'t find urls for subtitles!');
      }
    } else{
      console.info('Subtitles downloading skipped!');
    }

    return {
      error: dlFailed,
      data: files,
      fileName: fileName ? (path.isAbsolute(fileName) ? fileName : path.join(this.cfg.dir.content, fileName)) || './unknown' : './unknown'
    };
  }

  public async muxStreams(data: DownloadedMedia[], options: Record<any, any>, inverseTrackOrder: boolean = true) {
    this.cfg.bin = await yamlCfg.loadBinCfg();
    let hasAudioStreams = false;
    if (options.novids || data.filter(a => a.type === 'Video').length === 0)
      return console.info('Skip muxing since no vids are downloaded');
    if (data.some(a => a.type === 'Audio')) {
      hasAudioStreams = true;
    }
    const merger = new Merger({
      onlyVid: hasAudioStreams ? data.filter(a => a.type === 'Video').map((a) : MergerInput => {
        if (a.type === 'Subtitle')
          throw new Error('Never');
        return {
          lang: a.lang,
          path: a.path,
        };
      }) : [],
      skipSubMux: options.skipSubMux,
      inverseTrackOrder: inverseTrackOrder,
      keepAllVideos: options.keepAllVideos,
      onlyAudio: hasAudioStreams ? data.filter(a => a.type === 'Audio').map((a) : MergerInput => {
        if (a.type === 'Subtitle')
          throw new Error('Never');
        return {
          lang: a.lang,
          path: a.path,
        };
      }) : [],
      output: `${options.output}.${options.mp4 ? 'mp4' : 'mkv'}`,
      subtitles: data.filter(a => a.type === 'Subtitle').map((a) : SubtitleInput => {
        if (a.type === 'Video')
          throw new Error('Never');
        if (a.type === 'Audio')
          throw new Error('Never');
        return {
          file: a.path,
          language: a.language,
          closedCaption: a.cc
        };
      }),
      simul: data.filter(a => a.type === 'Video').map((a) : boolean => {
        if (a.type === 'Subtitle')
          throw new Error('Never');
        return !a.uncut as boolean;
      })[0],
      fonts: Merger.makeFontsList(this.cfg.dir.fonts, data.filter(a => a.type === 'Subtitle') as sxItem[]),
      videoAndAudio: hasAudioStreams ? [] : data.filter(a => a.type === 'Video').map((a) : MergerInput => {
        if (a.type === 'Subtitle')
          throw new Error('Never');
        return {
          lang: a.lang,
          path: a.path,
        };
      }),
      videoTitle: options.videoTitle,
      options: {
        ffmpeg: options.ffmpegOptions,
        mkvmerge: options.mkvmergeOptions
      },
      defaults: {
        audio: options.defaultAudio,
        sub: options.defaultSub
      },
      ccTag: options.ccTag
    });
    const bin = Merger.checkMerger(this.cfg.bin, options.mp4, options.forceMuxer);
    // collect fonts info
    // mergers
    let isMuxed = false;
    if (options.syncTiming) {
      await merger.createDelays();
    }
    if (bin.MKVmerge) {
      await merger.merge('mkvmerge', bin.MKVmerge);
      isMuxed = true;
    } else if (bin.FFmpeg) {
      await merger.merge('ffmpeg', bin.FFmpeg);
      isMuxed = true;
    } else{
      console.info('\nDone!\n');
      return;
    }
    if (isMuxed && !options.nocleanup)
      merger.cleanUp();
  }
  
  public sleep(ms: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
