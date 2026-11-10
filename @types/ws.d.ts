import { GUIConfig } from '../modules/module.cfg-loader';
import { AuthResponse, CheckTokenResponse, EpisodeListResponse, FolderTypes, QueueItem, ResolveItemsData, SearchData, SearchResponse } from './messageHandler';

export type ServiceName = 'crunchy' | 'hidive' | 'adn';
export type ServiceOverview = { queue: QueueItem[]; current?: QueueItem; downloading: boolean; autoStart: boolean };

export type WSMessage<T extends keyof MessageTypes, P extends 0 | 1 = 0> = {
	service?: ServiceName;
	name: T;
	data: MessageTypes[T][P];
};

export type WSMessageWithID<T extends keyof MessageTypes, P extends 0 | 1 = 0> = WSMessage<T, P> & {
	id: string;
};

export type UnknownWSMessage = {
	service?: ServiceName;
	name: keyof MessageTypes;
	data: MessageTypes[keyof MessageTypes][0];
	id: string;
};

export type MessageTypes = {
	auth: [AuthData, AuthResponse];
	version: [undefined, string];
	checkToken: [undefined, CheckTokenResponse];
	search: [SearchData, SearchResponse];
	default: [string, unknown];
	availableDubCodes: [undefined, string[]];
	availableSubCodes: [undefined, string[]];
	resolveItems: [ResolveItemsData, boolean];
	listEpisodes: [string, EpisodeListResponse];
	downloadItem: [QueueItem, undefined];
	isDownloading: [undefined, boolean];
	openFolder: [FolderTypes, undefined];
	changeProvider: [undefined, boolean];
	type: [undefined, 'crunchy' | 'hidive' | 'adn' | undefined];
	setup: [ServiceName | undefined, boolean];
	overview: [undefined, Record<ServiceName, ServiceOverview>];
	resolveDetailed: [ResolveItemsData, { ok: boolean; added: number; message?: string }];
	openFile: [[FolderTypes, string], undefined];
	openURL: [string, undefined];
	isSetup: [undefined, boolean];
	setupServer: [GUIConfig, boolean];
	requirePassword: [undefined, boolean];
	getQueue: [undefined, QueueItem[]];
	removeFromQueue: [number, undefined];
	clearQueue: [undefined, undefined];
	setDownloadQueue: [boolean, undefined];
	getDownloadQueue: [undefined, boolean];
};
