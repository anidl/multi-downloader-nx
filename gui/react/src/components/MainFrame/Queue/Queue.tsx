import { Box, Button, Divider, LinearProgress, Skeleton, Typography } from "@mui/material";
import React from "react";
import useStore from "../../../hooks/useStore";

import useDownloadManager from "../DownloadManager/DownloadManager";

const Queue: React.FC = () => {
  const data = useDownloadManager();

  const [{ queue }, dispatch] = useStore();
  return data || queue.length > 0 ? <>
    {data && <Box sx={{ mb: 1, height: 200, display: 'grid', gridTemplateColumns: '20% 1fr', gap: 1 }}>
      <img src={data.downloadInfo.image} height='200px' width='100%' />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr max-content' }}>
            <Typography variant='h5' color='text.primary'>
              {data.downloadInfo.title}
            </Typography>
            <Typography variant='h5' color='text.primary'>
              Language: {data.downloadInfo.language.name}
            </Typography>
          </Box>
          <Typography variant='h6' color='text.primary'>
            {data.downloadInfo.parent.title}
          </Typography>
        </Box>
        <LinearProgress variant='determinate' sx={{ height: '10px' }} value={(typeof data.progress.percent === 'string' ? parseInt(data.progress.percent) : data.progress.percent)} />
        <Box> 
          <Typography variant="body1" color='text.primary'>
            {data.progress.cur}MB / {(data.progress.total)}MB ({data.progress.percent}% | {formatTime(data.progress.time)} | {(data.progress.downloadSpeed / 1024 / 1024).toFixed(2)} MB/s)
          </Typography>
        </Box>
      </Box>
    </Box>}
    {queue.length && <Divider variant="fullWidth" />}
    {queue.map((queueItem, index, { length }) => {
      return <Box key={`queue_item_${index}`}>
        <Box sx={{ height: 200, display: 'grid', gridTemplateColumns: '20% 1fr', gap: 1, mb: 1, mt: 1 }}>
          <img src={queueItem.image} height='200px' width='100%' />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 200px' }}>
                <Typography variant='h5' color='text.primary'>
                  {queueItem.title}
                </Typography>
                <Typography variant='h5' color='text.primary'>
                  Languages: {queueItem.dubLang.join(', ')}
                </Typography>
              </Box>
              <Typography variant='h6' color='text.primary'>
                {queueItem.parent.title}
              </Typography>
            </Box>
            <Typography variant='body1' color='text.primary'>
              S{queueItem.parent.season}E{queueItem.episode} <br />
              Quality: {queueItem.q}
            </Typography>
            <Button onClick={() => {
              const override = [...queue];
              dispatch({
                type: 'queue',
                payload: override,
                extraInfo: {
                  force: true
                }
              });
            }} sx={{ position: 'relative', left: '50%', transform: 'translateX(-50%)', width: '60%' }} variant="outlined" color="warning">
              Remove from Queue
            </Button>
          </Box>
        </Box>
        {index < length - 1 && <Divider variant="fullWidth" />}
      </Box>;
    })}
  </> : <Box>
    <Typography color='text.primary' variant='h4'>
      Selected episodes will be shown here
    </Typography>
    <Box sx={{ height: 200, display: 'grid', gridTemplateColumns: '20% 1fr', gap: 1 }}>
      <Skeleton variant='rectangular' height={'100%'}/>
      <Box sx={{ display: 'grid', gridTemplateRows: '33% 1fr', gap: 1 }}>
        <Skeleton variant='text' height={'100%'} />
        <Skeleton variant='text' height={'100%'} />
      </Box>
    </Box>
  </Box>
}

const formatTime = (time: number) => {
  time = Math.floor(time / 1000);
  const minutes = Math.floor(time / 60);
  time = time % 60;

  return `${minutes.toFixed(0).length < 2 ? `0${minutes}` : minutes}m${time.toFixed(0).length < 2 ? `0${time}` : time}s`;
}

export default Queue;