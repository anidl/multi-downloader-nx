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

export type FrontEndMessages = MessageHandler & { randomEvents: RandomEventHandler; logout: () => Promise<boolean>; serviceReady: boolean };

export class RandomEventHandler {
	private handler: {
		[eventName in keyof RandomEvents]: Handler<eventName>[];
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
			this.handler[name] = [listener as any];
		}
	}

	public emit<T extends keyof RandomEvents>(name: keyof RandomEvents, data: RandomEvent<T>) {
		(this.handler[name] ?? []).forEach((handler) => handler(data as any));
	}

	public removeListener<T extends keyof RandomEvents>(name: T, listener: Handler<T>) {
		this.handler[name] = (this.handler[name] as Handler<T>[]).filter((a) => a !== listener) as any;
	}
}

export const messageChannelContext = React.createContext<FrontEndMessages | undefined>(undefined);

async function messageAndResponse<T extends keyof MessageTypes>(socket: WebSocket, msg: WSMessage<T>, timeout = 120000): Promise<WSMessage<T, 1>> {
	if (socket.readyState !== WebSocket.OPEN) throw new Error('Connection lost. Please reconnect or reload.');
	const id = v4();
	return new Promise((resolve, reject) => {
		const cleanup = () => {
			clearTimeout(timer);
			socket.removeEventListener('message', onMessage);
			socket.removeEventListener('close', onClose);
			socket.removeEventListener('error', onClose);
		};
		const onClose = () => {
			cleanup();
			reject(new Error('Connection to server was interrupted. Please reload the page.'));
		};
		const onMessage = (event: MessageEvent) => {
			let response: WSMessageWithID<T, 1> & { error?: string };
			try {
				response = JSON.parse(event.data.toString());
			} catch {
				return;
			}
			if (response?.id !== id) return;
			cleanup();
			if (response.error) reject(new Error(response.error));
			else resolve(response);
		};
		const timer = setTimeout(() => {
			cleanup();
			reject(new Error('Request timed out. Check the server logs and retry.'));
		}, timeout);
		socket.addEventListener('message', onMessage);
		socket.addEventListener('close', onClose);
		socket.addEventListener('error', onClose);
		try {
			socket.send(JSON.stringify({ ...msg, id }));
		} catch (error) {
			cleanup();
			reject(error);
		}
	});
}

const MessageChannelProvider: FCWithChildren = ({ children }) => {
	const [store, dispatch] = useStore();
	const [socket, setSocket] = React.useState<undefined | WebSocket>();
	const [serviceReady, setServiceReady] = React.useState(false);
	const connecting = React.useRef(false);
	const [publicWS, setPublicWS] = React.useState<undefined | WebSocket>();
	const [usePassword, setUsePassword] = React.useState<'waiting' | 'yes' | 'no'>('waiting');
	const [isSetup, setIsSetup] = React.useState<'waiting' | 'yes' | 'no'>('waiting');

	const { enqueueSnackbar } = useSnackbar();

	React.useEffect(() => {
		const wss = new WebSocket(`${location.protocol == 'https:' ? 'wss' : 'ws'}://${process.env.NODE_ENV === 'development' ? 'localhost:3000' : window.location.host}/public`);
		wss.addEventListener('open', () => {
			setPublicWS(wss);
		});
		wss.addEventListener('error', () => {
			enqueueSnackbar('Unable to connect to server. Please reload the page to try again.', { variant: 'error' });
		});
	}, []);

	React.useEffect(() => {
		(async () => {
			if (!publicWS) return;
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
				return enqueueSnackbar('Please provide a password', {
					variant: 'error'
				});
			search = new URLSearchParams({
				password
			});
		}

		if (connecting.current) return;
		connecting.current = true;
		const wws = new WebSocket(
			`${location.protocol == 'https:' ? 'wss' : 'ws'}://${process.env.NODE_ENV === 'development' ? 'localhost:3000' : window.location.host}/private?${search}`
		);
		wws.addEventListener('open', () => {
			console.log('[INFO] [WS] Connected');
			setSocket(wws);
			connecting.current = false;
		});
		wws.addEventListener('close', () => {
			connecting.current = false;
			setSocket((current) => current === wws ? undefined : current);
			setServiceReady(false);
		});
		wws.addEventListener('error', (er) => {
			connecting.current = false;
			console.error('[ERROR] [WS]', er);
			enqueueSnackbar('Unable to connect to server. Please check the password and try again.', {
				variant: 'error'
			});
		});
	};

	const setup = async (ev: React.FormEvent<HTMLFormElement>) => {
		ev.preventDefault();
		if (!socket) return enqueueSnackbar('Invalid state: socket not found', { variant: 'error' });
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
		if (!socket || !store.service) {
			setServiceReady(false);
			return;
		}
		let cancelled = false;
		setServiceReady(false);
		(async () => {
			try {
				const current = await messageAndResponse(socket, { name: 'type', data: undefined });
				if (cancelled) return;
				if (current.data && current.data !== store.service) {
					dispatch({ type: 'service', payload: current.data });
					return;
				}
				if (!current.data) {
					const setup = await messageAndResponse(socket, { name: 'setup', data: store.service });
					if (!setup.data) throw new Error('Unable to initialize the selected service.');
				}
				if (!cancelled) setServiceReady(true);
			} catch (error) {
				if (!cancelled) enqueueSnackbar(error instanceof Error ? error.message : String(error), { variant: 'error' });
			}
		})();
		return () => { cancelled = true; };
	}, [store.service, dispatch, socket]);

	React.useEffect(() => {
		if (usePassword === 'no' && !socket && !connecting.current) connect();
	}, [usePassword, socket]);

	React.useEffect(() => {
		if (!socket) return;
		/* finish is a placeholder */
		const listener = (initalData: MessageEvent<string>) => {
			try {
				const data = JSON.parse(initalData.data) as RandomEvent<'finish'> & { id?: string };
				if (!data.id && ['progress', 'finish', 'queueChange', 'current'].includes(data.name)) {
					randomEventHandler.emit(data.name, data);
				}
			} catch (error) {
				console.warn('Invalid server event', error);
			}
		};
		socket.addEventListener('message', listener);
		return () => {
			socket.removeEventListener('message', listener);
		};
	}, [socket]);

	const messageHandler = React.useMemo<FrontEndMessages | undefined>(() => !socket ? undefined : ({
		name: 'default',
		serviceReady,
		auth: async (data) => (await messageAndResponse(socket, { name: 'auth', data })).data,
		version: async () => (await messageAndResponse(socket, { name: 'version', data: undefined })).data,
		checkToken: async () => (await messageAndResponse(socket, { name: 'checkToken', data: undefined })).data,
		search: async (data) => (await messageAndResponse(socket, { name: 'search', data })).data,
		handleDefault: async (data) => (await messageAndResponse(socket, { name: 'default', data })).data,
		availableDubCodes: async () => (await messageAndResponse(socket, { name: 'availableDubCodes', data: undefined })).data,
		availableSubCodes: async () => (await messageAndResponse(socket, { name: 'availableSubCodes', data: undefined })).data,
		resolveItems: async (data) => (await messageAndResponse(socket, { name: 'resolveItems', data })).data,
		listEpisodes: async (data) => (await messageAndResponse(socket, { name: 'listEpisodes', data })).data,
		randomEvents: randomEventHandler,
		downloadItem: (data) => messageAndResponse(socket, { name: 'downloadItem', data }),
		isDownloading: async () => (await messageAndResponse(socket, { name: 'isDownloading', data: undefined })).data,
		openFolder: async (data) => messageAndResponse(socket, { name: 'openFolder', data }),
		logout: async () => (await messageAndResponse(socket, { name: 'changeProvider', data: undefined })).data,
		openFile: async (data) => await messageAndResponse(socket, { name: 'openFile', data }),
		openURL: async (data) => await messageAndResponse(socket, { name: 'openURL', data }),
		getQueue: async () => (await messageAndResponse(socket, { name: 'getQueue', data: undefined })).data,
		removeFromQueue: async (data) => await messageAndResponse(socket, { name: 'removeFromQueue', data }),
		clearQueue: async () => await messageAndResponse(socket, { name: 'clearQueue', data: undefined }),
		setDownloadQueue: async (data) => await messageAndResponse(socket, { name: 'setDownloadQueue', data }),
		getDownloadQueue: async () => (await messageAndResponse(socket, { name: 'getDownloadQueue', data: undefined })).data
	}), [socket, serviceReady, randomEventHandler]);

	if (usePassword === 'waiting') return <></>;

	if (socket === undefined) {
		if (usePassword === 'no') return <></>;
		return (
			<Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', justifyItems: 'center', alignItems: 'center' }}>
				<Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
					<LockOutlined />
				</Avatar>
				<Typography component="h1" variant="h5" color="text.primary">
					Login
				</Typography>
				<Box component="form" onSubmit={connect} sx={{ mt: 1 }}>
					<TextField name="password" margin="normal" type="password" fullWidth variant="filled" required label={'Password'} />
					<Button type="submit" variant="contained" sx={{ mt: 3, mb: 2 }} fullWidth>
						Login
					</Button>
					<Typography color="text.secondary" align="center" component="p" variant="body2">
						You need to login in order to use this tool.
					</Typography>
				</Box>
			</Box>
		);
	}

	if (isSetup === 'no') {
		return (
			<Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', justifyItems: 'center', alignItems: 'center' }}>
				<Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
					<PowerSettingsNew />
				</Avatar>
				<Typography component="h1" variant="h5" color="text.primary">
					Confirm
				</Typography>
				<Box component="form" onSubmit={setup} sx={{ mt: 1 }}>
					<TextField name="port" margin="normal" type="number" fullWidth variant="filled" required label={'Port'} defaultValue={3000} />
					<TextField name="password" margin="normal" type="password" fullWidth variant="filled" label={'Password'} />
					<Button type="submit" variant="contained" sx={{ mt: 3, mb: 2 }} fullWidth>
						Confirm
					</Button>
					<Typography color="text.secondary" align="center" component="p" variant="body2">
						Please enter data that will be set to use this tool.
						<br />
						Leave blank to use no password (NOT RECOMMENDED)!
					</Typography>
				</Box>
			</Box>
		);
	}


	return <messageChannelContext.Provider value={messageHandler}>{children}</messageChannelContext.Provider>;
};

export default MessageChannelProvider;
