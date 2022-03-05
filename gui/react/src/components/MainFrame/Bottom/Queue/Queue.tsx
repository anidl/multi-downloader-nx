import { Box, Divider, Typography } from "@mui/material";
import React from "react";
import useStore from "../../../../hooks/useStore";

const Queue: React.FC = () => {
  const [ { queue } ] = useStore();

  return <Box>
    {queue.map((item, index) => {
      return <Box key={`QueueItem_${index}`} sx={{ gap: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography color='text.primary'>
          {`[${index}] S${item.parent.season}E${item.episode} - ${item.title} (${item.dubLang.join(', ')})`}
        </Typography>
        <Divider />
      </Box>
    })}
  </Box>
}

export default Queue;