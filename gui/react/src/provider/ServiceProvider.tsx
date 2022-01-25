import React from 'react';
import {Divider, Box, Button, Typography} from '@mui/material';

type Services = 'funi'|'crunchy';

export const serviceContext = React.createContext<Services|undefined>(undefined);

const ServiceProvider: React.FC = ({ children }) => {
  const [service, setService] = React.useState<Services|undefined>();


  return service === undefined ? 
    <Box>
      <Typography color="text.primary" variant='h3' sx={{ textAlign: 'center', mb: 5 }}>Please choose your service</Typography>
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button size='large' variant="contained" onClick={() => setService('funi')} >Funimation</Button>
        <Divider orientation='vertical' flexItem />
        <Button size='large' variant="contained" onClick={() => setService('crunchy')}>Crunchyroll</Button>
      </Box>
    </Box>
    : <serviceContext.Provider value={service}>
      {children}
    </serviceContext.Provider>;
};

export default ServiceProvider;