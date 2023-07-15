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
    this.wsServer = new ws.WebSocketServer({ noServer: true, path: '/ws' });

    this.wsServer.on('connection', (socket, req) => {
      console.info(`[WS] Connection from '${req.socket.remoteAddress}'`);
      socket.on('error', (er) => console.error(`[WS] ${er}`));
      socket.on('message', (data) => {       
        const json = JSON.parse(data.toString()) as UnknownWSMessage;
        this.events.emit(json.name, json as any, (data) => {
          this.wsServer.clients.forEach(client => {
            if (client.readyState !== WebSocket.OPEN)
              return;
            client.send(JSON.stringify({
              data,
              id: json.id,
              name: json.name
            }), (er) => {
              if (er)
                console.error(`[WS] ${er}`);
            });
          });
        });
      });
    });

    server.on('upgrade', (request, socket, head) => {
      if (!this.wsServer.shouldHandle(request))
        return;
      if (!this.authenticate(request)) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        console.info(`[WS] ${request.socket.remoteAddress} tried to connect but used a wrong password.`);
        return;
      }
      this.wsServer.handleUpgrade(request, socket, head, socket => {
        this.wsServer.emit('connection', socket, request);
      });
    });
  }

  public sendMessage<T extends keyof RandomEvents>(data: RandomEvent<T>) {
    this.wsServer.clients.forEach(client => {
      if (client.readyState !== WebSocket.OPEN)
        return;
      client.send(JSON.stringify(data), (er) => {
        if (er)
          console.error(`[WS] ${er}`);
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
        const data = JSON.parse(msg.toString()) as UnknownWSMessage;
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
      if (!this.wsServer.shouldHandle(request))
        return;
      this.wsServer.handleUpgrade(request, socket, head, socket => {
        this.wsServer.emit('connection', socket, request);
      });
    });
  }

  private send(client: ws.WebSocket, id: string, name: string, data: any) {
    client.send(JSON.stringify({
      data,
      id,
      name
    }), (er) => {
      if (er)
        console.error(`[WS] ${er}`);
    });
  }
}