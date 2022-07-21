import * as iso639 from 'iso-639';
import { fontFamilies, fontMime } from './module.fontsData';
import path from 'path';
import fs from 'fs';
import { LanguageItem } from './module.langsData';
import { AvailableMuxer } from './module.args';
import { exec } from './sei-helper-fixes';

export type MergerInput = {
  path: string,
  lang: LanguageItem
}

export type SubtitleInput = {
  language: LanguageItem,
  file: string,
  closedCaption?: boolean
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
  output: string,
  videoTitle?: string,
  simul?: boolean,
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

  public FFmpeg() : string {
    const args = [];
    const metaData = [];

    let index = 0;
    let audioIndex = 0;
    let hasVideo = false;

    for (const vid of this.options.videoAndAudio) {
      args.push(`-i "${vid.path}"`);
      if (!hasVideo) {
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
      if (!hasVideo) {
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
      args.push(`-i "${sub.file}"`);
    }

    if (this.options.output.split('.').pop() === 'mkv')
      if (this.options.fonts) {
        let fontIndex = 0;
        for (const font of this.options.fonts) {
          args.push(`-attach ${font.path} -metadata:s:t:${fontIndex} mimetype=${font.mime}`);
          fontIndex++;
        }
      }

    args.push(...metaData);
    args.push(...this.options.subtitles.map((_, subIndex) => `-map ${subIndex + index}`));
    args.push(
      '-c:v copy',
      '-c:a copy',
      this.options.output.split('.').pop()?.toLowerCase() === 'mp4' ? '-c:s mov_text' : '-c:s ass',
      ...this.options.subtitles.map((sub, subindex) => `-metadata:s:s:${subindex} title="${
        (sub.language.language || sub.language.name) + `${sub.closedCaption === true ? ' CC' : ''}`
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
    const args = [];

    let hasVideo = false;

    args.push(`-o "${this.options.output}"`);
    args.push(...this.options.options.mkvmerge);

    for (const vid of this.options.onlyVid) {
      if (!hasVideo) {
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
      if (!hasVideo) {
        args.push(
          '--video-tracks 0',
          '--audio-tracks 1'
        );
        const trackName = ((this.options.videoTitle ?? vid.lang.name) + (this.options.simul ? ' [Simulcast]' : ' [Uncut]'));
        args.push('--track-name', `0:"${trackName}"`);
        //args.push('--track-name', `1:"${trackName}"`);
        args.push(`--language 1:${vid.lang.code}`);
        if (this.options.defaults.audio.code === vid.lang.code) {
          args.push('--default-track 1');
        } else {
          args.push('--default-track 1:0')
        }
        hasVideo = true;
      } else {
        args.push(
          '--no-video',
          '--audio-tracks 1'
        );
        if (this.options.defaults.audio.code === vid.lang.code) {
          args.push(`--default-track 1`)
        } else {
          args.push('--default-track 1:0')
        }
        args.push('--track-name', `1:"${vid.lang.name}"`);
        args.push(`--language 1:${vid.lang.code}`);
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
        args.push('--default-track 0:0')
      }
      args.push(`"${aud.path}"`);
    }

    if (this.options.subtitles.length > 0) {
      for (const subObj of this.options.subtitles) {
        args.push('--track-name', `0:"${(subObj.language.language || subObj.language.name) + `${subObj.closedCaption === true ? ' CC' : ''}`}"`);
        args.push('--language', `0:"${subObj.language.code}"`);
        if (this.options.defaults.sub.code === subObj.language.code) {
          args.push('--default-track 0');
        } else {
          args.push('--default-track 0:0')
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
        console.log(f.path);
        args.push('--attachment-name', f.name);
        args.push('--attachment-mime-type', f.mime);
        args.push('--attach-file', `"${f.path}"`);
      }
    } else {
      args.push(
        '--no-attachments'
      );
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
      console.log('[WARN] FFmpeg not found, skip muxing...');
    } else if (!bin.mkvmerge) {
      console.log('[WARN] MKVMerge not found, skip muxing...');
    }
    return {};
  }

  public static makeFontsList (fontsDir: string, subs: {
    language: LanguageItem,
    fonts: Font[]
  }[]) : ParsedFont[] {
    let fontsNameList: Font[] = []; const fontsList = [], subsList = []; let isNstr = true;
    for(const s of subs){
      fontsNameList.push(...s.fonts);
      subsList.push(s.language.locale);
    }
    fontsNameList = [...new Set(fontsNameList)];
    if(subsList.length > 0){
      console.log('\n[INFO] Subtitles: %s (Total: %s)', subsList.join(', '), subsList.length);
      isNstr = false;
    }
    if(fontsNameList.length > 0){
      console.log((isNstr ? '\n' : '') + '[INFO] Required fonts: %s (Total: %s)', fontsNameList.join(', '), fontsNameList.length);
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
      console.log('[WARN] Unable to merge files.');
      return;
    }
    console.log(`[INFO][${type}] Started merging`);
    const res = exec(type, `"${bin}"`, command);
    if (!res.isOk && type === 'mkvmerge' && res.err.code === 1) {
      console.log(`[INFO][${type}] Mkvmerge finished with at least one warning`);
    } else if (!res.isOk) {
      console.log(res.err);
      console.log(`[ERROR][${type}] Merging failed with exit code ${res.err.code}`);
    } else {
      console.log(`[INFO][${type} Done]`);
    }
  }

  public cleanUp() {
    this.options.onlyAudio.concat(this.options.onlyVid).concat(this.options.videoAndAudio).forEach(a => fs.unlinkSync(a.path));
    this.options.subtitles.forEach(a => fs.unlinkSync(a.file));
  }

}

export default Merger;