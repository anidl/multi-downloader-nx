export interface AnimeOnegaiStream {
  ID:                     number;
  CreatedAt:              Date;
  UpdatedAt:              Date;
  DeletedAt:              null;
  name:                   string;
  source_url:             string;
  backup_url:             string;
  live:                   boolean;
  token_handler:          number;
  entry:                  string;
  job:                    string;
  drm:                    boolean;
  transcoding_content_id: string;
  transcoding_asset_id:   string;
  status:                 number;
  thumbnail:              string;
  hls:                    string;
  dash:                   string;
  widevine_proxy:         string;
  playready_proxy:        string;
  apple_licence:          string;
  apple_certificate:      string;
  dpath:                  string;
  dbin:                   string;
  subtitles:              Subtitle[];
  origin:                 number;
  offline_entry:          string;
  offline_status:         boolean;
}

export interface Subtitle {
  ID:        number;
  CreatedAt: Date;
  UpdatedAt: Date;
  DeletedAt: null;
  name:      string;
  lang:      string;
  entry_id:  string;
  url:       string;
}
