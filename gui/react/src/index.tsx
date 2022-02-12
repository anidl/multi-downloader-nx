import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import ServiceProvider from './provider/ServiceProvider';
import Style from './Style';
import MessageChannel from './provider/MessageChannel';
import { IconButton } from "@mui/material";
import { CloseOutlined } from "@mui/icons-material";
import { SnackbarProvider, SnackbarKey } from 'notistack';
import Store from './provider/Store';
import ErrorHandler from './provider/ErrorHandler';

const notistackRef = React.createRef<SnackbarProvider>();
const onClickDismiss = (key: SnackbarKey | undefined) => () => { 
  if (notistackRef.current)
    notistackRef.current.closeSnackbar(key);
};

ReactDOM.render(
  <React.StrictMode>
    <ErrorHandler>
      <Store>
        <SnackbarProvider
          ref={notistackRef}
          action={(key) => (
            <IconButton onClick={onClickDismiss(key)} color="inherit">
              <CloseOutlined />
            </IconButton>
          )}
          >
          <Style>
            <MessageChannel>
              <ServiceProvider>
                <App />
              </ServiceProvider>
            </MessageChannel>
          </Style>
        </SnackbarProvider>
      </Store>
    </ErrorHandler>
  </React.StrictMode>,
  document.getElementById('root')
);