export interface AnimeOnegaiSeries {
  ID:                    number;
  CreatedAt:             Date;
  UpdatedAt:             Date;
  DeletedAt:             null;
  title:                 string;
  active:                boolean;
  excerpt:               string;
  description:           string;
  bg:                    string;
  poster:                string;
  entry:                 string;
  code_name:             string;
  /**
   * The Video ID required to get the streams
   */
  video_entry:           string;
  trailer:               string;
  year:                  number;
  asset_type:            number;
  status:                number;
  permalink:             string;
  duration:              string;
  subtitles:             boolean;
  price:                 number;
  rent_price:            number;
  rating:                number;
  color:                 number;
  classification:        number;
  brazil_classification: string;
  likes:                 number;
  views:                 number;
  button:                string;
  stream_url:            string;
  stream_url_backup:     string;
  copyright:             string;
  skip_intro:            null;
  ending:                null;
  bumper_intro:          string;
  ads:                   string;
  age_restriction:       boolean;
  epg:                   null;
  allow_languages:       string[];
  allow_countries:       string[];
  classification_text:   string;
  locked:                boolean;
  resign:                boolean;
  favorite:              boolean;
  actors_list:           CtorsList[];
  voiceactors_list:      CtorsList[];
  artdirectors_list:     any[];
  audios_list:           SList[];
  awards_list:           any[];
  companies_list:        any[];
  countries_list:        any[];
  directors_list:        CtorsList[];
  edition_list:          any[];
  genres_list:           SList[];
  music_list:            any[];
  photograpy_list:       any[];
  producer_list:         any[];
  screenwriter_list:     any[];
  season_list:           any[];
  tags_list:             TagsList[];
  chapter_id:            number;
  chapter_entry:         string;
  chapter_poster:        string;
  progress_time:         number;
  progress_percent:      number;
  included_subscription: number;
  paid_content:          number;
  rent_content:          number;
  objectID:              string;
  lang:                  string;
}

export interface CtorsList {
  ID:          number;
  CreatedAt:   Date;
  UpdatedAt:   Date;
  DeletedAt:   null;
  name:        string;
  Permalink?:  string;
  country:     number | null;
  year:        number | null;
  death:       number | null;
  image:       string;
  genre:       null;
  description: string;
  permalink?:  string;
  background?: string;
}

export interface SList {
  ID:               number;
  CreatedAt:        Date;
  UpdatedAt:        Date;
  DeletedAt:        null;
  name:             string;
  age_restriction?: number;
}

export interface TagsList {
  ID:        number;
  CreatedAt: Date;
  UpdatedAt: Date;
  DeletedAt: null;
  name:      string;
  position:  number;
  status:    boolean;
}
