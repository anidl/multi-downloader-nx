import { ExitToApp } from '@mui/icons-material';
import { Button } from '@mui/material';
import React from 'react';
import useStore from '../hooks/useStore';
import { messageChannelContext } from '../provider/MessageChannel';
import Require from './Require';

const LogoutButton: React.FC = () => {
  const messageChannel = React.useContext(messageChannelContext);
  const [, dispatch] = useStore();

  const logout = async () => {
    if (await messageChannel?.isDownloading())
      return alert('You are currently downloading. Please finish the download first.');
    if (await messageChannel?.logout())
      dispatch({
        type: 'service',
        payload: undefined
      });
    else 
      alert('Unable to change service');
  };

  return <Require value={messageChannel}>
    <Button
      startIcon={<ExitToApp />}
      variant='contained'
      onClick={logout}
    >
      Service select
    </Button>
  </Require>;

};

export default LogoutButton;