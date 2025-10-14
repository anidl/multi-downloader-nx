export interface NewHidiveEpisode {
	description: string;
	duration: number;
	title: string;
	categories: string[];
	contentDownload: ContentDownload;
	favourite: boolean;
	subEvents: any[];
	thumbnailUrl: string;
	longDescription: string;
	posterUrl: string;
	offlinePlaybackLanguages: string[];
	externalAssetId: string;
	maxHeight: number;
	rating: Rating;
	episodeInformation: EpisodeInformation;
	id: number;
	accessLevel: string;
	playerUrlCallback: string;
	thumbnailsPreview: string;
	displayableTags: any[];
	plugins: any[];
	watchStatus: string;
	computedReleases: any[];
	licences: any[];
	type: string;
}

export interface ContentDownload {
	permission: string;
	period: string;
}

export interface EpisodeInformation {
	seasonNumber: number;
	episodeNumber: number;
	season: number;
}

export interface Rating {
	rating: string;
	descriptors: any[];
}
