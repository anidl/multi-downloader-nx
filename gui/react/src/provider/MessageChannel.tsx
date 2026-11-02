import React from 'react';
import { MessageHandler } from '../../../../@types/messageHandler';
import useStore from '../hooks/useStore';
import type { MessageTypes, ServiceOverview, ServiceName, WSMessage, WSMessageWithID } from '../../../../@types/ws';
import type { Handler, RandomEvent, RandomEvents } from '../../../../@types/randomEvents';
import { Avatar, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { v4 } from 'uuid';
import { useSnackbar } from 'notistack';
import { LockOutlined, PowerSettingsNew } from '@mui/icons-material';
import { GUIConfig } from '../../../../modules/module.cfg-loader';

export type FrontEndMessages = MessageHandler & {
	randomEvents: RandomEventHandler;
	logout: () => Promise<boolean>;
	serviceReady: boolean;
	service?: ServiceName;
	getOverview: () => Promise<Record<ServiceName, ServiceOverview>>;
	resolveDetailed: (data: Parameters<MessageHandler['resolveItems']>[0]) => Promise<{ ok: boolean; added: number; message?: string }>;
};

export class RandomEventHandler {
	private handler: {
		[eventName in keyof RandomEvents]: Handler<eventName>[];
	} = {
		progress: [],
		finish: [],
		queueChange: [],
		queueError: [],
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
	const [store] = useStore();
	const [socket, setSocket] = React.useState<undefined | WebSocket>();
	const [serviceReady, setServiceReady] = React.useState(false);
	const [connectionError, setConnectionError] = React.useState<string>();
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
			setConnectionError(undefined);
			connecting.current = false;
		});
		wws.addEventListener('close', () => {
			connecting.current = false;
			setSocket((current) => (current === wws ? undefined : current));
			setServiceReady(false);
			setConnectionError('Connection closed. Restart the server or try again.');
		});
		wws.addEventListener('error', (er) => {
			connecting.current = false;
			setConnectionError('Could not reach the local server. Check that it is running.');
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
		const port = Number(formData.get('port'));
		if (!Number.isInteger(port) || port < 1 || port > 65535) {
			return enqueueSnackbar('Please enter a valid port (1–65535).', { variant: 'error' });
		}
		const data = {
			port,
			password: password ? password.toString() : undefined
		} as GUIConfig;
		await messageAndResponse(socket, { name: 'setupServer', data });
		enqueueSnackbar(`The following settings have been set: Port=${data.port}, Password=${data.password ? 'configured' : 'not configured'}`, {
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
		void messageAndResponse(socket, { name: 'setup', data: store.service })
			.then((response) => {
				if (!cancelled) {
					if (!response.data) throw new Error('Could not initialize the selected service.');
					setServiceReady(true);
				}
			})
			.catch((error) => {
				if (!cancelled) enqueueSnackbar(error instanceof Error ? error.message : String(error), { variant: 'error' });
			});
		return () => {
			cancelled = true;
		};
	}, [store.service, socket]);

	React.useEffect(() => {
		if (usePassword === 'no' && !socket && !connecting.current && !connectionError) connect();
	}, [usePassword, socket, connectionError]);

	React.useEffect(() => {
		if (!socket) return;
		/* finish is a placeholder */
		const listener = (initalData: MessageEvent<string>) => {
			try {
				const data = JSON.parse(initalData.data) as RandomEvent<'finish'> & { id?: string };
				if (!data.id && ['progress', 'finish', 'queueChange', 'current', 'queueError'].includes(data.name)) {
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

	const messageHandler = React.useMemo<FrontEndMessages | undefined>(
		() =>
			!socket
				? undefined
				: {
						name: store.service ?? 'default',
						service: store.service,
						serviceReady,
						getOverview: async () => (await messageAndResponse(socket, { name: 'overview', data: undefined })).data,
						resolveDetailed: async (data) => (await messageAndResponse(socket, { name: 'resolveDetailed', data, service: store.service })).data,
						auth: async (data) => (await messageAndResponse(socket, { name: 'auth', data, service: store.service })).data,
						version: async () => (await messageAndResponse(socket, { name: 'version', data: undefined })).data,
						checkToken: async () => (await messageAndResponse(socket, { name: 'checkToken', data: undefined, service: store.service })).data,
						search: async (data) => (await messageAndResponse(socket, { name: 'search', data, service: store.service })).data,
						handleDefault: async (data) => (await messageAndResponse(socket, { name: 'default', data, service: store.service })).data,
						availableDubCodes: async () => (await messageAndResponse(socket, { name: 'availableDubCodes', data: undefined, service: store.service })).data,
						availableSubCodes: async () => (await messageAndResponse(socket, { name: 'availableSubCodes', data: undefined, service: store.service })).data,
						resolveItems: async (data) => (await messageAndResponse(socket, { name: 'resolveItems', data, service: store.service })).data,
						listEpisodes: async (data) => (await messageAndResponse(socket, { name: 'listEpisodes', data, service: store.service })).data,
						randomEvents: randomEventHandler,
						downloadItem: (data) => messageAndResponse(socket, { name: 'downloadItem', data, service: store.service }),
						isDownloading: async () => (await messageAndResponse(socket, { name: 'isDownloading', data: undefined, service: store.service })).data,
						openFolder: async (data) => messageAndResponse(socket, { name: 'openFolder', data, service: store.service }),
						logout: async () => (await messageAndResponse(socket, { name: 'changeProvider', data: undefined, service: store.service })).data,
						openFile: async (data) => await messageAndResponse(socket, { name: 'openFile', data, service: store.service }),
						openURL: async (data) => await messageAndResponse(socket, { name: 'openURL', data, service: store.service }),
						getQueue: async () => (await messageAndResponse(socket, { name: 'getQueue', data: undefined, service: store.service })).data,
						removeFromQueue: async (data) => await messageAndResponse(socket, { name: 'removeFromQueue', data, service: store.service }),
						clearQueue: async () => await messageAndResponse(socket, { name: 'clearQueue', data: undefined, service: store.service }),
						setDownloadQueue: async (data) => await messageAndResponse(socket, { name: 'setDownloadQueue', data, service: store.service }),
						getDownloadQueue: async () => (await messageAndResponse(socket, { name: 'getDownloadQueue', data: undefined, service: store.service })).data
					},
		[socket, store.service, serviceReady, randomEventHandler]
	);

	if (usePassword === 'waiting' || isSetup === 'waiting') {
		return (
			<Box sx={{ minHeight: '80vh', display: 'grid', placeItems: 'center' }}>
				<Typography color="text.secondary">Connecting to the download manager…</Typography>
			</Box>
		);
	}

	if (socket === undefined) {
		if (usePassword === 'no') {
			return (
				<Box sx={{ minHeight: '80vh', display: 'grid', placeItems: 'center', px: 2 }}>
					<Stack alignItems="center" spacing={2}>
						<Typography color="text.secondary">{connectionError || 'Connecting to the local service…'}</Typography>
						{connectionError && (
							<Button
								variant="contained"
								onClick={() => {
									setConnectionError(undefined);
									connect();
								}}
							>
								Retry connection
							</Button>
						)}
					</Stack>
				</Box>
			);
		}
		return (
			<Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', px: 2, py: 5 }}>
				<Paper variant="outlined" sx={{ width: '100%', maxWidth: 460, p: { xs: 3, sm: 5 } }}>
					<Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', mb: 3 }}>
						<LockOutlined />
					</Avatar>
					<Typography variant="h4">Unlock workspace</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
						Enter the password you configured for this local server.
					</Typography>
					{connectionError && (
						<Typography variant="body2" color="error" sx={{ mb: 2 }}>
							{connectionError}
						</Typography>
					)}
					<Box component="form" onSubmit={connect}>
						<TextField name="password" label="Server password" size="small" type="password" autoComplete="current-password" fullWidth required />
						<Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
							Connect
						</Button>
					</Box>
				</Paper>
			</Box>
		);
	}
	if (isSetup === 'no') {
		return (
			<Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', px: 2, py: 5 }}>
				<Paper variant="outlined" sx={{ width: '100%', maxWidth: 550, p: { xs: 3, sm: 5 } }}>
					<Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', mb: 3 }}>
						<PowerSettingsNew />
					</Avatar>
					<Typography variant="overline" color="text.secondary">
						First-time setup · Step 1 of 1
					</Typography>
					<Typography variant="h4" sx={{ mb: 1 }}>
						Set up your workspace
					</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
						Choose a port and an optional server password. After restarting, you can connect multiple platforms from the sidebar.
					</Typography>
					<Box component="form" onSubmit={(event) => void setup(event)}>
						<Stack spacing={2}>
							<TextField
								size="small"
								name="port"
								type="number"
								label="Local server port"
								fullWidth
								required
								defaultValue={3000}
								inputProps={{ min: 1, max: 65535 }}
							/>
							<TextField
								size="small"
								name="password"
								type="password"
								label="Server password (optional)"
								autoComplete="new-password"
								fullWidth
								helperText="Recommended if the server can be reached from other devices."
							/>
							<Button type="submit" variant="contained" fullWidth>
								Save configuration
							</Button>
						</Stack>
					</Box>
					<Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: 'block' }}>
						The server must be restarted after you save these settings. Platform credentials are configured separately.
					</Typography>
				</Paper>
			</Box>
		);
	}

	return <messageChannelContext.Provider value={messageHandler}>{children}</messageChannelContext.Provider>;
};

export default MessageChannelProvider;
