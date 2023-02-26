import { ExitToApp, PauseCircleFilled, PlayCircleFilled } from "@mui/icons-material";
import { Button } from "@mui/material";
import React from "react";
import useStore from "../hooks/useStore";
import { messageChannelContext } from "../provider/MessageChannel";
import Require from "./Require";

const StartQueueButton: React.FC = () => {
  const messageChannel = React.useContext(messageChannelContext);
  const [store, dispatch] = useStore();

  const change = () => {
    if (messageChannel?.isDownloading() && store.downloadQueue)
      alert("The current download will be finished before the queue stops")
    dispatch({
      type: 'downloadQueue',
      payload: !store.downloadQueue
    })
  }

  return <Require value={messageChannel}>
    <Button
      startIcon={store.downloadQueue ? <PauseCircleFilled /> : <PlayCircleFilled /> }
      variant='contained'
      onClick={change}
    >
      {
        store.downloadQueue ? 'Stop Queue' : 'Start Queue'
      }
    </Button>
  </Require>

}

export default StartQueueButton;