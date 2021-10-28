import * as iso639 from 'iso-639';

export type MergerInput = {
  path: string,
  lang: string,
}

export type SubtitleInput = {
  language: string,
  file: string,
}

export type MergerOptions = {
  videoAndAudio: MergerInput[],
  onlyVid: MergerInput[],
  onlyAudio: MergerInput[],
  subtitels: SubtitleInput[],
  output: string,
  simul?: boolean
}

class Merger {
  private subDict = {
    'en': 'English (United State)',
    'es': 'Español (Latinoamericano)',
    'pt': 'Português (Brasil)',
    'ja': '日本語',
    'cmn': '官話'
  } as {
    [key: string]: string;
  };
  
  constructor(private options: MergerOptions) {}

  public FFmpeg() : string {
    const args = [];
    const metaData = [];

    let index = 0;
    let audioIndex = 0;
    let hasVideo = false;
    for (const vid of this.options.videoAndAudio) {
      args.push(`-i "${vid.path}"`);
      if (!hasVideo) {
        metaData.push(`-map ${index}`);
        metaData.push(`-metadata:s:a:${audioIndex} language=${Merger.getLanguageCode(vid.lang, vid.lang)}`);
        metaData.push(`-metadata:s:v:${index} title="[Funimation]"`);
        hasVideo = true;
      } else {
        metaData.push(`-map ${index}:a`);
        metaData.push(`-metadata:s:a:${audioIndex} language=${Merger.getLanguageCode(vid.lang, vid.lang)}`);
      }
      audioIndex++;
      index++;
    }

    for (const vid of this.options.onlyVid) {
      if (!hasVideo) {
        args.push(`-i "${vid.path}"`);
        metaData.push(`-map ${index} -map -${index}:a`);
        metaData.push(`-metadata:s:v:${index} title="[Funimation]"`);
        hasVideo = true;
        index++;
      }
    }

    for (const aud of this.options.onlyAudio) {
      args.push(`-i "${aud.path}"`);
      metaData.push(`-map ${index}`);
      metaData.push(`-metadata:s:a:${audioIndex} language=${Merger.getLanguageCode(aud.lang, aud.lang)}`);
      index++;
      audioIndex++;
    }

    for (const index in this.options.subtitels) {
      const sub = this.options.subtitels[index];
      args.push(`-i "${sub.file}"`);
    }

    args.push(...metaData);
    args.push(...this.options.subtitels.map((_, subIndex) => `-map ${subIndex + index}`));
    args.push(
      '-c:v copy',
      '-c:a copy'
    );
    args.push(this.options.output.split('.').pop()?.toLowerCase() === 'mp4' ? '-c:s mov_text' : '-c:s ass');
    args.push(...this.options.subtitels.map((sub, subindex) => `-metadata:s:${index + subindex} language=${Merger.getLanguageCode(sub.language)}`));
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
    args.push(
      '--no-date',
      '--disable-track-statistics-tags',
      '--engage no_variable_data',
    );

    for (const vid of this.options.onlyVid) {
      if (!hasVideo) {
        args.push(
          '--video-tracks 0',
          '--no-audio'
        );
        const trackName = this.subDict[vid.lang] + (this.options.simul ? ' [Simulcast]' : ' [Uncut]');
        args.push('--track-name', `0:"${trackName}"`);
        args.push(`--language 0:${Merger.getLanguageCode(vid.lang, vid.lang)}`);
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
        const trackName = this.subDict[vid.lang] + (this.options.simul ? ' [Simulcast]' : ' [Uncut]');
        args.push('--track-name', `0:"${trackName}"`);
        args.push('--track-name', `1:"${trackName}"`);
        args.push(`--language 1:${Merger.getLanguageCode(vid.lang, vid.lang)}`);
        hasVideo = true;
      } else {
        args.push(
          '--no-video',
          '--audio-tracks 1'
        );
        const trackName = this.subDict[vid.lang] + (this.options.simul ? ' [Simulcast]' : ' [Uncut]');
        args.push('--track-name', `1:"${trackName}"`);
        args.push(`--language 1:${Merger.getLanguageCode(vid.lang, vid.lang)}`);
      }
      args.push(`"${vid.path}"`);
    }

    for (const aud of this.options.onlyAudio) {
      const trackName = this.subDict[aud.lang] + (this.options.simul ? ' [Simulcast]' : ' [Uncut]');
      args.push('--track-name', `0:"${trackName}"`);
      args.push(`--language 0:${Merger.getLanguageCode(aud.lang, aud.lang)}`);
      args.push(
        '--no-video',
        '--audio-tracks 0'
      );
      args.push(`"${aud.path}"`);
    }

    if (this.options.subtitels.length > 0) {
      for (const subObj of this.options.subtitels) {
        const trackName = this.subDict[subObj.language] + (this.options.simul ? ' [Simulcast]' : ' [Uncut]');
        args.push('--track-name', `0:"${trackName}"`);
        args.push('--language', `0:${Merger.getLanguageCode(subObj.language)}`);
        args.push(`"${subObj.file}"`);
      }
    } else {
      args.push(
        '--no-subtitles',
        '--no-attachments'
      );
    }

    return args.join(' ');
  };

  public static checkMerger(bin: {
    mkvmerge?: string,
    ffmpeg?: string
  }, useMP4format: boolean) {
    const merger: {
      MKVmerge: undefined|string|false,
      FFmpeg: undefined|string|false
    } = {
      MKVmerge: bin.mkvmerge,
      FFmpeg: bin.ffmpeg,
    };
    if( !useMP4format && !merger.MKVmerge ){
      console.log('[WARN] MKVMerge not found, skip using this...');
      merger.MKVmerge = false;
    }
    if( !merger.MKVmerge && !merger.FFmpeg || useMP4format && !merger.FFmpeg ){
      console.log('[WARN] FFmpeg not found, skip using this...');
      merger.FFmpeg = false;
    }
    return merger;

  }

}

export default Merger;