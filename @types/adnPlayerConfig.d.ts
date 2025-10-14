export interface ADNPlayerConfig {
	player: Player;
}

export interface Player {
	image: string;
	options: Options;
}

export interface Options {
	user: User;
	chromecast: Chromecast;
	ios: Ios;
	video: Video;
	dock: any[];
	preference: Preference;
}

export interface Chromecast {
	appId: string;
	refreshTokenUrl: string;
}

export interface Ios {
	videoUrl: string;
	appUrl: string;
	title: string;
}

export interface Preference {
	quality: string;
	autoplay: boolean;
	language: string;
	green: boolean;
}

export interface User {
	hasAccess: boolean;
	profileId: number;
	refreshToken: string;
	refreshTokenUrl: string;
}

export interface Video {
	startDate: null;
	currentDate: Date;
	available: boolean;
	free: boolean;
	url: string;
}
