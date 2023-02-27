import { IncomingMessage, Server } from "http";
import ws, { WebSocket } from 'ws';
import { RandomEvent, RandomEvents } from "../../@types/randomEvents";
import { MessageTypes, UnknownWSMessage, WSMessage } from "../../@types/ws";
import { EventEmitter } from "events";
import { cfg } from ".";

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
      console.log(`[INFO] [WS] Connection from '${req.socket.remoteAddress}'`);
      socket.on('error', (er) => console.log(`[ERROR] [WS] ${er}`));
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
                console.log(`[ERROR] [WS] ${er}`)
            });
          })
        });
      });
    });

    server.on('upgrade', (request, socket, head) => {
      if (!this.authenticate(request)) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
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
          console.log(`[ERROR] [WS] ${er}`);
      });
    })
  }

  private authenticate(request: IncomingMessage): boolean {
    return cfg.gui.password === new URL(`http://${request.headers.host}${request.url}`).searchParams.get('password');
  }

}

