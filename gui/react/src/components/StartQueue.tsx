import { PauseCircleFilled, PlayCircleFilled } from '@mui/icons-material';
import { Button } from '@mui/material';
import { useSnackbar } from 'notistack';
import React from 'react';
import { messageChannelContext } from '../provider/MessageChannel';
import Require from './Require';

const StartQueueButton: React.FC = () => {
	const messageChannel = React.useContext(messageChannelContext);
	const [start, setStart] = React.useState(false);
	const msg = React.useContext(messageChannelContext);
	const { enqueueSnackbar } = useSnackbar();

	React.useEffect(() => {
		if (!msg?.serviceReady) return;
		void msg
			.getDownloadQueue()
			.then(setStart)
			.catch((error) => enqueueSnackbar(error instanceof Error ? error.message : String(error), { variant: 'error' }));
	}, [msg?.serviceReady]);

	const change = async () => {
		if (!msg?.serviceReady) return;
		try {
			if (start && (await msg.isDownloading())) enqueueSnackbar('The current download will finish before the queue pauses.', { variant: 'info' });
			await msg.setDownloadQueue(!start);
			setStart(!start);
		} catch (error) {
			enqueueSnackbar(error instanceof Error ? error.message : String(error), { variant: 'error' });
		}
	};

	return (
		<Require value={messageChannel}>
			<Button startIcon={start ? <PauseCircleFilled /> : <PlayCircleFilled />} variant="contained" disabled={!msg?.serviceReady} onClick={() => void change()}>
				{start ? 'Stop Queue' : 'Start Queue'}
			</Button>
		</Require>
	);
};

export default StartQueueButton;
