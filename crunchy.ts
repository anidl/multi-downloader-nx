#!/usr/bin/env node

// build-in
import path from 'path';
import fs from 'fs-extra';

// package program
import packageJson from './package.json';
console.log(`\n=== Crunchyroll Beta Downloader NX ${packageJson.version} ===\n`);

// plugins
import shlp from 'sei-helper';
import m3u8 from 'm3u8-parsed';
import streamdl from 'hls-download';

// custom modules
import * as fontsData from './modules/module.fontsData';
import * as langsData from './modules/module.langsData';
import * as yamlCfg from './modules/module.cfg-loader';
import * as yargs from './modules/module.app-args';
import * as epsFilter from './modules/module.eps-filter';
import Merger, { Font } from './modules/module.merger';

// new-cfg paths
const cfg = yamlCfg.loadCfg();
let token = yamlCfg.loadCRToken();
let cmsToken: {
  cms?: Record<string, string> 
} = {};

export type sxItem = {
  language: langsData.LanguageItem,
  path: string,
  file: string
  title: string,
  fonts: Font[]
}

// args
const argv = yargs.appArgv(cfg.cli);
const appstore: {
  fn: Variable[],
  isBatch: boolean,
  out?: string,
  sxList: sxItem[],
  lang?: string
} = {
  fn: [],
  isBatch: false,
  sxList: []
};

// load req
import { domain, api } from './modules/module.api-urls';
import * as reqModule from './modules/module.req';
import { CrunchySearch } from './@types/crunchySearch';
import { CrunchyEpisodeList } from './@types/crunchyEpisodeList';
import { CrunchyEpMeta, ParseItem } from './@types/crunchyTypes';
import { ObjectInfo } from './@types/objectInfo';
import parseFileName, { Variable } from './modules/module.filename';
import { PlaybackData } from './@types/playbackData';
const req = new reqModule.Req(domain, argv);

// select
export default (async () => {
  // load binaries
  cfg.bin = await yamlCfg.loadBinCfg();
  // select mode
  if(argv.dlfonts){
    await getFonts();
  }
  else if(argv.auth){
    await doAuth();
  }
  else if(argv.cmsindex){
    await refreshToken();
    await getCmsData();
  }
  else if(argv.new){
    await refreshToken();
    await getNewlyAdded();
  }
  else if(argv.search && argv.search.length > 2){
    await refreshToken();
    await doSearch();
  }
  else if(argv.series && argv.series.match(/^[0-9A-Z]{9}$/)){
    await refreshToken();
    await getSeriesById();
  }
  else if(argv['movie-listing'] && argv['movie-listing'].match(/^[0-9A-Z]{9}$/)){
    await refreshToken();
    await getMovieListingById();
  }
  else if(argv.s && argv.s.match(/^[0-9A-Z]{9}$/)){
    await refreshToken();
    await getSeasonById();
  }
  else if(argv.e){
    await refreshToken();
    await getObjectById();
  }
  else{
    yargs.showHelp();
  }
});

// get cr fonts
async function getFonts(){
  console.log('[INFO] Downloading fonts...');
  for(const f of Object.keys(fontsData.fonts)){
    const fontFile = fontsData.fonts[f as fontsData.AvailableFonts];
    const fontLoc  = path.join(cfg.dir.fonts, fontFile);
    if(fs.existsSync(fontLoc) && fs.statSync(fontLoc).size != 0){
      console.log(`[INFO] ${f} (${fontFile}) already downloaded!`);
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
      const fontUrl = fontsData.root + fontFile;
      const getFont = await req.getData<Buffer>(fontUrl, { binary: true });
      if(getFont.ok && getFont.res){
        fs.writeFileSync(fontLoc, getFont.res.body);
        console.log(`[INFO] Downloaded: ${f} (${fontFile})`);
      }
      else{
        console.log(`[WARN] Failed to download: ${f} (${fontFile})`);
      }
    }
  }
  console.log('[INFO] All required fonts downloaded!');
}

// auth method
async function doAuth(){
  const iLogin = await shlp.question('[Q] LOGIN/EMAIL');
  const iPsswd = await shlp.question('[Q] PASSWORD   ');
  const authData = new URLSearchParams({
    'username': iLogin,
    'password': iPsswd,
    'grant_type': 'password',
    'scope': 'offline_access'
  }).toString();
  const authReqOpts: reqModule.Params = {
    method: 'POST',
    headers: api.beta_authHeaderMob,
    body: authData
  };
  const authReq = await req.getData(api.beta_auth, authReqOpts);
  if(!authReq.ok || !authReq.res){
    console.log('[ERROR] Authentication failed!');
    return;
  }
  token = JSON.parse(authReq.res.body);
  token.expires = new Date(Date.now() + token.expires_in);
  yamlCfg.saveCRToken(token);
  await getProfile();
  console.log('[INFO] Your Country: %s', token.country);
}

async function getProfile(){
  if(!token.access_token){
    console.log('[ERROR] No access token!');
    return;
  }
  const profileReqOptions = {
    headers: {
      Authorization: `Bearer ${token.access_token}`,
    },
    useProxy: true
  };
  const profileReq = await req.getData(api.beta_profile, profileReqOptions);
  if(!profileReq.ok || !profileReq.res){
    console.log('[ERROR] Get profile failed!');
    return;
  }
  const profile = JSON.parse(profileReq.res.body);
  console.log('[INFO] USER: %s (%s)', profile.username, profile.email);
}

// auth method
async function doAnonymousAuth(){
  const authData = new URLSearchParams({
    'grant_type': 'client_id',
    'scope': 'offline_access',
  }).toString();
  const authReqOpts: reqModule.Params = {
    method: 'POST',
    headers: api.beta_authHeaderMob,
    body: authData
  };
  const authReq = await req.getData(api.beta_auth, authReqOpts);
  if(!authReq.ok || !authReq.res){
    console.log('[ERROR] Authentication failed!');
    return;
  }
  token = JSON.parse(authReq.res.body);
  token.expires = new Date(Date.now() + token.expires_in);
  yamlCfg.saveCRToken(token);
}

// refresh token
async function refreshToken(){
  if(!token.access_token && !token.refresh_token || token.access_token && !token.refresh_token){
    await doAnonymousAuth();
  }
  else{
    if(Date.now() > new Date(token.expires).getTime()){
      // return;
    }
    const authData = new URLSearchParams({
      'refresh_token': token.refresh_token,
      'grant_type': 'refresh_token',
      'scope': 'offline_access'
    }).toString();
    const authReqOpts: reqModule.Params = {
      method: 'POST',
      headers: api.beta_authHeaderMob,
      body: authData
    };
    const authReq = await req.getData(api.beta_auth, authReqOpts);
    if(!authReq.ok || !authReq.res){
      console.log('[ERROR] Authentication failed!');
      return;
    }
    token = JSON.parse(authReq.res.body);
    token.expires = new Date(Date.now() + token.expires_in);
    yamlCfg.saveCRToken(token);
  }
  if(token.refresh_token){
    await getProfile();
  }
  else{
    console.log('[INFO] USER: Anonymous');
  }
  await getCMStoken();
}

async function getCMStoken(){
  if(!token.access_token){
    console.log('[ERROR] No access token!');
    return;
  }
  const cmsTokenReqOpts = {
    headers: {
      Authorization: `Bearer ${token.access_token}`,
    },
    useProxy: true
  };
  const cmsTokenReq = await req.getData(api.beta_cmsToken, cmsTokenReqOpts);
  if(!cmsTokenReq.ok || !cmsTokenReq.res){
    console.log('[ERROR] Authentication CMS token failed!');
    return;
  }
  cmsToken = JSON.parse(cmsTokenReq.res.body);
  console.log('[INFO] Your Country: %s\n', cmsToken.cms?.bucket.split('/')[1]);
}

async function getCmsData(){
  // check token
  if(!cmsToken.cms){
    console.log('[ERROR] Authentication required!');
    return;
  }
  // opts
  const indexReqOpts = [
    api.beta_cms,
    cmsToken.cms.bucket,
    '/index?',
    new URLSearchParams({
      'Policy': cmsToken.cms.policy,
      'Signature': cmsToken.cms.signature,
      'Key-Pair-Id': cmsToken.cms.key_pair_id,
    }),
  ].join('');
  const indexReq = await req.getData(indexReqOpts);
  if(!indexReq.ok || ! indexReq.res){
    console.log('[ERROR] Get CMS index FAILED!');
    return;
  }
  console.log(JSON.parse(indexReq.res.body));
}

async function doSearch(){
  if(!token.access_token){
    console.log('[ERROR] Authentication required!');
    return;
  }
  const searchReqOpts = {
    headers: {
      Authorization: `Bearer ${token.access_token}`,
    },
    useProxy: true
  };
  const searchParams = new URLSearchParams({
    q: argv.search as string,
    n: '5',
    start: argv.page ? `${(argv.page-1)*5}` : '0',
    type: argv['search-type'],
    locale: argv['search-locale'],
  }).toString();
  const searchReq = await req.getData(`${api.beta_search}?${searchParams}`, searchReqOpts);
  if(!searchReq.ok || ! searchReq.res){
    console.log('[ERROR] Search FAILED!');
    return;
  }
  const searchResults = JSON.parse(searchReq.res.body) as CrunchySearch;
  if(searchResults.total < 1){
    console.log('[INFO] Nothing Found!');
    return;
  }
  const searchTypesInfo = {
    'top_results':   'Top results',
    'series':        'Found series',
    'movie_listing': 'Found movie lists',
    'episode':       'Found episodes'
  };
  for(const search_item of searchResults.items){
    console.log('[INFO] %s:', searchTypesInfo[search_item.type as keyof typeof searchTypesInfo]);
    // calculate pages
    const itemPad = parseInt(new URL(search_item.__href__, domain.api_beta).searchParams.get('start') || '');
    const pageCur = itemPad > 0 ? Math.ceil(itemPad/5) + 1 : 1;
    const pageMax = Math.ceil(search_item.total/5);
    // pages per category
    if(search_item.total < 1){
      console.log('  [INFO] Nothing Found...');
    }
    if(search_item.total > 0){
      if(pageCur > pageMax){
        console.log('  [INFO] Last page is %s...', pageMax);
        continue;
      }
      for(const item of search_item.items){
        await parseObject(item);
      }
      console.log(`  [INFO] Total results: ${search_item.total} (Page: ${pageCur}/${pageMax})`);
    }
  }
}

async function parseObject(item: ParseItem, pad?: number, getSeries?: boolean, getMovieListing?: boolean){
  if(argv.debug){
    console.log(item);
  }
  pad = pad || 2;
  getSeries = getSeries === undefined ? true : getSeries;
  getMovieListing = getMovieListing === undefined ? true : getMovieListing;
  item.isSelected = item.isSelected === undefined ? false : item.isSelected;
  if(!item.type) {
    item.type = item.__class__;
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
    // set object booleans
  if(iMetadata.duration_ms){
    oBooleans.push(shlp.formatTime(iMetadata.duration_ms/1000));
  }
  if(iMetadata.is_simulcast){
    oBooleans.push('SIMULCAST');
  }
  if(iMetadata.is_mature){
    oBooleans.push('MATURE');
  }
  if(iMetadata.is_subbed){
    oBooleans.push('SUB');
  }
  if(iMetadata.is_dubbed){
    oBooleans.push('DUB');
  }
  if(item.playback && item.type != 'movie_listing'){
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
  if(iMetadata.subtitle_locales && iMetadata.subtitle_locales.length > 0){
    console.log(
      '%s- Subtitles: %s',
      ''.padStart(pad + 2, ' '),
      langsData.parseSubtitlesArray(iMetadata.subtitle_locales)
    );
  }
  if(item.availability_notes && argv.shownotes){
    console.log(
      '%s- Availability notes: %s',
      ''.padStart(pad + 2, ' '),
      item.availability_notes.replace(/\[[^\]]*\]?/gm, '')
    );
  }
  if(item.type == 'series' && getSeries){
    argv.series = item.id;
    await getSeriesById(pad, true);
  }
  if(item.type == 'movie_listing' && getMovieListing){
    argv['movie-listing'] = item.id;
    await getMovieListingById(pad+2);
  }
}

async function getSeriesById(pad?: number, hideSeriesTitle?: boolean){
  // parse
  pad = pad || 0;
  hideSeriesTitle = hideSeriesTitle !== undefined ? hideSeriesTitle : false;
  // check token
  if(!cmsToken.cms){
    console.log('[ERROR] Authentication required!');
    return;
  }
  // opts
  const seriesReqOpts = [
    api.beta_cms,
    cmsToken.cms.bucket,
    '/series/',
    argv.series,
    '?',
    new URLSearchParams({
      'Policy': cmsToken.cms.policy,
      'Signature': cmsToken.cms.signature,
      'Key-Pair-Id': cmsToken.cms.key_pair_id,
    }),
  ].join('');
  const seriesSeasonListReqOpts = [
    api.beta_cms,
    cmsToken.cms.bucket,
    '/seasons?',
    new URLSearchParams({
      'series_id': argv.series as string,
      'Policy': cmsToken.cms.policy,
      'Signature': cmsToken.cms.signature,
      'Key-Pair-Id': cmsToken.cms.key_pair_id,
    }),
  ].join('');
    // reqs
  if(!hideSeriesTitle){
    const seriesReq = await req.getData(seriesReqOpts);
    if(!seriesReq.ok || !seriesReq.res){
      console.log('[ERROR] Series Request FAILED!');
      return;
    }
    const seriesData = JSON.parse(seriesReq.res.body);
    await parseObject(seriesData, pad, false);
  }
  // seasons list
  const seriesSeasonListReq = await req.getData(seriesSeasonListReqOpts);
  if(!seriesSeasonListReq.ok || !seriesSeasonListReq.res){
    console.log('[ERROR] Series Request FAILED!');
    return;
  }
  // parse data
  const seasonsList = JSON.parse(seriesSeasonListReq.res.body);
  if(seasonsList.total < 1){
    console.log('[INFO] Series is empty!');
    return;
  }
  for(const item of seasonsList.items){
    await parseObject(item, pad+2);
  }
}

async function getMovieListingById(pad?: number){
  pad = pad || 2;
  if(!cmsToken.cms){
    console.log('[ERROR] Authentication required!');
    return;
  }
  const movieListingReqOpts = [
    api.beta_cms,
    cmsToken.cms.bucket,
    '/movies?',
    new URLSearchParams({
      'movie_listing_id': argv['movie-listing'] as string,
      'Policy': cmsToken.cms.policy,
      'Signature': cmsToken.cms.signature,
      'Key-Pair-Id': cmsToken.cms.key_pair_id,
    }),
  ].join('');
  const movieListingReq = await req.getData(movieListingReqOpts);
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
    parseObject(item, pad);
  }
}

async function getNewlyAdded(){
  if(!token.access_token){
    console.log('[ERROR] Authentication required!');
    return;
  }
  const newlyAddedReqOpts = {
    headers: {
      Authorization: `Bearer ${token.access_token}`,
    },
    useProxy: true
  };
  const newlyAddedParams = new URLSearchParams({
    sort_by: 'newly_added',
    n: '25',
    start: (argv.page ? (argv.page-1)*25 : 0).toString(),
  }).toString();
  const newlyAddedReq = await req.getData(`${api.beta_browse}?${newlyAddedParams}`, newlyAddedReqOpts);
  if(!newlyAddedReq.ok || !newlyAddedReq.res){
    console.log('[ERROR] Get newly added FAILED!');
    return;
  }
  const newlyAddedResults = JSON.parse(newlyAddedReq.res.body);
  console.log('[INFO] Newly added:');
  for(const i of newlyAddedResults.items){
    await parseObject(i, 2);
  }
  // calculate pages
  const itemPad = parseInt(new URL(newlyAddedResults.__href__, domain.api_beta).searchParams.get('start') as string);
  const pageCur = itemPad > 0 ? Math.ceil(itemPad/5) + 1 : 1;
  const pageMax = Math.ceil(newlyAddedResults.total/5);
  console.log(`  [INFO] Total results: ${newlyAddedResults.total} (Page: ${pageCur}/${pageMax})`);
}

async function getSeasonById(){
  if(!cmsToken.cms){
    console.log('[ERROR] Authentication required!');
    return;
  }
    
  const showInfoReqOpts = [
    api.beta_cms,
    cmsToken.cms.bucket,
    '/seasons/',
    argv.s,
    '?',
    new URLSearchParams({
      'Policy': cmsToken.cms.policy,
      'Signature': cmsToken.cms.signature,
      'Key-Pair-Id': cmsToken.cms.key_pair_id,
    }),
  ].join('');
  const showInfoReq = await req.getData(showInfoReqOpts);
  if(!showInfoReq.ok || !showInfoReq.res){
    console.log('[ERROR] Show Request FAILED!');
    return;
  }
  const showInfo = JSON.parse(showInfoReq.res.body);
  parseObject(showInfo, 0);
  const reqEpsListOpts = [
    api.beta_cms,
    cmsToken.cms.bucket,
    '/episodes?',
    new URLSearchParams({
      'season_id': argv.s as string,
      'Policy': cmsToken.cms.policy,
      'Signature': cmsToken.cms.signature,
      'Key-Pair-Id': cmsToken.cms.key_pair_id,
    }),
  ].join('');
  const reqEpsList = await req.getData(reqEpsListOpts);
  if(!reqEpsList.ok || !reqEpsList.res){
    console.log('[ERROR] Episode List Request FAILED!');
    return;
  }
  const episodeList = JSON.parse(reqEpsList.res.body) as CrunchyEpisodeList;
    
  const epNumList: {
      ep: number[],
      sp: number
    } = { ep: [], sp: 0 };
  const epNumLen = epsFilter.epNumLen;
    
  if(episodeList.total < 1){
    console.log('  [INFO] Season is empty!');
    return;
  }
    
  const doEpsFilter = new epsFilter.doFilter();
  const selEps = doEpsFilter.checkFilter(argv.e);
  const selectedMedia: CrunchyEpMeta[] = [];
    
  episodeList.items.forEach((item) => {
    item.hide_season_title = true;
    if(item.season_title == '' && item.series_title != ''){
      item.season_title = item.series_title;
      item.hide_season_title = false;
      item.hide_season_number = true;
    }
    if(item.season_title == '' && item.series_title == ''){
      item.season_title = 'NO_TITLE';
    }
    // set data
    const epMeta: CrunchyEpMeta = {
      mediaId:       item.id,
      seasonTitle:   item.season_title,
      episodeNumber: item.episode,
      episodeTitle:  item.title,
      seasonID: item.season_id
    };
    if(item.playback){
      epMeta.playback = item.playback;
    }
    // find episode numbers
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
        ? 'S' + epNumList.sp.toString().padStart(epNumLen['S'], '0')
        : ''  + parseInt(epNum, 10).toString().padStart(epNumLen['E'], '0')
    );
    if(selEps.indexOf(selEpId) > -1 && !item.isSelected && item.playback){
      selectedMedia.push(epMeta);
      item.isSelected = true;
    }
    // show ep
    item.seq_id = selEpId;
    parseObject(item);
  });
    
  // display
  if(selectedMedia.length < 1){
    console.log('\n[INFO] Episodes not selected!\n');
    return;
  }
    
  if(selectedMedia.length > 1){
    appstore.isBatch = true;
  }
    
  console.log();
  for(const media of selectedMedia){
    await getMedia(media);
  }
    
}

async function getObjectById(returnData?: boolean){
  if(!cmsToken.cms){
    console.log('[ERROR] Authentication required!');
    return;
  }
    
  const doEpsFilter = new epsFilter.doFilter();
  const inpMedia = doEpsFilter.checkBetaFilter(argv.e as string);
    
  if(inpMedia.length < 1){
    console.log('\n[INFO] Objects not selected!\n');
    return;
  }
    
  // node crunchy-beta -e G6497Z43Y,GRZXCMN1W,G62PEZ2E6,G25FVGDEK,GZ7UVPVX5
  console.log('[INFO] Requested object ID: %s', inpMedia.join(', '));
    
  const objectReqOpts = [
    api.beta_cms,
    cmsToken.cms.bucket,
    '/objects/',
    inpMedia.join(','),
    '?',
    new URLSearchParams({
      'Policy': cmsToken.cms.policy,
      'Signature': cmsToken.cms.signature,
      'Key-Pair-Id': cmsToken.cms.key_pair_id,
    }),
  ].join('');
  const objectReq = await req.getData(objectReqOpts);
  if(!objectReq.ok || !objectReq.res){
    console.log('[ERROR] Objects Request FAILED!');
    if(objectReq.error && objectReq.error.res && objectReq.error.res.body){
      const objectInfo = JSON.parse(objectReq.error.res.body as string);
      console.log('[INFO] Body:', JSON.stringify(objectInfo, null, '\t'));
      objectInfo.error = true;
      return objectInfo;
    }
    return { error: true };
  }
    
  const objectInfo = JSON.parse(objectReq.res.body) as ObjectInfo;
  if(returnData){
    return objectInfo;
  }
    
  const selectedMedia = [];
    
  for(const item of objectInfo.items){
    if(item.type != 'episode' && item.type != 'movie'){
      await parseObject(item, 2, true, false);
      continue;
    }
    const epMeta: Partial<CrunchyEpMeta> = {};
    switch (item.type) {
    case 'episode':
      item.s_num = 'S:' + item.episode_metadata.season_id;
      epMeta.mediaId = 'E:'+ item.id;
      epMeta.seasonTitle = item.episode_metadata.season_title;
      epMeta.episodeNumber = item.episode_metadata.episode;
      epMeta.episodeTitle = item.title;
      break;
    case 'movie':
      item.f_num = 'F:' + item.movie_metadata?.movie_listing_id;
      epMeta.mediaId = 'M:'+ item.id;
      epMeta.seasonTitle = item.movie_metadata?.movie_listing_title;
      epMeta.episodeNumber = 'Movie';
      epMeta.episodeTitle = item.title;
      break;
    }
    if(item.playback){
      epMeta.playback = item.playback;
      selectedMedia.push(epMeta);
      item.isSelected = true;
    }
    await parseObject(item, 2);
  }
    
  if(selectedMedia.length > 1){
    appstore.isBatch = true;
  }
    
  console.log();
  for(const media of selectedMedia){
    await getMedia(media as CrunchyEpMeta);
  }
    
}

async function getMedia(mMeta: CrunchyEpMeta){
    
  let mediaName = '...';
  if(mMeta.seasonTitle && mMeta.episodeNumber && mMeta.episodeTitle){
    mediaName = `${mMeta.seasonTitle} - ${mMeta.episodeNumber} - ${mMeta.episodeTitle}`;
  }
    
  console.log(`[INFO] Requesting: [${mMeta.mediaId}] ${mediaName}`);
    
  if(!mMeta.playback){
    console.log('[WARN] Video not available!');
    return;
  }
    
  const playbackReq = await req.getData(mMeta.playback);
    
  if(!playbackReq.ok || !playbackReq.res){
    console.log('[ERROR] Request Stream URLs FAILED!');
    return;
  }
    
  const pbData = JSON.parse(playbackReq.res.body) as PlaybackData;

  appstore.fn = ([
    ['title', mMeta.episodeTitle],
    ['episode', mMeta.episodeNumber],
    ['service', 'Crunchyroll'],
    ['showTitle', mMeta.seasonTitle],
    ['season', mMeta.seasonID]
  ] as [yargs.AvailableFilenameVars, string|number][]).map((a): Variable => {
    return {
      name: a[0],
      replaceWith: a[1],
      type: typeof a[1]
    } as Variable;
  });

  let streams = [];
  let hsLangs: string[] = [];
  const pbStreams = pbData.streams;
    
  for(const s of Object.keys(pbStreams)){
    if(s.match(/hls/) && !s.match(/drm/) && !s.match(/trailer/)){
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
    return;
  }
    
  const audDub = langsData.findLang(langsData.fixLanguageTag(pbData.audio_locale)).code;
  hsLangs = langsData.sortTags(hsLangs);
    
  streams = streams.map((s) => {
    s.audio_lang = audDub;
    s.hardsub_lang = s.hardsub_lang ? s.hardsub_lang : '-';
    s.type = `${s.format}/${s.audio_lang}/${s.hardsub_lang}`;
    return s;
  });
    
  let dlFailed = false;
    
  if(argv.hslang != 'none'){
    if(hsLangs.indexOf(argv.hslang) > -1){
      console.log('[INFO] Selecting stream with %s hardsubs', langsData.locale2language(argv.hslang).language);
      streams = streams.filter((s) => {
        if(s.hardsub_lang == '-'){
          return false;
        }
        return s.hardsub_lang == argv.hslang ? true : false;
      });
    }
    else{
      console.log('[WARN] Selected stream with %s hardsubs not available', langsData.locale2language(argv.hslang).language);
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
    
  let curStream;
  if(!dlFailed){
    argv.kstream = typeof argv.kstream == 'number' ? argv.kstream : 1;
    argv.kstream = argv.kstream > streams.length ? 1 : argv.kstream;
        
    streams.forEach((s, i) => {
      const isSelected = argv.kstream == i + 1 ? '✓' : ' ';
      console.log('[INFO] Full stream found! (%s%s: %s )', isSelected, i + 1, s.type); 
    });
        
    console.log('[INFO] Downloading video...');
    curStream = streams[argv.kstream-1];
    if(argv.dubLang != curStream.audio_lang){
      argv.dubLang = curStream.audio_lang as string;
      console.log(`[INFO] audio language code detected, setted to ${curStream.audio_lang} for this episode`);
    }
        
    console.log('[INFO] Playlists URL: %s (%s)', curStream.url, curStream.type);
  }
    
  if(!argv.skipdl && !dlFailed && curStream){
    const streamPlaylistsReq = await req.getData(curStream.url);
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
                  RESOLUTION: {
                    width: number,
                    height: number
                  }
                }[] = [];
      for(const pl of streamPlaylists.playlists){
        // set quality
        const plResolution     = pl.attributes.RESOLUTION;
        const plResolutionText = `${plResolution.width}x${plResolution.height}`;
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
            RESOLUTION: plResolution
          });
        }
      }
            
      argv.server = argv.x > plServerList.length ? 1 : argv.x;
            
      const plSelectedServer = plServerList[argv.x - 1];
      const plSelectedList   = plStreams[plSelectedServer];
      plQuality.sort((a, b) => {
        const aMatch = a.dim.match(/[0-9]+/) || [];
        const bMatch = b.dim.match(/[0-9]+/) || [];
        return parseInt(aMatch[0]) - parseInt(bMatch[0]);
      });
      let quality = argv.q;
      if (quality > plQuality.length) {
        console.log(`[WARN] The requested quality of ${argv.q} is greater than the maximun ${plQuality.length}.\n[WARN] Therefor the maximum will be capped at ${plQuality.length}.`);
        quality = plQuality.length;
      }
      const selPlUrl = quality === 0 ? plSelectedList[plQuality.pop()?.dim as string] :
        plSelectedList[plQuality.map(a => a.dim)[quality - 1]] ? plSelectedList[plQuality.map(a => a.dim)[quality - 1]] : '';
      console.log(`[INFO] Servers available:\n\t${plServerList.join('\n\t')}`);
      console.log(`[INFO] Available qualities:\n\t${plQuality.map((a, ind) => `[${ind+1}] ${a.str}`).join('\n\t')}`);

      if(selPlUrl != ''){
        appstore.fn.push({
          name: 'height',
          type: 'number',
          replaceWith: quality === 0 ? plQuality.pop()?.RESOLUTION.height as number : plQuality[quality - 1].RESOLUTION.height
        }, {
          name: 'width',
          type: 'number',
          replaceWith: quality === 0 ? plQuality.pop()?.RESOLUTION.width as number : plQuality[quality - 1].RESOLUTION.width
        });
        appstore.lang = curStream.audio_lang;
        console.log(`[INFO] Selected quality: ${Object.keys(plSelectedList).find(a => plSelectedList[a] === selPlUrl)} @ ${plSelectedServer}`);
        if(argv['show-stream-url']){
          console.log('[INFO] Stream URL:', selPlUrl);
        }
        // TODO check filename
        appstore.out = parseFileName(argv.fileName, appstore.fn, argv.numbers).join(path.sep);
        console.log(`[INFO] Output filename: ${appstore.out}`);
        const chunkPage = await req.getData(selPlUrl);
        if(!chunkPage.ok || !chunkPage.res){
          console.log('[ERROR] CAN\'T FETCH VIDEO PLAYLIST!');
          dlFailed = true;
        }
        else{
          const chunkPlaylist = m3u8(chunkPage.res.body);
          const totalParts = chunkPlaylist.segments.length;
          const mathParts  = Math.ceil(totalParts / argv.partsize);
          const mathMsg    = `(${mathParts}*${argv.partsize})`;
          console.log('[INFO] Total parts in stream:', totalParts, mathMsg);
          const tsFile = path.isAbsolute(appstore.out as string) ? appstore.out : path.join(cfg.dir.content, appstore.out);
          const split = appstore.out.split(path.sep).slice(0, -1);
          split.forEach((val, ind, arr) => {
            const isAbsolut = path.isAbsolute(appstore.out as string);
            if (!fs.existsSync(path.join(isAbsolut ? '' : cfg.dir.content, ...arr.slice(0, ind), val)))
              fs.mkdirSync(path.join(isAbsolut ? '' : cfg.dir.content, ...arr.slice(0, ind), val));
          });
          const streamdlParams = {
            fn: `${tsFile}.ts`,
            m3u8json: chunkPlaylist,
            // baseurl: chunkPlaylist.baseUrl,
            pcount: argv.tsparts,
            partsOffset: 0,
          };
          const dlStreamByPl = await new streamdl(streamdlParams).download();
          if(!dlStreamByPl.ok){
            console.log(`[ERROR] DL Stats: ${JSON.stringify(dlStreamByPl.parts)}\n`);
            dlFailed = true;
          }
        }
      }
      else{
        console.log('[ERROR] Quality not selected!\n');
        dlFailed = true;
      }
    }
  }
  else if(argv.skipdl){
    console.log('[INFO] Downloading skipped!');
  }
    
  appstore.sxList = [];
    
  if(argv.dlsubs.indexOf('all') > -1){
    argv.dlsubs = ['all'];
  }
    
  if(argv.hslang != 'none'){
    console.log('[WARN] Subtitles downloading disabled for hardsubs streams.');
    argv.skipsubs = true;
  }


  if(!argv.skipsubs && argv.dlsubs.indexOf('none') == -1){
    if(pbData.subtitles && Object.values(pbData.subtitles).length > 0){
      const subsData = Object.values(pbData.subtitles);
      const subsDataMapped = subsData.map((s) => {
        const subLang = langsData.fixAndFindCrLC(s.locale);
        return {
          ...s,
          locale: subLang,
          language: subLang.locale,
          titile: subLang.language
        };
      });
      const subsArr = langsData.sortSubtitles<typeof subsDataMapped[0]>(subsDataMapped, 'language');
      for(const subsIndex in subsArr){
        const subsItem = subsArr[subsIndex];
        const langItem = subsItem.locale;
        const sxData: Partial<sxItem> = {};
        sxData.language = langItem;
        sxData.file = langsData.subsFile(appstore.out as string, subsIndex, langItem);
        sxData.path = path.join(cfg.dir.content, sxData.file);
        if(argv.dlsubs.includes('all') || argv.dlsubs.includes(langItem.locale)){
          const subsAssReq = await req.getData(subsItem.url);
          if(subsAssReq.ok && subsAssReq.res){
            const sBody = '\ufeff' + subsAssReq.res.body;
            sxData.title = sBody.split('\r\n')[1].replace(/^Title: /, '');
            sxData.title = `${langItem.language} / ${sxData.title}`;
            sxData.fonts = fontsData.assFonts(sBody) as Font[];
            fs.writeFileSync(path.join(cfg.dir.content, sxData.file), sBody);
            console.log(`[INFO] Subtitle downloaded: ${sxData.file}`);
            appstore.sxList.push(sxData as sxItem);
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
    
  // go to muxing
  if(!argv.skipmux && !dlFailed){
    await muxStreams();
  }
  else{
    console.log();
  }
    
}

async function muxStreams(){
  const merger = new Merger({
    onlyAudio: [],
    onlyVid: [],
    videoAndAudio: [{
      path: (path.isAbsolute(appstore.out as string) ? appstore.out as string : path.join(cfg.dir.content, appstore.out as string)) + '.ts',
      lang: appstore.lang as string,
      lookup: false
    }],
    subtitels: appstore.sxList.map(a => ({
      language: a.language.code,
      file: a.path,
      lookup: false,
      title: a.title
    })),
    output: (path.isAbsolute(appstore.out as string) ? appstore.out as string : path.join(cfg.dir.content, appstore.out as string)) + '.' + (argv.mp4 ? 'mp4' : 'mkv'),
    simul: false,
    fonts: Merger.makeFontsList(cfg.dir.fonts, appstore.sxList)
  });
  const bin = Merger.checkMerger(cfg.bin, argv.mp4);
  // collect fonts info
  // mergers
  let isMuxed = false;
  if (bin.MKVmerge) {
    const command = merger.MkvMerge();
    shlp.exec('mkvmerge', `"${bin.MKVmerge}"`, command);
    isMuxed = true;
  } else if (bin.FFmpeg) {
    const command = merger.FFmpeg();
    shlp.exec('ffmpeg', `"${bin.FFmpeg}"`, command);
    isMuxed = true;
  } else{
    console.log('\n[INFO] Done!\n');
    return;
  }
  if (isMuxed)
    merger.cleanUp();
}