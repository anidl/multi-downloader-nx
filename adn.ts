// Package Info
import packageJson from './package.json';

// Node
import path from 'path';
import fs from 'fs-extra';
import crypto from 'crypto';

// Plugins
import m3u8 from 'm3u8-parsed';

// Modules
import * as fontsData from './modules/module.fontsData';
import * as langsData from './modules/module.langsData';
import * as yamlCfg from './modules/module.cfg-loader';
import * as yargs from './modules/module.app-args';
import * as reqModule from './modules/module.fetch';
import Merger, { Font, MergerInput, SubtitleInput } from './modules/module.merger';
import streamdl from './modules/hls-download';
import { console } from './modules/log';
import { domain } from './modules/module.api-urls';
import { downloaded } from './modules/module.downloadArchive';
import parseSelect from './modules/module.parseSelect';
import parseFileName, { Variable } from './modules/module.filename';
import { AvailableFilenameVars } from './modules/module.args';
import Helper from './modules/module.helper';

// Types
import { ServiceClass } from './@types/serviceClassInterface';
import { AuthData, AuthResponse, SearchData, SearchResponse, SearchResponseItem } from './@types/messageHandler';
import { sxItem } from './crunchy';
import { DownloadedMedia } from './@types/hidiveTypes';
import { ADNSearch, ADNSearchShow } from './@types/adnSearch';
import { ADNVideo, ADNVideos } from './@types/adnVideos';
import { ADNPlayerConfig } from './@types/adnPlayerConfig';
import { ADNStreams } from './@types/adnStreams';
import { ADNSubtitles } from './@types/adnSubtitles';

export default class AnimationDigitalNetwork implements ServiceClass { 
  public cfg: yamlCfg.ConfigObject;
  public locale: string;
  private token: Record<string, any>;
  private req: reqModule.Req;
  private posAlignMap: { [key: string]: number } = {
    'start': 1,
    'end': 3
  };
  private lineAlignMap: { [key: string]: number } = {
    'middle': 8,
    'end': 4
  };
  private jpnStrings: string[] = [
    'vostf',
    'vostde'
  ];
  private deuStrings: string[] = [
    'vde'
  ];
  private fraStrings: string[] = [
    'vf'
  ];
  private deuSubStrings: string[] = [
    'vde',
    'vostde'
  ];
  private fraSubStrings: string[] = [
    'vf',
    'vostf'
  ];
  
  constructor(private debug = false) {
    this.cfg = yamlCfg.loadCfg();
    this.token = yamlCfg.loadADNToken();
    this.req = new reqModule.Req(domain, debug, false, 'adn');
    this.locale = 'fr';
  }

  public async cli() {
    console.info(`\n=== Multi Downloader NX ${packageJson.version} ===\n`);
    const argv = yargs.appArgv(this.cfg.cli);
    if (['fr', 'de'].includes(argv.locale))
      this.locale = argv.locale;
    if (argv.debug)
      this.debug = true;

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
    } else if (argv.search && argv.search.length > 2) {
      //Search
      await this.doSearch({ ...argv, search: argv.search as string });
    } else if (argv.s && !isNaN(parseInt(argv.s,10)) && parseInt(argv.s,10) > 0) {
      const selected = await this.selectShow(parseInt(argv.s), argv.e, argv.but, argv.all);
      if (selected.isOk) {
        for (const select of selected.value) {
          if (!(await this.getEpisode(select, {...argv, skipsubs: false}))) {
            console.error(`Unable to download selected episode ${select.shortNumber}`);
            return false;
          }
        }
      }
      return true;
    } else {
      console.info('No option selected or invalid value entered. Try --help.');
    }
  }

  private generateRandomString(length: number) {
    const characters = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  private parseCookies(cookiesString: string | null): Record<string, string> {
    const cookies: Record<string, string> = {};
    if (cookiesString) {
      cookiesString.split(';').forEach(cookie => {
        const parts = cookie.split('=');
        const name = parts.shift()?.trim();
        const value = decodeURIComponent(parts.join('='));
        if (name) {
          cookies[name] = value;
        }
      });
    }
    return cookies;
  }

  private convertToSSATimestamp(timestamp: number): string {
    const seconds = Math.floor(timestamp);
    const centiseconds = Math.round((timestamp - seconds) * 100);

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  }

  public async doSearch(data: SearchData): Promise<SearchResponse> {
    const limit = 12;
    const offset = data.page ? data.page * limit : 0;
    const searchReq = await this.req.getData(`https://gw.api.animationdigitalnetwork.com/show/catalog?maxAgeCategory=18&offset=${offset}&limit=${limit}&search=${encodeURIComponent(data.search)}`, {
      'headers': {
        'X-Target-Distribution': this.locale
      }
    });
    if (!searchReq.ok || !searchReq.res) {
      console.error('Search FAILED!');
      return { isOk: false, reason: new Error('Search failed. No more information provided') };
    }
    const searchData = await searchReq.res.json() as ADNSearch;
    const searchItems: ADNSearchShow[] = [];
    console.info('Search Results:');
    for (const show of searchData.shows) {
      searchItems.push(show);
      let fullType: string;
      if (show.type == 'EPS') {
        fullType = `S.${show.id}`;
      } else if (show.type == 'MOV' || show.type == 'OAV') {
        fullType = `E.${show.id}`;
      } else {
        fullType = 'Unknown';
        console.warn(`Unknown type ${show.type}, please report this.`);
      }
      console.log(`[${fullType}] ${show.title}`);
    }
    return { isOk: true, value: searchItems.flatMap((a): SearchResponseItem => {
      return {
        id: a.id+'',
        image: a.image ?? '/notFound.png',
        name: a.title,
        rating: a.rating,
        desc: a.summary
      };
    })};
  }

  public async doAuth(data: AuthData): Promise<AuthResponse>  {
    const authData = JSON.stringify({
      'username': data.username,
      'password': data.password,
      'source': 'Web'
    });
    const authReqOpts: reqModule.Params = {
      method: 'POST',
      body: authData,
      headers: {
        'content-type': 'application/json',
        'x-target-distribution': this.locale,
      }
    };
    const authReq = await this.req.getData('https://gw.api.animationdigitalnetwork.com/authentication/login', authReqOpts);
    if(!authReq.ok || !authReq.res){
      console.error('Authentication failed!');
      return { isOk: false, reason: new Error('Authentication failed') };
    }
    this.token = await authReq.res.json();
    yamlCfg.saveADNToken(this.token);
    console.info('Authentication Success');
    return { isOk: true, value: undefined };
  }

  public async refreshToken() {
    const authReq = await this.req.getData('https://gw.api.animationdigitalnetwork.com/authentication/refresh', {
      method: 'POST',  
      headers: {
        Authorization: `Bearer ${this.token.accessToken}`,
        'X-Access-Token': this.token.accessToken,
        'content-type': 'application/json',
        'x-target-distribution': this.locale
      },
      body: JSON.stringify({refreshToken: this.token.refreshToken})
    });
    if(!authReq.ok || !authReq.res){
      console.error('Token refresh failed!');
      return { isOk: false, reason: new Error('Token refresh failed') };
    }
    this.token = await authReq.res.json();
    yamlCfg.saveADNToken(this.token);
    return { isOk: true, value: undefined };
  }

  public async getShow(id: number) {
    const getShowData = await this.req.getData(`https://gw.api.animationdigitalnetwork.com/video/show/${id}?maxAgeCategory=18&limit=-1&order=asc`, {
      'headers': {
        'X-Target-Distribution': this.locale
      }
    });
    if (!getShowData.ok || !getShowData.res) { 
      console.error('Failed to get Series Data');
      return { isOk: false };
    }
    const showData = await getShowData.res.json() as ADNVideos;
    return { isOk: true, value: showData };
  }

  public async listShow(id: number) {
    const show = await this.getShow(id);
    if (!show.isOk || !show.value) {
      console.error('Failed to list show data: Failed to get show');
      return { isOk: false };
    }
    if (show.value.videos.length == 0) {
      console.error('No episodes found!');
      return { isOk: false };
    }
    const showData = show.value.videos[0].show;
    console.info(`[S.${showData.id}] ${showData.title}`);
    const specials: ADNVideo[] = [];
    const ncs: ADNVideo[] = [];
    let episodeIndex = 0, specialIndex = 0, ncIndex = 0;
    for (const episode of show.value.videos) {
      episode.season = episode.season+'';
      const seasonNumberTitleParse = episode.season.match(/\d+/);
      const seriesNumberTitleParse = episode.show.title.match(/\d+/);
      const episodeNumber = parseInt(episode.shortNumber);
      if (seasonNumberTitleParse && !isNaN(parseInt(seasonNumberTitleParse[0]))) {
        episode.season = seasonNumberTitleParse[0];
      } else if (seriesNumberTitleParse && !isNaN(parseInt(seriesNumberTitleParse[0]))) {
        episode.season = seriesNumberTitleParse[0];
      } else {
        episode.season = '1';
      }
      show.value.videos[episodeIndex].season = episode.season;
      show.value.videos[episodeIndex].shortNumber = episodeIndex+'';
      if (!episodeNumber) {
        specialIndex++;
        episode.shortNumber = 'S'+specialIndex;
        specials.push(episode);
        episodeIndex--;
      } else if (episode.number.includes('(NC)')) {
        ncIndex++;
        episode.shortNumber = 'NC'+ncIndex;
        ncs.push(episode);
        episodeIndex--;
      } else {
        console.info(`  (${episode.id}) [E${episode.shortNumber}] ${episode.number} - ${episode.name}`);
      }
      episodeIndex++;
    }
    for (const special of specials) {
      console.info(` (Special) (${special.id}) [${special.shortNumber}] ${special.number} - ${special.name}`);
      show.value.videos.splice(show.value.videos.findIndex(i => i.id === special.id), 1);
    }
    for (const nc of ncs) {
      console.info(` (NC) (${nc.id}) [${nc.shortNumber}] ${nc.number} - ${nc.name}`);
      show.value.videos.splice(show.value.videos.findIndex(i => i.id === nc.id), 1);
    }
    show.value.videos.push(...specials);
    show.value.videos.push(...ncs);
    return { isOk: true, value: show.value };
  }

  public async selectShow(id: number, e: string | undefined, but: boolean, all: boolean) {
    const getShowData = await this.listShow(id);
    if (!getShowData.isOk || !getShowData.value) {
      return { isOk: false, value: [] };
    }
    console.info('');
    console.info('-'.repeat(30));
    console.info('');
    const showData = getShowData.value;
    const doEpsFilter = parseSelect(e as string);
    const selEpsArr: ADNVideo[] = [];
    for (const episode of showData.videos) {
      if (
        all || 
        but && !doEpsFilter.isSelected([episode.shortNumber, episode.id+'']) || 
        !but && doEpsFilter.isSelected([episode.shortNumber, episode.id+''])
      ) {
        selEpsArr.push({ isSelected: true, ...episode });
        console.info('%s[S%sE%s] %s',
          '✓ ',
          episode.season,
          episode.shortNumber,
          episode.name,
        );
      }
    }
    return { isOk: true, value: selEpsArr };
  }

  public async muxStreams(data: DownloadedMedia[], options: yargs.ArgvType) {
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
      inverseTrackOrder: false,
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
      chapters: data.filter(a => a.type === 'Chapters').map((a) : MergerInput => {
        return {
          path: a.path,
          lang: a.lang
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


  public async getEpisode(data: ADNVideo, options: yargs.ArgvType) {
    //TODO: Move all the requests for getting the m3u8 here
    const res = await this.downloadEpisode(data, options);
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
        service: 'adn',
        type: 's'
      }, data.id+'', [data.shortNumber]);
      return { isOk: res, value: undefined };
    }
  }

  public async downloadEpisode(data: ADNVideo, options: yargs.ArgvType) {
    if(!this.token.accessToken){
      console.error('Authentication required!');
      return;
    }

    if (!this.cfg.bin.ffmpeg) 
      this.cfg.bin = await yamlCfg.loadBinCfg();

    let mediaName = '...';
    let fileName;
    const variables: Variable[] = [];
    if(data.show.title && data.shortNumber && data.title){
      mediaName = `${data.show.shortTitle ?? data.show.title} - ${data.shortNumber} - ${data.title}`;
    }

    const files: DownloadedMedia[] = [];

    let dlFailed = false;
    let dlVideoOnce = false; // Variable to save if best selected video quality was downloaded

    const refreshToken = await this.refreshToken();
    if (!refreshToken.isOk) {
      console.error('Failed to refresh token');
      return undefined;
    }

    const configReq = await this.req.getData(`https://gw.api.animationdigitalnetwork.com/player/video/${data.id}/configuration`, {
      headers: {
        Authorization: `Bearer ${this.token.accessToken}`,
        'X-Target-Distribution': this.locale
      }
    });
    if(!configReq.ok || !configReq.res){
      console.error('Player Config Request failed!');
      return undefined;
    }
    const configuration = await configReq.res.json() as ADNPlayerConfig;
    if (!configuration.player.options.user.hasAccess) {
      console.error('You don\'t have access to this video!');
      return undefined;
    }
    const tokenReq = await this.req.getData(configuration.player.options.user.refreshTokenUrl || 'https://gw.api.animationdigitalnetwork.com/player/refresh/token', {
      method: 'POST',  
      headers: {
        'X-Player-Refresh-Token': `${configuration.player.options.user.refreshToken}`
      }
    });
    if(!tokenReq.ok || !tokenReq.res){
      console.error('Player Token Request failed!');
      return undefined;
    }
    const token = await tokenReq.res.json() as {
      refreshToken: string,
      accessToken: string,
      token: string
    };

    const linksUrl = configuration.player.options.video.url || `https://gw.api.animationdigitalnetwork.com/player/video/${data.id}/link`;
    const key = this.generateRandomString(16);
    const decryptionKey = key + '7fac1178830cfe0c';

    const authorization = crypto.publicEncrypt({
      'key': '-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCbQrCJBRmaXM4gJidDmcpWDssg\nnumHinCLHAgS4buMtdH7dEGGEUfBofLzoEdt1jqcrCDT6YNhM0aFCqbLOPFtx9cg\n/X2G/G5bPVu8cuFM0L+ehp8s6izK1kjx3OOPH/kWzvstM5tkqgJkNyNEvHdeJl6\nKhS+IFEqwvZqgbBpKuwIDAQAB\n-----END PUBLIC KEY-----',
      padding: crypto.constants.RSA_PKCS1_PADDING
    }, Buffer.from(JSON.stringify({
      k: key,
      t: token.token
    }), 'utf-8')).toString('base64');

    //TODO: Add chapter support
    const streamsRequest = await this.req.getData(linksUrl+'?freeWithAds=true&adaptive=true&withMetadata=true&source=Web', {
      'headers': {
        'X-Player-Token': authorization,
        'X-Target-Distribution': this.locale
      }
    });
    if(!streamsRequest.ok || !streamsRequest.res){
      if (streamsRequest.error?.res!.status == 403 || streamsRequest.res?.status == 403) {
        console.error('Georestricted!');
      } else {
        console.error('Streams request failed!');
      }
      return undefined;
    }
    const streams = await streamsRequest.res.json() as ADNStreams;
    for (const streamName in streams.links.streaming) {
      let audDub: langsData.LanguageItem;
      if (this.jpnStrings.includes(streamName)) {
        audDub = langsData.languages.find(a=>a.code == 'jpn') as langsData.LanguageItem;
      } else if (this.deuStrings.includes(streamName)) {
        audDub = langsData.languages.find(a=>a.code == 'deu') as langsData.LanguageItem;
      } else if (this.fraStrings.includes(streamName)) {
        audDub = langsData.languages.find(a=>a.code == 'fra') as langsData.LanguageItem;
      } else {
        console.error(`Language ${streamName} not recognized, please report this.`);
        continue;
      }

      if (!options.dubLang.includes(audDub.code)) {
        continue;
      }

      console.info(`Requesting: [${data.id}] ${mediaName} (${audDub.name})`);

      variables.push(...([
        ['title', data.title, true],
        ['episode', isNaN(parseFloat(data.shortNumber)) ? data.shortNumber : parseFloat(data.shortNumber), false],
        ['service', 'ADN', false],
        ['seriesTitle', data.show.shortTitle ?? data.show.title, true],
        ['showTitle', data.show.title, true],
        ['season', isNaN(parseFloat(data.season)) ? data.season : parseFloat(data.season), false]
      ] as [AvailableFilenameVars, string|number, boolean][]).map((a): Variable => {
        return {
          name: a[0],
          replaceWith: a[1],
          type: typeof a[1],
          sanitize: a[2]
        } as Variable;
      }));

      console.info('Playlists URL: %s', streams.links.streaming[streamName].auto);

      let tsFile = undefined;

      if (!dlFailed && !options.novids) {
        const streamPlaylistsLocationReq = await this.req.getData(streams.links.streaming[streamName].auto);
        if (!streamPlaylistsLocationReq.ok || !streamPlaylistsLocationReq.res) {
          console.error('CAN\'T FETCH VIDEO PLAYLIST LOCATION!');
          return undefined;
        }
        const streamPlaylistLocation = await streamPlaylistsLocationReq.res.json() as {'location': string};
        const streamPlaylistsReq = await this.req.getData(streamPlaylistLocation.location);
        if (!streamPlaylistsReq.ok || !streamPlaylistsReq.res) {
          console.error('CAN\'T FETCH VIDEO PLAYLISTS!');
          dlFailed = true;
        } else {
          const streamPlaylistBody = await streamPlaylistsReq.res.text();
          const streamPlaylists = m3u8(streamPlaylistBody);
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
            if (plUri.searchParams.get('cdn')){
              plServer += ` (${plUri.searchParams.get('cdn')})`;
            }
            if (!plServerList.includes(plServer)){
              plServerList.push(plServer);
            }
            // add to server
            if (!Object.keys(plStreams).includes(plServer)){
              plStreams[plServer] = {};
            }
            if(
              plStreams[plServer][plResolutionText]
              && plStreams[plServer][plResolutionText] != pl.uri
              && typeof plStreams[plServer][plResolutionText] != 'undefined'
            ) {
              console.error(`Non duplicate url for ${plServer} detected, please report to developer!`);
            } else{
              plStreams[plServer][plResolutionText] = pl.uri;
            }
            // set plQualityStr
            const plBandwidth  = Math.round(pl.attributes.BANDWIDTH/1024);
            const qualityStrAdd   = `${plResolutionText} (${plBandwidth}KiB/s)`;
            const qualityStrRegx  = new RegExp(qualityStrAdd.replace(/([:()/])/g, '\\$1'), 'm');
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
            console.warn(`The requested quality of ${options.q} is greater than the maximum ${plQuality.length}.\n[WARN] Therefor the maximum will be capped at ${plQuality.length}.`);
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
          console.info(`Servers available:\n\t${plServerList.join('\n\t')}`);
          console.info(`Available qualities:\n\t${plQuality.map((a, ind) => `[${ind+1}] ${a.str}`).join('\n\t')}`);

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

            console.info(`Selected quality: ${Object.keys(plSelectedList).find(a => plSelectedList[a] === selPlUrl)} @ ${plSelectedServer}`);
            console.info('Stream URL:', selPlUrl);
            // TODO check filename
            fileName = parseFileName(options.fileName, variables, options.numbers, options.override).join(path.sep);
            const outFile = parseFileName(options.fileName + '.' + audDub.name, variables, options.numbers, options.override).join(path.sep);
            console.info(`Output filename: ${outFile}`);
            const chunkPage = await this.req.getData(selPlUrl);
            if(!chunkPage.ok || !chunkPage.res){
              console.error('CAN\'T FETCH VIDEO PLAYLIST!');
              dlFailed = true;
            } else {
              const chunkPageBody = await chunkPage.res.text();
              const chunkPlaylist = m3u8(chunkPageBody);
              const totalParts = chunkPlaylist.segments.length;
              const mathParts  = Math.ceil(totalParts / options.partsize);
              const mathMsg    = `(${mathParts}*${options.partsize})`;
              console.info('Total parts in stream:', totalParts, mathMsg);
              tsFile = path.isAbsolute(outFile as string) ? outFile : path.join(this.cfg.dir.content, outFile);
              const dirName = path.dirname(tsFile);
              if (!fs.existsSync(dirName)) {
                fs.mkdirSync(dirName, { recursive: true });
              }
              const dlStreamByPl = await new streamdl({
                output: `${tsFile}.ts`,
                timeout: options.timeout,
                m3u8json: chunkPlaylist,
                baseurl: selPlUrl.replace('playlist.m3u8',''),
                threads: options.partsize,
                fsRetryTime: options.fsRetryTime * 1000,
                override: options.force,
                callback: options.callbackMaker ? options.callbackMaker({
                  fileName: `${path.isAbsolute(outFile) ? outFile.slice(this.cfg.dir.content.length) : outFile}`,
                  image: data.image,
                  parent: {
                    title: data.show.title
                  },
                  title: data.title,
                  language: audDub
                }) : undefined
              }).download();
              if (!dlStreamByPl.ok) {
                console.error(`DL Stats: ${JSON.stringify(dlStreamByPl.parts)}\n`);
                dlFailed = true;
              }
              files.push({
                type: 'Video',
                path: `${tsFile}.ts`,
                lang: audDub
              });
              dlVideoOnce = true;
            }
          } else{
            console.error('Quality not selected!\n');
            dlFailed = true;
          }
        }
      } else if (options.novids) {
        console.info('Downloading skipped!');
        fileName = parseFileName(options.fileName, variables, options.numbers, options.override).join(path.sep);
      }
      await this.sleep(options.waittime);
    }

    const compiledChapters: string[] = [];
    if (options.chapters) {
      if (streams.video.tcIntroStart) {
        if (streams.video.tcIntroStart != '00:00:00') {
          compiledChapters.push(
            `CHAPTER${(compiledChapters.length/2)+1}=00:00:00.00`,
            `CHAPTER${(compiledChapters.length/2)+1}NAME=Prologue`
          );
        }
        compiledChapters.push(
          `CHAPTER${(compiledChapters.length/2)+1}=${streams.video.tcIntroStart+'.00'}`,
          `CHAPTER${(compiledChapters.length/2)+1}NAME=Opening`
        );
        compiledChapters.push(
          `CHAPTER${(compiledChapters.length/2)+1}=${streams.video.tcIntroEnd+'.00'}`,
          `CHAPTER${(compiledChapters.length/2)+1}NAME=Episode`
        );
      } else {
        compiledChapters.push(
          `CHAPTER${(compiledChapters.length/2)+1}=00:00:00.00`,
          `CHAPTER${(compiledChapters.length/2)+1}NAME=Episode`
        );
      }

      if (streams.video.tcEndingStart) {
        compiledChapters.push(
          `CHAPTER${(compiledChapters.length/2)+1}=${streams.video.tcEndingStart+'.00'}`,
          `CHAPTER${(compiledChapters.length/2)+1}NAME=Ending Start`
        );
        compiledChapters.push(
          `CHAPTER${(compiledChapters.length/2)+1}=${streams.video.tcEndingEnd+'.00'}`,
          `CHAPTER${(compiledChapters.length/2)+1}NAME=Ending End`
        );
      }

      if (compiledChapters.length > 0) {
        try {
          fileName = parseFileName(options.fileName, variables, options.numbers, options.override).join(path.sep);
          const outFile = parseFileName(options.fileName, variables, options.numbers, options.override).join(path.sep);
          const tsFile = path.isAbsolute(outFile as string) ? outFile : path.join(this.cfg.dir.content, outFile);
          const dirName = path.dirname(tsFile);
          if (!fs.existsSync(dirName)) {
            fs.mkdirSync(dirName, { recursive: true });
          }
          fs.writeFileSync(`${tsFile}.txt`, compiledChapters.join('\r\n'));
          files.push({
            path: `${tsFile}.txt`,
            lang: langsData.languages.find(a=>a.code=='jpn'),
            type: 'Chapters'
          });
        } catch {
          console.error('Failed to write chapter file');
        }
      }
    }

    if(options.dlsubs.indexOf('all') > -1){
      options.dlsubs = ['all'];
    }

    if (options.nosubs) {
      console.info('Subtitles downloading disabled from nosubs flag.');
      options.skipsubs = true;
    }

    if(!options.skipsubs && options.dlsubs.indexOf('none') == -1) {
      if (Object.keys(streams.links.subtitles).length !== 0) {
        const subtitlesUrlReq = await this.req.getData(streams.links.subtitles.all);
        if(!subtitlesUrlReq.ok || !subtitlesUrlReq.res){
          console.error('Subtitle location request failed!');
          return undefined;
        }
        const subtitleUrl = await subtitlesUrlReq.res.json() as {'location': string};
        const encryptedSubtitlesReq = await this.req.getData(subtitleUrl.location);
        if(!encryptedSubtitlesReq.ok || !encryptedSubtitlesReq.res){
          console.error('Subtitle request failed!');
          return undefined;
        }
        const encryptedSubtitles = await encryptedSubtitlesReq.res.text();
        const iv = Buffer.from(encryptedSubtitles.slice(0, 24), 'base64');
        const derivedKey = Buffer.from(decryptionKey, 'hex');
        const encryptedData = Buffer.from(encryptedSubtitles.slice(24), 'base64');
        const decipher = crypto.createDecipheriv('aes-128-cbc', derivedKey, iv);
        const decryptedData = Buffer.concat([decipher.update(encryptedData), decipher.final()]).toString('utf8');
    
        let subIndex = 0;
        const subtitles = JSON.parse(decryptedData) as ADNSubtitles;
        if (Object.keys(subtitles).length === 0) {
          console.warn('No subtitles found.');
        }
        for (const subName in subtitles) {
          let subLang: langsData.LanguageItem;
          if (this.deuSubStrings.includes(subName)) {
            subLang = langsData.languages.find(a=>a.code == 'deu') as langsData.LanguageItem;
          } else if (this.fraSubStrings.includes(subName)) {
            subLang = langsData.languages.find(a=>a.code == 'fra') as langsData.LanguageItem;
          } else {
            console.error(`Language ${subName} not recognized, please report this.`);
            continue;
          }

          if (!options.dlsubs.includes(subLang.locale) && !options.dlsubs.includes('all')) {
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
            let subBody = '[Script Info]'
          + '\nScriptType:V4.00+'
          + '\nWrapStyle: 0'
          + '\nPlayResX: 1280'
          + '\nPlayResY: 720'
          + '\nScaledBorderAndShadow: yes'
          + ''
          + '\n[V4+ Styles]'
          + '\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding'
          + `\nStyle: Default,${options.fontName ?? 'Arial'},${options.fontSize ?? 50},&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,1.95,0,2,0,0,70,0`
          + '\n[Events]'
          + '\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text';

            for (const sub of subtitles[subName]) {
              const [start, end, text, lineAlign, positionAlign] = 
                    [sub.startTime, sub.endTime, sub.text, sub.lineAlign, sub.positionAlign];
              for (const subProp in sub) {
                switch (subProp) {
                case 'startTime':
                case 'endTime':
                case 'text':
                case 'lineAlign':
                case 'positionAlign':
                  break;
                default: 
                  console.warn(`json2ass: Unknown style: ${subProp}`);
                }
              }
              const alignment = (this.posAlignMap[positionAlign] || 2) + (this.lineAlignMap[lineAlign] || 0);
              const xtext = text
                .replace(/ \\N$/g, '\\N')
                .replace(/\\N$/, '')
                .replace(/\r/g, '')
                .replace(/\n/g, '\\N')
                .replace(/\\N +/g, '\\N')
                .replace(/ +\\N/g, '\\N')
                .replace(/(\\N)+/g, '\\N')
                .replace(/<b[^>]*>([^<]*)<\/b>/g, '{\\b1}$1{\\b0}')
                .replace(/<i[^>]*>([^<]*)<\/i>/g, '{\\i1}$1{\\i0}')
                .replace(/<u[^>]*>([^<]*)<\/u>/g, '{\\u1}$1{\\u0}')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&')
                .replace(/<[^>]>/g, '')
                .replace(/\\N$/, '')
                .replace(/ +$/, '');
              subBody += `\nDialogue: 0,${this.convertToSSATimestamp(start)},${this.convertToSSATimestamp(end)},Default,,0,0,0,,${(alignment !== 2 ? `{\\a${alignment}}` : '')}${xtext}`;
            }
            sxData.title = `${subLang.language}`;
            sxData.fonts = fontsData.assFonts(subBody) as Font[];
            fs.writeFileSync(sxData.path, subBody);
            console.info(`Subtitle converted: ${sxData.file}`);
            files.push({
              type: 'Subtitle',
              ...sxData as sxItem,
              cc: false
            });
          }
          subIndex++;
        }
      } else {
        console.warn('Couldn\'t find subtitles.');
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

  public sleep(ms: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}