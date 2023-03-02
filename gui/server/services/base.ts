import { DownloadInfo, FolderTypes, ProgressData, QueueItem } from '../../../@types/messageHandler';
import { RandomEvent, RandomEvents } from '../../../@types/randomEvents';
import WebSocketHandler from '../websocket';
import copy from 'copy-to-clipboard';
import open from 'open';
import { cfg } from '..';
import path from 'path';

export default class Base {

  constructor(private ws: WebSocketHandler) {}

  private downloading = false;

  private queue: QueueItem[] = [];
  private workOnQueue = false;

  setDownloading(downloading: boolean) {
    this.downloading = downloading;
  }

  getDownloading() {
    return this.downloading;
  }

  alertError(error: Error) {
    console.log(`[ERROR] ${error}`);
  }

  makeProgressHandler(videoInfo: DownloadInfo) {
    return ((data: ProgressData) => {
      this.sendMessage({
        name: 'progress',
        data: {
          downloadInfo: videoInfo,
          progress: data
        }
      });
    });
  }

  sendMessage<T extends keyof RandomEvents>(data: RandomEvent<T>) {
    this.ws.sendMessage(data);
  }

  async isDownloading() {
    return this.downloading;
  }

  async writeToClipboard(text: string) {
    copy(text);
    return true;
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
    this.queue.splice(index, 1);
    this.queueChange();
  }

  public async clearQueue() {
    this.queue = [];
    this.queueChange();
  }

  public addToQueue(data: QueueItem[]) {
    this.queue = this.queue.concat(...data);
    this.queueChange();
  }

  public setDownloadQueue(data: boolean) {
    this.workOnQueue = data;
    this.queueChange();
  }

  public async getDownloadQueue(): Promise<boolean> {
    return this.workOnQueue;
  }

  private async queueChange() {
    this.sendMessage({ name: 'queueChange', data: this.queue });
    if (this.workOnQueue && this.queue.length > 0 && !await this.isDownloading()) {
      this.setDownloading(true);
      this.sendMessage({ name: 'current', data: this.queue[0] });
      this.downloadItem(this.queue[0]);
      this.queue = this.queue.slice(1);
      this.queueChange();
    }
  }

  public async onFinish() {
    this.sendMessage({ name: 'current', data: undefined });
    this.queueChange();
  }

  //Overriten
  // eslint-disable-next-line
  public async downloadItem(_: QueueItem) {
    throw new Error('downloadItem not overriden');
  }
}