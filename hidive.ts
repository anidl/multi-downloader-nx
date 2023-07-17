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
import streamdl from './modules/hls-download';

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

export default class Hidive implements ServiceClass { 
  public cfg: yamlCfg.ConfigObject;
  private session: Record<string, any>;
  private token: Record<string, any>;
  private req: reqModule.Req;
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
    this.token = yamlCfg.loadHDToken();
    this.client = yamlCfg.loadHDProfile() as {ipAddress: string, xNonce: string, xSignature: string, visitId: string, profile: {userId: number, profileId: number, deviceId : string}};
    this.req = new reqModule.Req(domain, debug, false, 'hd');
  }

  public async doInit() {
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
  }

  public async cli() {
    console.info(`\n=== Multi Downloader NX ${packageJson.version} ===\n`);
    const argv = yargs.appArgv(this.cfg.cli);
    if (argv.debug)
      this.debug = true;

    //below is for quickly testing API calls
    /*const searchItems = await this.reqData('GetTitles', {'Filter': 'recently-added', 'Pager': {'Number': 1, 'Size': 30}, 'Sort': 'Date', 'Verbose': false});
    const searchItems = await this.reqData('GetTitles', {'Id': 492});
    if(!searchItems.ok || !searchItems.res){return;}
    console.info(searchItems.res.body);
    fs.writeFileSync('apitest.json', JSON.stringify(JSON.parse(searchItems.res.body), null, 2));*/

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
      return true;
    } else if (argv.new) {
      //Initilize session
      await this.doInit();
      //Get Newly Added
      await this.getNewlyAdded(argv.page);
    } else {
      console.info('No option selected or invalid value entered. Try --help.');
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

  public async doAuth(data: AuthData): Promise<AuthResponse>  {
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
    console.info('[INFO] Auth complete!');
    console.info(`[INFO] Service level for "${data.username}" is ${authData.User.ServiceLevel}`);
    return { isOk: true, value: undefined };
  }

  public async genSubsUrl(type: string, file: string) {
    return [
      `${domain.hd_www}/caption/${type}/`,
      ( type == 'css' ? '?id=' : '' ),
      `${file}.${type}`
    ].join('');
  }

  public async doSearch(data: SearchData): Promise<SearchResponse> {
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

  public async listShow(id: number) {
    const getShowData = await this.reqData('GetTitle', { 'Id': id });
    if (!getShowData.ok || !getShowData.res) { 
      console.error('Failed to get show data');
      return { isOk: false};
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
    return { isOk: true, value: selEpsArr, showData: showData } ;
  }

  public async getEpisode(selectedEpisode: HidiveEpisodeExtra, options: Record<any, any>) {
    const getVideoData = await this.reqData('GetVideos', { 'VideoKey': selectedEpisode.epKey, 'TitleId': selectedEpisode.titleId });
    if (getVideoData.ok && getVideoData.res) {
      const videoData = JSON.parse(getVideoData.res.body) as HidiveVideoList;
      const showTitle = `${selectedEpisode.seriesTitle} S${parseFloat(selectedEpisode.SeasonNumberValue+'')}}`;
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
              //vttConvert(getVttContent.res.body, false, subLang.name, fontSize);
              const sBody = vtt(undefined, chosenFontSize, getVttContent.res.body, getCssContent.res.body, subsMargin, options.fontName);
              sxData.title = `${subLang.language} / ${sxData.title}`;
              sxData.fonts = fontsData.assFonts(sBody) as Font[];
              fs.writeFileSync(sxData.path, sBody);
              console.info(`Subtitle downloaded: ${sxData.file}`);
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

  public async muxStreams(data: DownloadedMedia[], options: Record<any, any>) {
    this.cfg.bin = await yamlCfg.loadBinCfg();
    if (options.novids || data.filter(a => a.type === 'Video').length === 0)
      return console.info('Skip muxing since no vids are downloaded');
    const merger = new Merger({
      onlyVid: [],
      skipSubMux: options.skipSubMux,
      inverseTrackOrder: true,
      keepAllVideos: options.keepAllVideos,
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
      simul: data.filter(a => a.type === 'Video').map((a) : boolean => {
        if (a.type === 'Subtitle')
          throw new Error('Never');
        return !a.uncut as boolean;
      })[0],
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