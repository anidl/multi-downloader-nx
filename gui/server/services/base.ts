import { DownloadInfo, FolderTypes, GuiState, ProgressData, QueueItem } from '../../../@types/messageHandler';
import { RandomEvent, RandomEvents } from '../../../@types/randomEvents';
import WebSocketHandler from '../websocket';
import open from 'open';
import { cfg } from '..';
import path from 'path';
import { console } from '../../../modules/log';
import { getState, setState } from '../../../modules/module.cfg-loader';
import packageJson from '../../../package.json';

export default class Base {
	private state: GuiState;
	public name = 'default';
	constructor(private ws: WebSocketHandler) {
		this.state = getState();
	}

	private downloading = false;

	private queue: QueueItem[] = [];
	private workOnQueue = false;

	version(): Promise<string> {
		return Promise.resolve(packageJson.version);
	}

	initState() {
		if (!this.state.services || typeof this.state.services !== 'object') this.state.services = {};
		const saved = this.state.services[this.name];
		this.queue = Array.isArray(saved?.queue) ? saved.queue : [];
		this.state.services[this.name] = { queue: this.queue };
		void this.queueChange();
	}

	setDownloading(downloading: boolean) {
		this.downloading = downloading;
	}

	getDownloading() {
		return this.downloading;
	}

	alertError(error: Error) {
		console.error(`${error}`);
		this.sendMessage({ name: 'queueError', data: error.message });
	}

	makeProgressHandler(videoInfo: DownloadInfo) {
		return (data: ProgressData) => {
			this.sendMessage({
				name: 'progress',
				data: {
					downloadInfo: videoInfo,
					progress: data
				}
			});
		};
	}

	sendMessage<T extends keyof RandomEvents>(data: RandomEvent<T>) {
		this.ws.sendMessage(data);
	}

	async isDownloading() {
		return this.downloading;
	}

	async openFolder(folderType: FolderTypes) {
		switch (folderType) {
			case 'content':
				open(cfg.dir.content);
				break;
			case 'config':
				open(cfg.dir.config);
				break;
		}
	}

	async openFile(data: [FolderTypes, string]) {
		switch (data[0]) {
			case 'config':
				open(path.join(cfg.dir.config, data[1]));
				break;
			case 'content':
				throw new Error('No subfolders');
		}
	}

	async openURL(data: string) {
		open(data);
	}

	public async getQueue(): Promise<QueueItem[]> {
		return this.queue;
	}

	public async removeFromQueue(index: number) {
		if (!Number.isInteger(index) || index < 0 || index >= this.queue.length) return;
		this.queue.splice(index, 1);
		void this.queueChange();
	}

	public async clearQueue() {
		this.queue = [];
		void this.queueChange();
	}

	public addToQueue(data: QueueItem[]) {
		if (!data.length) return;
		this.queue = this.queue.concat(data);
		void this.queueChange();
	}

	public setDownloadQueue(data: boolean) {
		this.workOnQueue = data;
		void this.queueChange();
	}

	public async getDownloadQueue(): Promise<boolean> {
		return this.workOnQueue;
	}

	private async queueChange() {
		// Persist the same snapshot that is shown to clients.
		if (this.workOnQueue && this.queue.length > 0 && !this.downloading) {
			const next = this.queue.shift()!;
			this.setDownloading(true);
			this.sendMessage({ name: 'current', data: next });
			void Promise.resolve().then(() => this.downloadItem(next)).catch((error) => {
				this.alertError(error instanceof Error ? error : new Error(String(error)));
				this.setDownloading(false);
				void this.onFinish();
			});
		}
		this.state.services[this.name].queue = this.queue;
		setState(this.state);
		this.sendMessage({ name: 'queueChange', data: this.queue });
	}

	public async onFinish() {
		this.sendMessage({ name: 'current', data: undefined });
		void this.queueChange();
	}

	//Overriten
	// eslint-disable-next-line
	public async downloadItem(_: QueueItem) {
		throw new Error('downloadItem not overriden');
	}
}
