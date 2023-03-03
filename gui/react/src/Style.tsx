import React from 'react';
import { Container, Box, ThemeProvider, createTheme, Theme } from '@mui/material';

const makeTheme = (mode: 'dark'|'light') : Partial<Theme> => {
  return createTheme({
    palette: {
      mode,
    },
  });
};

const Style: FCWithChildren = ({children}) => {
  return <ThemeProvider theme={makeTheme('dark')}>
    <Container maxWidth='xl'>
      <Box sx={{ position: 'fixed', height: '100%', width: '100%', zIndex: -500, backgroundColor: 'rgb(0, 30, 60)', top: 0, left: 0 }}/>
      {children}
    </Container>
  </ThemeProvider>;
};

export default Style;