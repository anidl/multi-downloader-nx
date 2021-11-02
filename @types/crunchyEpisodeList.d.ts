export interface CrunchyEpisodeList {
  __class__:        string;
  __href__:         string;
  __resource_key__: string;
  __links__:        unknown;
  __actions__:      unknown;
  total:            number;
  items:            Item[];
}

export interface Item {
  __class__:             Class;
  __href__:              string;
  __resource_key__:      string;
  __links__:             Links;
  __actions__:           unknown;
  id:                    string;
  channel_id:            ChannelID;
  series_id:             string;
  series_title:          string;
  series_slug_title:     string;
  season_id:             string;
  season_title:          string;
  season_slug_title:     string;
  season_number:         number;
  episode:               string;
  episode_number:        number | null;
  sequence_number:       number;
  production_episode_id: string;
  title:                 string;
  slug_title:            string;
  description:           string;
  next_episode_id?:      string;
  next_episode_title?:   string;
  hd_flag:               boolean;
  is_mature:             boolean;
  mature_blocked:        boolean;
  episode_air_date:      string;
  is_subbed:             boolean;
  is_dubbed:             boolean;
  is_clip:               boolean;
  seo_title:             string;
  seo_description:       string;
  season_tags:           string[];
  available_offline:     boolean;
  media_type:            Class;
  slug:                  string;
  images:                Images;
  duration_ms:           number;
  ad_breaks:             AdBreak[];
  is_premium_only:       boolean;
  listing_id:            string;
  subtitle_locales:      SubtitleLocale[];
  playback?:             string;
  availability_notes:    string;
  available_date?:       string;
  hide_season_title?:    boolean;
  hide_season_number?:   boolean;
  isSelected?:           boolean;
  seq_id:                string;
}

export enum Class {
  Episode = 'episode',
}

export interface Links {
  ads:                     Ads;
  'episode/channel':       Ads;
  'episode/next_episode'?: Ads;
  'episode/season':        Ads;
  'episode/series':        Ads;
  streams?:                Ads;
}

export interface Ads {
  href: string;
}

export interface AdBreak {
  type:      AdBreakType;
  offset_ms: number;
}

export enum AdBreakType {
  Midroll = 'midroll',
  Preroll = 'preroll',
}

export enum ChannelID {
  Crunchyroll = 'crunchyroll',
}

export interface Images {
  thumbnail: Array<Thumbnail[]>;
}

export interface Thumbnail {
  width:  number;
  height: number;
  type:   ThumbnailType;
  source: string;
}

export enum ThumbnailType {
  Thumbnail = 'thumbnail',
}

export enum SubtitleLocale {
  ArSA = 'ar-SA',
  DeDE = 'de-DE',
  EnUS = 'en-US',
  Es419 = 'es-419',
  EsES = 'es-ES',
  FrFR = 'fr-FR',
  ItIT = 'it-IT',
  PtBR = 'pt-BR',
  RuRU = 'ru-RU',
}
