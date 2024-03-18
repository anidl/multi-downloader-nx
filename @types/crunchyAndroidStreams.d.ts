export interface CrunchyAndroidStreams {
  __class__:        string;
  __href__:         string;
  __resource_key__: string;
  __links__:        Links;
  __actions__:      Record<unknown, unknown>;
  media_id:         string;
  audio_locale:     Locale;
  subtitles:        Subtitles;
  closed_captions:  Subtitles;
  streams:          Streams;
  bifs:             string[];
  versions:         Version[];
  captions:         Record<unknown, unknown>;
}

export interface Subtitles {
  '':        Subtitle;
  'en-US'?:  Subtitle;
  'es-LA'?:  Subtitle;
  'es-419'?: Subtitle;
  'es-ES'?:  Subtitle;
  'pt-BR'?:  Subtitle;
  'fr-FR'?:  Subtitle;
  'de-DE'?:  Subtitle;
  'ar-ME'?:  Subtitle;
  'ar-SA'?:  Subtitle;
  'it-IT'?:  Subtitle;
  'ru-RU'?:  Subtitle;
  'tr-TR'?:  Subtitle;
  'hi-IN'?:  Subtitle;
  'zh-CN'?:  Subtitle;
  'ko-KR'?:  Subtitle;
  'ja-JP'?:  Subtitle;
}

export interface Links {
  resource: Resource;
}

export interface Resource {
  href: string;
}

export interface Streams {
  [key: string]: { [key: string]: Download };
}

export interface Download {
  hardsub_locale: Locale;
  hardsub_lang?:  string;
  url:            string;
}

export interface Urls {
  '': Download;
}

export interface Subtitle {
  locale: Locale;
  url:    string;
  format: string;
}

export interface Version {
  audio_locale:    Locale;
  guid:            string;
  original:        boolean;
  variant:         string;
  season_guid:     string;
  media_guid:      string;
  is_premium_only: boolean;
}

export enum Locale {
  default = '',
  enUS = 'en-US',
  esLA = 'es-LA',
  es419 = 'es-419',
  esES = 'es-ES',
  ptBR = 'pt-BR',
  frFR = 'fr-FR',
  deDE = 'de-DE',
  arME = 'ar-ME',
  arSA = 'ar-SA',
  itIT = 'it-IT',
  ruRU = 'ru-RU',
  trTR = 'tr-TR',
  hiIN = 'hi-IN',
  zhCN = 'zh-CN',
  koKR = 'ko-KR',
  jaJP = 'ja-JP',
}