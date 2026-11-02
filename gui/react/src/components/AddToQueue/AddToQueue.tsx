import { Add } from '@mui/icons-material';
import { Box, Button, Dialog, Divider } from '@mui/material';
import React from 'react';
import { messageChannelContext } from '../../provider/MessageChannel';
import DownloadSelector from './DownloadSelector/DownloadSelector';
import EpisodeListing from './DownloadSelector/Listing/EpisodeListing';
import SearchBox from './SearchBox/SearchBox';

const AddToQueue: React.FC = () => {
	const [isOpen, setOpen] = React.useState(false);
	const messageHandler = React.useContext(messageChannelContext);

	return (
		<Box>
			<EpisodeListing />
			<Dialog open={isOpen} onClose={() => setOpen(false)} fullWidth maxWidth="md" slotProps={{ paper: { elevation: 4 } }}>
				<Box>
					<SearchBox />
					<Divider variant="middle" />
					<DownloadSelector onFinish={() => setOpen(false)} />
				</Box>
			</Dialog>
			<Button variant="contained" disabled={!messageHandler?.serviceReady} onClick={() => setOpen(true)}>
				<Add />
				Add to Queue
			</Button>
		</Box>
	);
};

export default AddToQueue;
