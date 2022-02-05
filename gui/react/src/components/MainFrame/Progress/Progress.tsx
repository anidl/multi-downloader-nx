import { Close } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import React from "react";
import { messageChannelContext } from "../../../provider/MessageChannel";
import LinearProgressWithLabel from "../../reusable/LinearProgressWithLabel";

import useDownloadManager from "../DownloadManager/DownloadManager";

const Progress: React.FC = () => {
  const data = useDownloadManager();
  
  return data ? <Box sx={{ display: 'grid', gridTemplateRows: '1fr 2fr', height: '100%' }}>
    <img style={{ maxWidth: '100%', maxHeight: '100%', border: '2px solid white', padding: 8 }} src={data.downloadInfo.image}></img>
    <Box sx={{ display: 'grid', gridTemplateRows: '1ft fit-content', gap: 1 }}>
      <table>
        <tbody style={{ verticalAlign: 'text-top' }}>
          <tr>
            <td>
              <Typography color='text.primary'>
                Title:
              </Typography>
            </td>
            <td>
              <Typography color='text.primary'>
                {data.downloadInfo.title}
              </Typography>
            </td>
          </tr>
          <tr>
            <td>
              <Typography color='text.primary'>
                Season:
              </Typography>
            </td>
            <td>
              <Typography color='text.primary'>
                {data.downloadInfo.parent.title}
              </Typography>
            </td>
          </tr>
          <tr>
            <td>
              <Typography color='text.primary' sx={{ verticalAlign: 'text-top' }}>
                Filename:
              </Typography>
            </td>
            <td>
              <Typography color='text.primary'>
                {data.downloadInfo.fileName}
              </Typography>
            </td>
          </tr>
          <tr>
            <td>
              <Typography color='text.primary' sx={{ verticalAlign: 'text-top' }}>
                Progress:
              </Typography>
            </td>
            <td>
              <Typography color='text.primary'>
                {`${data.progress.cur} / ${data.progress.total} - ${data.progress.percent}%`}
              </Typography>
            </td>
          </tr>
        </tbody>
      </table>
      <Box>
        <Typography color='text.primary'>
          {`ETA ${formatTime(data.progress.time)}`}
        </Typography>
        <Box sx={{ width: '100%' }}>
          <LinearProgressWithLabel sx={{ height: '10px' }} value={typeof data.progress.percent === 'string' ? parseInt(data.progress.percent) : data.progress.percent} />
        </Box>
      </Box>
    </Box>
  </Box> : <Box sx={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
    <Close color='primary' fontSize="large"/>
  </Box>
}

const formatTime = (time: number) => {
  let seconds = Math.ceil(time / 1000);
  let minutes = 0;
  if (seconds >= 60) {
    minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;
  }

  return `${minutes != 0 ? `${minutes} Minutes ` : ''}${seconds !== 0 ? `${seconds} Seconds` : ''}`

}

export default Progress;