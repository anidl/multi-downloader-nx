import React from 'react';
import type { AuthData, AuthResponse, EpisodeListResponse, MessageHandler, QueueItem, ResolveItemsData, ResponseBase, SearchData, SearchResponse } from '../../../../@types/messageHandler';
import useStore from '../hooks/useStore';
import type { MessageTypes, WSMessage, WSMessageWithID } from '../../../../@types/ws';
import type { Handler, RandomEvent, RandomEvents } from '../../../../@types/randomEvents';
import { Backdrop, Typography } from '@mui/material';
import { v4 } from "uuid";


export type FrontEndMessanges = (MessageHandler & { randomEvents: RandomEventHandler, logout: () => Promise<boolean> });

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

async function messageAndResponse<T extends keyof MessageTypes>(socket: WebSocket, msg: WSMessage<T>): Promise<WSMessage<T, 1>> {
  const id = v4();
  const ret = new Promise<WSMessage<T, 1>>((resolve) => {
    const handler = function({ data }: MessageEvent) {
      const parsed = JSON.parse(data.toString()) as WSMessageWithID<T, 1>;
      if (parsed.id === id) {
        socket.removeEventListener('message', handler);
        resolve(parsed);
      }
    }
    socket.addEventListener('message', handler); 
  });
  const toSend = msg as WSMessageWithID<T>;
  toSend.id = id;

  socket.send(JSON.stringify(toSend));
  return ret;
} 

const MessageChannelProvider: FCWithChildren = ({ children }) => {

  const [store, dispatch] = useStore();
  const [socket, setSocket] = React.useState<undefined|WebSocket|null>();

  React.useEffect(() => {
    const wws = new WebSocket(`ws://localhost:3000/ws?${new URLSearchParams({
      password: prompt('This website requires a password') ?? ''
    })}`, );
    wws.addEventListener('open', () => {
      console.log('[INFO] [WS] Connected');
      setSocket(wws);
    });
    wws.addEventListener('error', (er) => {
      console.error(`[ERROR] [WS]`, er);
      setSocket(null);
    })
  }, []);
  

  const randomEventHandler = React.useMemo(() => new RandomEventHandler(), []);

  React.useEffect(() => {
    (async () => {
      if (!socket)
        return;
      const currentService = await messageAndResponse(socket, { name: 'type', data: undefined });
      if (currentService.data !== undefined)
        return dispatch({ type: 'service', payload: currentService.data });
      if (store.service !== currentService.data) 
        messageAndResponse(socket, { name: 'setup', data: store.service });
    })();
  }, [store.service, dispatch, socket])

  React.useEffect(() => {
    if (!socket)
      return;
    /* finish is a placeholder */
    const listener = (initalData: MessageEvent<string>) => {
      const data = JSON.parse(initalData.data) as RandomEvent<'finish'>;
      randomEventHandler.emit(data.name, data);
    }
    socket.addEventListener('message', listener);
    return () => {
      socket.removeEventListener('message', listener);
    };
  }, [ socket ]);

  if (socket === undefined || socket === null)
    return <Typography color='primary'>{socket === undefined ? 'Loading...' : 'WebSocket Error. Please try to reload and make sure the password ist correct.'}</Typography>;

  const messageHandler: FrontEndMessanges = {
    auth: async (data) => (await messageAndResponse(socket, { name: 'auth', data })).data,
    checkToken: async () =>  (await messageAndResponse(socket, { name: 'checkToken', data: undefined })).data,
    search: async (data) => (await messageAndResponse(socket, { name: 'search', data })).data,
    handleDefault: async (data) => (await messageAndResponse(socket, { name: 'default', data })).data,
    availableDubCodes: async () => (await messageAndResponse(socket, { name: 'availableDubCodes', data: undefined})).data,
    availableSubCodes: async () => (await messageAndResponse(socket, { name: 'availableSubCodes', data: undefined })).data,
    resolveItems: async (data) => (await messageAndResponse(socket, { name: 'resolveItems', data })).data,
    listEpisodes: async (data) =>  (await messageAndResponse(socket, { name: 'listEpisodes', data })).data,
    randomEvents: randomEventHandler,
    downloadItem: (data) => messageAndResponse(socket, { name: 'downloadItem', data }),
    isDownloading: async () => (await messageAndResponse(socket, { name: 'isDownloading', data: undefined })).data,
    writeToClipboard: async (data) =>  messageAndResponse(socket, { name: 'writeToClipboard', data }),
    openFolder: async (data) =>  messageAndResponse(socket, { name: 'openFolder', data }),
    logout: async () => (await messageAndResponse(socket, { name: 'changeProvider', data: undefined })).data,
    openFile: async (data) => await messageAndResponse(socket, { name: 'openFile', data }),
    openURL: async (data) => await messageAndResponse(socket, { name: 'openURL', data })
  }

  return <messageChannelContext.Provider value={messageHandler}>
    {children}
  </messageChannelContext.Provider>;
};

export default MessageChannelProvider;