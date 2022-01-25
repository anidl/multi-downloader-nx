import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import ServiceProvider from './provider/ServiceProvider';
import Style from './Style';
import MessageChannel from './provider/MessageChannel';

ReactDOM.render(
  <React.StrictMode>
    <Style>
      <ServiceProvider>
        <MessageChannel>
          <App />
        </MessageChannel>
      </ServiceProvider>
    </Style>
  </React.StrictMode>,
  document.getElementById('root')
);