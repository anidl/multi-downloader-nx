import { Box, Skeleton, Typography } from "@mui/material";
import React from "react";
import useStore from "../../../hooks/useStore";

import useDownloadManager from "../DownloadManager/DownloadManager";

const Queue: React.FC = () => {
  const data = useDownloadManager();

  const [{ queue }] = useStore();
  return data || queue.length > 0 ? <>
    {data && <Box sx={{ mb: 1, height: 200, display: 'grid', gridTemplateColumns: '20% 1fr', gap: 1 }}>
      <img src={data.downloadInfo.image} height='200px' width='100%' />
      <Box>
        <Box sx={{ display: 'flex', flexDirection: 'row' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr fit-content' }}>
            <Typography variant='h5' color='text.primary'>
              {data.downloadInfo.title}
            </Typography>
            <Typography variant='h5' color='text.primary'>
              {data.downloadInfo.language.name}
            </Typography>
          </Box>
          <Typography variant='h6' color='text.primary'>
            {data.downloadInfo.parent.title}
          </Typography>
        </Box>
      </Box>
    </Box>}
    {queue.map((queueItem, index) => {
      return <Box key={`queue_item_${index}`} sx={{ height: 200, display: 'grid', gridTemplateColumns: '20% 1fr', gap: 1, mb: 1, mt: 1 }}>
        <img src={queueItem.image} height='200px' width='100%' />
        <Box>
          <Box sx={{ display: 'flex', flexDirection: 'row' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr fit-content' }}>
              <Typography variant='h5' color='text.primary'>
                {queueItem.title}
              </Typography>
              <Typography variant='h5' color='text.primary'>
                {queueItem.dubLang.join(', ')}
              </Typography>
            </Box>
            <Typography variant='h6' color='text.primary'>
              {queueItem.parent.title}
            </Typography>
          </Box>
        </Box>
      </Box>;
    })}
  </> : <Box sx={{ height: 200, display: 'grid', gridTemplateColumns: '20% 1fr', gap: 1 }}>
    <Skeleton variant='rectangular' height={'100%'}/>
    <Box sx={{ display: 'grid', gridTemplateRows: '33% 1fr', gap: 1 }}>
      <Skeleton variant='text' height={'100%'} />
      <Skeleton variant='text' height={'100%'} />
    </Box>
  </Box>
}

export default Queue;