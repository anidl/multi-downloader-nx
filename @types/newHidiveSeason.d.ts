export interface NewHidiveSeason {
	title: string;
	description: string;
	longDescription: string;
	smallCoverUrl: string;
	coverUrl: string;
	titleUrl: string;
	posterUrl: string;
	seasonNumber: number;
	episodeCount: number;
	displayableTags: any[];
	rating: Rating;
	contentRating: Rating;
	id: number;
	series: Series;
	episodes: Episode[];
	paging: Paging;
	licences: any[];
}

export interface Rating {
	rating: string;
	descriptors: any[];
}

export interface Episode {
	accessLevel: string;
	availablePurchases?: any[];
	licenceIds?: any[];
	type: string;
	id: number;
	title: string;
	description: string;
	thumbnailUrl: string;
	posterUrl: string;
	duration: number;
	favourite: boolean;
	contentDownload: ContentDownload;
	offlinePlaybackLanguages: string[];
	externalAssetId: string;
	subEvents: any[];
	maxHeight: number;
	thumbnailsPreview: string;
	longDescription: string;
	episodeInformation: EpisodeInformation;
	categories: string[];
	displayableTags: any[];
	watchStatus: string;
	computedReleases: any[];
}

export interface ContentDownload {
	permission: string;
}

export interface EpisodeInformation {
	seasonNumber: number;
	episodeNumber: number;
	season: number;
}

export interface Paging {
	moreDataAvailable: boolean;
	lastSeen: number;
}

export interface Series {
	seriesId: number;
	title: string;
	description: string;
	longDescription: string;
	displayableTags: any[];
	rating: Rating;
	contentRating: Rating;
}

export interface NewHidiveSeriesExtra extends Series {
	season: NewHidiveSeason;
}

export interface NewHidiveEpisodeExtra extends Episode {
	titleId: number;
	nameLong: string;
	seasonTitle: string;
	seriesTitle: string;
	seriesId?: number;
	isSelected: boolean;
	jwtToken?: string;
}
