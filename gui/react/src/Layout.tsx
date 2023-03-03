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

  return <Box sx={{ display: 'flex', flexDirection: 'column' }}>
    <MenuBar />
    <Box sx={{ height: 50, mb: 4, display: 'flex', gap: 1, mt: 3 }}>
      <LogoutButton />
      <AuthButton />
      <Box sx={{ display: 'flex', gap: 1, height: 36 }}>
        <Button variant="contained" startIcon={<Folder />} onClick={() => messageHandler?.openFolder('content')}>Open Output Directory</Button>
        <Button variant="contained" startIcon={<ClearAll />} onClick={() => messageHandler?.clearQueue() }>Clear Queue</Button>
      </Box>
      <AddToQueue />
      <StartQueueButton />
    </Box>
    <MainFrame />
  </Box>;
};

export default Layout;