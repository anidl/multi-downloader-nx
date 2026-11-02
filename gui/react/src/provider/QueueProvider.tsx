import React from 'react';
import { QueueItem } from '../../../../@types/messageHandler';
import { messageChannelContext } from './MessageChannel';
import { RandomEvent } from '../../../../@types/randomEvents';
import { useSnackbar } from 'notistack';

export const queueContext = React.createContext<QueueItem[]>([]);

const QueueProvider: FCWithChildren = ({ children }) => {
	const msg = React.useContext(messageChannelContext);
	const { enqueueSnackbar } = useSnackbar();
	const [queue, setQueue] = React.useState<QueueItem[]>([]);
	React.useEffect(() => {
		setQueue([]);
		if (!msg?.serviceReady || !msg.service) return;
		let active = true;
		let receivedEvent = false;
		const service = msg.service;
		const listener = (event: RandomEvent<'queueChange'>) => {
			if (event.service !== service) return;
			receivedEvent = true;
			if (active) setQueue(event.data);
		};
		msg.randomEvents.on('queueChange', listener);
		void msg
			.getQueue()
			.then((items) => {
				if (active && !receivedEvent) setQueue(items);
			})
			.catch((error) => {
				if (active) enqueueSnackbar(error instanceof Error ? error.message : 'Could not load the queue', { variant: 'error' });
			});
		return () => {
			active = false;
			msg.randomEvents.removeListener('queueChange', listener);
		};
	}, [msg?.service, msg?.serviceReady, msg?.randomEvents, enqueueSnackbar]);
	return <queueContext.Provider value={queue}>{children}</queueContext.Provider>;
};
export default QueueProvider;
