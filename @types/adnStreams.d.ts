export interface ADNStreams {
	links: Links;
	video: Video;
	metadata: Metadata;
}

export interface Links {
	streaming: Streaming;
	subtitles: Subtitles;
	history: string;
	nextVideoUrl: string;
	previousVideoUrl: string;
}

export interface Streaming {
	[streams: string]: Streams;
}

export interface Streams {
	mobile: string;
	sd: string;
	hd: string;
	fhd: string;
	auto: string;
}

export interface Subtitles {
	all: string;
}

export interface Metadata {
	title: string;
	subtitle: string;
	summary: null;
	rating: number;
}

export interface Video {
	guid: string;
	id: number;
	currentTime: number;
	duration: number;
	url: string;
	image: string;
	tcEpisodeStart?: string;
	tcEpisodeEnd?: string;
	tcIntroStart?: string;
	tcIntroEnd?: string;
	tcEndingStart?: string;
	tcEndingEnd?: string;
}
