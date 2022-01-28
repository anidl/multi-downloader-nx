import { ipcMain, MessagePortMain } from "electron";
import { MessageHandler } from "../../../@types/messageHandler";
import Funimation from './serviceHandler/funimation';

export default () => {
  let handler: MessageHandler|undefined;
  
  ipcMain.handle('setup', (_, data) => {
    if (data === 'funi') {
      handler = new Funimation();
    } else if (data === 'crunchy') {
  
    }
  });
  
  ipcMain.handle('auth', async (_, data) => handler?.auth(data));
  ipcMain.handle('checkToken', async () => handler?.checkToken());
  ipcMain.handle('search', async (_, data) => handler?.search(data));
  ipcMain.handle('dubLangCodes', async () => handler?.dubLangCodes());
}
