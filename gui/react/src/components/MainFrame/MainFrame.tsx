import { Box } from '@mui/material';
import React from 'react';
import './MainFrame.css';
import Queue from './Queue/Queue';

const MainFrame: React.FC = () => {
  return <Box sx={{ marginLeft: 1 }}>
    <Queue />
  </Box>;
};

export default MainFrame;