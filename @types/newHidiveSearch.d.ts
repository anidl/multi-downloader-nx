export interface NewHidiveSearch {
  results: Result[];
}

export interface Result {
  hits:                Hit[];
  nbHits:              number;
  page:                number;
  nbPages:             number;
  hitsPerPage:         number;
  exhaustiveNbHits:    boolean;
  exhaustiveTypo:      boolean;
  exhaustive:          Exhaustive;
  query:               string;
  params:              string;
  index:               string;
  renderingContent:    object;
  processingTimeMS:    number;
  processingTimingsMS: ProcessingTimingsMS;
  serverTimeMS:        number;
}

export interface Exhaustive {
  nbHits: boolean;
  typo:   boolean;
}

export interface Hit {
  type:             string;
  weight:           number;
  id:               number;
  name:             string;
  description:      string;
  meta:             object;
  coverUrl:         string;
  smallCoverUrl:    string;
  seasonsCount:     number;
  tags:             string[];
  localisations:    HitLocalisations;
  ratings:          Ratings;
  objectID:         string;
  _highlightResult: HighlightResult;
}

export interface HighlightResult {
  name:          Description;
  description:   Description;
  tags:          Description[];
  localisations: HighlightResultLocalisations;
}

export interface Description {
  value:             string;
  matchLevel:        string;
  matchedWords:      string[];
  fullyHighlighted?: boolean;
}

export interface HighlightResultLocalisations {
  en_US: PurpleEnUS;
}

export interface PurpleEnUS {
  title:       Description;
  description: Description;
}

export interface HitLocalisations {
  [language: string]: HitLocalization;
}

export interface HitLocalization {
  title:       string;
  description: string;
}

export interface Ratings {
  US: string[];
}

export interface ProcessingTimingsMS {
  _request: Request;
}

export interface Request {
  queue:     number;
  roundTrip: number;
}
