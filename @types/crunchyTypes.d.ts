import { LanguageItem } from "../modules/module.langsData"

export type CrunchyEpMeta = {
  mediaId: string,
  seasonTitle: string,
  episodeNumber: string,
  episodeTitle: string,
  playback?: string,
  seasonID: string
}

export type CrunchyEpMetaMultiDub = {
  data: {
    mediaId: string,
    lang: LanguageItem,
    playback?: string
  }[],
  seasonTitle: string,
  episodeNumber: string,
  episodeTitle: string,
  seasonID: string
}

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
  "season/channel":  Season;
  "season/episodes": Season;
  "season/series":   Season;
}

export interface Season {
  href: string;
}
