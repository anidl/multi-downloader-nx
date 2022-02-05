import React from 'react';
import type { MessageHandler } from '../../../../@types/messageHandler';
import type { IpcRenderer, IpcRendererEvent } from "electron";
import useStore from '../hooks/useStore';

import type { RandomEvents } from '../../../../@types/randomEvents';

export type Handler<T> = (data: T) => unknown;

export type FrontEndMessanges = (MessageHandler & { randomEvents: RandomEventHandler });

export class RandomEventHandler {
  private handler: {
    [eventName in keyof RandomEvents]: Handler<RandomEvents[eventName]>[]
  } = {
    progress: [],
    finish: []
  };
  private allHandler: Handler<unknown>[] = [];

  public on<T extends keyof RandomEvents>(name: T, listener: Handler<RandomEvents[T]>) {
    if (Object.prototype.hasOwnProperty.call(this.handler, name)) {
      this.handler[name].push(listener);
    } else {
      this.handler[name] = [ listener ];
    }
  }

  public emit<T extends keyof RandomEvents>(name: T, data: RandomEvents[T]) {
    (this.handler[name] ?? []).forEach(handler => handler(data));
    this.allHandler.forEach(handler => handler(data));
  }

  public removeListener<T extends keyof RandomEvents>(name: T, listener: Handler<RandomEvents[T]>) {
    this.handler[name] = this.handler[name].filter(a => a !== listener);
  }

  public onAll(listener: Handler<unknown>) {
    this.allHandler.push(listener);
  }

  public removeAllListener(listener: Handler<unknown>) {
    this.allHandler = this.allHandler.filter(a => a !== listener);
  }
}

export const messageChannelContext = React.createContext<FrontEndMessanges|undefined>(undefined);

const MessageChannelProvider: React.FC = ({ children }) => {

  const [store, dispatch] = useStore();

  const { ipcRenderer } = (window as any).Electron as { ipcRenderer: IpcRenderer };
  const [ randomEventHandler ] = React.useState(new RandomEventHandler());

  const buildListener = (event: keyof RandomEvents) => {
    return (_: IpcRendererEvent, ...data: any[]) => randomEventHandler.emit(event, data.length === 0 ? undefined : data[0]);
  }

  React.useEffect(() => {
    (async () => {
      const currentService = await ipcRenderer.invoke('type');
      if (currentService !== undefined)
        return dispatch({ type: 'service', payload: currentService });
      if (store.service !== currentService) 
        ipcRenderer.invoke('setup', store.service)
    })();
  }, [store.service])

  React.useEffect(() => {
    const progressListener = buildListener('progress');
    const finishListener = buildListener('finish');
    ipcRenderer.on('progress', progressListener);
    ipcRenderer.on('finish', finishListener);
    return () => {
      ipcRenderer.removeListener('progress', progressListener);
      ipcRenderer.removeListener('finish', finishListener);
    };
  }, [ ipcRenderer ]);


  const messageHandler: FrontEndMessanges = {
    auth: async (data) => await ipcRenderer.invoke('auth', data),
    checkToken: async () => await ipcRenderer.invoke('checkToken'),
    search: async (data) => await ipcRenderer.invoke('search', data),
    handleDefault: async (data) => await ipcRenderer.invoke('default', data),
    availableDubCodes: async () => await ipcRenderer.invoke('availableDubCodes'),
    resolveItems: async (data) => await ipcRenderer.invoke('resolveItems', data),
    listEpisodes: async (data) => await ipcRenderer.invoke('listEpisodes', data),
    randomEvents: randomEventHandler,
    downloadItem: (data) => ipcRenderer.invoke('downloadItem', data)
  }

  return <messageChannelContext.Provider value={messageHandler}>
    {children}
  </messageChannelContext.Provider>;
};

export default MessageChannelProvider;