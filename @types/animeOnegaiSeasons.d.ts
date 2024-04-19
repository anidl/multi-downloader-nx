export interface AnimeOnegaiSeasons {
  ID:              number;
  CreatedAt:       Date;
  UpdatedAt:       Date;
  DeletedAt:       null;
  name:            string;
  number:          number;
  asset_id:        number;
  entry:           string;
  description:     string;
  active:          boolean;
  allow_languages: string[];
  allow_countries: string[];
  list:            Episode[];
}

export interface Episode {
  ID:              number;
  CreatedAt:       Date;
  UpdatedAt:       Date;
  DeletedAt:       null;
  name:            string;
  number:          number;
  description:     string;
  thumbnail:       string;
  entry:           string;
  video_entry:     string;
  active:          boolean;
  season_id:       number;
  stream_url:      string;
  skip_intro:      null;
  ending:          null;
  open_free:       boolean;
  asset_id:        number;
  age_restriction: boolean;
}
