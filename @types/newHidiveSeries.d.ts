export interface NewHidiveSeries {
	id: number;
	title: string;
	description: string;
	longDescription: string;
	smallCoverUrl: string;
	coverUrl: string;
	titleUrl: string;
	posterUrl: string;
	seasons: Season[];
	rating: Rating;
	contentRating: Rating;
	displayableTags: any[];
	paging: Paging;
}

export interface Rating {
	rating: string;
	descriptors: any[];
}

export interface Paging {
	moreDataAvailable: boolean;
	lastSeen: number;
}

export interface Season {
	title: string;
	description: string;
	longDescription: string;
	seasonNumber: number;
	episodeCount: number;
	displayableTags: any[];
	id: number;
}
