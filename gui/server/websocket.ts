import { IncomingMessage, Server } from 'http';
import ws, { WebSocket } from 'ws';
import { RandomEvent, RandomEvents } from '../../@types/randomEvents';
import { MessageTypes, UnknownWSMessage, WSMessage } from '../../@types/ws';
import { EventEmitter } from 'events';
import { cfg } from '.';
import { getState } from '../../modules/module.cfg-loader';
import { console } from '../../modules/log';

declare interface ExternalEvent {
	on<T extends keyof MessageTypes>(event: T, listener: (msg: WSMessage<T>, respond: (data: MessageTypes[T][1]) => void) => void): this;
	emit<T extends keyof MessageTypes>(event: T, msg: WSMessage<T>, respond: (data: MessageTypes[T][1]) => void): boolean;
}

class ExternalEvent extends EventEmitter {}

export default class WebSocketHandler {
	private wsServer: ws.Server;

	public events: ExternalEvent = new ExternalEvent();

	constructor(server: Server) {
		this.wsServer = new ws.WebSocketServer({ noServer: true, path: '/private' });

		this.wsServer.on('connection', (socket, req) => {
			console.info(`[WS] Connection from '${req.socket.remoteAddress}'`);
			socket.on('error', (er) => console.error(`[WS] ${er}`));
			socket.on('message', (raw) => {
				let request: UnknownWSMessage;
				try {
					request = JSON.parse(raw.toString()) as UnknownWSMessage;
					if (!request || typeof request.name !== 'string' || typeof request.id !== 'string') {
						throw new Error('Malformed websocket request');
					}
				} catch (error) {
					console.error('[WS] Invalid request:', error);
					socket.close(1003, 'Invalid request');
					return;
				}

				const reply = (data: unknown) => {
					if (socket.readyState !== WebSocket.OPEN) return;
					socket.send(JSON.stringify({ data, id: request.id, name: request.name }), (error) => {
						if (error) console.error('[WS] Failed to send response:', error);
					});
				};
				const fail = (error: unknown) => {
					const message = error instanceof Error ? error.message : String(error);
					console.error('[WS] Request failed:', message);
					if (socket.readyState === WebSocket.OPEN) {
						socket.send(JSON.stringify({ id: request.id, name: request.name, error: message }));
					}
				};
				const listeners = this.events.listeners(request.name);
				if (!listeners.length) return fail(new Error('Unknown request: ' + request.name));
				for (const listener of listeners) {
					void Promise.resolve()
						.then(() => listener(request, reply))
						.catch(fail);
				}
			});
		});

		server.on('upgrade', (request, socket, head) => {
			if (!this.wsServer.shouldHandle(request)) return;
			if (!this.authenticate(request)) {
				socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
				socket.destroy();
				console.info(`[WS] ${request.socket.remoteAddress} tried to connect but used a wrong password.`);
				return;
			}
			this.wsServer.handleUpgrade(request, socket, head, (socket) => {
				this.wsServer.emit('connection', socket, request);
			});
		});
	}

	public sendMessage<T extends keyof RandomEvents>(data: RandomEvent<T>) {
		this.wsServer.clients.forEach((client) => {
			if (client.readyState !== WebSocket.OPEN) return;
			client.send(JSON.stringify(data), (er) => {
				if (er) console.error(`[WS] ${er}`);
			});
		});
	}

	private authenticate(request: IncomingMessage): boolean {
		const search = new URL(`http://${request.headers.host}${request.url}`).searchParams;
		return cfg.gui.password === (search.get('password') ?? undefined);
	}
}

export class PublicWebSocket {
	private wsServer: ws.Server;

	private state = getState();
	constructor(server: Server) {
		this.wsServer = new ws.WebSocketServer({ noServer: true, path: '/public' });

		this.wsServer.on('connection', (socket, req) => {
			console.info(`[WS] Connection to public ws from '${req.socket.remoteAddress}'`);
			socket.on('error', (er) => console.error(`[WS] ${er}`));
			socket.on('message', (msg) => {
				let data: UnknownWSMessage;
				try {
					data = JSON.parse(msg.toString()) as UnknownWSMessage;
					if (!data || typeof data.id !== 'string') return;
				} catch {
					return;
				}
				switch (data.name) {
					case 'isSetup':
						this.send(socket, data.id, data.name, this.state.setup);
						break;
					case 'requirePassword':
						this.send(socket, data.id, data.name, cfg.gui.password !== undefined);
						break;
				}
			});
		});

		server.on('upgrade', (request, socket, head) => {
			if (!this.wsServer.shouldHandle(request)) return;
			this.wsServer.handleUpgrade(request, socket, head, (socket) => {
				this.wsServer.emit('connection', socket, request);
			});
		});
	}

	private send(client: ws.WebSocket, id: string, name: string, data: any) {
		client.send(
			JSON.stringify({
				data,
				id,
				name
			}),
			(er) => {
				if (er) console.error(`[WS] ${er}`);
			}
		);
	}
}
