import React from 'react';
import { MessageHandler } from '../../../../@types/messageHandler';
import useStore from '../hooks/useStore';
import type { MessageTypes, WSMessage, WSMessageWithID } from '../../../../@types/ws';
import type { Handler, RandomEvent, RandomEvents } from '../../../../@types/randomEvents';
import { Avatar, Box, Button, TextField, Typography } from '@mui/material';
import { v4 } from 'uuid';
import { useSnackbar } from 'notistack';
import { LockOutlined, PowerSettingsNew } from '@mui/icons-material';
import { GUIConfig } from '../../../../modules/module.cfg-loader';

export type FrontEndMessages = (MessageHandler & { randomEvents: RandomEventHandler, logout: () => Promise<boolean> });

export class RandomEventHandler {
  private handler: {
    [eventName in keyof RandomEvents]: Handler<eventName>[]
  } = {
    progress: [],
    finish: [],
    queueChange: [],
    current: []
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

export const messageChannelContext = React.createContext<FrontEndMessages|undefined>(undefined);

async function messageAndResponse<T extends keyof MessageTypes>(socket: WebSocket, msg: WSMessage<T>): Promise<WSMessage<T, 1>> {
  const id = v4();
  const ret = new Promise<WSMessage<T, 1>>((resolve) => {
    const handler = function({ data }: MessageEvent) {
      const parsed = JSON.parse(data.toString()) as WSMessageWithID<T, 1>;
      if (parsed.id === id) {
        socket.removeEventListener('message', handler);
        resolve(parsed);
      }
    };
    socket.addEventListener('message', handler); 
  });
  const toSend = msg as WSMessageWithID<T>;
  toSend.id = id;

  socket.send(JSON.stringify(toSend));
  return ret;
} 

const MessageChannelProvider: FCWithChildren = ({ children }) => {

  const [store, dispatch] = useStore();
  const [socket, setSocket] = React.useState<undefined|WebSocket>();
  const [publicWS, setPublicWS] = React.useState<undefined|WebSocket>();
  const [usePassword, setUsePassword] = React.useState<'waiting'|'yes'|'no'>('waiting');
  const [isSetup, setIsSetup] = React.useState<'waiting'|'yes'|'no'>('waiting');

  const { enqueueSnackbar } = useSnackbar();

  React.useEffect(() => {
    const wss = new WebSocket(`ws://${process.env.NODE_ENV === 'development' ? 'localhost:3000' :  window.location.host}/public`);
    wss.addEventListener('open', () => {
      setPublicWS(wss);
    });
    wss.addEventListener('error', () => {
      enqueueSnackbar('Unable to connect to server. Please reload the page to try again.', { variant: 'error' });
    });
  }, []);

  React.useEffect(() => {
    (async () => {
      if (!publicWS)
        return;
      setUsePassword((await messageAndResponse(publicWS, { name: 'requirePassword', data: undefined })).data ? 'yes' : 'no');
      setIsSetup((await messageAndResponse(publicWS, { name: 'isSetup', data: undefined })).data ? 'yes' : 'no');
    })();
  }, [publicWS]);

  const connect = (ev?: React.FormEvent<HTMLFormElement>) => {
    let search = new URLSearchParams();
    if (ev) {
      ev.preventDefault();
      const formData = new FormData(ev.currentTarget);
      const password = formData.get('password')?.toString();
      if (!password)
        return enqueueSnackbar('Please provide both a username and password', {
          variant: 'error'
        });
      search = new URLSearchParams({
        password
      });
    }

    const wws = new WebSocket(`ws://${process.env.NODE_ENV === 'development' ? 'localhost:3000' :  window.location.host}/ws?${search}`, );
    wws.addEventListener('open', () => {
      console.log('[INFO] [WS] Connected');
      setSocket(wws);
    });
    wws.addEventListener('error', (er) => {
      console.error('[ERROR] [WS]', er);
      enqueueSnackbar('Unable to connect to server. Please check the password and try again.', {
        variant: 'error'
      });
    });
  };

  const setup = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    if (!socket)
      return enqueueSnackbar('Invalid state: socket not found', { variant: 'error' });
    const formData = new FormData(ev.currentTarget);
    const password = formData.get('password');
    const data = {
      port: parseInt(formData.get('port')?.toString() ?? '') ?? 3000,
      password: password ? password.toString() : undefined
    } as GUIConfig;
    await messageAndResponse(socket, { name: 'setupServer', data });
    enqueueSnackbar(`The following settings have been set: Port=${data.port}, Password=${data.password ?? 'noPasswordRequired'}`, {
      variant: 'success',
      persist: true
    });
    enqueueSnackbar('Please restart the server now.', {
      variant: 'info',
      persist: true
    });
  };

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
  }, [store.service, dispatch, socket]);

  React.useEffect(() => {
    if (!socket)
      return;
    /* finish is a placeholder */
    const listener = (initalData: MessageEvent<string>) => {
      const data = JSON.parse(initalData.data) as RandomEvent<'finish'>;
      randomEventHandler.emit(data.name, data);
    };
    socket.addEventListener('message', listener);
    return () => {
      socket.removeEventListener('message', listener);
    };
  }, [ socket ]);

  if (usePassword === 'waiting')
    return <></>;

  if (socket === undefined) {
    if (usePassword === 'no') {
      connect(undefined);
      return <></>;
    }
    return <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', justifyItems: 'center', alignItems: 'center' }}>
      <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
        <LockOutlined />
      </Avatar>
      <Typography component="h1" variant="h5" color="text.primary">
        Login
      </Typography>
      <Box component="form" onSubmit={connect} sx={{ mt: 1 }}>
        <TextField name="password" margin='normal' type="password" fullWidth variant="filled" required label={'Password'} />
        <Button type='submit' variant='contained' sx={{ mt: 3, mb: 2 }} fullWidth>Login</Button>
        <Typography color="text.secondary" align='center' component="p" variant='body2'>
          You need to login in order to use this tool.
        </Typography>
      </Box>
    </Box>;
  }

  if (isSetup === 'no') {
    return <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', justifyItems: 'center', alignItems: 'center' }}>
      <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
        <PowerSettingsNew />
      </Avatar>
      <Typography component="h1" variant="h5" color="text.primary">
        Confirm
      </Typography>
      <Box component="form" onSubmit={setup} sx={{ mt: 1 }}>
        <TextField name="port" margin='normal' type="number" fullWidth variant="filled" required label={'Port'} defaultValue={3000} />
        <TextField name="password" margin='normal' type="password" fullWidth variant="filled" label={'Password'} />
        <Button type='submit' variant='contained' sx={{ mt: 3, mb: 2 }} fullWidth>Confirm</Button>
        <Typography color="text.secondary" align='center' component="p" variant='body2'>
          Please enter data that will be set to use this tool.
          <br />
          Leave blank to use no password (NOT RECOMMENDED)!
        </Typography>
      </Box>
    </Box>;
  }

  const messageHandler: FrontEndMessages = {
    name: "default",
    auth: async (data) => (await messageAndResponse(socket, { name: 'auth', data })).data,
    version: async () => (await messageAndResponse(socket, { name: 'version', data: undefined })).data,
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
    openFolder: async (data) =>  messageAndResponse(socket, { name: 'openFolder', data }),
    logout: async () => (await messageAndResponse(socket, { name: 'changeProvider', data: undefined })).data,
    openFile: async (data) => await messageAndResponse(socket, { name: 'openFile', data }),
    openURL: async (data) => await messageAndResponse(socket, { name: 'openURL', data }),
    getQueue: async () => (await messageAndResponse(socket, { name: 'getQueue', data: undefined })).data,
    removeFromQueue: async (data) => await messageAndResponse(socket, { name: 'removeFromQueue', data }),
    clearQueue: async () => await messageAndResponse(socket, { name: 'clearQueue', data: undefined }),
    setDownloadQueue: async (data) => await messageAndResponse(socket, { name: 'setDownloadQueue', data }),
    getDownloadQueue: async () => (await messageAndResponse(socket, { name: 'getDownloadQueue', data: undefined })).data,
  };

  return <messageChannelContext.Provider value={messageHandler}>
    {children}
  </messageChannelContext.Provider>;
};

export default MessageChannelProvider;