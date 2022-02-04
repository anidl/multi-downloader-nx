import React from "react";
import { messageChannelContext } from "../../../provider/MessageChannel";

import { ProgressData } from '../../../../../../@types/hls-download';

const Progress: React.FC = () => {
  const messageHandler = React.useContext(messageChannelContext);

  React.useEffect(() => {
    const handler = (data: ProgressData) => {
      
    }
    messageHandler?.randomEvents.on('progress', handler);
    return () => messageHandler?.randomEvents.removeListener('progress', handler);
  }, [messageHandler]);
  
  return <></>
}

export default Progress;