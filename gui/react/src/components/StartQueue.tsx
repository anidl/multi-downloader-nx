import React from 'react';
import { Button } from '@mui/material';
import { PauseRounded, PlayArrowRounded } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { messageChannelContext } from '../provider/MessageChannel';

const StartQueueButton: React.FC = () => {
	const msg = React.useContext(messageChannelContext);
	const [started, setStarted] = React.useState(false);
	const [pending, setPending] = React.useState(false);
	const { enqueueSnackbar } = useSnackbar();
	React.useEffect(() => {
		setStarted(false);
		if (!msg?.serviceReady) return;
		let active = true;
		void msg
			.getDownloadQueue()
			.then((value) => {
				if (active) setStarted(value);
			})
			.catch((error) => {
				if (active) enqueueSnackbar(error instanceof Error ? error.message : String(error), { variant: 'error' });
			});
		return () => {
			active = false;
		};
	}, [msg?.service, msg?.serviceReady]);
	const change = async () => {
		if (!msg?.serviceReady || pending) return;
		setPending(true);
		try {
			await msg.setDownloadQueue(!started);
			setStarted(!started);
			if (started && (await msg.isDownloading())) enqueueSnackbar('Current download will finish before the queue pauses.', { variant: 'info' });
		} catch (error) {
			enqueueSnackbar(error instanceof Error ? error.message : String(error), { variant: 'error' });
		} finally {
			setPending(false);
		}
	};
	return (
		<Button disabled={!msg?.serviceReady || pending} variant="outlined" startIcon={started ? <PauseRounded /> : <PlayArrowRounded />} onClick={() => void change()}>
			{started ? 'Pause queue' : 'Start queue'}
		</Button>
	);
};
export default StartQueueButton;
