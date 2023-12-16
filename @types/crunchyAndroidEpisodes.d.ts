export interface CrunchyAndroidEpisodes {
  __class__:        string;
  __href__:         string;
  __resource_key__: string;
  __links__:        Actions;
  __actions__:      Actions;
  total:            number;
  items:            CrunchyEpisode[];
}

export interface Actions {
}

export interface CrunchyEpisode {
  __class__:                 string;
  __href__:                  string;
  __resource_key__:          string;
  __links__:                 Links;
  __actions__:               Actions;
  playback:                  string;
  id:                        string;
  channel_id:                string;
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
  maturity_ratings:          string[];
  extended_maturity_rating:  Actions;
  is_mature:                 boolean;
  mature_blocked:            boolean;
  episode_air_date:          string;
  upload_date:               string;
  availability_starts:       string;
  availability_ends:         string;
  eligible_region:           string;
  available_date:            Date;
  free_available_date:       string;
  premium_date:              Date;
  premium_available_date:    string;
  is_subbed:                 boolean;
  is_dubbed:                 boolean;
  is_clip:                   boolean;
  seo_title:                 string;
  seo_description:           string;
  season_tags:               string[];
  available_offline:         boolean;
  subtitle_locales:          string[];
  availability_notes:        string;
  audio_locale:              string;
  versions:                  Version[];
  closed_captions_available: boolean;
  identifier:                string;
  media_type:                string;
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
  'episode/channel':      EpisodeChannel;
  'episode/next_episode': EpisodeChannel;
  'episode/season':       EpisodeChannel;
  'episode/series':       EpisodeChannel;
  streams:                EpisodeChannel;
}

export interface EpisodeChannel {
  href: string;
}

export interface Images {
  thumbnail: Array<Thumbnail[]>;
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

export interface Version {
  audio_locale:    Locale;
  guid:            string;
  original:        boolean;
  variant:         string;
  season_guid:     string;
  media_guid:      string;
  is_premium_only: boolean;
}

