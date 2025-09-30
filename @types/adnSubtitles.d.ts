export interface ADNSubtitles {
	[subtitleLang: string]: Subtitle[];
}

export interface Subtitle {
	startTime: number;
	endTime: number;
	positionAlign: string;
	lineAlign: string;
	text: string;
}
