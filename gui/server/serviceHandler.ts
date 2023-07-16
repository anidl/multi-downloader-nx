import { ServerResponse } from 'http';
import { Server } from 'http';
import { IncomingMessage } from 'http';
import { MessageHandler, GuiState } from '../../@types/messageHandler';
import { setState, getState, writeYamlCfgFile } from '../../modules/module.cfg-loader';
import CrunchyHandler from './services/crunchyroll';
import FunimationHandler from './services/funimation';
import HidiveHandler from './services/hidive';
import WebSocketHandler from './websocket';
import packageJson from '../../package.json';

export default class ServiceHandler {

  private service: MessageHandler|undefined = undefined;
  private ws: WebSocketHandler;
  private state: GuiState;

  constructor(server: Server<typeof IncomingMessage, typeof ServerResponse>) {
    this.ws = new WebSocketHandler(server);
    this.handleMessages();
    this.state = getState();
  }

  private handleMessages() {
    this.ws.events.on('setupServer', ({ data }, respond) => {
      writeYamlCfgFile('gui', data);
      this.state.setup = true;
      setState(this.state);
      respond(true);
      process.exit(0);
    });

    this.ws.events.on('setup', ({ data }) => {
      if (data === 'funi') {
        this.service = new FunimationHandler(this.ws);
      } else if (data === 'crunchy') {
        this.service = new CrunchyHandler(this.ws);
      } else if (data === 'hidive') {
        this.service = new HidiveHandler(this.ws);
      }
    });
    
    this.ws.events.on('changeProvider', async (_, respond) => {
      if (await this.service?.isDownloading())
        return respond(false);
      this.service = undefined;
      respond(true);
    });

    this.ws.events.on('auth', async ({ data }, respond) => {
      if (this.service === undefined)
        return respond({ isOk: false, reason: new Error('No service selected') });
      respond(await this.service.auth(data));
    });
    this.ws.events.on('version', async (_, respond) => {
      respond(packageJson.version);
    });
    this.ws.events.on('type', async (_, respond) => respond(this.service === undefined ? undefined : this.service.name as 'hidive'|'crunchy'|'funi'));
    this.ws.events.on('checkToken', async (_, respond) => {
      if (this.service === undefined)
        return respond({ isOk: false, reason: new Error('No service selected') });
      respond(await this.service.checkToken());
    });
    this.ws.events.on('search', async ({ data }, respond) => {
      if (this.service === undefined)
        return respond({ isOk: false, reason: new Error('No service selected') });
      respond(await this.service.search(data));
    });
    this.ws.events.on('default', async ({ data }, respond) => {
      if (this.service === undefined)
        return respond({ isOk: false, reason: new Error('No service selected') });
      respond(await this.service.handleDefault(data));
    });
    this.ws.events.on('availableDubCodes', async (_, respond) => {
      if (this.service === undefined)
        return respond([]);
      respond(await this.service.availableDubCodes());
    });
    this.ws.events.on('availableSubCodes', async (_, respond) => {
      if (this.service === undefined)
        return respond([]);
      respond(await this.service.availableSubCodes());
    });
    this.ws.events.on('resolveItems', async ({ data }, respond) => {
      if (this.service === undefined)
        return respond(false);
      respond(await this.service.resolveItems(data));
    });
    this.ws.events.on('listEpisodes', async ({ data }, respond) => {
      if (this.service === undefined)
        return respond({ isOk: false, reason: new Error('No service selected') });
      respond(await this.service.listEpisodes(data));
    });
    this.ws.events.on('downloadItem', async ({ data }, respond) => {
      this.service?.downloadItem(data);
      respond(undefined);
    });
    this.ws.events.on('openFolder', async ({ data }, respond) => {
      this.service?.openFolder(data);
      respond(undefined);
    });
    this.ws.events.on('openFile', async ({ data }, respond) => {
      this.service?.openFile(data);
      respond(undefined);
    });
    this.ws.events.on('openURL', async ({ data }, respond) => {
      this.service?.openURL(data);
      respond(undefined);
    });
    this.ws.events.on('getQueue', async (_, respond) => {
      respond(await this.service?.getQueue() ?? []);
    });
    this.ws.events.on('removeFromQueue', async ({ data }, respond) => {
      this.service?.removeFromQueue(data);
      respond(undefined);
    });
    this.ws.events.on('clearQueue', async (_, respond) => {
      this.service?.clearQueue();
      respond(undefined);
    });
    this.ws.events.on('setDownloadQueue', async ({ data }, respond) => {
      this.service?.setDownloadQueue(data);
      respond(undefined);
    });
    this.ws.events.on('getDownloadQueue', async (_, respond) => {
      respond(await this.service?.getDownloadQueue() ?? false);
    });
    this.ws.events.on('isDownloading', async (_, respond) => respond(await this.service?.isDownloading() ?? false));
  }

}