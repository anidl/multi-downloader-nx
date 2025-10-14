export interface NewHidivePlayback {
	watermark: null;
	skipMarkers: any[];
	annotations: null;
	dash: Format[];
	hls: Format[];
}

export interface Format {
	subtitles: Subtitle[];
	url: string;
	drm: DRM;
}

export interface DRM {
	encryptionMode: string;
	containerType: string;
	jwtToken: string;
	url: string;
	keySystems: string[];
}

export interface Subtitle {
	format: Formats;
	language: string;
	url: string;
}

export enum Formats {
	Scc = 'scc',
	Srt = 'srt',
	Vtt = 'vtt'
}
