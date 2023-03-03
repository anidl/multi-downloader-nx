import React from 'react';
import { ExtendedProgress, QueueItem } from '../../../../../../@types/messageHandler';
import { RandomEvent } from '../../../../../../@types/randomEvents';
import { messageChannelContext } from '../../../provider/MessageChannel';

const useDownloadManager = () => {
  const messageHandler = React.useContext(messageChannelContext);

  const [progressData, setProgressData] = React.useState<ExtendedProgress|undefined>();
  const [current, setCurrent] = React.useState<undefined|QueueItem>();
  
  React.useEffect(() => {
    const handler = (ev: RandomEvent<'progress'>) => {
      console.log(ev.data);
      setProgressData(ev.data);
    };

    const currentHandler = (ev: RandomEvent<'current'>) => {
      setCurrent(ev.data);
    };
    
    const finishHandler = () => {
      setProgressData(undefined);
    };

    messageHandler?.randomEvents.on('progress', handler);
    messageHandler?.randomEvents.on('current', currentHandler);
    messageHandler?.randomEvents.on('finish', finishHandler);

    return () => {
      messageHandler?.randomEvents.removeListener('progress', handler);
      messageHandler?.randomEvents.removeListener('finish', finishHandler);
      messageHandler?.randomEvents.removeListener('current', currentHandler);
    };
  }, [messageHandler]);
  
  return { data: progressData, current};
};

export default useDownloadManager;