import { Add } from '@mui/icons-material';
import { Box, Button, Dialog, Divider } from '@mui/material';
import React from 'react';
import DownloadSelector from './DownloadSelector/DownloadSelector';
import EpisodeListing from './DownloadSelector/Listing/EpisodeListing';
import SearchBox from './SearchBox/SearchBox';

const AddToQueue: React.FC = () => {
	const [isOpen, setOpen] = React.useState(false);

	return (
		<Box>
			<EpisodeListing />
			<Dialog open={isOpen} onClose={() => setOpen(false)} maxWidth="md" PaperProps={{ elevation: 4 }}>
				<Box>
					<SearchBox />
					<Divider variant="middle" />
					<DownloadSelector onFinish={() => setOpen(false)} />
				</Box>
			</Dialog>
			<Button variant="contained" onClick={() => setOpen(true)} sx={{ maxHeight: '2.3rem' }}>
				<Add />
				Add to Queue
			</Button>
		</Box>
	);
};

export default AddToQueue;
