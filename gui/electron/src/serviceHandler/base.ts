import { BrowserWindow, dialog } from "electron";
import { ProgressData } from "../../../../@types/messageHandler";

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

  handleProgress(data: ProgressData) {
    this.window.webContents.send('progress', data);
  }

  getWindow() {
    return this.window;
  }

}