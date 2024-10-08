// Native
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import os from 'os';

// Plugins
import * as iso639 from 'iso-639';
import { exec } from './sei-helper-fixes';
import { console } from './log';
import ffprobe from 'ffprobe';
import { OggOpusDecodedAudio, OggOpusDecoder } from 'ogg-opus-decoder';
import SynAudio, { MultipleClipMatch, MultipleClipMatchFirst } from 'synaudio';

// Modules
import { LanguageItem } from './module.langsData';
import { AvailableMuxer } from './module.args';
import * as yamlCfg from './module.cfg-loader';
import { fontFamilies, fontMime } from './module.fontsData';

// Types 
import { DownloadedMediaMap } from '../@types/downloaderTypes';

export type MergerInput = {
  path: string,
  lang: LanguageItem,
  duration?: OggOpusDecodedAudio,
  delay?: number,
  isPrimary?: boolean,
  totalDuration?: number,
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
  mediaMap?: DownloadedMediaMap[],
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

  async convertFile(path: string, ffmpeg: string): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const options = [
        '-t',
        '60',
        '-i',
        path,
        '-vn',
        '-c:a',
        'libopus',
        '-f',
        'ogg',
        'pipe:1'
      ];
      console.info(ffmpeg, options.join(' '));
      const ffmpegSpawn = spawn(ffmpeg, options);
      const data: number[] = [];

      ffmpegSpawn.stdout.on('data', (chunk) => {
        data.push(...chunk);
      });

      ffmpegSpawn.stderr.on('data', (err) => {
        //console.debug(err.toString().trimEnd());
      });

      ffmpegSpawn.on('close', (code) => {
        if (code !== 0) {
          console.error('FFmpeg exited with code: ', code);
          return reject();
        }
        resolve(new Uint8Array(data));
      });
    });
  }

  async decodeAudio(data: Uint8Array): Promise<OggOpusDecodedAudio> {
    const decoder = new OggOpusDecoder();
    await decoder.ready;

    return decoder.decode(data);
  }

  public async createDelays() {
    const bin = await yamlCfg.loadBinCfg();
    const allFiles = [...this.options.onlyAudio, ...this.options.videoAndAudio, ...this.options.onlyVid, ...this.options.subtitles];
    if (this.options.chapters)
      allFiles.push(...this.options.chapters);
    const audios = [...this.options.onlyAudio, ...this.options.videoAndAudio];
    if (audios.length < 2)
      return;

    if (bin.ffmpeg === undefined || bin.ffmpeg.trim().length === 0)
      return console.error('Unable to sync timing without ffmpeg!');

    for (const audio of audios) {
      try {
        const track = (
          await this.decodeAudio(
            await this.convertFile(audio.path, bin.ffmpeg)
          )
        );
        if (track.errors.length > 0) {
          console.error(`Unable to decode ${audio.path}: ${track.errors}`);
          return;
        }
        audio.duration = track;
        const streamInfo = await ffprobe(audio.path, { path: bin.ffprobe as string });
        const compare = streamInfo.streams.find(s => s.codec_type === 'video') || streamInfo.streams.find(s => s.codec_type === 'audio');
        audio.totalDuration = parseInt(compare!.duration!);
      } catch (e) {
        console.error(`Unable to generate sync timing because of file ${audio.path}: ${e}`);
        return;
      }
    }

    audios.sort((a, b) => a.totalDuration! - b.totalDuration!);

    const synAudio = new SynAudio();
    const audioArray = await synAudio.syncMultiple(
      audios.map((audio) => {
        return {
          name: audio.path,
          data: {
            channelData: audio.duration!.channelData,
            samplesDecoded: audio.duration!.samplesDecoded,
          }
        };
      }), os.cpus().length-1
    );

    // Find max sampleOffset value
    const maxSampleOffset = Math.max(...audioArray[0].map(item => item.sampleOffset));

    // Invert the sampleOffset values
    const invertedArray = audioArray[0].map(item => ({
      ...item,
      sampleOffset: maxSampleOffset - item.sampleOffset
    }));

    //Iterate over found matches
    invertedArray.forEach((clip: MultipleClipMatch | MultipleClipMatchFirst) => {
      const audio = audios.find(a => a.path === clip.name)!;
      audio.delay = (clip.sampleOffset || 0 ) / audio.duration!.sampleRate;

      // Iterate over each DownloadedMediaMap in the array
      for (const mediaMap of this.options.mediaMap!) {
        // Iterate over the files array in each DownloadedMediaMap
        for (const media of mediaMap.files) {
          // Check if the path matches
          if (media.path === clip.name) {
            //console.debug('Matching path found:', media.path);

            // Re-iterate over the files array where the match was found
            mediaMap.files.forEach((file) => {
              const mergerFile = allFiles.find(a => 
                ('path' in a ? a.path : a.file) === file.path
              );
              if (mergerFile)
                mergerFile.delay = audio.delay;
              else 
                console.error(`File ${file.path} was not found in allFiles array, this shouldn't happen`);
            });

            // We only want the first match, so break out of the loop
            break;
          }
        }
      }
    });
  }

  public FFmpeg() : string {
    const args: string[] = [];
    const metaData: string[] = [];

    let index = 0;
    let audioIndex = 0;
    let hasVideo = false;

    for (const vid of this.options.videoAndAudio) {
      if (vid.delay && hasVideo) {
        console.info('Inserting delay vid', vid.delay);
        args.push(
          `-itsoffset ${Math.round(vid.delay * 1000) / 1000}`
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
      if (aud.delay) {
        console.info('Inserting delay', aud.delay);
        args.push(`-itsoffset -${Math.ceil(aud.delay * 1000) / 1000}`);
      }
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
          `-itsoffset -${Math.round(sub.delay*1000)}ms`
        );
      }
      args.push(`-i "${sub.file}"`);
    }

    if (this.options.output.split('.').pop() === 'mkv') {
      if (this.options.fonts) {
        let fontIndex = 0;
        for (const font of this.options.fonts) {
          args.push(`-attach ${font.path} -metadata:s:t:${fontIndex} mimetype=${font.mime}`);
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
          `--sync ${audioTrackNum}:-${Math.round(vid.delay*1000)}`
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
      if (aud.delay) {
        args.push(
          `--sync 0:-${Math.round(aud.delay*1000)}`
        );
      }
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
            `--sync 0:-${Math.round(subObj.delay*1000)}`
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
    const res = exec(type, `"${bin}"`, command);
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