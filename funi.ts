// modules build-in
import fs from 'fs';
import path from 'path';

// package json
import packageJson from './package.json';

// modules extra
import { console } from './modules/log';
import * as shlp from 'sei-helper';
import m3u8 from 'm3u8-parsed';
import hlsDownload, { HLSCallback } from './modules/hls-download';

// extra
import * as appYargs from './modules/module.app-args';
import * as yamlCfg from './modules/module.cfg-loader';
import vttConvert from './modules/module.vttconvert';

// types
import type { Item } from './@types/items.js';

// params

// Import modules after argv has been exported
import getData from './modules/module.getdata';
import merger from './modules/module.merger';
import parseSelect from './modules/module.parseSelect';
import { EpisodeData, MediaChild } from './@types/episode';
import { Subtitle } from './@types/funiTypes';
import { StreamData } from './@types/streamData';
import { DownloadedFile } from './@types/downloadedFile';
import parseFileName, { Variable } from './modules/module.filename';
import { downloaded } from './modules/module.downloadArchive';
import { FunimationMediaDownload } from './@types/funiTypes';
import * as langsData from './modules/module.langsData';
import { TitleElement } from './@types/episode';
import { AvailableFilenameVars } from './modules/module.args';
import { AuthData, AuthResponse, CheckTokenResponse, FuniGetEpisodeData, FuniGetEpisodeResponse, FuniGetShowData, SearchData, FuniSearchReponse, FuniShowResponse, FuniStreamData, FuniSubsData, FuniEpisodeData, ResponseBase } from './@types/messageHandler';
import { ServiceClass } from './@types/serviceClassInterface';
import { SubtitleRequest } from './@types/funiSubtitleRequest'; 

// program name
const api_host = 'https://prod-api-funimationnow.dadcdigital.com/api';
// check page

// fn variables
let  fnEpNum: string|number = 0,
  fnOutput: string[] = [],
  season = 0,
  tsDlPath: {
    path: string,
    lang: langsData.LanguageItem
  }[] = [],
  stDlPath: Subtitle[] = [];

export default class Funi implements ServiceClass {
  public static epIdLen = 4;
  public static typeIdLen = 0;

  public cfg: yamlCfg.ConfigObject;
  private token: string | boolean;

  constructor(private debug = false) {
    this.cfg = yamlCfg.loadCfg();
    this.token = yamlCfg.loadFuniToken();
  }

  public checkToken(): CheckTokenResponse {
    const isOk = typeof this.token === 'string';
    return isOk ? { isOk, value: undefined } : { isOk, reason: new Error('Not authenticated') };
  }

  public async cli() : Promise<boolean|undefined> {
    const argv = appYargs.appArgv(this.cfg.cli);
    if (argv.debug)
      this.debug = true;
    console.info(`\n=== Multi Downloader NX ${packageJson.version} ===\n`);
    if (argv.allDubs) {
      argv.dubLang = langsData.dubLanguageCodes;
    }
    // select mode
    if (argv.silentAuth && !argv.auth) {
      const data: AuthData = {
        username: argv.username ?? await shlp.question('[Q] LOGIN/EMAIL'),
        password: argv.password ?? await shlp.question('[Q] PASSWORD   ')
      };
      await this.auth(data);
    }
    if(argv.auth){
      const data: AuthData = {
        username: argv.username ?? await shlp.question('[Q] LOGIN/EMAIL'),
        password: argv.password ?? await shlp.question('[Q] PASSWORD   ')
      };
      await this.auth(data);
    }
    else if(argv.search){
      this.searchShow(true, { search: argv.search });
    }
    else if(argv.s && !isNaN(parseInt(argv.s)) && parseInt(argv.s) > 0){
      const data = await this.getShow(true, { id: parseInt(argv.s), but: argv.but, all: argv.all, e: argv.e });
      if (!data.isOk) {
        console.error(`${data.reason.message}`);
        return false;
      }
      let ok = true;
      for (const episodeData of data.value) {
        if ((await this.getEpisode(true, { subs: { dlsubs: argv.dlsubs, nosubs: argv.nosubs, sub: false, ccTag: argv.ccTag }, dubLang: argv.dubLang, fnSlug: episodeData, s: argv.s, simul: argv.simul }, {
          ass: false,
          ...argv
        })).isOk !== true)
          ok = false;
      }
      return ok;
    }
    else{
      console.info('No option selected or invalid value entered. Try --help.');
    }
  }
  public async auth(data: AuthData): Promise<AuthResponse> {
    const authOpts = {
      user: data.username,
      pass: data.password
    };
    const authData =  await getData({
      baseUrl: api_host,
      url: '/auth/login/',
      auth: authOpts,
      debug: this.debug,
    });
    if(authData.ok && authData.res){
      const resJSON = JSON.parse(authData.res.body);
      if(resJSON.token){
        console.info('Authentication success, your token: %s%s\n', resJSON.token.slice(0,8),'*'.repeat(32));
        yamlCfg.saveFuniToken({'token': resJSON.token});
        this.token = resJSON.token;
        return { isOk: true, value: undefined };
      } else {
        console.info('[ERROR]%s\n', ' No token found');
        if (this.debug) {
          console.info(resJSON);
        }
        return { isOk: false, reason: new Error(resJSON) };
      }
    }
    return { isOk: false, reason: new Error('Login request failed') };
  }

  public async searchShow(log: boolean, data: SearchData): Promise<FuniSearchReponse>  {
    const qs = {unique: true, limit: 100, q: data.search, offset: 0 };
    const searchData = await getData({
      baseUrl: api_host,
      url: '/source/funimation/search/auto/',
      querystring: qs,
      token: this.token,
      useToken: true,
      debug: this.debug,
    });
    if(!searchData.ok || !searchData.res){
      return { isOk: false, reason: new Error('Request is not ok') };
    }
    const searchDataJSON = JSON.parse(searchData.res.body);
    if(searchDataJSON.detail){
      console.error(`${searchDataJSON.detail}`);
      return { isOk: false, reason: new Error(searchDataJSON.defail) };
    }
    if(searchDataJSON.items && searchDataJSON.items.hits && log){
      const shows = searchDataJSON.items.hits;
      console.info('Search Results:');
      for(const ssn in shows){
        console.info(`[#${shows[ssn].id}] ${shows[ssn].title}` + (shows[ssn].tx_date?` (${shows[ssn].tx_date})`:''));
      }
    }
    if (log)
      console.info('Total shows found: %s\n',searchDataJSON.count);
    return { isOk: true, value: searchDataJSON };
  }

  public async listShowItems(id: number) : Promise<ResponseBase<Item[]>> {
    const showData = await getData({
      baseUrl: api_host,
      url: `/source/catalog/title/${id}`,
      token: this.token,
      useToken: true,
      debug: this.debug,
    });
      // check errors
    if(!showData.ok || !showData.res){ return { isOk: false, reason: new Error('ShowData is not ok') }; }
    const showDataJSON = JSON.parse(showData.res.body);
    if(showDataJSON.status){
      console.error('Error #%d: %s\n', showDataJSON.status, showDataJSON.data.errors[0].detail);
      return { isOk: false, reason: new Error(showDataJSON.data.errors[0].detail) };
    }
    else if(!showDataJSON.items || showDataJSON.items.length<1){
      console.error('Show not found\n');
      return { isOk: false, reason: new Error('Show not found') };
    }
    const showDataItem = showDataJSON.items[0];
    console.info('[#%s] %s (%s)',showDataItem.id,showDataItem.title,showDataItem.releaseYear);
    // show episodes
    const qs: {
          limit: number,
          sort: string,
          sort_direction: string,
          title_id: number,
          language?: string
      } = { limit: -1, sort: 'order', sort_direction: 'ASC', title_id: id };
    const episodesData = await getData({
      baseUrl: api_host,
      url: '/funimation/episodes/',
      querystring: qs,
      token: this.token,
      useToken: true,
      debug: this.debug,
    });
    if(!episodesData.ok || !episodesData.res){ return { isOk: false, reason: new Error('episodesData is not ok') }; }
      
    let epsDataArr: Item[] = JSON.parse(episodesData.res.body).items;
    const epNumRegex = /^([A-Z0-9]*[A-Z])?(\d+)$/i;
      
    const parseEpStr = (epStr: string) => {
      const match = epStr.match(epNumRegex);
      if (!match) {
        console.error('No match found');
        return ['', ''];
      }
      if(match.length > 2){
        const spliced = [...match].splice(1);
        spliced[0] = spliced[0] ? spliced[0] : '';
        return spliced;
      }
      else return [ '', match[0] ];
    };
      
    epsDataArr = epsDataArr.map(e => {
      const baseId = e.ids.externalAsianId ? e.ids.externalAsianId : e.ids.externalEpisodeId;
      e.id = baseId.replace(new RegExp('^' + e.ids.externalShowId), '');
      if(e.id.match(epNumRegex)){
        const epMatch = parseEpStr(e.id);
        Funi.epIdLen = epMatch[1].length > Funi.epIdLen ? epMatch[1].length : Funi.epIdLen;
        Funi.typeIdLen = epMatch[0].length > Funi.typeIdLen ? epMatch[0].length : Funi.typeIdLen;
        e.id_split = epMatch;
      }
      else{
        Funi.typeIdLen = 3 > Funi.typeIdLen? 3 : Funi.typeIdLen;
        console.error('FAILED TO PARSE: ', e.id);
        e.id_split = [ 'ZZZ', 9999 ];
      }
      return e;
    });
      
    epsDataArr.sort((a, b) => {
      if (a.item.seasonOrder < b.item.seasonOrder && a.id.localeCompare(b.id) < 0) {
        return -1;
      }
      if (a.item.seasonOrder > b.item.seasonOrder && a.id.localeCompare(b.id) > 0) {
        return 1;
      }
      return 0;
    });

    return { isOk: true, value: epsDataArr };
  }

  public async getShow(log: boolean, data: FuniGetShowData) : Promise<FuniShowResponse>  {
    const showList = await this.listShowItems(data.id);
    if (!showList.isOk)
      return showList;
    const eps = showList.value;
    const epSelList = parseSelect(data.e as string, data.but);
    const fnSlug: FuniEpisodeData[] = [], epSelEpsTxt: string[] = []; let is_selected = false;

      
    for(const e in eps){
      eps[e].id_split[1] = parseInt(eps[e].id_split[1].toString()).toString().padStart(Funi.epIdLen, '0');
      let epStrId = eps[e].id_split.join('');
      // select
      is_selected = false;
      if (data.all || epSelList.isSelected(epStrId)) {
        fnSlug.push({
          title:eps[e].item.titleSlug,
          episode:eps[e].item.episodeSlug,
          episodeID:epStrId,
          epsiodeNumber: eps[e].item.episodeNum,
          seasonTitle: eps[e].item.seasonTitle,
          seasonNumber: eps[e].item.seasonNum,
          ids: {
            episode: eps[e].ids.externalEpisodeId,
            season: eps[e].ids.externalSeasonId,
            show: eps[e].ids.externalShowId
          },
          image: eps[e].item.poster
        });
        epSelEpsTxt.push(epStrId);
        is_selected = true;
      }
      // console vars
      const tx_snum = eps[e].item.seasonNum=='1'?'':` S${eps[e].item.seasonNum}`;
      const tx_type = eps[e].mediaCategory != 'episode' ? eps[e].mediaCategory : '';
      const tx_enum = eps[e].item.episodeNum && eps[e].item.episodeNum !== '' ?
        `#${(parseInt(eps[e].item.episodeNum) < 10 ? '0' : '')+eps[e].item.episodeNum}` : '#'+eps[e].item.episodeId;
      const qua_str = eps[e].quality.height ? eps[e].quality.quality + eps[e].quality.height : 'UNK';
      const aud_str = eps[e].audio.length > 0 ? `, ${eps[e].audio.join(', ')}` : '';
      const rtm_str = eps[e].item.runtime !== '' ? eps[e].item.runtime : '??:??';
      // console string
      eps[e].id_split[0] = eps[e].id_split[0].toString().padStart(Funi.typeIdLen, ' ');
      epStrId = eps[e].id_split.join('');
      let conOut  = `[${epStrId}] `;
      conOut += `${eps[e].item.titleName+tx_snum} - ${tx_type+tx_enum} ${eps[e].item.episodeName} `;
      conOut += `(${rtm_str}) [${qua_str+aud_str}]`;
      conOut += is_selected ? ' (selected)' : '';
      conOut += eps.length-1 == parseInt(e) ? '\n' : '';
      console.info(conOut);
    }
    if(fnSlug.length < 1){
      if (log)
        console.info('Episodes not selected!\n');
      return { isOk: true, value: [] } ;
    }
    else{
      if (log)
        console.info('Selected Episodes: %s\n',epSelEpsTxt.join(', '));
      return { isOk: true, value: fnSlug };
    }
  }

  public async getEpisode(log: boolean, data: FuniGetEpisodeData, downloadData: FuniStreamData) : Promise<FuniGetEpisodeResponse> {
    const episodeData = await getData({
      baseUrl: api_host,
      url: `/source/catalog/episode/${data.fnSlug.title}/${data.fnSlug.episode}/`,
      token: this.token,
      useToken: true,
      debug: this.debug,
    });
    if(!episodeData.ok || !episodeData.res){return { isOk: false, reason: new Error('Unable to get episodeData') }; }
    const ep = JSON.parse(episodeData.res.body).items[0] as EpisodeData, streamIds: { id: number, lang: langsData.LanguageItem }[] = [];
    // build fn
    season = parseInt(ep.parent.seasonNumber);
    if(ep.mediaCategory != 'Episode'){
      ep.number = ep.number !== '' ? ep.mediaCategory+ep.number : ep.mediaCategory+'#'+ep.id;
    }
    fnEpNum = isNaN(parseInt(ep.number)) ? ep.number : parseInt(ep.number);
      
    // is uncut
    const uncut = {
      Japanese: false,
      English: false
    };
      
    // end
    if (log) {
      console.info(
        '%s - S%sE%s - %s',
        ep.parent.title,
        (ep.parent.seasonNumber ? ep.parent.seasonNumber : '?'),
        (ep.number ? ep.number : '?'),
        ep.title
      );
      
      console.info('Available streams (Non-Encrypted):');
    }
    // map medias
    const media = await Promise.all(ep.media.map(async (m) =>{
      if(m.mediaType == 'experience'){
        if(m.version.match(/uncut/i) && m.language){
          uncut[m.language] = true;
        }
        return {
          id: m.id,
          language: m.language,
          version: m.version,
          type: m.experienceType,
          subtitles: await this.getSubsUrl(m.mediaChildren, m.language, data.subs, ep.ids.externalEpisodeId, data.subs.ccTag)
        };
      }
      else{
        return { id: 0, type: '' };
      }
    }));
      
    // select
    stDlPath = [];
    for(const m of media){
      let selected = false;
      if(m.id > 0 && m.type == 'Non-Encrypted'){
        const dub_type = m.language;
        if (!dub_type)
          continue;
        let localSubs: Subtitle[] = [];
        const selUncut = !data.simul && uncut[dub_type] && m.version?.match(/uncut/i) 
          ? true 
          : (!uncut[dub_type] || data.simul && m.version?.match(/simulcast/i) ? true : false);
        for (const curDub of data.dubLang) {
          const item = langsData.languages.find(a => a.code === curDub);
          if(item && (dub_type === item.funi_name_lagacy || dub_type === (item.funi_name ?? item.name)) && selUncut){
            streamIds.push({
              id: m.id,
              lang: item
            });
            stDlPath.push(...m.subtitles);
            localSubs = m.subtitles;
            selected = true;
          }
        }
        if (log) {
          const subsToDisplay: langsData.LanguageItem[] = [];
          localSubs.forEach(a => {
            if (!subsToDisplay.includes(a.lang))
              subsToDisplay.push(a.lang);
          });
          console.info(`[#${m.id}] ${dub_type} [${m.version}]${(selected?' (selected)':'')}${
            localSubs && localSubs.length > 0 && selected ? ` (using ${subsToDisplay.map(a => `'${a.name}'`).join(', ')} for subtitles)` : ''
          }`);
        }
      }
    }
  
    const already: string[] = [];
    stDlPath = stDlPath.filter(a => {
      if (already.includes(`${a.closedCaption ? 'cc' : ''}-${a.lang.code}`)) {
        return false;
      } else {
        already.push(`${a.closedCaption ? 'cc' : ''}-${a.lang.code}`);
        return true;
      }
    });
    if(streamIds.length < 1){
      if (log)
        console.error('Track not selected\n');
      return { isOk: false, reason: new Error('Track not selected') };
    }
    else{
      tsDlPath = [];
      for (const streamId of streamIds) {
        const streamData = await getData({
          baseUrl: api_host,
          url: `/source/catalog/video/${streamId.id}/signed`,
          token: this.token,
          dinstid: 'uuid',
          useToken: true,
          debug: this.debug,
        });
        if(!streamData.ok || !streamData.res){return { isOk: false, reason: new Error('Unable to get streamdata') };}
        const streamDataRes = JSON.parse(streamData.res.body) as StreamData;
        if(streamDataRes.errors){
          if (log)
            console.info('Error #%s: %s\n',streamDataRes.errors[0].code,streamDataRes.errors[0].detail);
          return { isOk: false, reason: new Error(streamDataRes.errors[0].detail) };
        }
        else{
          for(const u in streamDataRes.items){
            if(streamDataRes.items[u].videoType == 'm3u8'){
              tsDlPath.push({
                path: streamDataRes.items[u].src,
                lang: streamId.lang
              });
              break;
            }
          }
        }
      }
      if(tsDlPath.length < 1){
        if (log)
          console.error('Unknown error\n');
        return { isOk: false, reason: new Error('Unknown error') };
      }
      else{
        const res = await this.downloadStreams(true, {
          id: data.fnSlug.episodeID,
          title: ep.title,
          showTitle: ep.parent.title,
          image: ep.thumb
        }, downloadData);
        if (res === true) {
          downloaded({
            service: 'funi',
            type: 's'
          }, data.s, [data.fnSlug.episodeID]);
          return { isOk: res, value: undefined };
        }
        return { isOk: false, reason: new Error('Unknown download error') };
      }
    }
  }
  
  public async downloadStreams(log: boolean, episode: FunimationMediaDownload, data: FuniStreamData): Promise<boolean|void> {
    
    // req playlist
  
    const purvideo: DownloadedFile[] = [];
    const puraudio: DownloadedFile[] = [];
    const audioAndVideo: DownloadedFile[] = []; 
    for (const streamPath of tsDlPath) {
      const plQualityReq = await getData({
        url: streamPath.path,
        debug: this.debug,
      });
      if(!plQualityReq.ok || !plQualityReq.res){return;}
          
      const plQualityLinkList = m3u8(plQualityReq.res.body);
          
      const mainServersList = [
        'vmfst-api.prd.funimationsvc.com',
        'd33et77evd9bgg.cloudfront.net',
        'd132fumi6di1wa.cloudfront.net',
        'funiprod.akamaized.net',
      ];
          
      const plServerList: string[] = [],
        plStreams: Record<string|number, {
        [key: string]: string   
      }> = {},
        plLayersStr: string[]  = [],
        plLayersRes: Record<string|number, {
        width: number,
        height: number
      }>  = {};
      let plMaxLayer   = 1,
        plNewIds     = 1,
        plAud: undefined|{
        uri: string
        language: langsData.LanguageItem
      };
          
      // new uris
      const vplReg = /streaming_video_(\d+)_(\d+)_(\d+)_index\.m3u8/;
      if(plQualityLinkList.playlists[0].uri.match(vplReg)){
        const audioKey = Object.keys(plQualityLinkList.mediaGroups.AUDIO).pop();
        if (!audioKey)
          return console.error('No audio key found');
        if(plQualityLinkList.mediaGroups.AUDIO[audioKey]){
          const audioDataParts = plQualityLinkList.mediaGroups.AUDIO[audioKey],
            audioEl = Object.keys(audioDataParts);
          const audioData = audioDataParts[audioEl[0]];
          let language = langsData.languages.find(a => a.code === audioData.language || a.locale === audioData.language);
          if (!language) {
            language = langsData.languages.find(a => a.funi_name_lagacy === audioEl[0] || ((a.funi_name ?? a.name) === audioEl[0]));
            if (!language) {
              if (log)
                console.error(`Unable to find language for locale ${audioData.language} or name ${audioEl[0]}`);
              return;
            }
          }
          plAud = {
            uri: audioData.uri,
            language: language
          };
        }
        plQualityLinkList.playlists.sort((a, b) => {
          const aMatch = a.uri.match(vplReg), bMatch = b.uri.match(vplReg);
          if (!aMatch || !bMatch) {
            console.info('Unable to match');
            return 0;
          }
          const av = parseInt(aMatch[3]);
          const bv = parseInt(bMatch[3]);
          if(av  > bv){
            return 1;
          }
          if (av < bv) {
            return -1;
          }
          return 0;
        });
      }
          
      for(const s of plQualityLinkList.playlists){
        if(s.uri.match(/_Layer(\d+)\.m3u8/) || s.uri.match(vplReg)){
          // set layer and max layer
          let plLayerId: number|string = 0;
          const match = s.uri.match(/_Layer(\d+)\.m3u8/);
          if(match){
            plLayerId = parseInt(match[1]);
          }
          else{
            plLayerId = plNewIds, plNewIds++;
          }
          plMaxLayer    = plMaxLayer < plLayerId ? plLayerId : plMaxLayer;
          // set urls and servers
          const plUrlDl  = s.uri;
          const plServer = new URL(plUrlDl).host;
          if(!plServerList.includes(plServer)){
            plServerList.push(plServer);
          }
          if(!Object.keys(plStreams).includes(plServer)){
            plStreams[plServer] = {};
          }
          if(plStreams[plServer][plLayerId] && plStreams[plServer][plLayerId] != plUrlDl){
            console.warn(`Non duplicate url for ${plServer} detected, please report to developer!`);
          }
          else{
            plStreams[plServer][plLayerId] = plUrlDl;
          }
          // set plLayersStr
          const plResolution = s.attributes.RESOLUTION;
          plLayersRes[plLayerId] = plResolution;
          const plBandwidth  = Math.round(s.attributes.BANDWIDTH/1024);
          if(plLayerId<10){
            plLayerId = plLayerId.toString().padStart(2,' ');
          }
          const qualityStrAdd   = `${plLayerId}: ${plResolution.width}x${plResolution.height} (${plBandwidth}KiB/s)`;
          const qualityStrRegx  = new RegExp(qualityStrAdd.replace(/(:|\(|\)|\/)/g,'\\$1'),'m');
          const qualityStrMatch = !plLayersStr.join('\r\n').match(qualityStrRegx);
          if(qualityStrMatch){
            plLayersStr.push(qualityStrAdd);
          }
        }
        else {
          console.info(s.uri);
        }
      }
  
      for(const s of mainServersList){
        if(plServerList.includes(s)){
          plServerList.splice(plServerList.indexOf(s), 1);
          plServerList.unshift(s);
          break;
        }
      }
  
          
      const plSelectedServer = plServerList[data.x-1];
      const plSelectedList   = plStreams[plSelectedServer];
          
      plLayersStr.sort();
      if (log) {
        console.info(`Servers available:\n\t${plServerList.join('\n\t')}`);
        console.info(`Available qualities:\n\t${plLayersStr.join('\n\t')}`);
      }
  
      const selectedQuality = data.q === 0 || data.q > Object.keys(plLayersRes).length
        ? Object.keys(plLayersRes).pop() as string
        : data.q;
      const videoUrl = data.x < plServerList.length+1 && plSelectedList[selectedQuality] ? plSelectedList[selectedQuality] : '';
  
      if(videoUrl != ''){
        if (log) {
          console.info(`Selected layer: ${selectedQuality} (${plLayersRes[selectedQuality].width}x${plLayersRes[selectedQuality].height}) @ ${plSelectedServer}`);
          console.info('Stream URL:',videoUrl);
        }
      
        fnOutput = parseFileName(data.fileName, ([
          ['episode', isNaN(parseInt(fnEpNum as string)) ? fnEpNum : parseInt(fnEpNum as string), true],
          ['title', episode.title, true],
          ['showTitle', episode.showTitle, true],
          ['season', season, false],
          ['width', plLayersRes[selectedQuality].width, false],
          ['height', plLayersRes[selectedQuality].height, false],
          ['service', 'Funimation', false]
        ] as [AvailableFilenameVars, string|number, boolean][]).map((a): Variable => {
          return {
            name: a[0],
            replaceWith: a[1],
            type: typeof a[1],
            sanitize: a[2]
          } as Variable;
        }), data.numbers, data.override);
        if (fnOutput.length < 1)
          throw new Error(`Invalid path generated for input ${data.fileName}`);
        if (log)
          console.info(`Output filename: ${fnOutput.join(path.sep)}.ts`);
      }
      else if(data.x > plServerList.length){
        if (log)
          console.error('Server not selected!\n');
        return;
      }
      else{
        if (log)
          console.error('Layer not selected!\n');
        return;
      }
          
      let dlFailed = false;
      let dlFailedA = false;
          
      await fs.promises.mkdir(path.join(this.cfg.dir.content, ...fnOutput.slice(0, -1)), { recursive: true });
  
      video: if (!data.novids) {
        if (plAud && (purvideo.length > 0 || audioAndVideo.length > 0)) {
          break video;
        } else if (!plAud && (audioAndVideo.some(a => a.lang === streamPath.lang) || puraudio.some(a => a.lang === streamPath.lang))) {
          break video;
        }
        // download video
        const reqVideo = await getData({
          url: videoUrl,
          debug: this.debug,
        });
        if (!reqVideo.ok || !reqVideo.res) { break video; }
              
        const chunkList = m3u8(reqVideo.res.body);
              
        const tsFile = path.join(this.cfg.dir.content, ...fnOutput.slice(0, -1), `${fnOutput.slice(-1)}.video${(plAud?.uri ? '' : '.' + streamPath.lang.code )}`);
        dlFailed = !await this.downloadFile(tsFile, chunkList, data.timeout, data.partsize, data.fsRetryTime, data.force, data.callbackMaker ? data.callbackMaker({
          fileName: `${fnOutput.slice(-1)}.video${(plAud?.uri ? '' : '.' + streamPath.lang.code )}.ts`,
          parent: {
            title: episode.showTitle
          },
          title: episode.title,
          image: episode.image,
          language: streamPath.lang,
        }) : undefined);
        if (!dlFailed) {
          if (plAud) {
            purvideo.push({
              path: `${tsFile}.ts`,
              lang: plAud.language
            });
          } else {
            audioAndVideo.push({
              path: `${tsFile}.ts`,
              lang: streamPath.lang
            });
          }
        }
      }
      else{
        if (log)
          console.info('Skip video downloading...\n');
      }
      audio: if (plAud && !data.noaudio) {
        // download audio
        if (audioAndVideo.some(a => a.lang === plAud?.language) || puraudio.some(a => a.lang === plAud?.language))
          break audio;
        const reqAudio = await getData({
          url: plAud.uri,
          debug: this.debug,
        });
        if (!reqAudio.ok || !reqAudio.res) { return; }
              
        const chunkListA = m3u8(reqAudio.res.body);
      
        const tsFileA = path.join(this.cfg.dir.content, ...fnOutput.slice(0, -1), `${fnOutput.slice(-1)}.audio.${plAud.language.code}`);
      
        dlFailedA = !await this.downloadFile(tsFileA, chunkListA, data.timeout, data.partsize, data.fsRetryTime, data.force, data.callbackMaker ? data.callbackMaker({
          fileName: `${fnOutput.slice(-1)}.audio.${plAud.language.code}.ts`,
          parent: {
            title: episode.showTitle
          },
          title: episode.title,
          image: episode.image,
          language: plAud.language
        }) : undefined);
        if (!dlFailedA)
          puraudio.push({
            path: `${tsFileA}.ts`,
            lang: plAud.language
          });
  
      }
    }
      
    // add subs
    const subsExt = !data.mp4 || data.mp4 && data.ass ? '.ass' : '.srt';
    let addSubs = true;
  
    // download subtitles
    if(stDlPath.length > 0){
      if (log)
        console.info('Downloading subtitles...');
      for (const subObject of stDlPath) {
        const subsSrc = await getData({
          url: subObject.url,
          debug: this.debug,
        });
        if(subsSrc.ok && subsSrc.res){
          const assData = vttConvert(subsSrc.res.body, (subsExt == '.srt' ? true : false), subObject.lang.name, data.fontSize, data.fontName);
          subObject.out = path.join(this.cfg.dir.content, ...fnOutput.slice(0, -1), `${fnOutput.slice(-1)}.subtitle${subObject.ext}${subsExt}`);
          fs.writeFileSync(subObject.out, assData);
        }
        else{
          if (log)
            console.error('Failed to download subtitles!');
          addSubs = false;
          break;
        }
      }
      if (addSubs && log)
        console.info('Subtitles downloaded!');
    }
    
    if((puraudio.length < 1 && audioAndVideo.length < 1) || (purvideo.length < 1 && audioAndVideo.length < 1)){
      if (log)
        console.info('\nUnable to locate a video AND audio file\n');
      return;
    }
      
    if(data.skipmux){
      if (log)
        console.info('Skipping muxing...');
      return;
    }
      
    // check exec
    this.cfg.bin = await yamlCfg.loadBinCfg();
    const mergerBin = merger.checkMerger(this.cfg.bin, data.mp4, data.forceMuxer);
      
    if ( data.novids ){
      if (log)
        console.info('Video not downloaded. Skip muxing video.');
    }
  
    const ffext = !data.mp4 ? 'mkv' : 'mp4';
    const mergeInstance = new merger({
      onlyAudio: puraudio,
      onlyVid: purvideo,
      output: `${path.join(this.cfg.dir.content, ...fnOutput)}.${ffext}`,
      subtitles: stDlPath.map(a => {
        return {
          file: a.out as string,
          language: a.lang,
          title: a.lang.name,
          closedCaption: a.closedCaption
        };
      }),
      videoAndAudio: audioAndVideo,
      simul: data.simul,
      skipSubMux: data.skipSubMux,
      videoTitle: data.videoTitle,
      options: {
        ffmpeg: data.ffmpegOptions,
        mkvmerge: data.mkvmergeOptions
      },
      defaults: {
        audio: data.defaultAudio,
        sub: data.defaultSub
      },
      ccTag: data.ccTag
    });
  
    if(mergerBin.MKVmerge){
      await mergeInstance.merge('mkvmerge', mergerBin.MKVmerge);
    }
    else if(mergerBin.FFmpeg){
      await mergeInstance.merge('ffmpeg', mergerBin.FFmpeg);
    }
    else{
      if (log)
        console.info('\nDone!\n');
      return true;
    }
    if (data.nocleanup) {
      return true;
    }
      
    mergeInstance.cleanUp();
    if (log)
      console.info('\nDone!\n');
    return true;
  }
  
  public async downloadFile(filename: string, chunkList: {
    segments: Record<string, unknown>[],
  }, timeout: number, partsize: number, fsRetryTime: number, override?: 'Y' | 'y' | 'N' | 'n' | 'C' | 'c', callback?: HLSCallback) {
    const downloadStatus = await new hlsDownload({
      m3u8json: chunkList,
      output: `${filename + '.ts'}`,
      timeout: timeout,
      threads: partsize,
      fsRetryTime: fsRetryTime * 1000,
      override,
      callback
    }).download();
      
    return downloadStatus.ok;
  }

  public async getSubsUrl(m: MediaChild[], parentLanguage: TitleElement|undefined, data: FuniSubsData, episodeID: string, ccTag: string) : Promise<Subtitle[]> {
    if((data.nosubs && !data.sub) || data.dlsubs.includes('none')){
      return [];
    }
  
    const subs = await getData({
      baseUrl: 'https://playback.prd.funimationsvc.com/v1/play',
      url: `/${episodeID}`,
      token: this.token,
      useToken: true,
      debug: this.debug,
      querystring: { deviceType: 'web' }
    });
    if (!subs.ok || !subs.res || !subs.res.body) {
      console.error('Subtitle Request failed.');
      return [];
    }
    const parsed: SubtitleRequest = JSON.parse(subs.res.body);
    
    const found: {
      isCC: boolean;
      url: string;
      lang: langsData.LanguageItem;
    }[] = parsed.primary.subtitles.filter(a => a.fileExt === 'vtt').map(subtitle => {
      return {
        isCC: subtitle.contentType === 'cc',
        url: subtitle.filePath,
        lang: langsData.languages.find(a => a.funi_locale === subtitle.languageCode || a.locale === subtitle.languageCode)
      };
    }).concat(m.filter(a => a.filePath.split('.').pop() === 'vtt').map(media => {
      const lang = langsData.languages.find(a => media.language === a.funi_name_lagacy || media.language === (a.funi_name || a.name));
      const pLang = langsData.languages.find(a =>  parentLanguage === a.funi_name_lagacy || (a.funi_name || a.name) === parentLanguage);
      return {
        isCC: pLang?.code === lang?.code,
        url: media.filePath,
        lang
      };
    })).filter((a) => a.lang !== undefined) as {
      isCC: boolean;
      url: string;
      lang: langsData.LanguageItem;
    }[];

    const ret = found.filter(item => {
      return data.dlsubs.includes('all') || data.dlsubs.some(a => a === item.lang.locale);
    });

    return ret.map(a => ({
      ext: `.${a.lang.code}${a.isCC ? `.${ccTag}` : ''}`,
      lang: a.lang,
      url: a.url,
      closedCaption: a.isCC
    }));
  }
  
}
