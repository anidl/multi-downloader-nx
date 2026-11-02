import React from 'react';
import { ExtendedProgress, QueueItem } from '../../../../../../@types/messageHandler';
import { RandomEvent } from '../../../../../../@types/randomEvents';
import { messageChannelContext } from '../../../provider/MessageChannel';

const useDownloadManager = () => {
	const messageHandler = React.useContext(messageChannelContext);
	const [progressData, setProgressData] = React.useState<ExtendedProgress | undefined>();
	const [current, setCurrent] = React.useState<QueueItem | undefined>();
	React.useEffect(() => {
		setProgressData(undefined);
		setCurrent(undefined);
		if (!messageHandler?.serviceReady || !messageHandler.service) return;
		const service = messageHandler.service;
		let active = true;
		const handler = (event: RandomEvent<'progress'>) => {
			if (event.service === service) setProgressData(event.data);
		};
		const currentHandler = (event: RandomEvent<'current'>) => {
			if (event.service === service) {
				setCurrent(event.data);
				if (!event.data) setProgressData(undefined);
			}
		};
		const finishHandler = (event: RandomEvent<'finish'>) => {
			if (event.service === service) setProgressData(undefined);
		};
		messageHandler.randomEvents.on('progress', handler);
		messageHandler.randomEvents.on('current', currentHandler);
		messageHandler.randomEvents.on('finish', finishHandler);
		void messageHandler
			.getOverview()
			.then((all) => {
				if (active) setCurrent(all[service].current);
			})
			.catch(() => undefined);
		return () => {
			active = false;
			messageHandler.randomEvents.removeListener('progress', handler);
			messageHandler.randomEvents.removeListener('current', currentHandler);
			messageHandler.randomEvents.removeListener('finish', finishHandler);
		};
	}, [messageHandler?.serviceReady, messageHandler?.service, messageHandler?.randomEvents]);
	return { data: progressData, current };
};
export default useDownloadManager;
