import React from 'react';
import type { AuthData, AuthResponse, MessageHandler, ResponseBase } from '../../../../@types/messageHandler';
import { serviceContext } from './ServiceProvider';


const messageChannelContext = React.createContext<MessageHandler|undefined>(undefined);

const MessageChannelProvider: React.FC = ({ children }) => {

  const service = React.useContext(serviceContext);

  const { ipcRenderer } = window.Electron;

  React.useEffect(() => {
    ipcRenderer.invoke('setup', service);
  }, [service])

  const messageHandler: MessageHandler = {
    auth: async (data) => await ipcRenderer.invoke('auth', data)
  }

  return <messageChannelContext.Provider value={messageHandler}>
    {children}
  </messageChannelContext.Provider>;
};

export default MessageChannelProvider;