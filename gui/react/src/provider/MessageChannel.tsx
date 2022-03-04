import React from 'react';
import type { MessageHandler } from '../../../../@types/messageHandler';
import type { IpcRenderer, IpcRendererEvent } from "electron";
import useStore from '../hooks/useStore';

import type { Handler, RandomEvent, RandomEvents } from '../../../../@types/randomEvents';
import { Backdrop, Typography } from '@mui/material';


export type FrontEndMessanges = (MessageHandler & { randomEvents: RandomEventHandler, logout: () => boolean });

export class RandomEventHandler {
  private handler: {
    [eventName in keyof RandomEvents]: Handler<eventName>[]
  } = {
    progress: [],
    finish: []
  };

  public on<T extends keyof RandomEvents>(name: T, listener: Handler<T>) {
    if (Object.prototype.hasOwnProperty.call(this.handler, name)) {
      this.handler[name].push(listener as any);
    } else {
      this.handler[name] = [ listener as any ];
    }
  }

  public emit<T extends keyof RandomEvents>(name: keyof RandomEvents, data: RandomEvent<T>) {
    (this.handler[name] ?? []).forEach(handler => handler(data as any));
  }

  public removeListener<T extends keyof RandomEvents>(name: T, listener: Handler<T>) {
    this.handler[name] = (this.handler[name] as Handler<T>[]).filter(a => a !== listener) as any;
  }
}

export const messageChannelContext = React.createContext<FrontEndMessanges|undefined>(undefined);

const MessageChannelProvider: React.FC = ({ children }) => {

  const [store, dispatch] = useStore();

  const { ipcRenderer } = (window as any).Electron as { ipcRenderer: IpcRenderer };
  const randomEventHandler = React.useMemo(() => new RandomEventHandler(), []);

  React.useEffect(() => {
    (async () => {
      const currentService = await ipcRenderer.invoke('type');
      if (currentService !== undefined)
        return dispatch({ type: 'service', payload: currentService });
      if (store.service !== currentService) 
        ipcRenderer.invoke('setup', store.service)
    })();
  }, [store.service, dispatch, ipcRenderer])

  React.useEffect(() => {
    /* finish is a placeholder */
    const listener = (_: IpcRendererEvent, initalData: RandomEvent<'finish'>) => {
      const eventName = initalData.name as keyof RandomEvents;
      const data = initalData as unknown as RandomEvent<typeof eventName>;

      randomEventHandler.emit(data.name, data);
    }
    ipcRenderer.on('randomEvent', listener);
    return () => {
      ipcRenderer.removeListener('randomEvent', listener);
    };
  }, [ ipcRenderer ]);


  const messageHandler: FrontEndMessanges = {
    auth: async (data) => await ipcRenderer.invoke('auth', data),
    checkToken: async () => await ipcRenderer.invoke('checkToken'),
    search: async (data) => await ipcRenderer.invoke('search', data),
    handleDefault: async (data) => await ipcRenderer.invoke('default', data),
    availableDubCodes: async () => await ipcRenderer.invoke('availableDubCodes'),
    availableSubCodes: async () => await ipcRenderer.invoke('availableSubCodes'),
    resolveItems: async (data) => await ipcRenderer.invoke('resolveItems', data),
    listEpisodes: async (data) => await ipcRenderer.invoke('listEpisodes', data),
    randomEvents: randomEventHandler,
    downloadItem: (data) => ipcRenderer.invoke('downloadItem', data),
    isDownloading: () => ipcRenderer.sendSync('isDownloading'),
    writeToClipboard: async (data) => await ipcRenderer.invoke('writeToClipboard', data),
    openFolder: async (data) => await ipcRenderer.invoke('openFolder', data),
    logout: () => ipcRenderer.sendSync('changeProvider')
  }

  return <messageChannelContext.Provider value={messageHandler}>
    {children}
  </messageChannelContext.Provider>;
};

export default MessageChannelProvider;