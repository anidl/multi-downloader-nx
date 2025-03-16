// Package Info
import packageJson from './package.json';

// Node
import path from 'path';
import fs from 'fs-extra';

// Plugins
import shlp from 'sei-helper';

// Modules
import * as fontsData from './modules/module.fontsData';
import * as langsData from './modules/module.langsData';
import * as yamlCfg from './modules/module.cfg-loader';
import * as yargs from './modules/module.app-args';
import * as reqModule from './modules/module.fetch';
import Merger, { Font, MergerInput, SubtitleInput } from './modules/module.merger';
import { canDecrypt, getKeysWVD, cdm, getKeysPRD } from './modules/cdm';
import streamdl, { M3U8Json } from './modules/hls-download';
import { exec } from './modules/sei-helper-fixes';
import { console } from './modules/log';
import { domain } from './modules/module.api-urls';
import { downloaded } from './modules/module.downloadArchive';
import parseSelect from './modules/module.parseSelect';
import parseFileName, { Variable } from './modules/module.filename';
import { AvailableFilenameVars } from './modules/module.args';
import { parse } from './modules/module.transform-mpd';

// Types
import { ServiceClass } from './@types/serviceClassInterface';
import { AuthData, AuthResponse, SearchData, SearchResponse, SearchResponseItem } from './@types/messageHandler';
import { AOSearchResult, AnimeOnegaiSearch } from './@types/animeOnegaiSearch';
import { AnimeOnegaiSeries } from './@types/animeOnegaiSeries';
import { AnimeOnegaiSeasons, Episode } from './@types/animeOnegaiSeasons';
import { DownloadedMedia } from './@types/hidiveTypes';
import { AnimeOnegaiStream } from './@types/animeOnegaiStream';
import { sxItem } from './crunchy';

type parsedMultiDubDownload = {
  data: {
    lang: string,
    videoId: string
    episode: Episode
  }[],
  seriesTitle: string,
  seasonTitle: string,
  episodeTitle: string,
  episodeNumber: number,
  seasonNumber: number,
  seriesID: number,
  seasonID: number,
  image: string,
}

export default class AnimeOnegai implements ServiceClass { 
  public cfg: yamlCfg.ConfigObject;
  private token: Record<string, any>;
  private req: reqModule.Req;
  public locale: string;
  public jpnStrings: string[] = [
    'Japonés con Subtítulos en Español', 
    'Japonés con Subtítulos en Portugués',
    'Japonês com legendas em espanhol',
    'Japonês com legendas em português',
    'Japonés'
  ];
  public spaStrings: string[] = [
    'Doblaje en Español',
    'Dublagem em espanhol',
    'Español',
  ];
  public porStrings: string[] = [
    'Doblaje en Portugués',
    'Dublagem em português'
  ];
  private defaultOptions: RequestInit = {
    'headers': {
      'origin': 'https://www.animeonegai.com',
      'referer': 'https://www.animeonegai.com/',
    }
  };

  constructor(private debug = false) {
    this.cfg = yamlCfg.loadCfg();
    this.token = yamlCfg.loadAOToken();
    this.req = new reqModule.Req(domain, debug, false, 'ao');
    this.locale = 'es';
  }

  public async cli() {
    console.info(`\n=== Multi Downloader NX ${packageJson.version} ===\n`);
    const argv = yargs.appArgv(this.cfg.cli);
    if (['pt', 'es'].includes(argv.locale))
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
        username: argv.username ?? await shlp.question('[Q] LOGIN/EMAIL'),
        password: argv.password ?? await shlp.question('[Q] PASSWORD   ')
      });
    } else if (argv.search && argv.search.length > 2) {
      //Search
      await this.doSearch({ ...argv, search: argv.search as string });
    } else if (argv.s && !isNaN(parseInt(argv.s,10)) && parseInt(argv.s,10) > 0) {
      const selected = await this.selectShow(parseInt(argv.s), argv.e, argv.but, argv.all, argv);
      if (selected.isOk) {
        for (const select of selected.value) {
          if (!(await this.downloadEpisode(select, {...argv, skipsubs: false}))) {
            console.error(`Unable to download selected episode ${select.episodeNumber}`);
            return false;
          }
        }
      }
      return true;
    } else if (argv.token) { 
      this.token = {token: argv.token};
      yamlCfg.saveAOToken(this.token);
      console.info('Saved token');
    } else {
      console.info('No option selected or invalid value entered. Try --help.');
    }
  }

  public async doSearch(data: SearchData): Promise<SearchResponse> {
    const searchReq = await this.req.getData(`https://api.animeonegai.com/v1/search/algolia/${encodeURIComponent(data.search)}?lang=${this.locale}`, this.defaultOptions);
    if (!searchReq.ok || !searchReq.res) {
      console.error('Search FAILED!');
      return { isOk: false, reason: new Error('Search failed. No more information provided') };
    }
    const searchData = await searchReq.res.json() as AnimeOnegaiSearch;
    const searchItems: AOSearchResult[] = [];
    console.info('Search Results:');
    for (const hit of searchData.list) {
      searchItems.push(hit);
      let fullType: string;
      if (hit.asset_type == 2) {
        fullType = `S.${hit.ID}`;
      } else if (hit.asset_type == 1) {
        fullType = `E.${hit.ID}`;
      } else {
        fullType = 'Unknown';
        console.warn(`Unknown asset type ${hit.asset_type}, please report this.`);
      }
      console.log(`[${fullType}] ${hit.title}`);
    }
    return { isOk: true, value: searchItems.filter(a => a.asset_type == 2).flatMap((a): SearchResponseItem => {
      return {
        id: a.ID+'',
        image: a.poster ?? '/notFound.png',
        name: a.title,
        rating: a.likes,
        desc: a.description
      };
    })};
  }

  public async doAuth(data: AuthData): Promise<AuthResponse>  {
    data;
    console.error('Authentication not possible, manual authentication required due to recaptcha. In order to login use the --token flag. You can get the token by logging into the website, and opening the dev console and running the command "localStorage.ott_token"');
    return { isOk: false, reason: new Error('Authentication not possible, manual authentication required do to recaptcha.') };
  }

  public async getShow(id: number) {
    const getSeriesData = await this.req.getData(`https://api.animeonegai.com/v1/asset/${id}?lang=${this.locale}`, this.defaultOptions);
    if (!getSeriesData.ok || !getSeriesData.res) { 
      console.error('Failed to get Show Data');
      return { isOk: false };
    }
    const seriesData = await getSeriesData.res.json() as AnimeOnegaiSeries;

    const getSeasonData = await this.req.getData(`https://api.animeonegai.com/v1/asset/content/${id}?lang=${this.locale}`, this.defaultOptions);
    if (!getSeasonData.ok || !getSeasonData.res) {
      console.error('Failed to get Show Data');
      return { isOk: false };
    }
    const seasonData = await getSeasonData.res.json() as AnimeOnegaiSeasons[];

    return { isOk: true, data: seriesData, seasons: seasonData };
  }

  public async listShow(id: number, outputEpisode: boolean = true) {
    const series = await this.getShow(id);
    if (!series.isOk || !series.data) {
      console.error('Failed to list series data: Failed to get series');
      return { isOk: false };
    }
    console.info(`[S.${series.data.ID}] ${series.data.title} (${series.seasons.length} Seasons)`);
    if (series.seasons.length === 0 && series.data.asset_type !== 1) {
      console.info('  No Seasons found!');
      return { isOk: false };
    }
    const episodes: { [key: string]: (Episode & { lang?: string })[] } = {};
    for (const season of series.seasons) {
      let lang: string | undefined = undefined;
      if (this.jpnStrings.includes(season.name.trim())) lang = 'ja';
      else if (this.porStrings.includes(season.name.trim())) lang = 'pt';
      else if (this.spaStrings.includes(season.name.trim())) lang = 'es';
      else {lang = 'unknown';console.error(`Language (${season.name.trim()}) not known, please report this!`);}
      for (const episode of season.list) {
        if (!episodes[episode.number]) {
          episodes[episode.number] = [];
        }
        /*if (!episodes[episode.number].find(a=>a.lang == lang))*/ episodes[episode.number].push({...episode, lang});
      }
    }
    //Item is movie, lets define it manually
    if (series.data.asset_type === 1 && series.seasons.length === 0) {
      let lang: string | undefined;
      if (this.jpnStrings.some(str => series.data.title.includes(str))) lang = 'ja';
      else if (this.porStrings.some(str => series.data.title.includes(str))) lang = 'pt';
      else if (this.spaStrings.some(str => series.data.title.includes(str))) lang = 'es';
      else {lang = 'unknown';console.error('Language could not be parsed from movie title, please report this!');}
      episodes[1] = [{
        'video_entry': series.data.video_entry,
        'number': 1,
        'season_id': 1,
        'name': series.data.title,
        'ID': series.data.ID,
        'CreatedAt': series.data.CreatedAt,
        'DeletedAt': series.data.DeletedAt,
        'UpdatedAt': series.data.UpdatedAt,
        'active': series.data.active,
        'description': series.data.description,
        'age_restriction': series.data.age_restriction,
        'asset_id': series.data.ID,
        'ending': null,
        'entry': series.data.entry,
        'stream_url': series.data.stream_url,
        'skip_intro': null,
        'thumbnail': series.data.bg,
        'open_free': false,
        lang
      }]; // as unknown as (Episode & { lang?: string })[];
      // The above needs to be uncommented if the episode number should be M1 instead of 1
    }
    //Enable to output episodes seperate from selection
    if (outputEpisode) {
      for (const episodeKey in episodes) {
        const episode = episodes[episodeKey][0];
        const langs = Array.from(new Set(episodes[episodeKey].map(a=>a.lang)));
        console.info(`  [E.${episode.ID}] E${episode.number} - ${episode.name} (${langs.map(a=>{
          if (a) return langsData.languages.find(b=>b.ao_locale === a)?.name;
          return 'Unknown';
        }).join(', ')})`);
      }
    }
    return { isOk: true, value: episodes, series: series };
  }

  public async selectShow(id: number, e: string | undefined, but: boolean, all: boolean, options: yargs.ArgvType) {
    const getShowData = await this.listShow(id, false);
    if (!getShowData.isOk || !getShowData.value) {
      return { isOk: false, value: [] };
    }
    //const showData = getShowData.value;
    const doEpsFilter = parseSelect(e as string);
    // build selected episodes
    const selEpsArr: parsedMultiDubDownload[] = [];
    const episodes = getShowData.value;
    const seasonNumberTitleParse = getShowData.series.data.title.match(/\d+/);
    const seasonNumber = seasonNumberTitleParse ? parseInt(seasonNumberTitleParse[0]) : 1;
    for (const episodeKey in getShowData.value) {
      const episode = episodes[episodeKey][0];
      const selectedLangs: string[] = [];
      const selected: {
        lang: string,
        videoId: string
        episode: Episode
      }[] = [];
      for (const episode of episodes[episodeKey]) {
        const lang = langsData.languages.find(a=>a.ao_locale === episode.lang);
        let isSelected = false;
        if (typeof selected.find(a=>a.lang == episode.lang) == 'undefined') {
          if (options.dubLang.includes(lang?.code ?? 'Unknown')) {
            if ((but && !doEpsFilter.isSelected([episode.number+'', episode.ID+''])) || all || (!but && doEpsFilter.isSelected([episode.number+'', episode.ID+'']))) {
              isSelected = true;
              selected.push({lang: episode.lang as string, videoId: episode.video_entry, episode: episode });
            }
          }
          const selectedLang = isSelected ? `✓ ${lang?.name ?? 'Unknown'}` : `${lang?.name ?? 'Unknown'}`;
          if (!selectedLangs.includes(selectedLang)) {
            selectedLangs.push(selectedLang);
          }
        }
      }
      if (selected.length > 0) {
        selEpsArr.push({
          'data': selected,
          'seasonNumber': seasonNumber,
          'episodeNumber': episode.number,
          'episodeTitle': episode.name,
          'image': episode.thumbnail,
          'seasonID': episode.season_id,
          'seasonTitle': getShowData.series.data.title,
          'seriesTitle': getShowData.series.data.title,
          'seriesID': getShowData.series.data.ID
        });
      }
      console.info(`  [S${seasonNumber}E${episode.number}] - ${episode.name} (${selectedLangs.join(', ')})`);
    }
    return { isOk: true, value: selEpsArr, showData: getShowData.series };
  }

  public async downloadEpisode(data: parsedMultiDubDownload, options: yargs.ArgvType): Promise<boolean> {
    const res = await this.downloadMediaList(data, options);
    if (res === undefined || res.error) {
      return false;
    } else {
      if (!options.skipmux) {
        await this.muxStreams(res.data, { ...options, output: res.fileName });
      } else {
        console.info('Skipping mux');
      }
      downloaded({
        service: 'ao',
        type: 's'
      }, data.seasonID+'', [data.episodeNumber+'']);
    }
    return true;
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

  public async downloadMediaList(medias: parsedMultiDubDownload, options: yargs.ArgvType) : Promise<{
    data: DownloadedMedia[],
    fileName: string,
    error: boolean
  } | undefined> {
    if(!this.token.token){
      console.error('Authentication required!');
      return;
    }

    if (!this.cfg.bin.ffmpeg) 
      this.cfg.bin = await yamlCfg.loadBinCfg();

    let mediaName = '...';
    let fileName;
    const variables: Variable[] = [];
    if(medias.seasonTitle && medias.episodeNumber && medias.episodeTitle){
      mediaName = `${medias.seasonTitle} - ${medias.episodeNumber} - ${medias.episodeTitle}`;
    }

    const files: DownloadedMedia[] = [];

    let subIndex = 0;
    let dlFailed = false;
    let dlVideoOnce = false; // Variable to save if best selected video quality was downloaded

    for (const media of medias.data) {
      console.info(`Requesting: [E.${media.episode.ID}] ${mediaName}`);

      const AuthHeaders = {
        headers: {
          Authorization: `Bearer ${this.token.token}`,
          'Referer': 'https://www.animeonegai.com/',
          'Origin': 'https://www.animeonegai.com',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Content-Type': 'application/json'
        }
      };

      const playbackReq = await this.req.getData(`https://api.animeonegai.com/v1/media/${media.videoId}?lang=${this.locale}`, AuthHeaders);
      if(!playbackReq.ok || !playbackReq.res){
        console.error('Request Stream URLs FAILED!');
        return undefined;
      }
      const streamData = await playbackReq.res.json() as AnimeOnegaiStream;

      variables.push(...([
        ['title', medias.episodeTitle, true],
        ['episode', medias.episodeNumber, false],
        ['service', 'AO', false],
        ['seriesTitle', medias.seriesTitle, true],
        ['showTitle', medias.seasonTitle, true],
        ['season', medias.seasonNumber, false]
      ] as [AvailableFilenameVars, string|number, boolean][]).map((a): Variable => {
        return {
          name: a[0],
          replaceWith: a[1],
          type: typeof a[1],
          sanitize: a[2]
        } as Variable;
      }));

      if (!canDecrypt) {
        console.error('No valid Widevine or PlayReady CDM detected. Please ensure a supported and functional CDM is installed.');
        return undefined;
      }
      
      if (!this.cfg.bin.mp4decrypt && !this.cfg.bin.shaka) {
        console.error('Neither Shaka nor MP4Decrypt found. Please ensure at least one of them is installed.');
        return undefined;
      }

      const lang = langsData.languages.find(a=>a.ao_locale == media.lang) as langsData.LanguageItem;
      if (!lang) {
        console.error(`Unable to find language for code ${media.lang}`);
        return;
      }
      let tsFile = undefined;

      if (!streamData.dash) {
        console.error('You don\'t have access to download this content');
        continue;
      }

      console.info('Playlists URL: %s', streamData.dash);

      if(!dlFailed && !(options.novids && options.noaudio)){
        const streamPlaylistsReq = await this.req.getData(streamData.dash, AuthHeaders);
        if(!streamPlaylistsReq.ok || !streamPlaylistsReq.res){
          console.error('CAN\'T FETCH VIDEO PLAYLISTS!');
          dlFailed = true;
        } else {
          const streamPlaylistBody = (await streamPlaylistsReq.res.text()).replace(/<BaseURL>(.*?)<\/BaseURL>/g, `<BaseURL>${streamData.dash.split('/dash/')[0]}/dash/$1</BaseURL>`);
          //Parse MPD Playlists
          const streamPlaylists = await parse(streamPlaylistBody, lang as langsData.LanguageItem, streamData.dash.split('/dash/')[0]+'/dash/');

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
              resolutionText: `${Math.round(item.bandwidth/1024)}kB/s`
            };
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

          let chosenAudioQuality = options.q === 0 ? audios.length : options.q;
          if(chosenAudioQuality > audios.length) {
            chosenAudioQuality = audios.length;
          }
          chosenAudioQuality--;

          const chosenVideoSegments = videos[chosenVideoQuality];
          const chosenAudioSegments = audios[chosenAudioQuality];

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

          console.info(`Selected quality: \n\tVideo: ${chosenVideoSegments.resolutionText}\n\tAudio: ${chosenAudioSegments.resolutionText}\n\tServer: ${selectedServer}`);
          //console.info('Stream URL:', chosenVideoSegments.segments[0].uri);
          // TODO check filename
          fileName = parseFileName(options.fileName, variables, options.numbers, options.override).join(path.sep);
          const outFile = parseFileName(options.fileName + '.' + lang.name, variables, options.numbers, options.override).join(path.sep);
          const tempFile = parseFileName(`temp-${media.videoId}`, variables, options.numbers, options.override).join(path.sep);
          const tempTsFile = path.isAbsolute(tempFile as string) ? tempFile : path.join(this.cfg.dir.content, tempFile);

          let [audioDownloaded, videoDownloaded] = [false, false];

          // When best selected video quality is already downloaded
          if(dlVideoOnce && options.dlVideoOnce) {
            console.info('Already downloaded video, skipping video download...');
          } else if (options.novids) {
            console.info('Skipping video download...');
          } else {
            //Download Video
            const totalParts = chosenVideoSegments.segments.length;
            const mathParts  = Math.ceil(totalParts / options.partsize);
            const mathMsg    = `(${mathParts}*${options.partsize})`;
            console.info('Total parts in video stream:', totalParts, mathMsg);
            tsFile = path.isAbsolute(outFile as string) ? outFile : path.join(this.cfg.dir.content, outFile);
            const dirName = path.dirname(tsFile);
            if (!fs.existsSync(dirName)) {
              fs.mkdirSync(dirName, { recursive: true });
            }
            const videoJson: M3U8Json = {
              segments: chosenVideoSegments.segments
            };
            try {
              const videoDownload = await new streamdl({
                output: chosenVideoSegments.pssh_wvd ? `${tempTsFile}.video.enc.m4s` : `${tsFile}.video.m4s`,
                timeout: options.timeout,
                m3u8json: videoJson,
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
              if(!videoDownload.ok){
                console.error(`DL Stats: ${JSON.stringify(videoDownload.parts)}\n`);
                dlFailed = true;
              } else {
                dlVideoOnce = true;
                videoDownloaded = true;
              }
            } catch (e) {
              console.error(e);
              dlFailed = true;
            }
          }

          if (chosenAudioSegments && !options.noaudio) {
            //Download Audio (if available)
            const totalParts = chosenAudioSegments.segments.length;
            const mathParts  = Math.ceil(totalParts / options.partsize);
            const mathMsg    = `(${mathParts}*${options.partsize})`;
            console.info('Total parts in audio stream:', totalParts, mathMsg);
            tsFile = path.isAbsolute(outFile as string) ? outFile : path.join(this.cfg.dir.content, outFile);
            const dirName = path.dirname(tsFile);
            if (!fs.existsSync(dirName)) {
              fs.mkdirSync(dirName, { recursive: true });
            }
            const audioJson: M3U8Json = {
              segments: chosenAudioSegments.segments
            };
            try {
              const audioDownload = await new streamdl({
                output: chosenAudioSegments.pssh_wvd ? `${tempTsFile}.audio.enc.m4s` : `${tsFile}.audio.m4s`,
                timeout: options.timeout,
                m3u8json: audioJson,
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
              if(!audioDownload.ok){
                console.error(`DL Stats: ${JSON.stringify(audioDownload.parts)}\n`);
                dlFailed = true;
              } else {
                audioDownloaded = true;
              }
            } catch (e) {
              console.error(e);
              dlFailed = true;
            }
          } else if (options.noaudio) {
            console.info('Skipping audio download...');
          }

          //Handle Decryption if needed
          if ((chosenVideoSegments.pssh_wvd || chosenAudioSegments.pssh_wvd) && (videoDownloaded || audioDownloaded)) {
            console.info('Decryption Needed, attempting to decrypt');
            let encryptionKeys;

            if (cdm === 'widevine') {
              encryptionKeys = await getKeysWVD(chosenVideoSegments.pssh_wvd, streamData.widevine_proxy, {});
            }
            if (cdm === 'playready') {
              encryptionKeys = await getKeysPRD(chosenVideoSegments.pssh_prd, streamData.playready_proxy, {});
            }

            if (!encryptionKeys || encryptionKeys.length == 0) {
              console.error('Failed to get encryption keys');
              return undefined;
            }
            /*const keys = {} as Record<string, string>;
              encryptionKeys.forEach(function(key) {
                keys[key.kid] = key.key;
              });*/

            if (this.cfg.bin.mp4decrypt || this.cfg.bin.shaka) {
              let commandBase = `--show-progress --key ${encryptionKeys[cdm === 'playready' ? 0 : 1].kid}:${encryptionKeys[cdm === 'playready' ? 0 : 1].key} `;
              let commandVideo = commandBase+`"${tempTsFile}.video.enc.m4s" "${tempTsFile}.video.m4s"`;
              let commandAudio = commandBase+`"${tempTsFile}.audio.enc.m4s" "${tempTsFile}.audio.m4s"`;

              if (this.cfg.bin.shaka) {
                commandBase = ` --enable_raw_key_decryption ${encryptionKeys.map(kb => '--keys key_id='+kb.kid+':key='+kb.key).join(' ')}`;
                commandVideo = `input="${tempTsFile}.video.enc.m4s",stream=video,output="${tempTsFile}.video.m4s"`+commandBase;
                commandAudio = `input="${tempTsFile}.audio.enc.m4s",stream=audio,output="${tempTsFile}.audio.m4s"`+commandBase;
              }

              if (videoDownloaded) {
                console.info('Started decrypting video,', this.cfg.bin.shaka ? 'using shaka' : 'using mp4decrypt');
                const decryptVideo = exec(this.cfg.bin.shaka ? 'shaka-packager' : 'mp4decrypt', this.cfg.bin.shaka ? `"${this.cfg.bin.shaka}"` : `"${this.cfg.bin.mp4decrypt}"`, commandVideo);
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
                    lang: lang
                  });
                }
              }

              if (audioDownloaded) {
                console.info('Started decrypting audio,', this.cfg.bin.shaka ? 'using shaka' : 'using mp4decrypt');
                const decryptAudio = exec(this.cfg.bin.shaka ? 'shaka' : 'mp4decrypt', this.cfg.bin.shaka ? `"${this.cfg.bin.shaka}"` : `"${this.cfg.bin.mp4decrypt}"`, commandAudio);
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
                    lang: lang
                  });
                  console.info('Decryption done for audio');
                }
              }
            } else {
              console.warn('mp4decrypt/shaka not found, files need decryption. Decryption Keys:', encryptionKeys);
            }
          } else {
            if (videoDownloaded) {
              files.push({
                type: 'Video',
                path: `${tsFile}.video.m4s`,
                lang: lang
              });
            }
            if (audioDownloaded) {
              files.push({
                type: 'Audio',
                path: `${tsFile}.audio.m4s`,
                lang: lang
              });
            }
          }
        }
      } else if (options.novids && options.noaudio) {
        fileName = parseFileName(options.fileName, variables, options.numbers, options.override).join(path.sep);
      }

      if(options.dlsubs.indexOf('all') > -1){
        options.dlsubs = ['all'];
      }

      if (options.nosubs) {
        console.info('Subtitles downloading disabled from nosubs flag.');
        options.skipsubs = true;
      }

      if (!options.skipsubs && options.dlsubs.indexOf('none') == -1) {
        if(streamData.subtitles.length > 0) {
          for(const sub of streamData.subtitles) {
            const subLang = langsData.languages.find(a => a.ao_locale === sub.lang);
            if (!subLang) {
              console.warn(`Language not found for subtitle language: ${sub.lang}, Skipping`);
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
            if((options.dlsubs.includes('all') || options.dlsubs.includes(subLang.locale)) && sub.url.includes('.ass')) {
              const getSubtitle = await this.req.getData(sub.url, AuthHeaders);
              if (getSubtitle.ok && getSubtitle.res) {
                console.info(`Subtitle Downloaded: ${sub.url}`);
                const sBody = await getSubtitle.res.text();
                sxData.title = `${subLang.language}`;
                sxData.fonts = fontsData.assFonts(sBody) as Font[];
                fs.writeFileSync(sxData.path, sBody);
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
      }
      else{
        console.info('Subtitles downloading skipped!');
      }
      await this.sleep(options.waittime);
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