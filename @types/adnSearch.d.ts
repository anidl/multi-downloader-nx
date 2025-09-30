export interface ADNSearch {
	shows: ADNSearchShow[];
	total: number;
}

export interface ADNSearchShow {
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
	tagline: null;
	firstReleaseYear: string;
	productionStudio: string;
	countryOfOrigin: string;
	productionTeam: ProductionTeam[];
	nextVideoReleaseDate: null;
	indexable: boolean;
}

export interface ProductionTeam {
	role: string;
	name: string;
}
