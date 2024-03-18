// build-in
import path from 'path';
import fs from 'fs-extra';
import crypto from 'crypto';

// package program
import packageJson from './package.json';

// plugins
import { console } from './modules/log';
import shlp from 'sei-helper';
import m3u8 from 'm3u8-parsed';
import streamdl, { M3U8Json } from './modules/hls-download';

// custom modules
import * as fontsData from './modules/module.fontsData';
import * as langsData from './modules/module.langsData';
import * as yamlCfg from './modules/module.cfg-loader';
import * as yargs from './modules/module.app-args';
import Merger, { Font, MergerInput, SubtitleInput } from './modules/module.merger';
import { vtt } from './modules/module.vtt2ass';

// load req
import { domain, api } from './modules/module.api-urls';
import * as reqModule from './modules/module.req';
import { HidiveEpisodeList, HidiveEpisodeExtra } from './@types/hidiveEpisodeList';
import { HidiveVideoList, HidiveStreamInfo, DownloadedMedia, HidiveSubtitleInfo } from './@types/hidiveTypes';
import parseFileName, { Variable } from './modules/module.filename';
import { downloaded } from './modules/module.downloadArchive';
import parseSelect from './modules/module.parseSelect';
import { AvailableFilenameVars } from './modules/module.args';
import { AuthData, AuthResponse, SearchData, SearchResponse, SearchResponseItem } from './@types/messageHandler';
import { ServiceClass } from './@types/serviceClassInterface';
import { sxItem } from './crunchy';
import { HidiveSearch } from './@types/hidiveSearch';
import { HidiveDashboard } from './@types/hidiveDashboard';
import { Hit, NewHidiveSearch } from './@types/newHidiveSearch';
import { NewHidiveSeries } from './@types/newHidiveSeries';
import { Episode, NewHidiveEpisodeExtra, NewHidiveSeason, NewHidiveSeriesExtra } from './@types/newHidiveSeason';
import { NewHidiveEpisode } from './@types/newHidiveEpisode';
import { NewHidivePlayback, Subtitle } from './@types/newHidivePlayback';
import { MPDParsed, parse } from './modules/module.transform-mpd';
import getKeys, { canDecrypt } from './modules/widevine';
import { exec } from './modules/sei-helper-fixes';
import { KeyContainer } from './modules/license';

export default class Hidive implements ServiceClass { 
  public cfg: yamlCfg.ConfigObject;
  private session: Record<string, any>;
  private tokenOld: Record<string, any>;
  private token: Record<string, any>;
  private req: reqModule.Req;
  public api: 'old' | 'new';
  private client: {
    // base
    ipAddress: string,
    xNonce: string,
    xSignature: string,
    // personal
    visitId: string,
    // profile data
    profile: {
      userId: number,
      profileId: number,
      deviceId : string,
    }
  };

  constructor(private debug = false) {
    this.cfg = yamlCfg.loadCfg();
    this.session = yamlCfg.loadHDSession();
    this.tokenOld = yamlCfg.loadHDToken();
    this.token = yamlCfg.loadNewHDToken();
    this.client = yamlCfg.loadHDProfile() as {ipAddress: string, xNonce: string, xSignature: string, visitId: string, profile: {userId: number, profileId: number, deviceId : string}};
    this.req = new reqModule.Req(domain, debug, false, 'hd');
    this.api = 'old';
  }

  public async cli() {
    console.info(`\n=== Multi Downloader NX ${packageJson.version} ===\n`);
    const argv = yargs.appArgv(this.cfg.cli);
    this.api = argv.hdapi;
    if (argv.debug)
      this.debug = true;

    //below is for quickly testing API calls
    /*const searchItems = await this.reqData('GetTitles', {'Filter': 'recently-added', 'Pager': {'Number': 1, 'Size': 30}, 'Sort': 'Date', 'Verbose': false});
    const searchItems = await this.reqData('GetTitles', {'Id': 492});
    if(!searchItems.ok || !searchItems.res){return;}
    console.info(searchItems.res.body);
    fs.writeFileSync('apitest.json', JSON.stringify(JSON.parse(searchItems.res.body), null, 2));*/

    //new api testing
    /*if (this.api == 'new') {
      await this.doInit();
      const apiTest = await this.apiReq('/v4/season/18871', '', 'auth', 'GET');
      if(!apiTest.ok || !apiTest.res){return;}
      console.info(apiTest.res.body);
      fs.writeFileSync('apitest.json', JSON.stringify(JSON.parse(apiTest.res.body), null, 2));
      return console.info('test done');
    }*/

    // load binaries
    this.cfg.bin = await yamlCfg.loadBinCfg();
    if (argv.allDubs) {
      argv.dubLang = langsData.dubLanguageCodes;
    }
    if (argv.auth) {
      //Initilize session
      await this.doInit();
      //Authenticate
      await this.doAuth({
        username: argv.username ?? await shlp.question('[Q] LOGIN/EMAIL'),
        password: argv.password ?? await shlp.question('[Q] PASSWORD   ')
      });
    } else if (argv.search && argv.search.length > 2){
      //Initilize session
      await this.doInit();
      //Search
      await this.doSearch({ ...argv, search: argv.search as string });
    } else if (argv.s && !isNaN(parseInt(argv.s,10)) && parseInt(argv.s,10) > 0) {
      if (this.api == 'old') {
        //Initilize session
        await this.doInit();
        //get selected episodes
        const selected = await this.getShow(parseInt(argv.s), argv.e, argv.but, argv.all);
        if (selected.isOk && selected.showData) {
          for (const select of selected.value) {
            //download episode
            if (!(await this.getEpisode(select, {...argv}))) {
              console.error(`Unable to download selected episode ${parseFloat(select.EpisodeNumberValue+'')}`);
              return false;
            }
          }
        }
      } else {
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
      if (this.api == 'old') {
        //Initilize session
        await this.doInit();
        //Get Newly Added
        await this.getNewlyAdded(argv.page);
      } else {
        console.error('--new is not yet implemented in the new API');
      }
    } else if(argv.e) { 
      if (this.api == 'new') {
        if (!(await this.downloadSingleEpisode(parseInt(argv.e), {...argv}))) {
          console.error(`Unable to download selected episode ${argv.e}`);
          return false;
        }
      } else {
        console.error('-e is not supported in the old API');
      }
    } else {
      console.info('No option selected or invalid value entered. Try --help.');
    }
  }

  public async doInit() {
    if (this.api == 'old') {
    //get client ip
      const newIp = await this.reqData('Ping', '');
      if (!newIp.ok || !newIp.res) return false;
      this.client.ipAddress = JSON.parse(newIp.res.body).IPAddress;
      //get device id
      const newDevice = await this.reqData('InitDevice', { 'DeviceName': api.hd_devName });
      if (!newDevice.ok || !newDevice.res) return false;
      this.client.profile = Object.assign(this.client.profile, {
        deviceId: JSON.parse(newDevice.res.body).Data.DeviceId,
      });
      //get visit id
      const newVisitId = await this.reqData('InitVisit', {});
      if (!newVisitId.ok || !newVisitId.res) return false;
      this.client.visitId = JSON.parse(newVisitId.res.body).Data.VisitId;
      //save client
      yamlCfg.saveHDProfile(this.client);
      return true;
    } else {
      //this.refreshToken();
      return true;
    }
  }

  // Generate Nonce
  public generateNonce(){
    const initDate = new Date();
    const nonceDate = [
      initDate.getUTCFullYear().toString().slice(-2), // yy
      ('0'+(initDate.getUTCMonth()+1)).slice(-2),     // MM
      ('0'+initDate.getUTCDate()).slice(-2),          // dd
      ('0'+initDate.getUTCHours()).slice(-2),         // HH
      ('0'+initDate.getUTCMinutes()).slice(-2)        // mm
    ].join(''); // => "yyMMddHHmm" (UTC)
    const nonceCleanStr = nonceDate + api.hd_apikey;
    const nonceHash = crypto.createHash('sha256').update(nonceCleanStr).digest('hex');
    return nonceHash;
  }

  // Generate Signature
  public generateSignature(body: string|object, visitId: string, profile: Record<string, any>) {
    const sigCleanStr = [
      this.client.ipAddress,
      api.hd_appId,
      profile.deviceId,
      visitId,
      profile.userId,
      profile.profileId,
      body,
      this.client.xNonce,
      api.hd_apikey,
    ].join('');
    return crypto.createHash('sha256').update(sigCleanStr).digest('hex');
  }

  public makeCookieList(data: Record<string, any>, keys: Array<string>) {
    const res = [];
    for (const key of keys) {
      if (typeof data[key] !== 'object') continue;
      res.push(`${key}=${data[key].value}`);
    }
    return res.join('; ');
  }

  public async reqData(method: string, body: string | object, type = 'POST') {
    const options = { 
      headers: {} as Record<string, unknown>,
      method: type as 'GET'|'POST',
      url: '' as string,
      body: body,
    };
    // get request type
    const isGet = type == 'GET' ? true : false;
    // set request type, url, user agent, referrer, and origin
    options.method = isGet ? 'GET' : 'POST';
    options.url = ( !isGet ? domain.hd_api + '/api/v1/' : '') + method;
    options.headers['user-agent'] = isGet ? api.hd_clientExo : api.hd_clientWeb;
    options.headers['referrer'] = 'https://www.hidive.com/';
    options.headers['origin'] = 'https://www.hidive.com';
    // set api data
    if(!isGet){
      options.body = body == '' ? body : JSON.stringify(body);
      // set api headers
      if(method != 'Ping'){
        const visitId = this.client.visitId ? this.client.visitId : '';
        const vprofile = {
          userId: this.client.profile.userId || 0,
          profileId: this.client.profile.profileId || 0,
          deviceId: this.client.profile.deviceId || '',
        };
        this.client.xNonce     = this.generateNonce();
        this.client.xSignature = this.generateSignature(options.body, visitId, vprofile);
        options.headers = Object.assign(options.headers, {
          'X-VisitId'      : visitId,
          'X-UserId'       : vprofile.userId,
          'X-ProfileId'    : vprofile.profileId,
          'X-DeviceId'     : vprofile.deviceId,
          'X-Nonce'        : this.client.xNonce,
          'X-Signature'    : this.client.xSignature,
        });
      }
      options.headers = Object.assign({
        'Content-Type'   : 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-ApplicationId': api.hd_appId,
      }, options.headers);
      // cookies
      const cookiesList = Object.keys(this.session);
      if(cookiesList.length > 0 && method != 'Ping') {
        options.headers.Cookie = this.makeCookieList(this.session, cookiesList);
      }
    } else if(isGet && !options.url.match(/\?/)){
      this.client.xNonce = this.generateNonce();
      this.client.xSignature = this.generateSignature(options.body, this.client.visitId, this.client.profile);
      options.url = options.url + '?' + (new URLSearchParams({
        'X-ApplicationId': api.hd_appId,
        'X-DeviceId': this.client.profile.deviceId,
        'X-VisitId': this.client.visitId,
        'X-UserId': this.client.profile.userId+'',
        'X-ProfileId': this.client.profile.profileId+'',
        'X-Nonce': this.client.xNonce,
        'X-Signature': this.client.xSignature,
      })).toString();
    }
    try {
      if (this.debug) {
        console.debug('[DEBUG] Request params:');
        console.debug(options);
      }
      const apiReqOpts: reqModule.Params = {
        method: options.method,
        headers: options.headers as Record<string, string>,
        body: options.body as string
      };
      const apiReq = await this.req.getData(options.url, apiReqOpts);
      if(!apiReq.ok || !apiReq.res){
        console.error('API Request Failed!');
        return {
          ok: false,
          res: apiReq.res,
        };
      }

      if (!isGet && apiReq.res.headers && apiReq.res.headers['set-cookie']) {
        const newReqCookies = shlp.cookie.parse(apiReq.res.headers['set-cookie'] as unknown as Record<string, string>);
        this.session = Object.assign(this.session, newReqCookies);
        yamlCfg.saveHDSession(this.session);
      }
      if (!isGet) {
        const resJ = JSON.parse(apiReq.res.body);
        if (resJ.Code > 0) {
          console.error(`Code ${resJ.Code} (${resJ.Status}): ${resJ.Message}\n`);
          if (resJ.Code == 81 || resJ.Code == 5) {
            console.info('[NOTE] App was broken because of changes in official app.');
            console.info('[NOTE] See: https://github.com/anidl/hidive-downloader-nx/issues/1\n');
          }
          if (resJ.Code == 55) {
            console.info('[NOTE] You need premium account to view this video.');
          }
          return {
            ok: false,
            res: apiReq.res,
          };
        }
      }
      return {
        ok: true,
        res: apiReq.res,
      };
    } catch (error: any) {
      if (error.statusCode && error.statusMessage) {
        console.error(`\n ${error.name} ${error.statusCode}: ${error.statusMessage}\n`);
      } else {
        console.error(`\n ${error.name}: ${error.code}\n`);
      }
      return {
        ok: false,
        error,
      };
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
    const isGet = method == 'GET' ? true : false;
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
      if (apiReq.error && apiReq.error.res.statusCode == 401) {
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
    if (this.api == 'old') {
      const auth = await this.reqData('Authenticate', {'Email':data.username,'Password':data.password});
      if(!auth.ok || !auth.res) {
        console.error('Authentication failed!');
        return { isOk: false, reason: new Error('Authentication failed') };
      }
      const authData = JSON.parse(auth.res.body).Data;
      this.client.profile = Object.assign(this.client.profile, {
        userId: authData.User.Id,
        profileId: authData.Profiles[0].Id,
      });
      yamlCfg.saveHDProfile(this.client);
      yamlCfg.saveHDToken(authData);
      console.info('Auth complete!');
      console.info(`Service level for "${data.username}" is ${authData.User.ServiceLevel}`);
      return { isOk: true, value: undefined };
    } else {
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
      const tokens: Record<string, string> = JSON.parse(authReq.res.body);
      for (const token in tokens) {
        this.token[token] = tokens[token];
      }
      this.token.guest = false;
      yamlCfg.saveNewHDToken(this.token);
      console.info('Auth complete!');
      return { isOk: true, value: undefined };
    }
  }
  
  public async doAnonymousAuth() {
    const authReq = await this.apiReq('/v2/login/guest/checkin');
    if(!authReq.ok || !authReq.res){
      console.error('Authentication failed!');
      return false;
    }
    const tokens: Record<string, string> = JSON.parse(authReq.res.body);
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
        if (!this.initSession()) {
          return false;
        } else {
          return true;
        }
      }
      const tokens: Record<string, string> = JSON.parse(authReq.res.body);
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
    const tokens: Record<string, string> = JSON.parse(authReq.res.body).authentication;
    for (const token in tokens) {
      this.token[token] = tokens[token];
    }
    yamlCfg.saveNewHDToken(this.token);
    return true;
  }

  public async genSubsUrl(type: string, file: string) {
    return [
      `${domain.hd_api}/caption/${type}/`,
      ( type == 'css' ? '?id=' : '' ),
      `${file}.${type}`
    ].join('');
  }

  public async doSearch(data: SearchData): Promise<SearchResponse> {
    if (this.api == 'old') {
      const searchReq = await this.reqData('Search', {'Query':data.search});
      if(!searchReq.ok || !searchReq.res){
        console.error('Search FAILED!');
        return { isOk: false, reason: new Error('Search failed. No more information provided') };
      }
      const searchData = JSON.parse(searchReq.res.body) as HidiveSearch;
      const searchItems = searchData.Data.TitleResults;
      if(searchItems.length>0) {
        console.info('[INFO] Search Results:');
        for(let i=0;i<searchItems.length;i++){
          console.info(`[#${searchItems[i].Id}] ${searchItems[i].Name} [${searchItems[i].ShowInfoTitle}]`);
        }
      } else{
        console.warn('Nothing found!');
      }
      return { isOk: true, value: searchItems.map((a): SearchResponseItem => {
        return {
          id: a.Id+'',
          image: a.KeyArtUrl ?? '/notFound.png',
          name: a.Name,
          rating: a.OverallRating,
          desc: a.LongSynopsis
        };
      })};
    } else {
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
      const searchData = JSON.parse(searchReq.res.body) as NewHidiveSearch;
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
  }

  public async getNewlyAdded(page?: number) {
    const pageNum = page ? page : 1;
    const dashboardReq = await this.reqData('GetDashboard', {'Pager': {'Number': pageNum, 'Size': 30}, 'Verbose': false});
    if(!dashboardReq.ok || !dashboardReq.res) {
      console.error('Search for new episodes FAILED!');
      return;
    }

    const dashboardData = JSON.parse(dashboardReq.res.body) as HidiveDashboard;
    const dashboardItems = dashboardData.Data.TitleRows;
    const recentlyAddedIndex = dashboardItems.findIndex(item => item.Name == 'Recently Added');
    const recentlyAdded = recentlyAddedIndex >= 0 ? dashboardItems[recentlyAddedIndex] : undefined;
    if (recentlyAdded) {
      const searchItems = recentlyAdded?.Titles;
      if(searchItems.length>0) {
        console.info('[INFO] Recently Added:');
        for(let i=0;i<searchItems.length;i++){
          console.info(`[#${searchItems[i].Id}] ${searchItems[i].Name} [${searchItems[i].ShowInfoTitle}]`);
        }
      } else{
        console.warn('No new episodes found!');
      }
    } else {
      console.warn('New episode category not found!');
    }
  }

  public async getSeries(id: number) {
    const getSeriesData = await this.apiReq(`/v4/series/${id}?rpp=20`, '', 'auth', 'GET');
    if (!getSeriesData.ok || !getSeriesData.res) { 
      console.error('Failed to get Series Data');
      return { isOk: false };
    }
    const seriesData = JSON.parse(getSeriesData.res.body) as NewHidiveSeries;
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
    const seasonData = JSON.parse(getSeasonData.res.body) as NewHidiveSeason;
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
        if (episode.title.includes(' - ')) {
          episode.episodeInformation.episodeNumber = parseFloat(episode.title.split(' - ')[0].replace('E', ''));
          episode.title = episode.title.split(' - ')[1];
        }
        //S${episode.episodeInformation.seasonNumber}E${episode.episodeInformation.episodeNumber} - 
        episodes.push(episode);
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
      if (episode.title.includes(' - ')) {
        episode.episodeInformation.episodeNumber = parseFloat(episode.title.split(' - ')[0].replace('E', ''));
        episode.title = episode.title.split(' - ')[1];
      }
      //S${episode.episodeInformation.seasonNumber}E${episode.episodeInformation.episodeNumber} - 
      episodes.push(episode);
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
      const seasonTitle = getShowData.series.seasons[showData[i].episodeInformation.seasonNumber-1]?.title;
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

  public async listShow(id: number) {
    const getShowData = await this.reqData('GetTitle', { 'Id': id });
    if (!getShowData.ok || !getShowData.res) { 
      console.error('Failed to get show data');
      return { isOk: false };
    }
    const rawShowData = JSON.parse(getShowData.res.body) as HidiveEpisodeList;
    const showData = rawShowData.Data.Title;
    console.info(`[#${showData.Id}] ${showData.Name} [${showData.ShowInfoTitle}]`);
    return { isOk: true, value: showData };
  }

  async getShow(id: number, e: string | undefined, but: boolean, all: boolean) {
    const getShowData = await this.listShow(id);
    if (!getShowData.isOk || !getShowData.value) {
      return { isOk: false, value: [] };
    }
    const showData = getShowData.value;
    const doEpsFilter = parseSelect(e as string);
    // build selected episodes
    const selEpsArr: HidiveEpisodeExtra[] = []; let ovaSeq = 1; let movieSeq = 1;
    for (let i = 0; i < showData.Episodes.length; i++) {
      const titleId = showData.Episodes[i].TitleId;
      const epKey = showData.Episodes[i].VideoKey;
      const seriesTitle = showData.Name;
      let nameLong = showData.Episodes[i].DisplayNameLong;
      if (nameLong.match(/OVA/i)) {
        nameLong = 'ova' + (('0' + ovaSeq).slice(-2)); ovaSeq++;
      }
      else if (nameLong.match(/Theatrical/i)) {
        nameLong = 'movie' + (('0' + movieSeq).slice(-2)); movieSeq++;
      }
      else {
        nameLong = epKey;
      }
      let sumDub: string | RegExpMatchArray | null = showData.Episodes[i].Summary.match(/^Audio: (.*)/m);
      sumDub = sumDub ? `\n - ${sumDub[0]}` : '';
      let sumSub: string | RegExpMatchArray | null = showData.Episodes[i].Summary.match(/^Subtitles: (.*)/m);
      sumSub = sumSub ? `\n - ${sumSub[0]}` : '';
      let selMark = '';
      if (all || 
        but && !doEpsFilter.isSelected([parseFloat(showData.Episodes[i].EpisodeNumberValue+'')+'', showData.Episodes[i].Id+'']) || 
        !but && doEpsFilter.isSelected([parseFloat(showData.Episodes[i].EpisodeNumberValue+'')+'', showData.Episodes[i].Id+''])
      ) {
        selEpsArr.push({ isSelected: true, titleId, epKey, nameLong, seriesTitle, ...showData.Episodes[i] });
        selMark = '✓ ';
      }
      //const epKeyTitle = !epKey.match(/e(\d+)$/) ? nameLong : epKey;
      //const titleIdStr = (titleId != id ? `#${titleId}|` : '') + epKeyTitle;
      //console.info(`[${titleIdStr}] ${showData.Episodes[i].Name}${selMark}${sumDub}${sumSub}`);
      console.info('%s[%s] %s%s%s',
        selMark,
        'S'+parseFloat(showData.Episodes[i].SeasonNumberValue+'')+'E'+parseFloat(showData.Episodes[i].EpisodeNumberValue+''),
        showData.Episodes[i].Name,
        sumDub,
        sumSub
      );
    }
    return { isOk: true, value: selEpsArr, showData: showData };
  }

  public async getEpisode(selectedEpisode: HidiveEpisodeExtra, options: Record<any, any>) {
    const getVideoData = await this.reqData('GetVideos', { 'VideoKey': selectedEpisode.epKey, 'TitleId': selectedEpisode.titleId });
    if (getVideoData.ok && getVideoData.res) {
      const videoData = JSON.parse(getVideoData.res.body) as HidiveVideoList;
      const showTitle = `${selectedEpisode.seriesTitle} S${parseFloat(selectedEpisode.SeasonNumberValue+'')}`;
      console.info(`[INFO] ${showTitle} - ${parseFloat(selectedEpisode.EpisodeNumberValue+'')}`);
      const videoList = videoData.Data.VideoLanguages;
      const subsList = videoData.Data.CaptionLanguages;
      console.info('[INFO] Available dubs and subtitles:');
      console.info('\tVideos: ' + videoList.join('\n\t\t'));
      console.info('\tSubs  : ' + subsList.join('\n\t\t'));
      console.info(`[INFO] Selected dub(s): ${options.dubLang.join(', ')}`);
      const videoUrls = videoData.Data.VideoUrls;
      const subsUrls = videoData.Data.CaptionVttUrls;
      const fontSize = videoData.Data.FontSize ? videoData.Data.FontSize : options.fontSize;
      const subsSel = subsList;
      //Get Selected Video URLs
      const videoSel = videoList.sort().filter(videoLanguage => 
        langsData.languages.find(a => 
          a.hd_locale ? videoLanguage.match(a.hd_locale) && 
          options.dubLang.includes(a.code) : false
        )
      );
      //Prioritize Home Video, unless simul is used
      videoSel.forEach(function(video, index) {
        if (index > 0) {
          const video1 = video.split(', ');
          const video2 = videoSel[index - 1].split(', ');
          if (video1[0] == video2[0]) {
            if (video1[1] == 'Home Video' && video2[1] == 'Broadcast') {
              options.simul ? videoSel.splice(index, 1) : videoSel.splice(index - 1, 1);
            }
          }
        }
      });
      if (videoSel.length === 0) {
        console.error('No suitable videos(s) found for options!');
      }
      //Build video array
      const selectedVideoUrls: HidiveStreamInfo[] = [];
      videoSel.forEach(function(video, index) {
        const videodetails = videoSel[index].split(', ');
        const videoinfo: HidiveStreamInfo = videoUrls[video];
        videoinfo.language = videodetails[0];
        videoinfo.episodeTitle = selectedEpisode.Name;
        videoinfo.seriesTitle = selectedEpisode.seriesTitle;
        videoinfo.season = parseFloat(selectedEpisode.SeasonNumberValue+'');
        videoinfo.episodeNumber = parseFloat(selectedEpisode.EpisodeNumberValue+'');
        videoinfo.uncut = videodetails[0] == 'Home Video' ? true : false;
        videoinfo.image = selectedEpisode.ScreenShotSmallUrl;
        console.info(`[INFO] Selected release: ${videodetails[0]} ${videodetails[1]}`);
        selectedVideoUrls.push(videoinfo);
      });
      //Build subtitle array
      const selectedSubUrls: HidiveSubtitleInfo[] = [];
      subsSel.forEach(function(sub, index) {
        console.info(subsSel[index]);
        const subinfo = {
          url: subsUrls[sub],
          cc: subsSel[index].includes('Caps'),
          language: subsSel[index].replace(' Subs', '').replace(' Caps', '')
        };
        selectedSubUrls.push(subinfo);
      });
      //download media list
      const res = await this.downloadMediaList(selectedVideoUrls, selectedSubUrls, fontSize, options);
      if (res === undefined || res.error) {
        console.error('Failed to download media list');
        return { isOk: false, reason: new Error('Failed to download media list') };
      } else {
        if (!options.skipmux) {
          await this.muxStreams(res.data, { ...options, output: res.fileName });
        } else {
          console.info('Skipping mux');
        }
        downloaded({
          service: 'hidive',
          type: 's'
        }, selectedEpisode.titleId+'', [selectedEpisode.EpisodeNumberValue+'']);
        return { isOk: res, value: undefined };
      }
    }
    return { isOk: false, reason: new Error('Unknown download error') };
  }

  public async downloadEpisode(selectedEpisode: NewHidiveEpisodeExtra, options: Record<any, any>) {
    //Get Episode data
    const episodeDataReq = await this.apiReq(`/v4/vod/${selectedEpisode.id}?includePlaybackDetails=URL`, '', 'auth', 'GET');
    if (!episodeDataReq.ok || !episodeDataReq.res) { 
      console.error('Failed to get episode data');
      return { isOk: false, reason: new Error('Failed to get Episode Data') };
    }
    const episodeData = JSON.parse(episodeDataReq.res.body) as NewHidiveEpisode;

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
    const playbackData = JSON.parse(playbackReq.res.body) as NewHidivePlayback;

    //Get actual MPD
    const mpdRequest = await this.req.getData(playbackData.dash[0].url);
    if(!mpdRequest.ok || !mpdRequest.res){
      console.error('MPD Request Failed');
      return { isOk: false, reason: new Error('MPD request failed') };
    }
    const mpd = mpdRequest.res.body as string;

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
    const parsedmpd = parse(mpd, undefined, baseUrl);
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
    const episodeData = JSON.parse(episodeDataReq.res.body) as NewHidiveEpisode;

    if (episodeData.title.includes(' - ')) {
      episodeData.episodeInformation.episodeNumber = parseFloat(episodeData.title.split(' - ')[0].replace('E', ''));
      episodeData.title = episodeData.title.split(' - ')[1];
    }

    if (!episodeData.playerUrlCallback) {
      console.error('Failed to download episode: You do not have access to this');
      return { isOk: false, reason: new Error('You do not have access to this') };
    }

    const seasonData = await this.getSeason(episodeData.episodeInformation.season);
    if (!seasonData.isOk || !seasonData.value) { 
      console.error('Failed to get season data');
      return { isOk: false, reason: new Error('Failed to get season data') };
    }

    //Get Playback data
    const playbackReq = await this.req.getData(episodeData.playerUrlCallback);
    if(!playbackReq.ok || !playbackReq.res){
      console.error('Playback Request Failed');
      return { isOk: false, reason: new Error('Playback request failed') };
    }
    const playbackData = JSON.parse(playbackReq.res.body) as NewHidivePlayback;

    //Get actual MPD
    const mpdRequest = await this.req.getData(playbackData.dash[0].url);
    if(!mpdRequest.ok || !mpdRequest.res){
      console.error('MPD Request Failed');
      return { isOk: false, reason: new Error('MPD request failed') };
    }
    const mpd = mpdRequest.res.body as string;

    const selectedEpisode: NewHidiveEpisodeExtra = {
      ...episodeData,
      nameLong: episodeData.title,
      titleId: episodeData.id,
      seasonTitle: seasonData.value.title,
      seriesTitle: seasonData.value.series.title,
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
    const parsedmpd = parse(mpd, undefined, baseUrl);
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
    let encryptionKeys: KeyContainer[] | undefined = undefined;
    if (!canDecrypt) console.warn('Decryption not enabled!');

    if (!this.cfg.bin.ffmpeg) 
      this.cfg.bin = await yamlCfg.loadBinCfg();

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

    const fileName = parseFileName(options.fileName, variables, options.numbers, options.override).join(path.sep);

    console.info(`Selected quality: \n\tVideo: ${chosenVideoSegments.resolutionText}\n\tAudio: ${chosenAudios[0].resolutionText}\n\tServer: ${selectedServer}`);
    console.info(`Selected (Available) Audio Languages: ${chosenAudios.map(a => a.language.name).join(', ')}`);
    console.info('Stream URL:', chosenVideoSegments.segments[0].map.uri.split('/init.mp4')[0]);

    if (!options.novids) {
      //Download Video
      const totalParts = chosenVideoSegments.segments.length;
      const mathParts  = Math.ceil(totalParts / options.partsize);
      const mathMsg    = `(${mathParts}*${options.partsize})`;
      console.info('Total parts in video stream:', totalParts, mathMsg);
      const tsFile = path.isAbsolute(fileName) ? fileName : path.join(this.cfg.dir.content, fileName);
      const split = fileName.split(path.sep).slice(0, -1);
      split.forEach((val, ind, arr) => {
        const isAbsolut = path.isAbsolute(fileName);
        if (!fs.existsSync(path.join(isAbsolut ? '' : this.cfg.dir.content, ...arr.slice(0, ind), val)))
          fs.mkdirSync(path.join(isAbsolut ? '' : this.cfg.dir.content, ...arr.slice(0, ind), val));
      });
      const videoJson: M3U8Json = {
        segments: chosenVideoSegments.segments
      };
      const videoDownload = await new streamdl({
        output: `${tsFile}.video.enc.ts`,
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
        if (chosenVideoSegments.pssh) {
          console.info('Decryption Needed, attempting to decrypt');
          encryptionKeys = await getKeys(chosenVideoSegments.pssh, 'https://shield-drm.imggaming.com/api/v2/license', {
            'Authorization': `Bearer ${selectedEpisode.jwtToken}`,
            'X-Drm-Info': 'eyJzeXN0ZW0iOiJjb20ud2lkZXZpbmUuYWxwaGEifQ==',
          });
          if (encryptionKeys.length == 0) {
            console.error('Failed to get encryption keys');
            return undefined;
          }
          if (this.cfg.bin.mp4decrypt) {
            const commandBase = `--show-progress --key ${encryptionKeys[1].kid}:${encryptionKeys[1].key} `;
            const commandVideo = commandBase+`"${tsFile}.video.enc.ts" "${tsFile}.video.ts"`;

            console.info('Started decrypting video');
            const decryptVideo = exec('mp4decrypt', `"${this.cfg.bin.mp4decrypt}"`, commandVideo);
            if (!decryptVideo.isOk) {
              console.error(decryptVideo.err);
              console.error(`Decryption failed with exit code ${decryptVideo.err.code}`);
              return undefined;
            } else {
              console.info('Decryption done for video');
              if (!options.nocleanup) {
                fs.removeSync(`${tsFile}.video.enc.ts`);
              }
              files.push({
                type: 'Video',
                path: `${tsFile}.video.ts`,
                lang: chosenAudios[0].language,
                isPrimary: true
              });
            }
          } else {
            console.warn('mp4decrypt not found, files need decryption. Decryption Keys:', encryptionKeys);
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
        const outFile = parseFileName(options.fileName + '.' + (chosenAudioSegments.language.name), variables, options.numbers, options.override).join(path.sep);
        const tsFile = path.isAbsolute(outFile as string) ? outFile : path.join(this.cfg.dir.content, outFile);
        const split = outFile.split(path.sep).slice(0, -1);
        split.forEach((val, ind, arr) => {
          const isAbsolut = path.isAbsolute(outFile as string);
          if (!fs.existsSync(path.join(isAbsolut ? '' : this.cfg.dir.content, ...arr.slice(0, ind), val)))
            fs.mkdirSync(path.join(isAbsolut ? '' : this.cfg.dir.content, ...arr.slice(0, ind), val));
        });
        const audioJson: M3U8Json = {
          segments: chosenAudioSegments.segments
        };
        const audioDownload = await new streamdl({
          output: `${tsFile}.audio.enc.ts`,
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
        if (chosenAudioSegments.pssh) {
          console.info('Decryption Needed, attempting to decrypt');
          if (!encryptionKeys) {
            encryptionKeys = await getKeys(chosenVideoSegments.pssh, 'https://shield-drm.imggaming.com/api/v2/license', {
              'Authorization': `Bearer ${selectedEpisode.jwtToken}`,
              'X-Drm-Info': 'eyJzeXN0ZW0iOiJjb20ud2lkZXZpbmUuYWxwaGEifQ==',
            });
          }
          if (this.cfg.bin.mp4decrypt) {
            const commandBase = `--show-progress --key ${encryptionKeys[1].kid}:${encryptionKeys[1].key} `;
            const commandAudio = commandBase+`"${tsFile}.audio.enc.ts" "${tsFile}.audio.ts"`;

            console.info('Started decrypting audio');
            const decryptAudio = exec('mp4decrypt', `"${this.cfg.bin.mp4decrypt}"`, commandAudio);
            if (!decryptAudio.isOk) {
              console.error(decryptAudio.err);
              console.error(`Decryption failed with exit code ${decryptAudio.err.code}`);
              return undefined;
            } else {
              if (!options.nocleanup) {
                fs.removeSync(`${tsFile}.audio.enc.ts`);
              }
              files.push({
                type: 'Audio',
                path: `${tsFile}.audio.ts`,
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
          sxData.path = path.join(this.cfg.dir.content, sxData.file);
          sxData.language = subLang;
          if(options.dlsubs.includes('all') || options.dlsubs.includes(subLang.locale)) {
            const getVttContent = await this.req.getData(sub.url);
            if (getVttContent.ok && getVttContent.res) {
              console.info(`Subtitle Downloaded: ${sub.url}`);
              //vttConvert(getVttContent.res.body, false, subLang.name, fontSize);
              const sBody = vtt(undefined, chosenFontSize, getVttContent.res.body, '', subsMargin, options.fontName);
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

  public async downloadMediaList(videoUrls: HidiveStreamInfo[], subUrls: HidiveSubtitleInfo[], fontSize: number, options: Record<any, any>) {
    let mediaName = '...';
    let fileName;
    const files: DownloadedMedia[] = [];
    const variables: Variable[] = [];
    let dlFailed = false;
    //let dlVideoOnce = false; // Variable to save if best selected video quality was downloaded
    let subsMargin = 0;
    let videoIndex = 0;
    const chosenFontSize = options.originalFontSize ? fontSize : options.fontSize;
    for (const videoData of videoUrls) {
      if(videoData.seriesTitle && videoData.episodeNumber && videoData.episodeTitle){
        mediaName = `${videoData.seriesTitle} - ${videoData.episodeNumber} - ${videoData.episodeTitle}`;
      }
      if(!options.novids && !dlFailed) {
        console.info(`Requesting: ${mediaName}`);
        console.info('Playlists URL: %s', videoData.hls[0]);
        const streamPlaylistsReq = await this.req.getData(videoData.hls[0]);
        if(!streamPlaylistsReq.ok || !streamPlaylistsReq.res){
          console.error('CAN\'T FETCH VIDEO PLAYLISTS!');
          return { error: true, data: []};
        }

        variables.push(...([
          ['title', videoData.episodeTitle, true],
          ['episode', isNaN(parseFloat(videoData.episodeNumber+'')) ? videoData.episodeNumber : parseFloat(videoData.episodeNumber+''), false],
          ['service', 'HD', false],
          ['showTitle', videoData.seriesTitle, true],
          ['season', videoData.season, false]
        ] as [AvailableFilenameVars, string|number, boolean][]).map((a): Variable => {
          return {
            name: a[0],
            replaceWith: a[1],
            type: typeof a[1],
            sanitize: a[2]
          } as Variable;
        }));

        const streamPlaylists = m3u8(streamPlaylistsReq.res.body);
        const plServerList: string[] = [],
          plStreams: Record<string, Record<string, string>> = {},
          plQuality: {
            str: string,
            dim: string,
            CODECS: string,
            RESOLUTION: {
              width: number,
              height: number
            }
          }[] = [];
        for (const pl of streamPlaylists.playlists) {
          // set quality
          const plResolution = pl.attributes.RESOLUTION;
          const plResolutionText = `${plResolution.width}x${plResolution.height}`;
          // set codecs
          const plCodecs = pl.attributes.CODECS;
          // parse uri
          const plUri = new URL(pl.uri);
          let plServer = plUri.hostname;
          // set server list
          if (plUri.searchParams.get('cdn')) {
            plServer += ` (${plUri.searchParams.get('cdn')})`;
          }
          if (!plServerList.includes(plServer)) {
            plServerList.push(plServer);
          }
          // add to server
          if (!Object.keys(plStreams).includes(plServer)) {
            plStreams[plServer] = {};
          }
          if (
            plStreams[plServer][plResolutionText]
            && plStreams[plServer][plResolutionText] != pl.uri
            && typeof plStreams[plServer][plResolutionText] != 'undefined'
          ) {
            console.error(`Non duplicate url for ${plServer} detected, please report to developer!`);
          }
          else {
            plStreams[plServer][plResolutionText] = pl.uri;
          }
          // set plQualityStr
          const plBandwidth = Math.round(pl.attributes.BANDWIDTH / 1024);
          const qualityStrAdd = `${plResolutionText} (${plBandwidth}KiB/s)`;
          const qualityStrRegx = new RegExp(qualityStrAdd.replace(/(:|\(|\)|\/)/g, '\\$1'), 'm');
          const qualityStrMatch = !plQuality.map(a => a.str).join('\r\n').match(qualityStrRegx);
          if (qualityStrMatch) {
            plQuality.push({
              str: qualityStrAdd,
              dim: plResolutionText,
              CODECS: plCodecs,
              RESOLUTION: plResolution
            });
          }
        }

        options.x = options.x > plServerList.length ? 1 : options.x;

        const plSelectedServer = plServerList[options.x - 1];
        const plSelectedList   = plStreams[plSelectedServer];
        plQuality.sort((a, b) => {
          const aMatch: RegExpMatchArray | never[] = a.dim.match(/[0-9]+/) || [];
          const bMatch: RegExpMatchArray | never[] = b.dim.match(/[0-9]+/) || [];
          return parseInt(aMatch[0]) - parseInt(bMatch[0]);
        });
        let quality = options.q === 0 ? plQuality.length : options.q;
        if(quality > plQuality.length) {
          console.warn(`The requested quality of ${options.q} is greater than the maximun ${plQuality.length}.\n[WARN] Therefor the maximum will be capped at ${plQuality.length}.`);
          quality = plQuality.length;
        }
        const selPlUrl = plSelectedList[plQuality.map(a => a.dim)[quality - 1]] ? plSelectedList[plQuality.map(a => a.dim)[quality - 1]] : '';
        console.info(`Servers available:\n\t${plServerList.join('\n\t')}`);
        console.info(`Available qualities:\n\t${plQuality.map((a, ind) => `[${ind+1}] ${a.str}`).join('\n\t')}`);
        if(selPlUrl != '') {
          variables.push({
            name: 'height',
            type: 'number',
            replaceWith: quality === 0 ? plQuality[plQuality.length - 1].RESOLUTION.height as number : plQuality[quality - 1].RESOLUTION.height
          }, {
            name: 'width',
            type: 'number',
            replaceWith: quality === 0 ? plQuality[plQuality.length - 1].RESOLUTION.width as number : plQuality[quality - 1].RESOLUTION.width
          });
        }
        const lang = langsData.languages.find(a => a.hd_locale === videoData.language);
        if (!lang) {
          console.error(`Unable to find language for code ${videoData.language}`);
          return { error: true, data: [] };
        }
        console.info(`Selected quality: ${Object.keys(plSelectedList).find(a => plSelectedList[a] === selPlUrl)} @ ${plSelectedServer}`);
        console.info('Stream URL:', selPlUrl);
        // TODO check filename
        const outFile = parseFileName(options.fileName + '.' + lang.name + '.' + videoIndex, variables, options.numbers, options.override).join(path.sep);
        fileName = parseFileName(options.fileName, variables, options.numbers, options.override).join(path.sep);
        console.info(`Output filename: ${outFile}`);
        const chunkPage = await this.req.getData(selPlUrl);
        if(!chunkPage.ok || !chunkPage.res){
          console.error('CAN\'T FETCH VIDEO PLAYLIST!');
          dlFailed = true;
        } else {
          const chunkPlaylist = m3u8(chunkPage.res.body);
          //TODO: look into how to keep bumpers without the video being affected
          if(chunkPlaylist.segments[0].uri.match(/\/bumpers\//) && options.removeBumpers){
            subsMargin = chunkPlaylist.segments[0].duration;
            chunkPlaylist.segments.splice(0, 1);
          }
          const totalParts = chunkPlaylist.segments.length;
          const mathParts = Math.ceil(totalParts / options.partsize);
          const mathMsg = `(${mathParts}*${options.partsize})`;
          console.info('Total parts in stream:', totalParts, mathMsg);
          const tsFile = path.isAbsolute(outFile as string) ? outFile : path.join(this.cfg.dir.content, outFile);
          const split = outFile.split(path.sep).slice(0, -1);
          split.forEach((val, ind, arr) => {
            const isAbsolut = path.isAbsolute(outFile as string);
            if (!fs.existsSync(path.join(isAbsolut ? '' : this.cfg.dir.content, ...arr.slice(0, ind), val)))
              fs.mkdirSync(path.join(isAbsolut ? '' : this.cfg.dir.content, ...arr.slice(0, ind), val));
          });
          const dlStreamByPl = await new streamdl({
            output: `${tsFile}.ts`,
            timeout: options.timeout,
            m3u8json: chunkPlaylist,
            // baseurl: chunkPlaylist.baseUrl,
            threads: options.partsize,
            fsRetryTime: options.fsRetryTime * 1000,
            override: options.force,
            callback: options.callbackMaker ? options.callbackMaker({
              fileName: `${path.isAbsolute(outFile) ? outFile.slice(this.cfg.dir.content.length) : outFile}`,
              image: videoData.image,
              parent: {
                title: videoData.seriesTitle
              },
              title: videoData.episodeTitle,
              language: lang
            }) : undefined
          }).download();
          if (!dlStreamByPl.ok) {
            console.error(`DL Stats: ${JSON.stringify(dlStreamByPl.parts)}\n`);
            dlFailed = true;
          }
          files.push({
            type: 'Video',
            path: `${tsFile}.ts`,
            lang: lang,
            uncut: videoData.uncut
          });
          //dlVideoOnce = true;
        }
      } else if(options.novids){
        fileName = parseFileName(options.fileName, variables, options.numbers, options.override).join(path.sep);
        console.info('Downloading skipped!');
      }
      videoIndex++;
      await this.sleep(options.waittime);
    }
    
    if(options.dlsubs.indexOf('all') > -1){
      options.dlsubs = ['all'];
    }

    if (options.nosubs) {
      console.info('Subtitles downloading disabled from nosubs flag.');
      options.skipsubs = true;
    }

    if(!options.skipsubs && options.dlsubs.indexOf('none') == -1) {
      if(subUrls.length > 0) {
        let subIndex = 0;
        for(const sub of subUrls) {
          const subLang = langsData.languages.find(a => a.hd_locale === sub.language);
          if (!subLang) {
            console.warn(`Language not found for subtitle language: ${sub.language}, Skipping`);
            continue;
          }
          const sxData: Partial<sxItem> = {};
          sxData.file = langsData.subsFile(fileName as string, subIndex+'', subLang, sub.cc, options.ccTag);
          sxData.path = path.join(this.cfg.dir.content, sxData.file);
          sxData.language = subLang;
          if(options.dlsubs.includes('all') || options.dlsubs.includes(subLang.locale)){
            const subs4XUrl = sub.url.split('/');
            const subsXUrl = subs4XUrl[subs4XUrl.length - 1].replace(/.vtt$/, '');
            const getCssContent = await this.req.getData(await this.genSubsUrl('css', subsXUrl));
            const getVttContent = await this.req.getData(await this.genSubsUrl('vtt', subsXUrl));
            if (getCssContent.ok && getVttContent.ok && getCssContent.res && getVttContent.res) {
              console.info(`Subtitle Downloaded: ${await this.genSubsUrl('vtt', subsXUrl)}`);
              //vttConvert(getVttContent.res.body, false, subLang.name, fontSize);
              const sBody = vtt(undefined, chosenFontSize, getVttContent.res.body, getCssContent.res.body, subsMargin, options.fontName);
              sxData.title = `${subLang.language} / ${sxData.title}`;
              sxData.fonts = fontsData.assFonts(sBody) as Font[];
              fs.writeFileSync(sxData.path, sBody);
              console.info(`Subtitle Converted: ${sxData.file}`);
              files.push({
                type: 'Subtitle',
                ...sxData as sxItem,
                cc: sub.cc
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