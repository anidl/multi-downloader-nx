import { ServerResponse, Server, IncomingMessage } from 'http';
import { MessageHandler, GuiState } from '../../@types/messageHandler';
import { ServiceName, ServiceOverview } from '../../@types/ws';
import { setState, getState, writeYamlCfgFile } from '../../modules/module.cfg-loader';
import CrunchyHandler from './services/crunchyroll';
import HidiveHandler from './services/hidive';
import ADNHandler from './services/adn';
import Base from './services/base';
import WebSocketHandler from './websocket';
import packageJson from '../../package.json';

type Service = Base & MessageHandler;
const SERVICE_NAMES: ServiceName[] = ['crunchy', 'hidive', 'adn'];

export default class ServiceHandler {
	private services: Partial<Record<ServiceName, Service>> = {};
	private ws: WebSocketHandler;
	private state: GuiState;

	constructor(server: Server<typeof IncomingMessage, typeof ServerResponse>) {
		this.state = getState();
		this.ws = new WebSocketHandler(server);
		this.handleMessages();
	}

	private serviceFor(name?: ServiceName): Service {
		if (!name || !SERVICE_NAMES.includes(name)) throw new Error('Select a download service first.');
		if (!this.services[name]) {
			switch (name) {
				case 'crunchy':
					this.services[name] = new CrunchyHandler(this.ws);
					break;
				case 'hidive':
					this.services[name] = new HidiveHandler(this.ws);
					break;
				case 'adn':
					this.services[name] = new ADNHandler(this.ws);
					break;
			}
		}
		return this.services[name]!;
	}

	private handleMessages() {
		this.ws.events.on('setupServer', ({ data }, respond) => {
			writeYamlCfgFile('gui', data);
			this.state.setup = true;
			setState(this.state);
			respond(true);
			setTimeout(() => process.exit(0), 250);
		});

		this.ws.events.on('setup', ({ data }, respond) => {
			this.serviceFor(data);
			respond(true);
		});
		this.ws.events.on('type', (_, respond) => respond(undefined));
		this.ws.events.on('changeProvider', (_, respond) => respond(true));
		this.ws.events.on('version', (_, respond) => respond(packageJson.version));

		this.ws.events.on('overview', async (_, respond) => {
			const saved = getState();
			const overview = {} as Record<ServiceName, ServiceOverview>;
			for (const name of SERVICE_NAMES) {
				const service = this.services[name];
				overview[name] = {
					queue: service ? await service.getQueue() : (saved.services?.[name]?.queue ?? []),
					current: service?.getCurrent(),
					downloading: service ? await service.isDownloading() : false,
					autoStart: service ? await service.getDownloadQueue() : false
				};
			}
			respond(overview);
		});

		this.ws.events.on('auth', async ({ data, service }, respond) => respond(await this.serviceFor(service).auth(data)));
		this.ws.events.on('checkToken', async ({ service }, respond) => respond(await this.serviceFor(service).checkToken()));
		this.ws.events.on('search', async ({ data, service }, respond) => respond(await this.serviceFor(service).search(data)));
		this.ws.events.on('default', async ({ data, service }, respond) => respond(await this.serviceFor(service).handleDefault(data)));
		this.ws.events.on('availableDubCodes', async ({ service }, respond) => respond(await this.serviceFor(service).availableDubCodes()));
		this.ws.events.on('availableSubCodes', async ({ service }, respond) => respond(await this.serviceFor(service).availableSubCodes()));

		const resolve = async (name: ServiceName | undefined, data: Parameters<MessageHandler['resolveItems']>[0]) => {
			const service = this.serviceFor(name);
			const before = service.getAddedCount();
			const ok = await service.resolveItems(data);
			const added = service.getAddedCount() - before;
			return {
				ok: !!ok && added > 0,
				added,
				message: added
					? undefined
					: 'No matching episodes found for this show and selected audio/episodes. Check your selection using “List episodes”, or choose Download all.'
			};
		};
		this.ws.events.on('resolveItems', async ({ data, service }, respond) => respond((await resolve(service, data)).ok));
		this.ws.events.on('resolveDetailed', async ({ data, service }, respond) => respond(await resolve(service, data)));

		this.ws.events.on('listEpisodes', async ({ data, service }, respond) => respond(await this.serviceFor(service).listEpisodes(data)));
		this.ws.events.on('downloadItem', async ({ data, service }, respond) => {
			const handler = this.serviceFor(service);
			// A direct download should not block a websocket request for hours.
			void Promise.resolve()
				.then(() => handler.downloadItem(data))
				.catch((error) => {
					handler.alertError(error instanceof Error ? error : new Error(String(error)));
					handler.setDownloading(false);
					void handler.onFinish();
				});
			respond(undefined);
		});
		this.ws.events.on('openFolder', async ({ data, service }, respond) => {
			await this.serviceFor(service).openFolder(data);
			respond(undefined);
		});
		this.ws.events.on('openFile', async ({ data, service }, respond) => {
			await this.serviceFor(service).openFile(data);
			respond(undefined);
		});
		this.ws.events.on('openURL', async ({ data, service }, respond) => {
			await this.serviceFor(service).openURL(data);
			respond(undefined);
		});
		this.ws.events.on('getQueue', async ({ service }, respond) => respond(await this.serviceFor(service).getQueue()));
		this.ws.events.on('removeFromQueue', async ({ data, service }, respond) => {
			await this.serviceFor(service).removeFromQueue(data);
			respond(undefined);
		});
		this.ws.events.on('clearQueue', async ({ service }, respond) => {
			await this.serviceFor(service).clearQueue();
			respond(undefined);
		});
		this.ws.events.on('setDownloadQueue', async ({ data, service }, respond) => {
			this.serviceFor(service).setDownloadQueue(data);
			respond(undefined);
		});
		this.ws.events.on('getDownloadQueue', async ({ service }, respond) => respond(await this.serviceFor(service).getDownloadQueue()));
		this.ws.events.on('isDownloading', async ({ service }, respond) => respond(await this.serviceFor(service).isDownloading()));
	}
}
