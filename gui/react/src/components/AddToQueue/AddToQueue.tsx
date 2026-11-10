import { AddRounded, CloseRounded } from '@mui/icons-material';
import { Box, Button, Dialog, Divider, IconButton, Stack, Typography } from '@mui/material';
import React from 'react';
import { messageChannelContext } from '../../provider/MessageChannel';
import DownloadSelector from './DownloadSelector/DownloadSelector';
import EpisodeListing from './DownloadSelector/Listing/EpisodeListing';
import SearchBox from './SearchBox/SearchBox';

const AddToQueue: React.FC = () => {
	const [open, setOpen] = React.useState(false);
	const messageHandler = React.useContext(messageChannelContext);
	return (
		<Box>
			<EpisodeListing />
			<Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md" scroll="paper" slotProps={{ paper: { sx: { maxHeight: 'min(92vh, 980px)' } } }}>
				<Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ py: 2.5, px: { xs: 2.5, sm: 3 } }}>
					<Box>
						<Typography variant="h5">Add episodes</Typography>
						<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
							Search, choose your episodes and configure download preferences.
						</Typography>
					</Box>
					<IconButton aria-label="Close dialog" onClick={() => setOpen(false)}>
						<CloseRounded />
					</IconButton>
				</Stack>
				<Divider />
				<Box sx={{ px: { xs: 2.5, sm: 3 }, py: 2.5, overflowY: 'auto' }}>
					<SearchBox />
					<DownloadSelector onFinish={() => setOpen(false)} />
				</Box>
			</Dialog>
			<Button startIcon={<AddRounded />} variant="contained" disabled={!messageHandler?.serviceReady} onClick={() => setOpen(true)}>
				Add episodes
			</Button>
		</Box>
	);
};
export default AddToQueue;
