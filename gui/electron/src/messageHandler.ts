import { ipcMain } from 'electron';
import { MessageHandler } from '../../../@types/messageHandler';
import Crunchy from './serviceHandler/crunchyroll';
import Funimation from './serviceHandler/funimation';

export default () => {
  let handler: MessageHandler|undefined;
  
  ipcMain.handle('setup', (_, data) => {
    if (data === 'funi') {
      handler = new Funimation();
    } else if (data === 'crunchy') {
      handler = new Crunchy();
    }
  });
  
  ipcMain.handle('auth', async (_, data) => handler?.auth(data));
  ipcMain.handle('checkToken', async () => handler?.checkToken());
  ipcMain.handle('search', async (_, data) => handler?.search(data));
  ipcMain.handle('default', async (_, data) => handler?.handleDefault(data));
  ipcMain.handle('availableDubCodes', async () => handler?.availableDubCodes());
};
