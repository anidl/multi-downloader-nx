import { BrowserWindow, clipboard, dialog, shell } from "electron";
import { DownloadInfo, ProgressData } from "../../../../@types/messageHandler";
import { RandomEvent, RandomEvents } from "../../../../@types/randomEvents";
import { isWindows } from "..";

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
      title: `Error`,
      type: 'error'
    })
  }

  makeProgressHandler(videoInfo: DownloadInfo) {
    return ((data: ProgressData) => {
      this.sendMessage({
        name: 'progress',
        data: {
          downloadInfo: videoInfo,
          progress: data
        }
      })
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

  async openFolder(subPath: string[]) {
    const sep = isWindows ? '\\' : '/';

    const p = __dirname.split(sep).slice(0, -4); // gui/electron/src/serviceHandler
    p.push(...subPath);
    shell.openPath(p.join(sep));
  }

}