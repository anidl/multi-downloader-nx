export interface HidiveEpisodeList {
  Code:      number;
  Status:    string;
  Message:   null;
  Messages:  Record<unknown, unknown>;
  Data:      Data;
  Timestamp: string;
  IPAddress: string;
}

export interface Data {
  Title: HidiveTitle;
}

export interface HidiveTitle {
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
  RunTime:            number;
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
  ContinueWatching:   ContinueWatching;
  Episodes:           HidiveEpisode[];
  LoadTime:           number;
}

export interface ContinueWatching {
  Id:           string;
  ProfileId:    number;
  EpisodeId:    number;
  Status:       string;
  CurrentTime:  number;
  UserId:       number;
  TitleId:      number;
  SeasonId:     number;
  VideoId:      number;
  TotalSeconds: number;
  CreatedDT:    Date;
  ModifiedDT:   Date;
}

export interface HidiveEpisode {
  Id:                      number;
  Number:                  number;
  Name:                    string;
  Summary:                 string;
  HIDIVEPremiereDate:      Date;
  ScreenShotSmallUrl:      string;
  ScreenShotCompressedUrl: string;
  SeasonNumber:            number;
  TitleId:                 number;
  SeasonNumberValue:       number;
  EpisodeNumberValue:      number;
  VideoKey:                string;
  DisplayNameLong:         string;
  PercentProgress:         number;
  LoadTime:                number;
}

export interface HidiveEpisodeExtra extends HidiveEpisode {
  titleId:      number;
  epKey:        string;
  nameLong:     string;
  seriesTitle:  string;
  seriesId?:    number;
  isSelected:   boolean;
}