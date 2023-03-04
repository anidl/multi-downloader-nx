import React from 'react';
import { Box, Backdrop, CircularProgress } from '@mui/material';

export type RequireType<T> = {
  value?: T
}

const Require = <T, >(props: React.PropsWithChildren<RequireType<T>>) => {
  return props.value === undefined ? <Backdrop open>
    <CircularProgress />
  </Backdrop> : <Box>{props.children}</Box>;
};

export default Require;