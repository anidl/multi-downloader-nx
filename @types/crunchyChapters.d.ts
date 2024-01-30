export interface CrunchyChapters {
  [key: string]: CrunchyChapter;
  lastUpdate: Date;
  mediaId:    string;
}

export interface CrunchyChapter {
  approverId:         string;
  distributionNumber: string;
  end:                number;
  start:              number;
  title:              string;
  seriesId:           string;
  new:                boolean;
  type:               string;
}
