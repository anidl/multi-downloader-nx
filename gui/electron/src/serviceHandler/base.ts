import { BrowserWindow, clipboard, dialog, shell } from 'electron';
import { DownloadInfo, FolderTypes, ProgressData } from '../../../../@types/messageHandler';
import { RandomEvent, RandomEvents } from '../../../../@types/randomEvents';
import { loadCfg } from '../../../../modules/module.cfg-loader';

export default class Base {

  constructor(private window: BrowserWindow) {}

  private downloading = false;

  setDownloading(downloading: boolean) {
    this.downloading = downloading;
  }

  getDownloading() {
    return this.downloading;
  }

  alertError(error: Error) {
    dialog.showMessageBoxSync(this.window, {
      message: `${error.name ?? 'An error occured'}\n${error.message}`,
      detail: error.stack,
      title: 'Error',
      type: 'error'
    });
  }

  makeProgressHandler(videoInfo: DownloadInfo) {
    return ((data: ProgressData) => {
      const progress = (typeof data.percent === 'string' ?
        parseFloat(data.percent) : data.percent) / 100;
      this.window.setProgressBar(progress === 1 ? -1 : progress);
      this.sendMessage({
        name: 'progress',
        data: {
          downloadInfo: videoInfo,
          progress: data
        }
      });
    }).bind(this);
  }

  getWindow() {
    return this.window;
  }

  sendMessage<T extends keyof RandomEvents>(data: RandomEvent<T>) {
    this.window.webContents.send('randomEvent', data);
  }

  isDownloading() {
    return this.downloading;
  }

  async writeToClipboard(text: string) {
    clipboard.writeText(text, 'clipboard');
    return true;
  } 

  async openFolder(folderType: FolderTypes) {
    const conf = loadCfg();
    switch (folderType) {
    case 'content':
      shell.openPath(conf.dir.content);
      break;
    case 'config':
      shell.openPath(conf.dir.config);
      break;
    }
  }

}