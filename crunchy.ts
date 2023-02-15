// build-in
import path from 'path';
import fs from 'fs-extra';

// package program
import packageJson from './package.json';
// plugins
import shlp from 'sei-helper';
import m3u8 from 'm3u8-parsed';
import streamdl from 'hls-download';

// custom modules
import * as fontsData from './modules/module.fontsData';
import * as langsData from './modules/module.langsData';
import * as yamlCfg from './modules/module.cfg-loader';
import * as yargs from './modules/module.app-args';
import Merger, { Font, MergerInput, SubtitleInput } from './modules/module.merger';

export type sxItem = {
  language: langsData.LanguageItem,
  path: string,
  file: string
  title: string,
  fonts: Font[]
}

// args

// load req
import { domain, api } from './modules/module.api-urls';
import * as reqModule from './modules/module.req';
import { CrunchySearch } from './@types/crunchySearch';
import { CrunchyEpisodeList, CrunchyEpisode } from './@types/crunchyEpisodeList';
import { CrunchyDownloadOptions, CrunchyEpMeta, CrunchyMuxOptions, CurnchyMultiDownload, DownloadedMedia, ParseItem, SeriesSearch, SeriesSearchItem } from './@types/crunchyTypes';
import { ObjectInfo } from './@types/objectInfo';
import parseFileName, { Variable } from './modules/module.filename';
import { PlaybackData } from './@types/playbackData';
import { downloaded } from './modules/module.downloadArchive';
import parseSelect from './modules/module.parseSelect';
import { AvailableFilenameVars, getDefault } from './modules/module.args';
import { AuthData, AuthResponse, Episode, ResponseBase, SearchData, SearchResponse, SearchResponseItem } from './@types/messageHandler';
import { ServiceClass } from './@types/serviceClassInterface';

export default class Crunchy implements ServiceClass {
  public cfg: yamlCfg.ConfigObject;
  private token: Record<string, any>;
  private req: reqModule.Req;
  private cmsToken: {
    cms?: Record<string, string> 
  } = {};

  constructor(private debug = false) {
    this.cfg = yamlCfg.loadCfg();
    this.token = yamlCfg.loadCRToken();
    this.req = new reqModule.Req(domain, false, false);
  }

  public checkToken(): boolean {
    return Object.keys(this.cmsToken.cms ?? {}).length > 0;
  }

  public async cli() {
    console.log(`\n=== Multi Downloader NX ${packageJson.version} ===\n`);
    const argv = yargs.appArgv(this.cfg.cli);
  
    // load binaries
    this.cfg.bin = await yamlCfg.loadBinCfg();
    if (argv.allDubs) {
      argv.dubLang = langsData.dubLanguageCodes;
    }
    // select mode
    if (argv.silentAuth && !argv.auth) {
      await this.doAuth({
        username: argv.username ?? await shlp.question('[Q] LOGIN/EMAIL'),
        password: argv.password ?? await shlp.question('[Q] PASSWORD   ')
      });
    }
    if(argv.dlFonts){
      await this.getFonts();
    }
    else if(argv.auth){
      await this.doAuth({
        username: argv.username ?? await shlp.question('[Q] LOGIN/EMAIL'),
        password: argv.password ?? await shlp.question('[Q] PASSWORD   ')
      });
    }
    else if(argv.cmsindex){
      await this.refreshToken();
      await this.getCmsData();
    }
    else if(argv.new){
      await this.refreshToken();
      await this.getNewlyAdded(argv.page);
    }
    else if(argv.search && argv.search.length > 2){
      await this.refreshToken();
      await this.doSearch({ ...argv, search: argv.search as string });
    }
    else if(argv.series && argv.series.match(/^[0-9A-Z]{9}$/)){
      await this.refreshToken();
      await this.logSeriesById(argv.series as string);
      const selected = await this.downloadFromSeriesID(argv.series, { ...argv });
      if (selected.isOk) {
        for (const select of selected.value) {
          if (!(await this.downloadEpisode(select, {...argv, skipsubs: false }))) {
            console.log(`[ERROR] Unable to download selected episode ${select.episodeNumber}`);
            return false;
          }
        }
      }
      return true;
    }
    else if(argv['movie-listing'] && argv['movie-listing'].match(/^[0-9A-Z]{9}$/)){
      await this.refreshToken();
      await this.logMovieListingById(argv['movie-listing'] as string);
    }
    else if(argv.s && argv.s.match(/^[0-9A-Z]{9}$/)){
      await this.refreshToken();
      if (argv.dubLang.length > 1) {
        console.log('[INFO] One show can only be downloaded with one dub. Use --srz instead.');
      }
      argv.dubLang = [argv.dubLang[0]];
      const selected = await this.getSeasonById(argv.s, argv.numbers, argv.e, argv.but, argv.all);
      if (selected.isOk) {
        for (const select of selected.value) {
          if (!(await this.downloadEpisode(select, {...argv, skipsubs: false }))) {
            console.log(`[ERROR] Unable to download selected episode ${select.episodeNumber}`);
            return false;
          }
        }
      }
      return true;
    }
    else if(argv.e){
      await this.refreshToken();
      const selected = await this.getObjectById(argv.e, false);
      for (const select of selected as Partial<CrunchyEpMeta>[]) {
        if (!(await this.downloadEpisode(select as CrunchyEpMeta, {...argv, skipsubs: false }))) {
          console.log(`[ERROR] Unable to download selected episode ${select.episodeNumber}`);
          return false;
        }
      }
      return true;
    }
    else{
      console.log('[INFO] No option selected or invalid value entered. Try --help.');
    }
  }

  public async getFonts() {
    console.log('[INFO] Downloading fonts...');
    const fonts = Object.values(fontsData.fontFamilies).reduce((pre, curr) => pre.concat(curr));
    for(const f of fonts) {
      const fontLoc  = path.join(this.cfg.dir.fonts, f);
      if(fs.existsSync(fontLoc) && fs.statSync(fontLoc).size != 0){
        console.log(`[INFO] ${f} already downloaded!`);
      }
      else{
        const fontFolder = path.dirname(fontLoc);
        if(fs.existsSync(fontLoc) && fs.statSync(fontLoc).size == 0){
          fs.unlinkSync(fontLoc);
        }
        try{
          fs.ensureDirSync(fontFolder);
        }
        catch(e){
          console.log();
        }
        const fontUrl = fontsData.root + f;
        const getFont = await this.req.getData<Buffer>(fontUrl, { binary: true });
        if(getFont.ok && getFont.res){
          fs.writeFileSync(fontLoc, getFont.res.body);
          console.log(`[INFO] Downloaded: ${f}`);
        }
        else{
          console.log(`[WARN] Failed to download: ${f}`);
        }
      }
    }
    console.log('[INFO] All required fonts downloaded!');
  }

  public async doAuth(data: AuthData): Promise<AuthResponse> {
    const authData = new URLSearchParams({
      'username': data.username,
      'password': data.password,
      'grant_type': 'password',
      'scope': 'offline_access'
    }).toString();
    const authReqOpts: reqModule.Params = {
      method: 'POST',
      headers: api.beta_authHeaderMob,
      body: authData
    };
    const authReq = await this.req.getData(api.beta_auth, authReqOpts);
    if(!authReq.ok || !authReq.res){
      console.log('[ERROR] Authentication failed!');
      return { isOk: false, reason: new Error('Authentication failed') };
    }
    this.token = JSON.parse(authReq.res.body);
    this.token.expires = new Date(Date.now() + this.token.expires_in);
    yamlCfg.saveCRToken(this.token);
    await this.getProfile();
    console.log('[INFO] Your Country: %s', this.token.country);
    return { isOk: true, value: undefined };
  }

  public async doAnonymousAuth(){
    const authData = new URLSearchParams({
      'grant_type': 'client_id',
      'scope': 'offline_access',
    }).toString();
    const authReqOpts: reqModule.Params = {
      method: 'POST',
      headers: api.beta_authHeaderMob,
      body: authData
    };
    const authReq = await this.req.getData(api.beta_auth, authReqOpts);
    if(!authReq.ok || !authReq.res){
      console.log('[ERROR] Authentication failed!');
      return;
    }
    this.token = JSON.parse(authReq.res.body);
    this.token.expires = new Date(Date.now() + this.token.expires_in);
    yamlCfg.saveCRToken(this.token);
  }

  public async getProfile() : Promise<boolean> {
    if(!this.token.access_token){
      console.log('[ERROR] No access token!');
      return false;
    }
    const profileReqOptions = {
      headers: {
        Authorization: `Bearer ${this.token.access_token}`,
      },
      useProxy: true
    };
    const profileReq = await this.req.getData(api.beta_profile, profileReqOptions);
    if(!profileReq.ok || !profileReq.res){
      console.log('[ERROR] Get profile failed!');
      return false;
    }
    const profile = JSON.parse(profileReq.res.body);
    console.log('[INFO] USER: %s (%s)', profile.username, profile.email);
    return true;
  }

  public async refreshToken(ifNeeded = false,  silent = false) {
    if(!this.token.access_token && !this.token.refresh_token || this.token.access_token && !this.token.refresh_token){
      await this.doAnonymousAuth();
    }
    else{
      /*if (ifNeeded)
        return;*/
      if (!(Date.now() > new Date(this.token.expires).getTime()) && ifNeeded) {
        return;
      } else {
        //console.log('[WARN] The token has expired compleatly. I will try to refresh the token anyway, but you might have to reauth.');
      }
      const authData = new URLSearchParams({
        'refresh_token': this.token.refresh_token,
        'grant_type': 'refresh_token',
        'scope': 'offline_access'
      }).toString();
      const authReqOpts: reqModule.Params = {
        method: 'POST',
        headers: api.beta_authHeaderMob,
        body: authData
      };
      const authReq = await this.req.getData(api.beta_auth, authReqOpts);
      if(!authReq.ok || !authReq.res){
        console.log('[ERROR] Authentication failed!');
        return;
      }
      this.token = JSON.parse(authReq.res.body);
      this.token.expires = new Date(Date.now() + this.token.expires_in);
      yamlCfg.saveCRToken(this.token);
    }
    if(this.token.refresh_token) {
      if (!silent)
        await this.getProfile();
    } else {
      console.log('[INFO] USER: Anonymous');
    }
    await this.getCMStoken();
  }

  public async getCMStoken(){
    if(!this.token.access_token){
      console.log('[ERROR] No access token!');
      return;
    }
    const cmsTokenReqOpts = {
      headers: {
        Authorization: `Bearer ${this.token.access_token}`,
      },
      useProxy: true
    };
    const cmsTokenReq = await this.req.getData(api.beta_cmsToken, cmsTokenReqOpts);
    if(!cmsTokenReq.ok || !cmsTokenReq.res){
      console.log('[ERROR] Authentication CMS token failed!');
      return;
    }
    this.cmsToken = JSON.parse(cmsTokenReq.res.body);
    console.log('[INFO] Your Country: %s\n', this.cmsToken.cms?.bucket.split('/')[1]);
  }

  public async getCmsData(){
    // check token
    if(!this.cmsToken.cms){
      console.log('[ERROR] Authentication required!');
      return;
    }
    // opts
    const indexReqOpts = [
      api.beta_cms,
      this.cmsToken.cms.bucket,
      '/index?',
      new URLSearchParams({
        'Policy': this.cmsToken.cms.policy,
        'Signature': this.cmsToken.cms.signature,
        'Key-Pair-Id': this.cmsToken.cms.key_pair_id,
      }),
    ].join('');
    const indexReq = await this.req.getData(indexReqOpts);
    if(!indexReq.ok || ! indexReq.res){
      console.log('[ERROR] Get CMS index FAILED!');
      return;
    }
    console.log(JSON.parse(indexReq.res.body));
  }

  public async doSearch(data: SearchData): Promise<SearchResponse>{
    if(!this.token.access_token){
      console.log('[ERROR] Authentication required!');
      return { isOk: false, reason: new Error('Not authenticated') };
    }
    const searchReqOpts = {
      headers: {
        Authorization: `Bearer ${this.token.access_token}`,
      },
      useProxy: true
    };
    const searchStart = data.page ? (data.page-1)*5 : 0;
    const searchParams = new URLSearchParams({
      q: data.search,
      n: '5',
      start: data.page ? `${(data.page-1)*5}` : '0',
      type: data['search-type'] ?? getDefault('search-type', this.cfg.cli),
      locale: data['search-locale'] ?? getDefault('search-locale', this.cfg.cli),
    }).toString();
    const searchReq = await this.req.getData(`${api.search}?${searchParams}`, searchReqOpts);
    if(!searchReq.ok || ! searchReq.res){
      console.log('[ERROR] Search FAILED!');
      return { isOk: false, reason: new Error('Search failed. No more information provided') };
    }
    const searchResults = JSON.parse(searchReq.res.body) as CrunchySearch;
    if(searchResults.total < 1){
      console.log('[INFO] Nothing Found!');
      return { isOk: true, value: [] };
    }

    const searchTypesInfo = {
      'top_results':   'Top results',
      'series':        'Found series',
      'movie_listing': 'Found movie lists',
      'episode':       'Found episodes'
    };
    for(const search_item of searchResults.data){
      console.log('[INFO] %s:', searchTypesInfo[search_item.type as keyof typeof searchTypesInfo]);
      // calculate pages
      const pageCur = searchStart > 0 ? Math.ceil(searchStart/5) + 1 : 1;
      const pageMax = Math.ceil(search_item.count/5);
      // pages per category
      if(search_item.count < 1){
        console.log('  [INFO] Nothing Found...');
      }
      if(search_item.count > 0){
        if(pageCur > pageMax){
          console.log('  [INFO] Last page is %s...', pageMax);
          continue;
        }
        for(const item of search_item.items){
          await this.logObject(item);
        }
        console.log(`  [INFO] Total results: ${search_item.count} (Page: ${pageCur}/${pageMax})`);
      }
    }
    const toSend = searchResults.data.filter(a => a.type === 'series' || a.type === 'movie_listing');
    return { isOk: true, value: toSend.map(a => {
      return a.items.map((a): SearchResponseItem => {
        const images = (a.images.poster_tall ?? [[ { source: '/notFound.png' } ]])[0];
        return {
          id: a.id,
          image: images[Math.floor(images.length / 2)].source,
          name: a.title,
          rating: -1,
          desc: a.description
        };
      });
    }).reduce((pre, cur) => pre.concat(cur))};
  }

  public async logObject(item: ParseItem, pad?: number, getSeries?: boolean, getMovieListing?: boolean){
    if(this.debug){
      console.log(item);
    }
    pad = pad ?? 2;
    getSeries = getSeries === undefined ? true : getSeries;
    getMovieListing = getMovieListing === undefined ? true : getMovieListing;
    item.isSelected = item.isSelected === undefined ? false : item.isSelected;
    if(!item.type) {
      item.type = item.__class__;
    }

    //guess item type
    //TODO: look into better methods of getting item type
    let iType = item.type;
    if (!iType) {
      if (item.episode_number) {
        iType = 'episode';
      } else if (item.season_number) {
        iType = 'season';
      } else if (item.season_count) {
        iType = 'series';
      } else {
        if (item.identifier !== '') {
          const iTypeCheck = item.identifier?.split('|');
          if (iTypeCheck) {
            if (iTypeCheck[1] == 'M') {
              iType = 'movie';
            } else if (!iTypeCheck[2]) {
              iType = 'season';
            } else {
              iType = 'episode';
            }
          } else {
            iType = 'series';
          }
        } else {
          iType = 'movie_listing';
        }
      }
      item.type = iType;
    }

    const oTypes = {
      'series': 'Z',        // SRZ
      'season': 'S',        // VOL
      'episode': 'E',       // EPI
      'movie_listing': 'F', // FLM
      'movie': 'M',         // MED
    };
      // check title
    item.title = item.title != '' ? item.title : 'NO_TITLE';
    // static data
    const oMetadata = [],
      oBooleans = [],
      tMetadata = item.type + '_metadata',
      iMetadata = (Object.prototype.hasOwnProperty.call(item, tMetadata) ? item[tMetadata as keyof ParseItem] : item) as Record<string, any>,
      iTitle = [ item.title ];
    
    const audio_languages = [];

    // set object booleans
    if(iMetadata.duration_ms){
      oBooleans.push(shlp.formatTime(iMetadata.duration_ms/1000));
    }
    if(iMetadata.is_simulcast) {
      oBooleans.push('SIMULCAST');
    }
    if(iMetadata.is_mature) {
      oBooleans.push('MATURE');
    }
    if (item.versions) {
      for(const version of item.versions) {
        audio_languages.push(version.audio_locale);
        if (version.original) {
          oBooleans.push('SUB');
        } else {
          if (!oBooleans.includes('DUB')) {
            oBooleans.push('DUB');
          }
        }
      }
    } else {
      if(iMetadata.is_subbed){
        oBooleans.push('SUB');
      }
      if(iMetadata.is_dubbed){
        oBooleans.push('DUB');
      }
    }
    if(item.playback && item.type != 'movie_listing') {
      oBooleans.push('STREAM');
    }
    // set object metadata
    if(iMetadata.season_count){
      oMetadata.push(`Seasons: ${iMetadata.season_count}`);
    }
    if(iMetadata.episode_count){
      oMetadata.push(`EPs: ${iMetadata.episode_count}`);
    }
    if(item.season_number && !iMetadata.hide_season_title && !iMetadata.hide_season_number){
      oMetadata.push(`Season: ${item.season_number}`);
    }
    if(item.type == 'episode'){
      if(iMetadata.episode){
        iTitle.unshift(iMetadata.episode);
      }
      if(!iMetadata.hide_season_title && iMetadata.season_title){
        iTitle.unshift(iMetadata.season_title);
      }
    }
    if(item.is_premium_only){
      iTitle[0] = `☆ ${iTitle[0]}`;
    }
    // display metadata
    if(item.hide_metadata){
      iMetadata.hide_metadata = item.hide_metadata;
    }
    const showObjectMetadata = oMetadata.length > 0 && !iMetadata.hide_metadata ? true : false;
    const showObjectBooleans = oBooleans.length > 0 && !iMetadata.hide_metadata ? true : false;
    // make obj ids
    const objects_ids = [];
    objects_ids.push(oTypes[item.type as keyof typeof oTypes] + ':' + item.id);
    if(item.seq_id){
      objects_ids.unshift(item.seq_id);
    }
    if(item.f_num){
      objects_ids.unshift(item.f_num);
    }
    if(item.s_num){
      objects_ids.unshift(item.s_num);
    }
    if(item.external_id){
      objects_ids.push(item.external_id);
    }
    if(item.ep_num){
      objects_ids.push(item.ep_num);
    }

    // show entry
    console.log(
      '%s%s[%s] %s%s%s',
      ''.padStart(item.isSelected ? pad-1 : pad, ' '),
      item.isSelected ? '✓' : '',
      objects_ids.join('|'),
      iTitle.join(' - '),
      showObjectMetadata ? ` (${oMetadata.join(', ')})` : '',
      showObjectBooleans ? ` [${oBooleans.join(', ')}]` : '',
          
    );
    if(item.last_public){
      console.log(''.padStart(pad+1, ' '), '- Last updated:', item.last_public);
    }
    if(item.subtitle_locales){
      iMetadata.subtitle_locales = item.subtitle_locales;
    }
    if (item.versions && audio_languages.length > 0) {
      console.log(
        '%s- Versions: %s',
        ''.padStart(pad + 2, ' '),
        langsData.parseSubtitlesArray(audio_languages)
      );
    }
    if(iMetadata.subtitle_locales && iMetadata.subtitle_locales.length > 0){
      console.log(
        '%s- Subtitles: %s',
        ''.padStart(pad + 2, ' '),
        langsData.parseSubtitlesArray(iMetadata.subtitle_locales)
      );
    }
    if(item.availability_notes){
      console.log(
        '%s- Availability notes: %s',
        ''.padStart(pad + 2, ' '),
        item.availability_notes.replace(/\[[^\]]*\]?/gm, '')
      );
    }
    if(item.type == 'series' && getSeries){
      await this.logSeriesById(item.id, pad, true);
      console.log();
    }
    if(item.type == 'movie_listing' && getMovieListing){
      await this.logMovieListingById(item.id, pad+2);
      console.log();
    }
  }

  public async logSeriesById(id: string, pad?: number, hideSeriesTitle?: boolean){
    // parse
    pad = pad || 0;
    hideSeriesTitle = hideSeriesTitle !== undefined ? hideSeriesTitle : false;
    // check token
    if(!this.cmsToken.cms){
      console.log('[ERROR] Authentication required!');
      return;
    }
    // opts
    const AuthHeaders = {
      headers: {
        Authorization: `Bearer ${this.token.access_token}`,
      },
      useProxy: true
    };
    // reqs
    if(!hideSeriesTitle){
      const seriesReq = await this.req.getData(`${api.cms}/series/${id}?preferred_audio_language=ja-JP`, AuthHeaders);
      if(!seriesReq.ok || !seriesReq.res){
        console.log('[ERROR] Series Request FAILED!');
        return;
      }
      const seriesData = JSON.parse(seriesReq.res.body);
      await this.logObject(seriesData.data[0], pad, false);
    }
    // seasons list
    const seriesSeasonListReq = await this.req.getData(`${api.cms}/series/${id}/seasons?preferred_audio_language=ja-JP`, AuthHeaders);
    if(!seriesSeasonListReq.ok || !seriesSeasonListReq.res){
      console.log('[ERROR] Series Request FAILED!');
      return;
    }
    // parse data
    const seasonsList = JSON.parse(seriesSeasonListReq.res.body) as SeriesSearch;
    if(seasonsList.total < 1){
      console.log('[INFO] Series is empty!');
      return;
    }
    for(const item of seasonsList.data){
      await this.logObject(item, pad+2);
    }
  }

  public async logMovieListingById(id: string, pad?: number){
    pad = pad || 2;
    if(!this.cmsToken.cms){
      console.log('[ERROR] Authentication required!');
      return;
    }
    const movieListingReqOpts = [
      api.beta_cms,
      this.cmsToken.cms.bucket,
      '/movies?',
      new URLSearchParams({
        'movie_listing_id': id,
        'Policy': this.cmsToken.cms.policy,
        'Signature': this.cmsToken.cms.signature,
        'Key-Pair-Id': this.cmsToken.cms.key_pair_id,
      }),
    ].join('');
    const movieListingReq = await this.req.getData(movieListingReqOpts);
    if(!movieListingReq.ok || !movieListingReq.res){
      console.log('[ERROR]  Movie Listing Request FAILED!');
      return;
    }
    const movieListing = JSON.parse(movieListingReq.res.body);
    if(movieListing.total < 1){
      console.log('[INFO] Movie Listing is empty!');
      return;
    }
    for(const item of movieListing.items){
      this.logObject(item, pad);
    }
  }
  
  public async getNewlyAdded(page?: number){
    if(!this.token.access_token){
      console.log('[ERROR] Authentication required!');
      return;
    }
    const newlyAddedReqOpts = {
      headers: {
        Authorization: `Bearer ${this.token.access_token}`,
      },
      useProxy: true
    };
    const newlyAddedParams = new URLSearchParams({
      sort_by: 'newly_added',
      n: '25',
      start: (page ? (page-1)*25 : 0).toString(),
    }).toString();
    const newlyAddedReq = await this.req.getData(`${api.beta_browse}?${newlyAddedParams}`, newlyAddedReqOpts);
    if(!newlyAddedReq.ok || !newlyAddedReq.res){
      console.log('[ERROR] Get newly added FAILED!');
      return;
    }
    const newlyAddedResults = JSON.parse(newlyAddedReq.res.body);
    console.log('[INFO] Newly added:');
    for(const i of newlyAddedResults.items){
      await this.logObject(i, 2);
    }
    // calculate pages
    const itemPad = parseInt(new URL(newlyAddedResults.__href__, domain.api_beta).searchParams.get('start') as string);
    const pageCur = itemPad > 0 ? Math.ceil(itemPad/25) + 1 : 1;
    const pageMax = Math.ceil(newlyAddedResults.total/25);
    console.log(`  [INFO] Total results: ${newlyAddedResults.total} (Page: ${pageCur}/${pageMax})`);
  }

  public async getSeasonById(id: string, numbers: number, e: string|undefined, but: boolean, all: boolean) : Promise<ResponseBase<CrunchyEpMeta[]>> {
    if(!this.cmsToken.cms){
      console.log('[ERROR] Authentication required!');
      return { isOk: false, reason: new Error('Authentication required') };
    }

    const AuthHeaders = {
      headers: {
        Authorization: `Bearer ${this.token.access_token}`,
      },
      useProxy: true
    };

    
    //get show info
    const showInfoReq = await this.req.getData(`${api.cms}/seasons/${id}?preferred_audio_language=ja-JP`, AuthHeaders);
    if(!showInfoReq.ok || !showInfoReq.res){
      console.log('[ERROR] Show Request FAILED!');
      return { isOk: false, reason: new Error('Show request failed. No more information provided.') };
    }
    const showInfo = JSON.parse(showInfoReq.res.body);
    this.logObject(showInfo.data[0], 0);

    //get episode info
    const reqEpsList = await this.req.getData(`${api.cms}/seasons/${id}/episodes?preferred_audio_language=ja-JP`, AuthHeaders);
    if(!reqEpsList.ok || !reqEpsList.res){
      console.log('[ERROR] Episode List Request FAILED!');
      return { isOk: false, reason: new Error('Episode List request failed. No more information provided.') };
    }
    const episodeList = JSON.parse(reqEpsList.res.body) as CrunchyEpisodeList;
      
    const epNumList: {
        ep: number[],
        sp: number
      } = { ep: [], sp: 0 };
    const epNumLen = numbers;
      
    if(episodeList.total < 1){
      console.log('  [INFO] Season is empty!');
      return { isOk: true, value: [] };
    }
      
    const doEpsFilter = parseSelect(e as string);
    const selectedMedia: CrunchyEpMeta[] = [];
      
    episodeList.data.forEach((item) => {
      item.hide_season_title = true;
      if(item.season_title == '' && item.series_title != ''){
        item.season_title = item.series_title;
        item.hide_season_title = false;
        item.hide_season_number = true;
      }
      if(item.season_title == '' && item.series_title == ''){
        item.season_title = 'NO_TITLE';
      }
      const epNum = item.episode;
      let isSpecial = false;
      item.isSelected = false;
      if(!epNum.match(/^\d+$/) || epNumList.ep.indexOf(parseInt(epNum, 10)) > -1){
        isSpecial = true;
        epNumList.sp++;
      }
      else{
        epNumList.ep.push(parseInt(epNum, 10));
      }
      const selEpId = (
        isSpecial 
          ? 'S' + epNumList.sp.toString().padStart(epNumLen, '0')
          : ''  + parseInt(epNum, 10).toString().padStart(epNumLen, '0')
      );
      // set data
      const images = (item.images.thumbnail ?? [[ { source: '/notFound.png' } ]])[0];
      const epMeta: CrunchyEpMeta = {
        data: [
          {
            mediaId: item.id,
            versions: null,
            lang: langsData.languages.find(a => a.code == yargs.appArgv(this.cfg.cli).dubLang[0])
          }
        ],
        seasonTitle:   item.season_title,
        episodeNumber: item.episode,
        episodeTitle:  item.title,
        seasonID: item.season_id,
        season: item.season_number,
        showID: id,
        e: selEpId,
        image: images[Math.floor(images.length / 2)].source
      };
      // Check for streams_link and update playback var if needed
      if (item.streams_link) {
        epMeta.data[0].playback = item.streams_link;
        if(!item.playback) {
          item.playback = item.streams_link;
        }
      }
      if (item.versions) {
        epMeta.data[0].versions = item.versions;
      }
      // find episode numbers
      if((but && item.playback && !doEpsFilter.isSelected([selEpId, item.id])) || (all && item.playback) || (!but && doEpsFilter.isSelected([selEpId, item.id]) && !item.isSelected && item.playback)){
        selectedMedia.push(epMeta);
        item.isSelected = true;
      }
      // show ep
      item.seq_id = selEpId;
      this.logObject(item);
    });
      
    // display
    if(selectedMedia.length < 1){
      console.log('\n[INFO] Episodes not selected!\n');
    }
      
    console.log();
    return { isOk: true, value: selectedMedia };
  }

  public async downloadEpisode(data: CrunchyEpMeta, options: CrunchyDownloadOptions): Promise<boolean> {
    const res = await this.downloadMediaList(data, options);
    if (res === undefined || res.error) {
      return false;
    } else {
      await this.muxStreams(res.data, { ...options, output: res.fileName });
      downloaded({
        service: 'crunchy',
        type: 's'
      }, data.showID, [data.episodeNumber]);
    }
    return true;
  }

  public async getObjectById(e?: string, earlyReturn?: boolean): Promise<ObjectInfo|Partial<CrunchyEpMeta>[]|undefined> {
    if(!this.cmsToken.cms){
      console.log('[ERROR] Authentication required!');
      return;
    }
      
    const doEpsFilter = parseSelect(e as string);
      
    if(doEpsFilter.values.length < 1){
      console.log('\n[INFO] Objects not selected!\n');
      return;
    }
      
    // node index.js --service crunchy -e G6497Z43Y,GRZXCMN1W,G62PEZ2E6,G25FVGDEK,GZ7UVPVX5
    console.log('[INFO] Requested object ID: %s', doEpsFilter.values.join(', '));
    
    const AuthHeaders = {
      headers: {
        Authorization: `Bearer ${this.token.access_token}`,
      },
      useProxy: true
    };

    // reqs
    const objectReq = await this.req.getData(`${api.cms}/objects/${doEpsFilter.values.join(',')}?preferred_audio_language=ja-JP`, AuthHeaders);
    if(!objectReq.ok || !objectReq.res){
      console.log('[ERROR] Objects Request FAILED!');
      if(objectReq.error && objectReq.error.res && objectReq.error.res.body){
        const objectInfo = JSON.parse(objectReq.error.res.body as string);
        console.log('[INFO] Body:', JSON.stringify(objectInfo, null, '\t'));
        objectInfo.error = true;
        return objectInfo;
      }
      return;
    }
      
    const objectInfo = JSON.parse(objectReq.res.body) as ObjectInfo;
    if(earlyReturn){
      return objectInfo;
    }
      
    const selectedMedia = [];
      
    for(const item of objectInfo.data){
      if(item.type != 'episode' && item.type != 'movie'){
        await this.logObject(item, 2, true, false);
        continue;
      }
      const epMeta: Partial<CrunchyEpMeta> = {};

      epMeta.data = [];
      if (item.episode_metadata) {
        item.s_num = 'S:' + item.episode_metadata.season_id;
        epMeta.data = [
          {
            mediaId: 'E:'+ item.id,
            versions: item.episode_metadata.versions
          }
        ];
        epMeta.seasonTitle = item.episode_metadata.season_title;
        epMeta.episodeNumber = item.episode_metadata.episode;
        epMeta.episodeTitle = item.title;
        epMeta.season = item.episode_metadata.season_number;
      } else if (item.movie_listing_metadata) {
        item.f_num = 'F:' + item.id;
        epMeta.data = [
          {
            mediaId: 'M:'+ item.id
          }
        ];
        epMeta.seasonTitle = item.title;
        epMeta.episodeNumber = 'Movie';
        epMeta.episodeTitle = item.title;
      }
      if (item.streams_link) {
        epMeta.data[0].playback = item.streams_link;
        if(!item.playback) {
          item.playback = item.streams_link;
        }
        selectedMedia.push(epMeta);
        item.isSelected = true;
      }
      await this.logObject(item, 2);
    }
    console.log();
    return selectedMedia;      
  }

  public async downloadMediaList(medias: CrunchyEpMeta, options: CrunchyDownloadOptions) : Promise<{
    data: DownloadedMedia[],
    fileName: string,
    error: boolean
  } | undefined> {
    if(!this.cmsToken.cms){
      console.log('[ERROR] Authentication required!');
      return;
    }

    let mediaName = '...';
    let fileName;
    const variables: Variable[] = [];
    if(medias.seasonTitle && medias.episodeNumber && medias.episodeTitle){
      mediaName = `${medias.seasonTitle} - ${medias.episodeNumber} - ${medias.episodeTitle}`;
    }
      
    const files: DownloadedMedia[] = [];
  
    if(medias.data.every(a => !a.playback)){
      console.log('[WARN] Video not available!');
      return undefined;
    }

    let dlFailed = false;
    let dlVideoOnce = false; // Variable to save if best selected video quality was downloaded
    

    for (const mMeta of medias.data) {
      console.log(`[INFO] Requesting: [${mMeta.mediaId}] ${mediaName}`);
      
      //Make sure token is up to date
      await this.refreshToken(true, true);
      const AuthHeaders = {
        headers: {
          Authorization: `Bearer ${this.token.access_token}`,
        },
        useProxy: true
      };

      //Get Media GUID
      let mediaId = mMeta.mediaId;
      if (mMeta.versions && mMeta.lang) {
        mediaId = mMeta.versions.find(a => a.audio_locale == mMeta.lang?.cr_locale)?.media_guid as string;
        if (!mediaId) {
          console.log('[ERROR] Selected language not found.');
          return undefined;
        }
      }

      // If for whatever reason mediaId has a :, return the ID only
      if (mediaId.includes(':'))
        mediaId = mediaId.split(':')[1];

      let playbackReq = await this.req.getData(`${api.cms}/videos/${mediaId}/streams`, AuthHeaders);
      if(!playbackReq.ok || !playbackReq.res){
        console.log('[ERROR] Request Stream URLs FAILED! Attempting fallback');
        playbackReq = await this.req.getData(`${domain.api_beta}${mMeta.playback}`, AuthHeaders);
        if(!playbackReq.ok || !playbackReq.res){
          console.log('[ERROR] Fallback Request Stream URLs FAILED!');
          return undefined;
        }
      }
        
      const pbData = JSON.parse(playbackReq.res.body) as PlaybackData;
    
      variables.push(...([
        ['title', medias.episodeTitle, true],
        ['episode', isNaN(parseInt(medias.episodeNumber)) ? medias.episodeNumber : parseInt(medias.episodeNumber), false],
        ['service', 'CR', false],
        ['showTitle', medias.seasonTitle, true],
        ['season', medias.season, false]
      ] as [AvailableFilenameVars, string|number, boolean][]).map((a): Variable => {
        return {
          name: a[0],
          replaceWith: a[1],
          type: typeof a[1],
          sanitize: a[2]
        } as Variable;
      }));
    
      let streams = [];
      let hsLangs: string[] = [];
      const pbStreams = pbData.data[0];

      for(const s of Object.keys(pbStreams)){
        if(s.match(/hls/) && !s.match(/drm/) && !s.match(/trailer/)) {
          const pb = Object.values(pbStreams[s]).map(v => {
            v.hardsub_lang = v.hardsub_locale 
              ? langsData.fixAndFindCrLC(v.hardsub_locale).locale
              : v.hardsub_locale;
            if(v.hardsub_lang && hsLangs.indexOf(v.hardsub_lang) < 0){
              hsLangs.push(v.hardsub_lang);
            }
            return { 
              ...v, 
              ...{ format: s }
            };
          });
          streams.push(...pb);
        }
      }
        
      if(streams.length < 1){
        console.log('[WARN] No full streams found!');
        return undefined;
      }
      
      const audDub = langsData.findLang(langsData.fixLanguageTag(pbData.meta.audio_locale as string) || '').code;
      hsLangs = langsData.sortTags(hsLangs);
        
      streams = streams.map((s) => {
        s.audio_lang = audDub;
        s.hardsub_lang = s.hardsub_lang ? s.hardsub_lang : '-';
        s.type = `${s.format}/${s.audio_lang}/${s.hardsub_lang}`;
        return s;
      });

      streams = streams.sort((a, b) => {
        if (a.type < b.type) {
          return -1;
        }
        return 0;
      });
        
      if(options.hslang != 'none'){
        if(hsLangs.indexOf(options.hslang) > -1){
          console.log('[INFO] Selecting stream with %s hardsubs', langsData.locale2language(options.hslang).language);
          streams = streams.filter((s) => {
            if(s.hardsub_lang == '-'){
              return false;
            }
            return s.hardsub_lang == options.hslang ? true : false;
          });
        }
        else{
          console.log('[WARN] Selected stream with %s hardsubs not available', langsData.locale2language(options.hslang).language);
          if(hsLangs.length > 0){
            console.log('[WARN] Try other hardsubs stream:', hsLangs.join(', '));
          }
          dlFailed = true;
        }
      }
      else{
        streams = streams.filter((s) => {
          if(s.hardsub_lang != '-'){
            return false;
          }
          return true;
        });
        if(streams.length < 1){
          console.log('[WARN] Raw streams not available!');
          if(hsLangs.length > 0){
            console.log('[WARN] Try hardsubs stream:', hsLangs.join(', '));
          }
          dlFailed = true;
        }
        console.log('[INFO] Selecting raw stream');
      }
        
      let curStream:
        undefined|typeof streams[0]
        = undefined;
      if(!dlFailed){
        options.kstream = typeof options.kstream == 'number' ? options.kstream : 1;
        options.kstream = options.kstream > streams.length ? 1 : options.kstream;
            
        streams.forEach((s, i) => {
          const isSelected = options.kstream == i + 1 ? '✓' : ' ';
          console.log('[INFO] Full stream found! (%s%s: %s )', isSelected, i + 1, s.type); 
        });
            
        console.log('[INFO] Downloading video...');
        curStream = streams[options.kstream-1];
            
        console.log('[INFO] Playlists URL: %s (%s)', curStream.url, curStream.type);
      }
        
      if(!options.novids && !dlFailed && curStream !== undefined){
        const streamPlaylistsReq = await this.req.getData(curStream.url);
        if(!streamPlaylistsReq.ok || !streamPlaylistsReq.res){
          console.log('[ERROR] CAN\'T FETCH VIDEO PLAYLISTS!');
          dlFailed = true;
        }
        else{
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
          for(const pl of streamPlaylists.playlists){
            // set quality
            const plResolution     = pl.attributes.RESOLUTION;
            const plResolutionText = `${plResolution.width}x${plResolution.height}`;
            // set codecs
            const plCodecs     = pl.attributes.CODECS;
            // parse uri
            const plUri = new URL(pl.uri);
            let plServer = plUri.hostname;
            // set server list
            if(plUri.searchParams.get('cdn')){
              plServer += ` (${plUri.searchParams.get('cdn')})`;
            }
            if(!plServerList.includes(plServer)){
              plServerList.push(plServer);
            }
            // add to server
            if(!Object.keys(plStreams).includes(plServer)){
              plStreams[plServer] = {};
            }
            if(
              plStreams[plServer][plResolutionText]
                        && plStreams[plServer][plResolutionText] != pl.uri
                        && typeof plStreams[plServer][plResolutionText] != 'undefined'
            ){
              console.log(`[WARN] Non duplicate url for ${plServer} detected, please report to developer!`);
            }
            else{
              plStreams[plServer][plResolutionText] = pl.uri;
            }
            // set plQualityStr
            const plBandwidth  = Math.round(pl.attributes.BANDWIDTH/1024);
            const qualityStrAdd   = `${plResolutionText} (${plBandwidth}KiB/s)`;
            const qualityStrRegx  = new RegExp(qualityStrAdd.replace(/(:|\(|\)|\/)/g, '\\$1'), 'm');
            const qualityStrMatch = !plQuality.map(a => a.str).join('\r\n').match(qualityStrRegx);
            if(qualityStrMatch){
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
            console.log(`[WARN] The requested quality of ${options.q} is greater than the maximun ${plQuality.length}.\n[WARN] Therefor the maximum will be capped at ${plQuality.length}.`);
            quality = plQuality.length;
          }
          // When best selected video quality is already downloaded
          if(dlVideoOnce && options.dlVideoOnce) {
            // Select the lowest resolution with the same codecs
            while(quality !=1 && plQuality[quality - 1].CODECS == plQuality[quality - 2].CODECS) {
              quality--;
            }
          }
          const selPlUrl = plSelectedList[plQuality.map(a => a.dim)[quality - 1]] ? plSelectedList[plQuality.map(a => a.dim)[quality - 1]] : '';
          console.log(`[INFO] Servers available:\n\t${plServerList.join('\n\t')}`);
          console.log(`[INFO] Available qualities:\n\t${plQuality.map((a, ind) => `[${ind+1}] ${a.str}`).join('\n\t')}`);
    
          if(selPlUrl != ''){
            variables.push({
              name: 'height',
              type: 'number',
              replaceWith: quality === 0 ? plQuality[plQuality.length - 1].RESOLUTION.height as number : plQuality[quality - 1].RESOLUTION.height
            }, {
              name: 'width',
              type: 'number',
              replaceWith: quality === 0 ? plQuality[plQuality.length - 1].RESOLUTION.width as number : plQuality[quality - 1].RESOLUTION.width
            });
            const lang = langsData.languages.find(a => a.code === curStream?.audio_lang);
            if (!lang) {
              console.log(`[ERROR] Unable to find language for code ${curStream.audio_lang}`);
              return;
            }
            console.log(`[INFO] Selected quality: ${Object.keys(plSelectedList).find(a => plSelectedList[a] === selPlUrl)} @ ${plSelectedServer}`);
            console.log('[INFO] Stream URL:', selPlUrl);
            // TODO check filename
            fileName = parseFileName(options.fileName, variables, options.numbers, options.override).join(path.sep);
            const outFile = parseFileName(options.fileName + '.' + (mMeta.lang?.name || lang.name), variables, options.numbers, options.override).join(path.sep);
            console.log(`[INFO] Output filename: ${outFile}`);
            const chunkPage = await this.req.getData(selPlUrl);
            if(!chunkPage.ok || !chunkPage.res){
              console.log('[ERROR] CAN\'T FETCH VIDEO PLAYLIST!');
              dlFailed = true;
            }
            else{
              const chunkPlaylist = m3u8(chunkPage.res.body);
              const totalParts = chunkPlaylist.segments.length;
              const mathParts  = Math.ceil(totalParts / options.partsize);
              const mathMsg    = `(${mathParts}*${options.partsize})`;
              console.log('[INFO] Total parts in stream:', totalParts, mathMsg);
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
                  image: medias.image,
                  parent: {
                    title: medias.seasonTitle
                  },
                  title: medias.episodeTitle,
                  language: lang
                }) : undefined
              }).download();
              if(!dlStreamByPl.ok){
                console.log(`[ERROR] DL Stats: ${JSON.stringify(dlStreamByPl.parts)}\n`);
                dlFailed = true;
              }
              files.push({
                type: 'Video',
                path: `${tsFile}.ts`,
                lang: lang
              });
              dlVideoOnce = true;
            }
          }
          else{
            console.log('[ERROR] Quality not selected!\n');
            dlFailed = true;
          }
        }
      }
      else if(options.novids){
        fileName = parseFileName(options.fileName, variables, options.numbers, options.override).join(path.sep);
        console.log('[INFO] Downloading skipped!');
      }
      
        
      if(options.dlsubs.indexOf('all') > -1){
        options.dlsubs = ['all'];
      }
        
      if(options.hslang != 'none'){
        console.log('[WARN] Subtitles downloading disabled for hardsubs streams.');
        options.skipsubs = true;
      }
  
      if(!options.skipsubs && options.dlsubs.indexOf('none') == -1){
        if(pbData.meta.subtitles && Object.values(pbData.meta.subtitles).length > 0){
          const subsData = Object.values(pbData.meta.subtitles);
          const subsDataMapped = subsData.map((s) => {
            const subLang = langsData.fixAndFindCrLC(s.locale);
            return {
              ...s,
              locale: subLang,
              language: subLang.locale
            };
          });
          const subsArr = langsData.sortSubtitles<typeof subsDataMapped[0]>(subsDataMapped, 'language');
          for(const subsIndex in subsArr){
            const subsItem = subsArr[subsIndex];
            const langItem = subsItem.locale;
            const sxData: Partial<sxItem> = {};
            sxData.language = langItem;
            const isCC = langItem.code === audDub;
            sxData.file = langsData.subsFile(fileName as string, subsIndex, langItem, isCC, options.ccTag);
            sxData.path = path.join(this.cfg.dir.content, sxData.file);
            if (files.some(a => a.type === 'Subtitle' && (a.language.cr_locale == langItem.cr_locale || a.language.locale == langItem.locale) && a.cc === isCC))
              continue;
            if(options.dlsubs.includes('all') || options.dlsubs.includes(langItem.locale)){
              const subsAssReq = await this.req.getData(subsItem.url);
              if(subsAssReq.ok && subsAssReq.res){
                let sBody = '\ufeff' + subsAssReq.res.body;
                const sBodySplit = sBody.split('\r\n');
                sBodySplit.splice(2, 0, 'ScaledBorderAndShadow: yes');
                sBody = sBodySplit.join('\r\n');
                sxData.title = sBody.split('\r\n')[1].replace(/^Title: /, '');
                sxData.title = `${langItem.language} / ${sxData.title}`;
                sxData.fonts = fontsData.assFonts(sBody) as Font[];
                fs.writeFileSync(sxData.path, sBody);
                console.log(`[INFO] Subtitle downloaded: ${sxData.file}`);
                files.push({
                  type: 'Subtitle',
                  ...sxData as sxItem,
                  cc: isCC
                });
              }
              else{
                console.log(`[WARN] Failed to download subtitle: ${sxData.file}`);
              }
            }
          }
        }
        else{
          console.log('[WARN] Can\'t find urls for subtitles!');
        }
      }
      else{
        console.log('[INFO] Subtitles downloading skipped!');
      }
    }
    return {
      error: dlFailed,
      data: files,
      fileName: fileName ? (path.isAbsolute(fileName) ? fileName : path.join(this.cfg.dir.content, fileName)) || './unknown' : './unknown'
    };
  }

  public async muxStreams(data: DownloadedMedia[], options: CrunchyMuxOptions) {
    this.cfg.bin = await yamlCfg.loadBinCfg();
    if (options.novids || data.filter(a => a.type === 'Video').length === 0)
      return console.log('[INFO] Skip muxing since no vids are downloaded');
    const merger = new Merger({
      onlyVid: [],
      skipSubMux: options.skipSubMux,
      onlyAudio: [],
      output: `${options.output}.${options.mp4 ? 'mp4' : 'mkv'}`,
      subtitles: data.filter(a => a.type === 'Subtitle').map((a) : SubtitleInput => {
        if (a.type === 'Video')
          throw new Error('Never');
        return {
          file: a.path,
          language: a.language,
          closedCaption: a.cc
        };
      }),
      simul: false,
      fonts: Merger.makeFontsList(this.cfg.dir.fonts, data.filter(a => a.type === 'Subtitle') as sxItem[]),
      videoAndAudio: data.filter(a => a.type === 'Video').map((a) : MergerInput => {
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
    if (bin.MKVmerge) {
      await merger.merge('mkvmerge', bin.MKVmerge);
      isMuxed = true;
    } else if (bin.FFmpeg) {
      await merger.merge('ffmpeg', bin.FFmpeg);
      isMuxed = true;
    } else{
      console.log('\n[INFO] Done!\n');
      return;
    }
    if (isMuxed && !options.nocleanup)
      merger.cleanUp();
  }

  public async listSeriesID(id: string): Promise<{ list: Episode[], data: Record<string, {
    items: CrunchyEpisode[];
    langs: langsData.LanguageItem[];
  }>}> {
    await this.refreshToken(true, true);
    let serieshasversions = true;
    const parsed = await this.parseSeriesById(id);
    if (!parsed)
      return { data: {}, list: [] };
    const result = this.parseSeriesResult(parsed);
    const episodes : Record<string, {
      items: CrunchyEpisode[],
      langs: langsData.LanguageItem[]
    }> = {};
    for(const season of Object.keys(result) as unknown as number[]) {
      for (const key of Object.keys(result[season])) {
        const s = result[season][key];
        (await this.getSeasonDataById(s))?.data?.forEach(episode => {
          //TODO: Make sure the below code is ok
          //Prepare the episode array
          let item;
          const seasonIdentifier = s.identifier ? s.identifier.split('|')[1] : `S${episode.season_number}`;
          if (!(Object.prototype.hasOwnProperty.call(episodes, `${seasonIdentifier}E${episode.episode_number || episode.episode}`))) {
            item = episodes[`${seasonIdentifier}E${episode.episode_number || episode.episode}`] = {
              items: [] as CrunchyEpisode[],
              langs: [] as langsData.LanguageItem[]
            };
          } else {
            item = episodes[`${seasonIdentifier}E${episode.episode_number || episode.episode}`];
          }

          if (episode.versions) {
            //Iterate over episode versions for audio languages
            for (const version of episode.versions) {
              //Make sure there is only one of the same language
              if (!item.langs.find(a => a.cr_locale == version.audio_locale)) {
                //Push to arrays if there is no duplicates of the same language.
                item.items.push(episode);
                item.langs.push(langsData.languages.find(a => a.cr_locale == version.audio_locale) as langsData.LanguageItem);
              }
            }
          } else {
            //Episode didn't have versions, mark it as such to be logged.
            serieshasversions = false;
            //Make sure there is only one of the same language
            if (!item.langs.find(a => a.cr_locale == episode.audio_locale)) {
              //Push to arrays if there is no duplicates of the same language.
              item.items.push(episode);
              item.langs.push(langsData.languages.find(a => a.cr_locale == episode.audio_locale) as langsData.LanguageItem);
            }
          }
        });
      }
    }
  
    const itemIndexes = {
      sp: 1,
      no: 1
    };

    for (const key of Object.keys(episodes)) {
      const item = episodes[key];
      const isSpecial = !item.items[0].episode.match(/^\d+$/);
      episodes[`${isSpecial ? 'S' : 'E'}${itemIndexes[isSpecial ? 'sp' : 'no']}`] = item;
      if (isSpecial)
        itemIndexes.sp++;
      else 
        itemIndexes.no++;
      delete episodes[key];
    }
  
    for (const key of Object.keys(episodes)) {
      const item = episodes[key];
      console.log(`[${key}] ${
        item.items.find(a => !a.season_title.match(/\(\w+ Dub\)/))?.season_title ?? item.items[0].season_title.replace(/\(\w+ Dub\)/g, '').trimEnd()
      } - Season ${item.items[0].season_number} - ${item.items[0].title} [${
        item.items.map((a, index) => {
          return `${a.is_premium_only ? '☆ ' : ''}${item.langs[index].name}`;
        }).join(', ')
      }]`);
    }

    //TODO: Sort episodes to have specials at the end

    if (!serieshasversions) {
      console.log('[WARN] Couldn\'t find versions on some episodes, fell back to old method.');
    }

    return { data: episodes, list: Object.entries(episodes).map(([key, value]) => {
      const images = (value.items[0].images.thumbnail ?? [[ { source: '/notFound.png' } ]])[0];
      const seconds = Math.floor(value.items[0].duration_ms / 1000);
      return {
        e: key.startsWith('E') ? key.slice(1) : key,
        lang: value.langs.map(a => a.code),
        name: value.items[0].title,
        season: value.items[0].season_number.toString(),
        seasonTitle: value.items[0].season_title.replace(/\(\w+ Dub\)/g, '').trimEnd(),
        episode: value.items[0].episode_number?.toString() ?? value.items[0].episode ?? '?',
        id: value.items[0].season_id,
        img: images[Math.floor(images.length / 2)].source,
        description: value.items[0].description,
        time: `${Math.floor(seconds / 60)}:${seconds % 60}`
      };
    })};
  }

  public async downloadFromSeriesID(id: string, data: CurnchyMultiDownload) : Promise<ResponseBase<CrunchyEpMeta[]>> {
    const { data: episodes } = await this.listSeriesID(id);
    console.log();
    console.log('-'.repeat(30));
    console.log();
    const selected = this.itemSelectMultiDub(episodes, data.dubLang, data.but, data.all, data.e);
    for (const key of Object.keys(selected)) {
      const item = selected[key];
      console.log(`[S${item.season}E${item.episodeNumber}] - ${item.episodeTitle} [${
        item.data.map(a => {
          return `✓ ${a.lang?.name || 'Unknown Language'}`;
        }).join(', ')
      }]`);
    }
    return { isOk: true, value: Object.values(selected) };
  }

  public itemSelectMultiDub (eps: Record<string, {
    items: CrunchyEpisode[],
    langs: langsData.LanguageItem[]
  }>, dubLang: string[], but?: boolean, all?: boolean, e?: string, ) {
    const doEpsFilter = parseSelect(e as string);
  
    const ret: Record<string, CrunchyEpMeta> = {};
  
    for (const key of Object.keys(eps)) {
      const itemE = eps[key];
      itemE.items.forEach((item, index) => {
        if (!dubLang.includes(itemE.langs[index].code))
          return;
        item.hide_season_title = true;
        if(item.season_title == '' && item.series_title != ''){
          item.season_title = item.series_title;
          item.hide_season_title = false;
          item.hide_season_number = true;
        }
        if(item.season_title == '' && item.series_title == ''){
          item.season_title = 'NO_TITLE';
        }
        const epNum = key.startsWith('E') ? key.slice(1) : key;
        // set data
        const images = (item.images.thumbnail ?? [[ { source: '/notFound.png' } ]])[0];
        const epMeta: CrunchyEpMeta = {
          data: [
            {
              mediaId: item.id,
              versions: item.versions
            }
          ],
          seasonTitle: itemE.items.find(a => !a.season_title.match(/\(\w+ Dub\)/))?.season_title ?? itemE.items[0].season_title.replace(/\(\w+ Dub\)/g, '').trimEnd(),
          episodeNumber: item.episode,
          episodeTitle: item.title,
          seasonID: item.season_id,
          season: item.season_number,
          showID: item.series_id,
          e: epNum,
          image: images[Math.floor(images.length / 2)].source,
        };
        if (item.streams_link) {
          epMeta.data[0].playback = item.streams_link;
          if(!item.playback) {
            item.playback = item.streams_link;
          }
        }
        // find episode numbers
        if(item.playback && ((but && !doEpsFilter.isSelected([epNum, item.id])) || (all || (doEpsFilter.isSelected([epNum, item.id])) && !but))) {
          if (Object.prototype.hasOwnProperty.call(ret, key)) {
            const epMe = ret[key];
            epMe.data.push({
              lang: itemE.langs[index],
              ...epMeta.data[0]
            });
          } else {
            epMeta.data[0].lang = itemE.langs[index];
            ret[key] = {
              ...epMeta
            };
          }
        }
        // show ep
        item.seq_id = epNum;
      });
    }
    return ret;
  }
  
  public parseSeriesResult (seasonsList: SeriesSearch) : Record<number, Record<string, SeriesSearchItem>> {
    const ret: Record<number, Record<string, SeriesSearchItem>> = {};
    let i = 0;
    for (const item of seasonsList.data) {
      i++;
      for (const lang of langsData.languages) {
        //TODO: Make sure the below code is fine
        let season_number = item.season_number;
        if (item.versions) {
          season_number = i;
        }
        if (!Object.prototype.hasOwnProperty.call(ret, season_number))
          ret[season_number] = {};
        if (item.title.includes(`(${lang.name} Dub)`) || item.title.includes(`(${lang.name})`)) {
          ret[season_number][lang.code] = item;
        } else if (item.is_subbed && !item.is_dubbed && lang.code == 'jpn') {
          ret[season_number][lang.code] = item;
        } else if (item.is_dubbed && lang.code === 'eng' && !langsData.languages.some(a => item.title.includes(`(${a.name})`) || item.title.includes(`(${a.name} Dub)`))) { // Dubbed with no more infos will be treated as eng dubs
          ret[season_number][lang.code] = item;
        }
      }
    }
    return ret;
  }
  
  public async parseSeriesById(id: string) {
    if(!this.cmsToken.cms){
      console.log('[ERROR] Authentication required!');
      return;
    }

    const AuthHeaders = {
      headers: {
        Authorization: `Bearer ${this.token.access_token}`,
      },
      useProxy: true
    };

    // seasons list
    const seriesSeasonListReq = await this.req.getData(`${api.cms}/series/${id}/seasons?preferred_audio_language=ja-JP`, AuthHeaders);
    if(!seriesSeasonListReq.ok || !seriesSeasonListReq.res){
      console.log('[ERROR] Series Request FAILED!');
      return;
    }
    // parse data
    const seasonsList = JSON.parse(seriesSeasonListReq.res.body) as SeriesSearch;
    if(seasonsList.total < 1){
      console.log('[INFO] Series is empty!');
      return;
    }
    return seasonsList;
  }
  
  public async getSeasonDataById(item: SeriesSearchItem, log = false){
    if(!this.cmsToken.cms){
      console.log('[ERROR] Authentication required!');
      return;
    }

    const AuthHeaders = {
      headers: {
        Authorization: `Bearer ${this.token.access_token}`,
      },
      useProxy: true
    };

    //get show info
    const showInfoReq = await this.req.getData(`${api.cms}/seasons/${item.id}?preferred_audio_language=ja-JP`, AuthHeaders);
    if(!showInfoReq.ok || !showInfoReq.res){
      console.log('[ERROR] Show Request FAILED!');
      return;
    }
    const showInfo = JSON.parse(showInfoReq.res.body);
    if (log)
      this.logObject(showInfo, 0);
    //get episode info
    const reqEpsList = await this.req.getData(`${api.cms}/seasons/${item.id}/episodes?preferred_audio_language=ja-JP`, AuthHeaders);
    if(!reqEpsList.ok || !reqEpsList.res){
      console.log('[ERROR] Episode List Request FAILED!');
      return;
    }
    const episodeList = JSON.parse(reqEpsList.res.body) as CrunchyEpisodeList;
      
    if(episodeList.total < 1){
      console.log('  [INFO] Season is empty!');
      return;
    }
    return episodeList;
  }

}