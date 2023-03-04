import { Add } from '@mui/icons-material';
import { Box, Button, Dialog, Divider } from '@mui/material';
import React from 'react';
import DownloadSelector from './DownloadSelector/DownloadSelector';
import EpisodeListing from './DownloadSelector/Listing/EpisodeListing';
import SearchBox from './SearchBox/SearchBox';

const AddToQueue: React.FC = () => {
  const [isOpen, setOpen] = React.useState(false);

  return <Box>
    <EpisodeListing />
    <Dialog open={isOpen} onClose={() => setOpen(false)} maxWidth='md'>
      <Box sx={{ border: '2px solid white', p: 2 }}>
        <SearchBox />
        <Divider variant='middle' className="divider-width" light sx={{ color: 'text.primary', fontSize: '1.2rem' }}>Options</Divider>
        <DownloadSelector onFinish={() => setOpen(false)} />
      </Box>
    </Dialog>
    <Button  variant='contained' onClick={() => setOpen(true)}>
      <Add />
      Add to Queue
    </Button>
  </Box>;
};

export default AddToQueue;