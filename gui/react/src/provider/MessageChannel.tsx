import React from 'react';
import type { MessageHandler } from '../../../../@types/messageHandler';
import type { IpcRenderer } from "electron";
import useStore from '../hooks/useStore';


export const messageChannelContext = React.createContext<MessageHandler|undefined>(undefined);

const MessageChannelProvider: React.FC = ({ children }) => {

  const [store, dispatch] = useStore();

  const { ipcRenderer } = (window as any).Electron as { ipcRenderer: IpcRenderer };

  React.useEffect(() => {
    (async () => {
      const currentService = await ipcRenderer.invoke('type');
      if (currentService !== undefined)
        return dispatch({ type: 'service', payload: currentService });
      if (store.service !== currentService) 
        ipcRenderer.invoke('setup', store.service)
    })();
  }, [store.service])

  const messageHandler: MessageHandler = {
    auth: async (data) => await ipcRenderer.invoke('auth', data),
    checkToken: async () => await ipcRenderer.invoke('checkToken'),
    search: async (data) => await ipcRenderer.invoke('search', data),
    handleDefault: async (data) => await ipcRenderer.invoke('default', data),
    availableDubCodes: async () => await ipcRenderer.invoke('availableDubCodes'),
    resolveItems: async (data) => await ipcRenderer.invoke('resolveItems', data),
    listEpisodes: async (data) => await ipcRenderer.invoke('listEpisodes', data)
  }

  return <messageChannelContext.Provider value={messageHandler}>
    {children}
  </messageChannelContext.Provider>;
};

export default MessageChannelProvider;