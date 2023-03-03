import { PauseCircleFilled, PlayCircleFilled } from '@mui/icons-material';
import { Button } from '@mui/material';
import React from 'react';
import { messageChannelContext } from '../provider/MessageChannel';
import Require from './Require';

const StartQueueButton: React.FC = () => {
  const messageChannel = React.useContext(messageChannelContext);
  const [start, setStart] = React.useState(false);
  const msg = React.useContext(messageChannelContext);

  React.useEffect(() => {
    (async () => {
      if (!msg)
        return alert('Invalid state: msg not found');
      setStart(await msg.getDownloadQueue());
    })();
  }, []);

  const change = async () => {
    if (await messageChannel?.isDownloading())
      alert('The current download will be finished before the queue stops');
    msg?.setDownloadQueue(!start);
    setStart(!start);
  };

  return <Require value={messageChannel}>
    <Button
      startIcon={start ? <PauseCircleFilled /> : <PlayCircleFilled /> }
      variant='contained'
      onClick={change}
    >
      {
        start ? 'Stop Queue' : 'Start Queue'
      }
    </Button>
  </Require>;

};

export default StartQueueButton;