import React from 'react';
import { Button } from '@mui/material';
import { messageChannelContext } from './provider/MessageChannel';

function App() {
  const channel = React.useContext(messageChannelContext);

  return (
    <Button variant='contained' size='large' onClick={async () => {
      console.log(await channel?.auth({ username: 'thekonrat@gmail.com', password: 'Ol5@2OAf2qDp05kXqiW#' }));
    }}>
      Test auth
    </Button>
  );
}

export default App;
