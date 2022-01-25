import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('Electron', {
  ipcRenderer
});