import { LinearProgressProps, Box, LinearProgress, Typography } from '@mui/material';
import React from 'react';

// The following code has been taken from the mui example
// Thanks for that mui

export type LinearProgressWithLabelProps = LinearProgressProps & { value: number };

const LinearProgressWithLabel: React.FC<LinearProgressWithLabelProps> = (props) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2" color="text.secondary">{`${Math.round(
          props.value,
        )}%`}</Typography>
      </Box>
    </Box>
  );
};

export default LinearProgressWithLabel;