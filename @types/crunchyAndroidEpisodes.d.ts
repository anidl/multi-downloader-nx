import { Images } from './crunchyEpisodeList';

export interface CrunchyAndroidEpisodes {
  __class__:        string;
  __href__:         string;
  __resource_key__: string;
  __links__:        object;
  __actions__:      object;
  total:            number;
  items:            CrunchyAndroidEpisode[];
}

export interface CrunchyAndroidEpisode {
  __class__:                 string;
  __href__:                  string;
  __resource_key__:          string;
  __links__:                 Links;
  __actions__:               Actions;
  playback:                  string;
  id:                        string;
  channel_id:                ChannelID;
  series_id:                 string;
  series_title:              string;
  series_slug_title:         string;
  season_id:                 string;
  season_title:              string;
  season_slug_title:         string;
  season_number:             number;
  episode:                   string;
  episode_number:            number;
  sequence_number:           number;
  production_episode_id:     string;
  title:                     string;
  slug_title:                string;
  description:               string;
  next_episode_id:           string;
  next_episode_title:        string;
  hd_flag:                   boolean;
  maturity_ratings:          MaturityRating[];
  extended_maturity_rating:  Actions;
  is_mature:                 boolean;
  mature_blocked:            boolean;
  episode_air_date:          Date;
  upload_date:               Date;
  availability_starts:       Date;
  availability_ends:         Date;
  eligible_region:           string;
  available_date:            Date;
  free_available_date:       Date;
  premium_date:              Date;
  premium_available_date:    Date;
  is_subbed:                 boolean;
  is_dubbed:                 boolean;
  is_clip:                   boolean;
  seo_title:                 string;
  seo_description:           string;
  season_tags:               string[];
  available_offline:         boolean;
  subtitle_locales:          Locale[];
  availability_notes:        string;
  audio_locale:              Locale;
  versions:                  Version[];
  closed_captions_available: boolean;
  identifier:                string;
  media_type:                MediaType;
  slug:                      string;
  images:                    Images;
  duration_ms:               number;
  is_premium_only:           boolean;
  listing_id:                string;
  hide_season_title?:        boolean;
  hide_season_number?:       boolean;
  isSelected?:               boolean;
  seq_id:                    string;
}

export interface Links {
  'episode/channel':      Link;
  'episode/next_episode': Link;
  'episode/season':       Link;
  'episode/series':       Link;
  streams:                Link;
}

export interface Link {
  href: string;
}

export interface Thumbnail {
  width:  number;
  height: number;
  type:   string;
  source: string;
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

export enum MediaType {
  Episode = 'episode',
}

export enum ChannelID {
  Crunchyroll = 'crunchyroll',
}

export enum MaturityRating {
  Tv14 = 'TV-14',
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

