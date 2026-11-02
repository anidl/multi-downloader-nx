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
		if (!msg?.serviceReady) return;
		let active = true;
		let updatedByEvent = false;
		const listener = (event: RandomEvent<'queueChange'>) => {
			updatedByEvent = true;
			if (active) setQueue(event.data);
		};
		// Listen first: a queue event must never be overwritten by a stale initial fetch.
		msg.randomEvents.on('queueChange', listener);
		void msg.getQueue().then((items) => {
			if (active && !updatedByEvent) setQueue(items);
		}).catch((error) => {
			if (active) enqueueSnackbar(error instanceof Error ? error.message : 'Unable to load queue', { variant: 'error' });
		});
		return () => {
			active = false;
			msg.randomEvents.removeListener('queueChange', listener);
		};
	}, [msg, enqueueSnackbar]);

	return <queueContext.Provider value={queue}>{children}</queueContext.Provider>;
};

export default QueueProvider;
