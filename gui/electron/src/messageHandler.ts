import { ipcMain, MessagePortMain } from "electron";
import { MessageHandler } from "../../../@types/messageHandler";
import Funimation from './serviceHandler/funimation';

export default () => {
  let handler: MessageHandler|undefined;
  
  ipcMain.handle('setup', (ev, data) => {
    if (data === 'funi') {
      handler = new Funimation();
    } else if (data === 'crunchy') {
  
    }
  });
  
  ipcMain.handle('auth', async (ev, data) => handler?.auth(data));
}
