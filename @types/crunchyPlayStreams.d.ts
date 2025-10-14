import { Locale } from './playbackData';

export interface CrunchyPlayStream {
	assetId: string;
	audioLocale: Locale;
	bifs: string;
	burnedInLocale: string;
	captions: { [key: string]: Caption };
	hardSubs: { [key: string]: HardSub };
	playbackType: string;
	session: Session;
	subtitles: { [key: string]: Subtitle };
	token: string;
	url: string;
	versions: any[];
}

export interface Caption {
	format: string;
	language: string;
	url: string;
}

export interface HardSub {
	hlang: string;
	url: string;
	quality: string;
}

export interface Session {
	renewSeconds: number;
	noNetworkRetryIntervalSeconds: number;
	noNetworkTimeoutSeconds: number;
	maximumPauseSeconds: number;
	endOfVideoUnloadSeconds: number;
	sessionExpirationSeconds: number;
	usesStreamLimits: boolean;
}

export interface Subtitle {
	format: string;
	language: string;
	url: string;
}
