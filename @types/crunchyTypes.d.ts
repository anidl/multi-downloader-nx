import { HLSCallback } from 'hls-download';
import { sxItem } from '../crunchy';
import { LanguageItem } from '../modules/module.langsData';
import { DownloadInfo } from './messageHandler';
import { CrunchyPlayStreams } from './enums';

export type CrunchyDownloadOptions = {
  hslang: string,
  // kstream: number,
  cstream: keyof typeof CrunchyPlayStreams,
  vstream: keyof typeof CrunchyPlayStreams,
  astream: keyof typeof CrunchyPlayStreams,
  tsd?: boolean,
  novids?: boolean,
  noaudio?: boolean,
  x: number,
  q: number,
  fileName: string,
  numbers: number,
  partsize: number,
  callbackMaker?: (data: DownloadInfo) => HLSCallback,
  timeout: number,
  waittime: number,
  fsRetryTime: number,
  dlsubs: string[],
  skipsubs: boolean,
  nosubs?: boolean,
  mp4: boolean,
  override: string[],
  videoTitle: string,
  force: 'Y'|'y'|'N'|'n'|'C'|'c',
  ffmpegOptions: string[],
  mkvmergeOptions: string[],
  defaultSub: LanguageItem,
  defaultAudio: LanguageItem,
  ccTag: string,
  dlVideoOnce: boolean,
  skipmux?: boolean,
  syncTiming: boolean,
  nocleanup: boolean,
  chapters: boolean,
  fontName: string | undefined,
  originalFontSize: boolean,
  fontSize: number,
  dubLang: string[],
}

export type CrunchyMultiDownload = {
  absolute?: boolean,
  dubLang: string[],
  all?: boolean,
  but?: boolean,
  e?: string,
  s?: string
}

export type CrunchyMuxOptions = {
  output: string,
  skipSubMux?: boolean
  keepAllVideos?: bolean
  novids?: boolean,
  mp4: boolean,
  forceMuxer?: 'ffmpeg'|'mkvmerge',
  nocleanup?: boolean,
  videoTitle: string,
  ffmpegOptions: string[],
  mkvmergeOptions: string[],
  defaultSub: LanguageItem,
  defaultAudio: LanguageItem,
  ccTag: string,
  syncTiming: boolean,
}

export type CrunchyEpMeta = {
  data: {
    mediaId: string,
    lang?: LanguageItem,
    playback?: string,
    versions?: EpisodeVersion[] | null,
    isSubbed: boolean,
    isDubbed: boolean,
  }[],
  seriesTitle: string,
  seasonTitle: string,
  episodeNumber: string,
  episodeTitle: string,
  seasonID: string,
  season: number,
  showID: string,
  e: string,
  image: string,
}

export type DownloadedMedia = {
  type: 'Video',
  lang: LanguageItem,
  path: string,
  isPrimary?: boolean
} | {
  type: 'Audio',
  lang: LanguageItem,
  path: string,
  isPrimary?: boolean
} | {
  type: 'Chapters',
  lang: LanguageItem,
  path: string
} | ({
  type: 'Subtitle',
  signs: boolean,
  cc: boolean
} & sxItem )

export type ParseItem = {
  __class__?: string;
  isSelected?: boolean,
  type?: string,
  id: string,
  title: string,
  playback?: string,
  season_number?: number|string,
  episode_number?: number|string,
  season_count?: number|string,
  is_premium_only?: boolean,
  hide_metadata?: boolean,
  seq_id?: string,
  f_num?: string,
  s_num?: string
  external_id?: string,
  ep_num?: string
  last_public?: string,
  subtitle_locales?: string[],
  availability_notes?: string,
  identifier?: string,
  versions?: Version[] | null,
  media_type?: string | null,
  movie_release_year?: number | null,
}

export interface SeriesSearch {
  total: number;
  data:  SeriesSearchItem[];
  meta:  Meta;
}

export interface SeriesSearchItem {
  description:              string;
  seo_description:          string;
  number_of_episodes:       number;
  is_dubbed:                boolean;
  identifier:               string;
  channel_id:               string;
  slug_title:               string;
  season_sequence_number:   number;
  season_tags:              string[];
  extended_maturity_rating: Record<unknown>;
  is_mature:                boolean;
  audio_locale:             string;
  season_number:            number;
  images:                   Record<unknown>;
  mature_blocked:           boolean;
  versions:                 Version[];
  title:                    string;
  is_subbed:                boolean;
  id:                       string;
  audio_locales:            string[];
  subtitle_locales:         string[];
  availability_notes:       string;
  series_id:                string;
  season_display_number:    string;
  is_complete:              boolean;
  keywords:                 any[];
  maturity_ratings:         string[];
  is_simulcast:             boolean;
  seo_title:                string;
}
export interface Version {
  audio_locale: Locale;
  guid:         string;
  original:     boolean;
  variant:      string;
}

export interface EpisodeVersion {
  audio_locale: Locale;
  guid: string;
  is_premium_only: boolean;
  media_guid: string;
  original: boolean;
  season_guid: string;
  variant: string;
}

export enum Locale {
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

export interface Meta {
  versions_considered: boolean;
}
