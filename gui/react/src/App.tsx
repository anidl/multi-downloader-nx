import React from 'react';
import { Button, TextField, Box } from '@mui/material';
import { messageChannelContext } from './provider/MessageChannel';

function App() {
  const channel = React.useContext(messageChannelContext);

  const [data, setData] = React.useState<{username: string|undefined, password: string|undefined}>({ username: undefined, password: undefined });
  return (
    <Box>
      <TextField variant='outlined'  value={data.username ?? ''} onChange={(e) => setData({ password: data.password, username: e.target.value })} />
      <TextField variant='outlined'  value={data.password ?? ''} onChange={(e) => setData({ password: e.target.value, username: data.username })} />
      <Button variant='contained' size='large' onClick={async () => {
        console.log(await channel?.auth({ username: data.username ?? '', password: data.password ?? ''}));
      }}>
        Test auth
      </Button>
    </Box>
  );
}

export default App;
