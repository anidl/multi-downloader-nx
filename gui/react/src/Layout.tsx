import React from 'react';
import AuthButton from './components/AuthButton';
import { Box, Button } from '@mui/material';
import MainFrame from './components/MainFrame/MainFrame';
import LogoutButton from './components/LogoutButton';
import AddToQueue from './components/AddToQueue/AddToQueue';
import { messageChannelContext } from './provider/MessageChannel';
import { ClearAll, Folder } from '@mui/icons-material';
import StartQueueButton from './components/StartQueue';
import MenuBar from './components/MenuBar/MenuBar';

const Layout: React.FC = () => {
	const messageHandler = React.useContext(messageChannelContext);

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%', alignItems: 'center' }}>
			<MenuBar />
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					width: '93vw',
					maxWidth: '93rem',
					maxHeight: '3rem'
					//backgroundColor: '#ffffff',
				}}
			>
				<LogoutButton />
				<AuthButton />
				<Button variant="contained" startIcon={<Folder />} onClick={() => messageHandler?.openFolder('content')} sx={{ height: '37px' }}>
					Open Output Directory
				</Button>
				<Button variant="contained" startIcon={<ClearAll />} onClick={() => messageHandler?.clearQueue()} sx={{ height: '37px' }}>
					Clear Queue
				</Button>
				<AddToQueue />
				<StartQueueButton />
			</Box>
			<MainFrame />
		</Box>
	);
};

export default Layout;
