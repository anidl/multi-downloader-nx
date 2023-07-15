export interface CrunchyEpisodeList {
  total: number;
  data:  CrunchyEpisode[];
  meta:  Meta;
}

export interface CrunchyEpisode {
  next_episode_id:           string;
  series_id:                 string;
  season_number:             number;
  next_episode_title:        string;
  availability_notes:        string;
  duration_ms:               number;
  series_slug_title:         string;
  series_title:              string;
  is_dubbed:                 boolean;
  versions:                  Version[] | null;
  identifier:                string;
  sequence_number:           number;
  eligible_region:           Record<unknown>;
  availability_starts:       Date;
  images:                    Images;
  season_id:                 string;
  seo_title:                 string;
  is_premium_only:           boolean;
  extended_maturity_rating:  Record<unknown>;
  title:                     string;
  production_episode_id:     string;
  premium_available_date:    Date;
  season_title:              string;
  seo_description:           string;
  audio_locale:              Locale;
  id:                        string;
  media_type:                MediaType;
  availability_ends:         Date;
  free_available_date:       Date;
  playback:                  string;
  channel_id:                ChannelID;
  episode:                   string;
  is_mature:                 boolean;
  listing_id:                string;
  episode_air_date:          Date;
  slug:                      string;
  available_date:            null;
  subtitle_locales:          Locale[];
  slug_title:                string;
  available_offline:         boolean;
  description:               string;
  is_subbed:                 boolean;
  premium_date:              null;
  upload_date:               Date;
  season_slug_title:         string;
  closed_captions_available: boolean;
  episode_number:            number;
  season_tags:               any[];
  maturity_ratings:          MaturityRating[];
  streams_link:              string;
  mature_blocked:            boolean;
  is_clip:                   boolean;
  hd_flag:                   boolean;
  hide_season_title?:    boolean;
  hide_season_number?:   boolean;
  isSelected?:           boolean;
  seq_id:                string;
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

export enum ChannelID {
  Crunchyroll = 'crunchyroll',
}

export interface Images {
  poster_tall?: Array<Image[]>;
  poster_wide?: Array<Image[]>;
  promo_image?: Array<Image[]>;
  thumbnail?:   Array<Image[]>;
}

export interface Image {
  height: number;
  source: string;
  type:   ImageType;
  width:  number;
}

export enum ImageType {
  PosterTall = 'poster_tall',
  PosterWide = 'poster_wide',
  PromoImage = 'promo_image',
  Thumbnail = 'thumbnail',
}

export enum MaturityRating {
  Tv14 = 'TV-14',
}

export enum MediaType {
  Episode = 'episode',
}

export interface Version {
  audio_locale:    Locale;
  guid:            string;
  is_premium_only: boolean;
  media_guid:      string;
  original:        boolean;
  season_guid:     string;
  variant:         string;
}

export interface Meta {
  versions_considered: boolean;
}