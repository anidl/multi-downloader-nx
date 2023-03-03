import React from 'react';
import { QueueItem } from '../../../../@types/messageHandler';
import { messageChannelContext } from './MessageChannel';
import { RandomEvent } from '../../../../@types/randomEvents';

export const queueContext = React.createContext<QueueItem[]>([]);

const QueueProvider: FCWithChildren = ({ children }) => {
  const msg = React.useContext(messageChannelContext);

  const [ready, setReady] = React.useState(false);
  const [queue, setQueue] = React.useState<QueueItem[]>([]);

  React.useEffect(() => {
    if (msg && !ready) {
      msg.getQueue().then(data => {
        setQueue(data);
        setReady(true);
      });
    }
    const listener = (ev: RandomEvent<'queueChange'>) => {
      setQueue(ev.data);
    };
    msg?.randomEvents.on('queueChange', listener);
    return () => {
      msg?.randomEvents.removeListener('queueChange', listener);
    };
  }, [ msg ]);
  
  return <queueContext.Provider value={queue}>
    {children}
  </queueContext.Provider>;
};

export default QueueProvider;