import React from "react";
import { ProgressData } from "../../../../../../@types/messageHandler";
import useStore from "../../../hooks/useStore";
import { messageChannelContext } from "../../../provider/MessageChannel";

const useDownloadManager = () => {
  const [ { currentDownload }, dispatch ] = useStore();
  const messageHandler = React.useContext(messageChannelContext);

  const [progressData, setProgressData] = React.useState<ProgressData|undefined>();
  
  React.useEffect(() => {
    const handler = (data: ProgressData) => {
      console.log(data);
      setProgressData(data);
    }
    messageHandler?.randomEvents.on('progress', handler);

    const finishHandler = () => {
      console.log('DONE');
    }

    messageHandler?.randomEvents.on('finish', finishHandler);
    return () => {
      messageHandler?.randomEvents.removeListener('progress', handler);
      messageHandler?.randomEvents.removeListener('finish', finishHandler)
    };
  }, [messageHandler]);

  React.useEffect(() => {
    if (!currentDownload)
      return;
    messageHandler?.downloadItem(currentDownload);
  }, [currentDownload]);
  

  return progressData;
}

export default useDownloadManager;