import { HLSCallback } from 'hls-download';
import { sxItem } from '../crunchy';
import { LanguageItem } from '../modules/module.langsData';
import { DownloadInfo } from './messageHandler';

export type CrunchyDownloadOptions = {
  hslang: string,
  kstream: number,
  novids?: boolean,
  x: number,
  q: number,
  fileName: string,
  numbers: number,
  partsize: number,
  callbackMaker?: (data: DownloadInfo) => HLSCallback,
  timeout: number,
  fsRetryTime: number,
  dlsubs: string[],
  skipsubs: boolean,
  mp4: boolean,
  override: string[],
  videoTitle: string
}

export type CurnchyMultiDownload = {
  dubLang: string[],
  all?: boolean,
  but?: boolean,
  e?: string
}

export type CrunchyMuxOptions = {
  output: string,
  skipSubMux?: boolean
  novids?: boolean,
  mp4: boolean,
  forceMuxer?: 'ffmpeg'|'mkvmerge',
  nocleanup?: boolean,
  videoTitle: string
}

export type CrunchyEpMeta = {
  data: {
    mediaId: string,
    lang?: LanguageItem,
    playback?: string
  }[],
  seasonTitle: string,
  episodeNumber: string,
  episodeTitle: string,
  seasonID: string,
  season: number,
  showID: string,
  e: string,
  image: string
}

export type DownloadedMedia = {
  type: 'Video',
  lang: LanguageItem,
  path: string
} | ({
  type: 'Subtitle'
} & sxItem )

export type ParseItem = {
  __class__?: string;
  isSelected?: boolean,
  type?: string,
  id: string,
  title: string,
  playback?: string,
  season_number?: number|string,
  is_premium_only?: boolean,
  hide_metadata?: boolean,
  seq_id?: string,
  f_num?: string,
  s_num?: string
  external_id?: string,
  ep_num?: string
  last_public?: string,
  subtitle_locales?: string[],
  availability_notes?: string
}

export interface SeriesSearch {
  __class__:        string;
  __href__:         string;
  __resource_key__: string;
  __links__:        Actions;
  __actions__:      Actions;
  total:            number;
  items:            SeriesSearchItem[];
}

export interface SeriesSearchItem {
  __class__:          string;
  __href__:           string;
  __resource_key__:   string;
  __links__:          Links;
  __actions__:        string[];
  id:                 string;
  channel_id:         string;
  title:              string;
  slug_title:         string;
  series_id:          string;
  season_number:      number;
  is_complete:        boolean;
  description:        string;
  keywords:           any[];
  season_tags:        string[];
  images:             Actions;
  is_mature:          boolean;
  mature_blocked:     boolean;
  is_subbed:          boolean;
  is_dubbed:          boolean;
  is_simulcast:       boolean;
  seo_title:          string;
  seo_description:    string;
  availability_notes: string;
}

export interface Links {
  'season/channel':  Season;
  'season/episodes': Season;
  'season/series':   Season;
}

export interface Season {
  href: string;
}
