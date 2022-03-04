import { BrowserWindow, ipcMain } from 'electron';
import { MessageHandler } from '../../../@types/messageHandler';
import Crunchy from './serviceHandler/crunchyroll';
import Funimation from './serviceHandler/funimation';

export default (window: BrowserWindow) => {
  let handler: MessageHandler|undefined;
  ipcMain.handle('setup', (_, data) => {
    if (data === 'funi') {
      handler = new Funimation(window);
    } else if (data === 'crunchy') {
      handler = new Crunchy(window);
    }
  });

  ipcMain.on('changeProvider', (ev) => {
    handler = undefined;
    ev.returnValue = true;
  })
  
  ipcMain.handle('type', async () => handler === undefined ? undefined : handler instanceof Funimation ? 'funi' : 'crunchy');
  ipcMain.handle('auth', async (_, data) => handler?.auth(data));
  ipcMain.handle('checkToken', async () => handler?.checkToken());
  ipcMain.handle('search', async (_, data) => handler?.search(data));
  ipcMain.handle('default', async (_, data) => handler?.handleDefault(data));
  ipcMain.handle('availableDubCodes', async () => handler?.availableDubCodes());
  ipcMain.handle('availableSubCodes', async () => handler?.availableSubCodes());
  ipcMain.handle('resolveItems', async (_, data) => handler?.resolveItems(data));
  ipcMain.handle('listEpisodes', async (_, data) => handler?.listEpisodes(data));
  ipcMain.handle('downloadItem', async (_, data) => handler?.downloadItem(data));
  ipcMain.handle('writeToClipboard', async (_, data) => handler?.writeToClipboard(data));
  ipcMain.handle('openFolder', async (_, data) => handler?.openFolder(data));
  ipcMain.on('isDownloading', (ev) => ev.returnValue = handler?.isDownloading());
};
