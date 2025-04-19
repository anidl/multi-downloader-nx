export interface HidiveDashboard {
  Code:      number;
  Status:    string;
  Message:   null;
  Messages:  object;
  Data:      Data;
  Timestamp: string;
  IPAddress: string;
}

export interface Data {
  TitleRows: TitleRow[];
  LoadTime:  number;
}

export interface TitleRow {
  Name:     string;
  Titles:   Title[];
  LoadTime: number;
}

export interface Title {
  Id:                 number;
  Name:               string;
  ShortSynopsis:      string;
  MediumSynopsis:     string;
  LongSynopsis:       string;
  KeyArtUrl:          string;
  MasterArtUrl:       string;
  Rating:             null | string;
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
  ContinueWatching:   ContinueWatching;
  Episodes:           any[];
  LoadTime:           number;
}

export interface ContinueWatching {
  Id:           string;
  ProfileId:    number;
  EpisodeId:    number;
  Status:       Status | null;
  CurrentTime:  number;
  UserId:       number;
  TitleId:      number;
  SeasonId:     number;
  VideoId:      number;
  TotalSeconds: number;
  CreatedDT:    Date;
  ModifiedDT:   Date | null;
}

export enum Status {
  Paused = 'Paused',
  Playing = 'Playing',
  Watching = 'Watching',
}