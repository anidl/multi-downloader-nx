export interface HidiveVideoList {
  Code:      number;
  Status:    string;
  Message:   null;
  Messages:  Record<unknown, unknown>;
  Data:      HidiveVideo;
  Timestamp: string;
  IPAddress: string;
}

export interface HidiveVideo {
  ShowAds:             boolean;
  CaptionCssUrl:       string;
  FontSize:            number;
  FontScale:           number;
  CaptionLanguages:    string[];
  CaptionLanguage:     string;
  CaptionVttUrls:      Record<string, string>;
  VideoLanguages:      string[];
  VideoLanguage:       string;
  VideoUrls:           Record<string, HidiveStreamList>;
  FontColorName:       string;
  AutoPlayNextEpisode: boolean;
  MaxStreams:          number;
  CurrentTime:         number;
  FontColorCode:       string;
  RunTime:             number;
  AdUrl:               null;
}

export interface HidiveStreamList {
  hls:        string[];
  drm:        string[];
  drmEnabled: boolean;
}

export interface HidiveStreamInfo extends HidiveStreamList {
  language?:      string;
  episodeTitle?:  string;
  seriesTitle?:   string;
  season?:        number;
  episodeNumber?: number;
  uncut?:         boolean;
  image?:         string;
}

export interface HidiveSubtitleInfo {
  language: string;
  cc:       boolean;
  url:      string;
}

export type DownloadedMedia = {
  type:  'Video',
  lang:  LanguageItem,
  path:  string,
  uncut: boolean
} | ({
  type: 'Subtitle',
  cc: boolean
} & sxItem )