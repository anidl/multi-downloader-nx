export interface ADNVideos {
	videos: ADNVideo[];
}

export interface ADNVideo {
	id: number;
	title: string;
	name: string;
	number: string;
	shortNumber: string;
	season: string;
	reference: string;
	type: string;
	order: number;
	image: string;
	image2x: string;
	summary: string;
	releaseDate: Date;
	duration: number;
	url: string;
	urlPath: string;
	embeddedUrl: string;
	languages: string[];
	qualities: string[];
	rating: number;
	ratingsCount: number;
	commentsCount: number;
	available: boolean;
	download: boolean;
	free: boolean;
	freeWithAds: boolean;
	show: Show;
	indexable: boolean;
	isSelected?: boolean;
}

export interface Show {
	id: number;
	title: string;
	type: string;
	originalTitle: string;
	shortTitle: string;
	reference: string;
	age: string;
	languages: string[];
	summary: string;
	image: string;
	image2x: string;
	imageHorizontal: string;
	imageHorizontal2x: string;
	url: string;
	urlPath: string;
	episodeCount: number;
	genres: string[];
	copyright: string;
	rating: number;
	ratingsCount: number;
	commentsCount: number;
	qualities: string[];
	simulcast: boolean;
	free: boolean;
	available: boolean;
	download: boolean;
	basedOn: string;
	tagline: string;
	firstReleaseYear: string;
	productionStudio: string;
	countryOfOrigin: string;
	productionTeam: ProductionTeam[];
	nextVideoReleaseDate: Date;
	indexable: boolean;
}

export interface ProductionTeam {
	role: string;
	name: string;
}
