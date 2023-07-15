import React from 'react';
import {Divider, Box, Button, Typography, Avatar} from '@mui/material';
import useStore from '../hooks/useStore';
import { StoreState } from './Store';

type Services = 'funi'|'crunchy'|'hidive';

export const serviceContext = React.createContext<Services|undefined>(undefined);

const ServiceProvider: FCWithChildren = ({ children }) => {
  const [ { service }, dispatch ] = useStore();

  const setService = (s: StoreState['service']) => {
    dispatch({
      type: 'service',
      payload: s
    });
  };

  return service === undefined ? 
    <Box>
      <Typography color="text.primary" variant='h3' sx={{ textAlign: 'center', mb: 5 }}>Please choose your service</Typography>
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button size='large' variant="contained" onClick={() => setService('funi')} startIcon={<Avatar src={'https://static.funimation.com/static/img/favicon.ico'} />}>Funimation</Button>
        <Divider orientation='vertical' flexItem />
        <Button size='large' variant="contained" onClick={() => setService('crunchy')} startIcon={<Avatar src={'https://static.crunchyroll.com/cxweb/assets/img/favicons/favicon-32x32.png'} />}>Crunchyroll</Button>
        <Divider orientation='vertical' flexItem />
        <Button size='large' variant="contained" onClick={() => setService('hidive')} startIcon={<Avatar src={'https://www.hidive.com/favicon.ico'} />}>Hidive</Button>
      </Box>
    </Box>
    : <serviceContext.Provider value={service}>
      {children}
    </serviceContext.Provider>;
};

export default ServiceProvider;