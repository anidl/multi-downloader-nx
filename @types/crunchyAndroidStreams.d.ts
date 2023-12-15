export interface CrunchyAndroidStreams {
  __class__:        string;
  __href__:         string;
  __resource_key__: string;
  __links__:        Links;
  __actions__:      Actions;
  media_id:         string;
  audio_locale:     string;
  subtitles:        { [key: string]: Subtitle };
  closed_captions:  Actions;
  streams:          Streams;
  bifs:             string[];
  versions:         Version[];
  captions:         Actions;
}

export interface Actions {
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
  hardsub_locale: string;
  hardsub_lang?:  string;
  url:            string;
}

export interface Urls {
  '': Download;
}

export interface Subtitle {
  locale: string;
  url:    string;
  format: string;
}

export interface Version {
  audio_locale:    string;
  guid:            string;
  original:        boolean;
  variant:         string;
  season_guid:     string;
  media_guid:      string;
  is_premium_only: boolean;
}
