import React from 'react';
import { dubLanguageCodes } from '../../../../modules/module.langsData';

export type QueueItem = {

}

export type DownloadOptions = {
  q: number,
  id: string,
  e: string,
  dubLang: typeof dubLanguageCodes,
  fileName: string,
  all: boolean,
  but: boolean
}

export type StoreState = {
  queue: QueueItem[],
  downloadOptions: DownloadOptions
}

export type StoreAction<T extends keyof StoreState> = {
  type: T,
  payload: StoreState[T]
}

const Reducer = <T extends keyof StoreState,>(state: StoreState, action: StoreAction<T>): StoreState => {
  switch(action.type) {
    case "queue":
      return { ...state, queue: state.queue.concat(action.payload)  };
    case "downloadOptions":
      return { ...state, downloadOptions: action.payload as DownloadOptions };
  }
  return state;
};

const initialState: StoreState = {
  queue: [],
  downloadOptions: {
    id: '',
    q: 0,
    e: '',
    dubLang: [ 'jpn' ],
    fileName: '[${service}] ${showTitle} - S${season}E${episode} [${height}p]',
    all: false,
    but: false
  }
};

const Store: React.FC = ({children}) => {
  const [state, dispatch] = React.useReducer(Reducer, initialState);
  /*React.useEffect(() => {
    if (!state.unsavedChanges.has)
      return;
    const unsavedChanges = (ev: BeforeUnloadEvent, lang: LanguageContextType) => {
      ev.preventDefault();
      ev.returnValue = lang.getLang('unsaved_changes');
      return lang.getLang('unsaved_changes');
    };


    const windowListener = (ev: BeforeUnloadEvent) => {
      return unsavedChanges(ev, state.lang);
    };

    window.addEventListener('beforeunload', windowListener);

    return () => window.removeEventListener('beforeunload', windowListener);
  }, [state.unsavedChanges.has]);*/

  return (
    <StoreContext.Provider value={[state, dispatch]}>
      {children}
    </StoreContext.Provider>
  );
};

/* Importent Notice -- The 'queue' generic will be overriden */
export const StoreContext = React.createContext<[StoreState, React.Dispatch<StoreAction<'queue'>>]>([initialState, undefined as any]);
export default Store;