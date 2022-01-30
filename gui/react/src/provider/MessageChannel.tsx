import React from 'react';
import type { AuthData, AuthResponse, MessageHandler, ResponseBase, SearchData } from '../../../../@types/messageHandler';
import { serviceContext } from './ServiceProvider';
import type { IpcRenderer } from "electron";

export const messageChannelContext = React.createContext<MessageHandler|undefined>(undefined);

const MessageChannelProvider: React.FC = ({ children }) => {

  const service = React.useContext(serviceContext);

  const { ipcRenderer } = (window as any).Electron as { ipcRenderer: IpcRenderer };

  React.useEffect(() => {
    ipcRenderer.invoke('setup', service);
  }, [service])

  const messageHandler: MessageHandler = {
    auth: async (data) => await ipcRenderer.invoke('auth', data),
    checkToken: async () => await ipcRenderer.invoke('checkToken'),
    search: async (data) => await ipcRenderer.invoke('search', data),
    handleDefault: async (data) => await ipcRenderer.invoke('default', data),
    availableDubCodes: async () => await ipcRenderer.invoke('availableDubCodes')
  }

  return <messageChannelContext.Provider value={messageHandler}>
    {children}
  </messageChannelContext.Provider>;
};

export default MessageChannelProvider;