import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('Electron', {
  ipcRenderer: {
    ...ipcRenderer,
    on: (name: string, handler: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => {
      ipcRenderer.on(name, handler);
      return ipcRenderer;
    },
    removeListener: (name: string, handler: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => {
      ipcRenderer.removeListener(name, handler);
    }
  }
});