import React from "react";
import { messageChannelContext } from "../../../provider/MessageChannel";

import useDownloadManager from "../DownloadManager/DownloadManager";

const Progress: React.FC = () => {
  useDownloadManager();
  
  return <></>
}

export default Progress;