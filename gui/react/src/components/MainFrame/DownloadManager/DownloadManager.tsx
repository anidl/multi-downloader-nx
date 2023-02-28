import React from "react";
import { ExtendedProgress } from "../../../../../../@types/messageHandler";
import { RandomEvent } from "../../../../../../@types/randomEvents";
import useStore from "../../../hooks/useStore";
import { messageChannelContext } from "../../../provider/MessageChannel";

const useDownloadManager = () => {
  const messageHandler = React.useContext(messageChannelContext);

  const [progressData, setProgressData] = React.useState<ExtendedProgress|undefined>();
  
  React.useEffect(() => {
    const handler = (ev: RandomEvent<'progress'>) => {
      console.log(ev.data);
      setProgressData(ev.data);
    }
    messageHandler?.randomEvents.on('progress', handler);

    const finishHandler = () => {
      setProgressData(undefined);
    }

    messageHandler?.randomEvents.on('finish', finishHandler);
    return () => {
      messageHandler?.randomEvents.removeListener('progress', handler);
      messageHandler?.randomEvents.removeListener('finish', finishHandler)
    };
  }, [messageHandler]);
  
  return progressData;
}

export default useDownloadManager;