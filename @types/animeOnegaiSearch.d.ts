export interface AnimeOnegaiSearch {
  text: string;
  list: AOSearchResult[];
}

export interface AOSearchResult {
  /**
   * Asset ID
   */
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
  /**
   * Asset Type, Known Possibilities
   * * 1 - Video
   * * 2 - Series
   */
  asset_type:            1 | 2;
  status:                number;
  permalink:             string;
  duration:              string;
  subtitles:             boolean;
  price:                 number;
  rent_price:            number;
  rating:                number;
  color:                 number | null;
  classification:        number;
  brazil_classification: null | string;
  likes:                 number;
  views:                 number;
  button:                string;
  stream_url:            string;
  stream_url_backup:     string;
  copyright:             null | string;
  skip_intro:            null | string;
  ending:                null | string;
  bumper_intro:          string;
  ads:                   string;
  age_restriction:       boolean | null;
  epg:                   null;
  allow_languages:       string[] | null;
  allow_countries:       string[] | null;
  classification_text:   string;
  locked:                boolean;
  resign:                boolean;
  favorite:              boolean;
  actors_list:           null;
  voiceactors_list:      null;
  artdirectors_list:     null;
  audios_list:           null;
  awards_list:           null;
  companies_list:        null;
  countries_list:        null;
  directors_list:        null;
  edition_list:          null;
  genres_list:           null;
  music_list:            null;
  photograpy_list:       null;
  producer_list:         null;
  screenwriter_list:     null;
  season_list:           null;
  tags_list:             null;
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