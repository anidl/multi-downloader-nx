import React from 'react';
import AuthButton from './components/AuthButton';
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import MainFrame from './components/MainFrame/MainFrame';
import LogoutButton from './components/LogoutButton';
import AddToQueue from './components/AddToQueue/AddToQueue';
import { messageChannelContext } from './provider/MessageChannel';
import { ClearAll, FolderOpen, PlaylistPlay } from '@mui/icons-material';
import StartQueueButton from './components/StartQueue';
import MenuBar from './components/MenuBar/MenuBar';
import { queueContext } from './provider/QueueProvider';
import { useSnackbar } from 'notistack';

const Layout: React.FC = () => {
	const messageHandler = React.useContext(messageChannelContext);
	const queue = React.useContext(queueContext);
	const { enqueueSnackbar } = useSnackbar();
	const clear = async () => {
		if (!queue.length || !window.confirm('Clear all pending downloads?')) return;
		try {
			await messageHandler?.clearQueue();
			enqueueSnackbar('Pending downloads cleared', { variant: 'info' });
		} catch (error) {
			enqueueSnackbar(error instanceof Error ? error.message : String(error), { variant: 'error' });
		}
	};
	return (
		<Box sx={{ width: '100%', maxWidth: 1360, mx: 'auto', px: { xs: 2, md: 4 }, pb: 8 }}>
			<MenuBar />
			<Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, mb: 3, bgcolor: 'rgba(21,29,48,.85)', borderColor: 'divider' }}>
				<Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1.5} sx={{ mb: 2.5 }}>
					<Box>
						<Typography variant="h5" fontWeight={800}>Download dashboard</Typography>
						<Typography variant="body2" color="text.secondary">Manage episodes and follow your downloads in one place.</Typography>
					</Box>
					<Chip icon={<PlaylistPlay />} label={`${queue.length} pending`} variant="outlined" />
				</Stack>
				<Stack direction="row" flexWrap="wrap" gap={1.25} alignItems="center" useFlexGap>
					<LogoutButton />
					<AuthButton />
					<AddToQueue />
					<StartQueueButton />
					<Button variant="outlined" startIcon={<FolderOpen />} onClick={() => void messageHandler?.openFolder('content')}>Output folder</Button>
					<Button color="error" variant="outlined" disabled={!queue.length} startIcon={<ClearAll />} onClick={() => void clear()}>Clear queue</Button>
				</Stack>
			</Paper>
			<MainFrame />
		</Box>
	);
};
export default Layout;
