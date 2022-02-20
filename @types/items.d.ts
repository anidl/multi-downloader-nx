export interface Item {
  // Added later
  id: string,
  id_split: (number|string)[]
  // Added from the start
  mostRecentSvodJpnUs:                    MostRecentSvodJpnUs;
  synopsis:                               string;
  mediaCategory:                          ContentType;
  mostRecentSvodUsEndTimestamp:           number;
  quality:                                QualityClass;
  genres:                                 Genre[];
  titleImages:                            TitleImages;
  engAllTerritoryAvail:                   EngAllTerritoryAvail;
  thumb:                                  string;
  mostRecentSvodJpnAllTerrStartTimestamp: number;
  title:                                  string;
  starRating:                             number;
  primaryAvail:                           PrimaryAvail;
  access:                                 Access[];
  version:                                Version[];
  mostRecentSvodJpnAllTerrEndTimestamp:   number;
  itemId:                                 number;
  versionAudio:                           VersionAudio;
  contentType:                            ContentType;
  mostRecentSvodUsStartTimestamp:         number;
  poster:                                 string;
  mostRecentSvodEngAllTerrEndTimestamp:   number;
  mostRecentSvodJpnUsStartTimestamp:      number;
  mostRecentSvodJpnUsEndTimestamp:        number;
  mostRecentSvodStartTimestamp:           number;
  mostRecentSvod:                         MostRecent;
  altAvail:                               AltAvail;
  ids:                                    IDs;
  mostRecentSvodUs:                       MostRecent;
  item:                                   Item;
  mostRecentSvodEngAllTerrStartTimestamp: number;
  audio:                                  string[];
  mostRecentAvod:                         MostRecent;
}

export enum ContentType {
  Episode = 'episode',
  Ova = 'ova',
}

export interface IDs {
  externalShowId:    ID;
  externalSeasonId:  ExternalSeasonID;
  externalEpisodeId: string;
  externalAsianId?: string
}

export interface Item {
  seasonTitle:     string;
  seasonId:        number;
  episodeOrder:    number;
  episodeSlug:     string;
  created:         Date;
  titleSlug:       string;
  episodeNum:      string;
  episodeId:       number;
  titleId:         number;
  seasonNum:       string;
  ratings:         Array<string[]>;
  showImage:       string;
  titleName:       string;
  runtime:         string;
  episodeName:     string;
  seasonOrder:     number;
  titleExternalId: string;
}


export interface MostRecent {
  image?:                 string;
  siblingStartTimestamp?: string;
  devices?:               Device[];
  availId?:               number;
  distributor?:           Distributor;
  quality?:               MostRecentAvodQuality;
  endTimestamp?:          string;
  mediaCategory?:         ContentType;
  isPromo?:               boolean;
  siblingType?:           Purchase;
  version?:               Version;
  territory?:             Territory;
  startDate?:             Date;
  endDate?:               Date;
  versionId?:             number;
  tier?:                  Device | null;
  purchase?:              Purchase;
  startTimestamp?:        string;
  language?:              Audio;
  itemTitle?:             string;
  ids?:                   MostRecentAvodIDS;
  experience?:            number;
  siblingEndTimestamp?:   string;
  item?:                  Item;
  subscriptionRequired?:  boolean;
  purchased?:             boolean;
}

export interface MostRecentAvodIDS {
  externalSeasonId:  ExternalSeasonID;
  externalAsianId:   null;
  externalShowId:    ID;
  externalEpisodeId: string;
  externalEnglishId: string;
  externalAlphaId:   string;
}

export enum Purchase {
  AVOD = 'A-VOD',
  Dfov = 'DFOV',
  Est = 'EST',
  Svod = 'SVOD',
}

export enum Version {
  Simulcast = 'Simulcast',
  Uncut = 'Uncut',
}

export type MostRecentSvodJpnUs = Record<string, any>

export interface QualityClass {
  quality: QualityQuality;
  height:  number;
}

export enum QualityQuality {
  HD = 'HD',
  SD = 'SD',
}

export interface TitleImages {
  showThumbnail:                string;
  showBackgroundSite:           string;
  showDetailHeaderDesktop:      string;
  continueWatchingDesktop:      string;
  showDetailHeroSite:           string;
  appleHorizontalBannerShow:    string;
  backgroundImageXbox_360:      string;
  applePosterCover:             string;
  showDetailBoxArtTablet:       string;
  featuredShowBackgroundTablet: string;
  backgroundImageAppletvfiretv: string;
  newShowDetailHero:            string;
  showDetailHeroDesktop:        string;
  showKeyart:                   string;
  continueWatchingMobile:       string;
  featuredSpotlightShowPhone:   string;
  appleHorizontalBannerMovie:   string;
  featuredSpotlightShowTablet:  string;
  showDetailBoxArtPhone:        string;
  featuredShowBackgroundPhone:  string;
  appleSquareCover:             string;
  backgroundVideo:              string;
  showMasterKeyArt:             string;
  newShowDetailHeroPhone:       string;
  showDetailBoxArtXbox_360:     string;
  showDetailHeaderMobile:       string;
  showLogo:                     string;
}

export interface VersionAudio {
  Uncut?:    Audio[];
  Simulcast: Audio[];
}