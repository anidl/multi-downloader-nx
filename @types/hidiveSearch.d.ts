export interface HidiveSearch {
  Code:      number;
  Status:    string;
  Message:   null;
  Messages:  Record<unknown, unknown>;
  Data:      HidiveSearchData;
  Timestamp: string;
  IPAddress: string;
}

export interface HidiveSearchData {
  Query:                   string;
  Slug:                    string;
  TitleResults:            HidiveSearchItem[];
  SearchId:                number;
  IsSearchPinned:          boolean;
  IsPinnedSearchAvailable: boolean;
}

export interface HidiveSearchItem {
  Id:                 number;
  Name:               string;
  ShortSynopsis:      string;
  MediumSynopsis:     string;
  LongSynopsis:       string;
  KeyArtUrl:          string;
  MasterArtUrl:       string;
  Rating:             string;
  OverallRating:      number;
  RatingCount:        number;
  MALScore:           null;
  UserRating:         number;
  RunTime:            number | null;
  ShowInfoTitle:      string;
  FirstPremiereDate:  Date;
  EpisodeCount:       number;
  SeasonName:         string;
  RokuHDArtUrl:       string;
  RokuSDArtUrl:       string;
  IsRateable:         boolean;
  InQueue:            boolean;
  IsFavorite:         boolean;
  IsContinueWatching: boolean;
  ContinueWatching:   null;
  Episodes:           any[];
  LoadTime:           number;
}