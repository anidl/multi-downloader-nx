import * as iso639 from 'iso-639';
import * as yamlCfg from './module.cfg-loader';
import { fontFamilies, fontMime } from './module.fontsData';
import path from 'path';
import fs from 'fs';
import { LanguageItem } from './module.langsData';
import { AvailableMuxer } from './module.args';
import { console } from './log';
import ffprobe from 'ffprobe';
import Helper from './module.helper';

export type MergerInput = {
  path: string,
  lang: LanguageItem,
  duration?: number,
  delay?: number,
  isPrimary?: boolean,
}

export type SubtitleInput = {
  language: LanguageItem,
  file: string,
  closedCaption?: boolean,
  signs?: boolean,
  delay?: number
}

export type Font = keyof typeof fontFamilies;

export type ParsedFont = {
  name: string,
  path: string,
  mime: string,
}

export type MergerOptions = {
  videoAndAudio: MergerInput[],
  onlyVid: MergerInput[],
  onlyAudio: MergerInput[],
  subtitles: SubtitleInput[],
  chapters?: MergerInput[],
  ccTag: string,
  output: string,
  videoTitle?: string,
  simul?: boolean,
  inverseTrackOrder?: boolean,
  keepAllVideos?: boolean,
  fonts?: ParsedFont[],
  skipSubMux?: boolean,
  options: {
    ffmpeg: string[],
    mkvmerge: string[]
  },
  defaults: {
    audio: LanguageItem,
    sub: LanguageItem
  }
}

class Merger {
  
  constructor(private options: MergerOptions) {
    if (this.options.skipSubMux)
      this.options.subtitles = [];
    if (this.options.videoTitle)
      this.options.videoTitle = this.options.videoTitle.replace(/"/g, '\'');
  }

  public async createDelays() {
    //Don't bother scanning it if there is only 1 vna stream
    if (this.options.videoAndAudio.length > 1) {
      const bin = await yamlCfg.loadBinCfg();
      const vnas = this.options.videoAndAudio;
      //get and set durations on each videoAndAudio Stream
      for (const [vnaIndex, vna] of vnas.entries()) {
        const streamInfo = await ffprobe(vna.path, { path: bin.ffprobe as string });
        const videoInfo = streamInfo.streams.filter(stream => stream.codec_type == 'video');
        vnas[vnaIndex].duration = parseInt(videoInfo[0].duration as string);
      }
      //Sort videoAndAudio streams by duration (shortest first)
      vnas.sort((a,b) => {
        if (!a.duration || !b.duration) return -1;
        return a.duration - b.duration;
      });
      //Set Delays
      const shortestDuration = vnas[0].duration;
      for (const [vnaIndex, vna] of vnas.entries()) {
        //Don't calculate the shortestDuration track
        if (vnaIndex == 0) {
          if (!vna.isPrimary && vna.isPrimary !== undefined) 
            console.warn('Shortest video isn\'t primary, this might lead to problems with subtitles. Please report on github or discord if you experience issues.');
          continue;
        }
        if (vna.duration && shortestDuration) {
          //Calculate the tracks delay
          vna.delay = Math.ceil((vna.duration-shortestDuration) * 1000) / 1000;
          //TODO: set primary language for audio so it can be used to determine which track needs the delay
          //The above is a problem in the event that it isn't the dub that needs the delay, but rather the sub.
          //Alternatively: Might not work: it could be checked if there are multiple of the same video language, and if there is
          //more than 1 of the same video language, then do the subtitle delay on CC, else normal language.
          const subtitles = this.options.subtitles.filter(sub => sub.language.code == vna.lang.code);
          for (const [subIndex, sub] of subtitles.entries()) {
            if (vna.isPrimary) subtitles[subIndex].delay = vna.delay;
            else if (sub.closedCaption) subtitles[subIndex].delay = vna.delay;
          }
        }
      }
    }
  }

  public FFmpeg() : string {
    const args: string[] = [];
    const metaData: string[] = [];

    let index = 0;
    let audioIndex = 0;
    let hasVideo = false;

    for (const vid of this.options.videoAndAudio) {
      if (vid.delay && hasVideo) {
        args.push(
          `-itsoffset -${Math.ceil(vid.delay*1000)}ms`
        );
      }
      args.push(`-i "${vid.path}"`);
      if (!hasVideo || this.options.keepAllVideos) {
        metaData.push(`-map ${index}:a -map ${index}:v`);
        metaData.push(`-metadata:s:a:${audioIndex} language=${vid.lang.code}`);
        metaData.push(`-metadata:s:v:${index} title="${this.options.videoTitle}"`);
        hasVideo = true;
      } else {
        metaData.push(`-map ${index}:a`);
        metaData.push(`-metadata:s:a:${audioIndex} language=${vid.lang.code}`);
      }
      audioIndex++;
      index++;
    }

    for (const vid of this.options.onlyVid) {
      if (!hasVideo || this.options.keepAllVideos) {
        args.push(`-i "${vid.path}"`);
        metaData.push(`-map ${index} -map -${index}:a`);
        metaData.push(`-metadata:s:v:${index} title="${this.options.videoTitle}"`);
        hasVideo = true;
        index++;
      }
    }

    for (const aud of this.options.onlyAudio) {
      args.push(`-i "${aud.path}"`);
      metaData.push(`-map ${index}`);
      metaData.push(`-metadata:s:a:${audioIndex} language=${aud.lang.code}`);
      index++;
      audioIndex++;
    }

    for (const index in this.options.subtitles) {
      const sub = this.options.subtitles[index];
      if (sub.delay) {
        args.push(
          `-itsoffset -${Math.ceil(sub.delay*1000)}ms`
        );
      }
      args.push(`-i "${sub.file}"`);
    }

    if (this.options.output.split('.').pop() === 'mkv') {
      if (this.options.fonts) {
        let fontIndex = 0;
        for (const font of this.options.fonts) {
          args.push(`-attach ${font.path} -metadata:s:t:${fontIndex} mimetype=${font.mime} -metadata:s:t:${fontIndex} filename=${font.name}`);
          fontIndex++;
        }
      }
    }

    //TODO: Make it possible for chapters to work with ffmpeg merging

    args.push(...metaData);
    args.push(...this.options.subtitles.map((_, subIndex) => `-map ${subIndex + index}`));
    args.push(
      '-c:v copy',
      '-c:a copy',
      this.options.output.split('.').pop()?.toLowerCase() === 'mp4' ? '-c:s mov_text' : '-c:s ass',
      ...this.options.subtitles.map((sub, subindex) => `-metadata:s:s:${subindex} title="${
        (sub.language.language || sub.language.name) + `${sub.closedCaption === true ? ` ${this.options.ccTag}` : ''}` + `${sub.signs === true ? ' Signs' : ''}`
      }" -metadata:s:s:${subindex} language=${sub.language.code}`)
    );
    args.push(...this.options.options.ffmpeg);
    args.push(`"${this.options.output}"`);
    return args.join(' ');
  }

  public static getLanguageCode = (from: string, _default = 'eng'): string => {
    if (from === 'cmn') return 'chi';
    for (const lang in iso639.iso_639_2) {
      const langObj = iso639.iso_639_2[lang];
      if (Object.prototype.hasOwnProperty.call(langObj, '639-1') && langObj['639-1'] === from) {
        return langObj['639-2'] as string;
      }
    }
    return _default;
  };

  public MkvMerge = () => {
    const args: string[] = [];

    let hasVideo = false;

    args.push(`-o "${this.options.output}"`);
    args.push(...this.options.options.mkvmerge);

    for (const vid of this.options.onlyVid) {
      if (!hasVideo || this.options.keepAllVideos) {
        args.push(
          '--video-tracks 0',
          '--no-audio'
        );
        const trackName = ((this.options.videoTitle ?? vid.lang.name) + (this.options.simul ? ' [Simulcast]' : ' [Uncut]'));
        args.push('--track-name', `0:"${trackName}"`);
        args.push(`--language 0:${vid.lang.code}`);
        hasVideo = true;
        args.push(`"${vid.path}"`);
      }
    }

    for (const vid of this.options.videoAndAudio) {
      const audioTrackNum = this.options.inverseTrackOrder ? '0' : '1';
      const videoTrackNum = this.options.inverseTrackOrder ? '1' : '0';
      if (vid.delay) {
        args.push(
          `--sync ${audioTrackNum}:-${Math.ceil(vid.delay*1000)}`
        );
      }
      if (!hasVideo || this.options.keepAllVideos) {
        args.push(
          `--video-tracks ${videoTrackNum}`,
          `--audio-tracks ${audioTrackNum}`
        );
        const trackName = ((this.options.videoTitle ?? vid.lang.name) + (this.options.simul ? ' [Simulcast]' : ' [Uncut]'));
        args.push('--track-name', `0:"${trackName}"`);
        //args.push('--track-name', `1:"${trackName}"`);
        args.push(`--language ${audioTrackNum}:${vid.lang.code}`);
        if (this.options.defaults.audio.code === vid.lang.code) {
          args.push(`--default-track ${audioTrackNum}`);
        } else {
          args.push(`--default-track ${audioTrackNum}:0`);
        }
        hasVideo = true;
      } else {
        args.push(
          '--no-video',
          `--audio-tracks ${audioTrackNum}`
        );
        if (this.options.defaults.audio.code === vid.lang.code) {
          args.push(`--default-track ${audioTrackNum}`);
        } else {
          args.push(`--default-track ${audioTrackNum}:0`);
        }
        args.push('--track-name', `${audioTrackNum}:"${vid.lang.name}"`);
        args.push(`--language ${audioTrackNum}:${vid.lang.code}`);
      }
      args.push(`"${vid.path}"`);
    }

    for (const aud of this.options.onlyAudio) {
      const trackName = aud.lang.name;
      args.push('--track-name', `0:"${trackName}"`);
      args.push(`--language 0:${aud.lang.code}`);
      args.push(
        '--no-video',
        '--audio-tracks 0'
      );
      if (this.options.defaults.audio.code === aud.lang.code) {
        args.push('--default-track 0');
      } else {
        args.push('--default-track 0:0');
      }
      args.push(`"${aud.path}"`);
    }

    if (this.options.subtitles.length > 0) {
      for (const subObj of this.options.subtitles) {
        if (subObj.delay) {
          args.push(
            `--sync 0:-${Math.ceil(subObj.delay*1000)}`
          );
        }
        args.push('--track-name', `0:"${(subObj.language.language || subObj.language.name) + `${subObj.closedCaption === true ? ` ${this.options.ccTag}` : ''}` + `${subObj.signs === true ? ' Signs' : ''}`}"`);
        args.push('--language', `0:"${subObj.language.code}"`);
        //TODO: look into making Closed Caption default if it's the only sub of the default language downloaded
        if (this.options.defaults.sub.code === subObj.language.code && !subObj.closedCaption) {
          args.push('--default-track 0');
        } else {
          args.push('--default-track 0:0');
        }
        args.push(`"${subObj.file}"`);
      }
    } else {
      args.push(
        '--no-subtitles',
      );
    }

    if (this.options.fonts && this.options.fonts.length > 0) {
      for (const f of this.options.fonts) {
        args.push('--attachment-name', f.name);
        args.push('--attachment-mime-type', f.mime);
        args.push('--attach-file', `"${f.path}"`);
      }
    } else {
      args.push(
        '--no-attachments'
      );
    }

    if (this.options.chapters && this.options.chapters.length > 0) {
      args.push(`--chapters "${this.options.chapters[0].path}"`);
    }

    return args.join(' ');
  };

  public static checkMerger(bin: {
    mkvmerge?: string,
    ffmpeg?: string,
  }, useMP4format: boolean, force: AvailableMuxer|undefined) : {
    MKVmerge?: string,
    FFmpeg?: string
  } {
    if (force && bin[force]) {
      return {
        FFmpeg: force === 'ffmpeg' ? bin.ffmpeg : undefined,
        MKVmerge: force === 'mkvmerge' ? bin.mkvmerge : undefined
      };
    }
    if (useMP4format && bin.ffmpeg) {
      return {
        FFmpeg: bin.ffmpeg
      };
    } else if (!useMP4format && (bin.mkvmerge || bin.ffmpeg)) {
      return {
        MKVmerge: bin.mkvmerge,
        FFmpeg: bin.ffmpeg
      };
    } else if (useMP4format) {
      console.warn('FFmpeg not found, skip muxing...');
    } else if (!bin.mkvmerge) {
      console.warn('MKVMerge not found, skip muxing...');
    }
    return {};
  }

  public static makeFontsList (fontsDir: string, subs: {
    language: LanguageItem,
    fonts: Font[]
  }[]) : ParsedFont[] {
    let fontsNameList: Font[] = []; const fontsList: { name: string, path: string, mime: string }[] = [], subsList: string[] = []; let isNstr = true;
    for(const s of subs){
      fontsNameList.push(...s.fonts);
      subsList.push(s.language.locale);
    }
    fontsNameList = [...new Set(fontsNameList)];
    if(subsList.length > 0){
      console.info('\nSubtitles: %s (Total: %s)', subsList.join(', '), subsList.length);
      isNstr = false;
    }
    if(fontsNameList.length > 0){
      console.info((isNstr ? '\n' : '') + 'Required fonts: %s (Total: %s)', fontsNameList.join(', '), fontsNameList.length);
    }
    for(const f of fontsNameList){
      const fontFiles = fontFamilies[f];
      if(fontFiles){
        for (const fontFile of fontFiles) {
          const fontPath = path.join(fontsDir, fontFile);
          const mime = fontMime(fontFile);
          if(fs.existsSync(fontPath) && fs.statSync(fontPath).size != 0){
            fontsList.push({
              name: fontFile,
              path: fontPath,
              mime: mime,
            });
          } 
        }
      }
    }
    return fontsList;
  }

  public async merge(type: 'ffmpeg'|'mkvmerge', bin: string) {
    let command: string|undefined = undefined;
    switch (type) {
    case 'ffmpeg':
      command = this.FFmpeg();
      break;
    case 'mkvmerge':
      command = this.MkvMerge();
      break;
    }
    if (command === undefined) {
      console.warn('Unable to merge files.');
      return;
    }
    console.info(`[${type}] Started merging`);
    const res = Helper.exec(type, `"${bin}"`, command);
    if (!res.isOk && type === 'mkvmerge' && res.err.code === 1) {
      console.info(`[${type}] Mkvmerge finished with at least one warning`);
    } else if (!res.isOk) {
      console.error(res.err);
      console.error(`[${type}] Merging failed with exit code ${res.err.code}`);
    } else {
      console.info(`[${type} Done]`);
    }
  }

  public cleanUp() {
    this.options.onlyAudio.concat(this.options.onlyVid).concat(this.options.videoAndAudio).forEach(a => fs.unlinkSync(a.path));
    this.options.chapters?.forEach(a => fs.unlinkSync(a.path));
    this.options.subtitles.forEach(a => fs.unlinkSync(a.file));
  }

}

export default Merger;