import { ipcMain, MessagePortMain } from "electron";
import { MessageHandler } from "../../../@types/messageHandler";
import Funimation from './serviceHandler/funimation';

let handler: MessageHandler|undefined;

ipcMain.on('setup', (ev, data) => {
  if (data === 'funi') {
    handler = new Funimation();
  } else if (data === 'crunchy') {

  }
});
