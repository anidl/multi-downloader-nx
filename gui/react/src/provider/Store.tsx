import React from 'react';
import { Episode, QueueItem } from '../../../../@types/messageHandler';
import { dubLanguageCodes } from '../../../../modules/module.langsData';

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
  episodeListing: Episode[];
  downloadOptions: DownloadOptions,
  service: 'crunchy'|'funi'|undefined,
  currentDownload?: QueueItem
}

export type StoreAction<T extends keyof StoreState> = {
  type: T,
  payload: StoreState[T]
}

const Reducer = <T extends keyof StoreState,>(state: StoreState, action: StoreAction<T>): StoreState => {
  switch(action.type) {
    case "queue":
      let queue = state.queue.concat(action.payload as QueueItem[]);
      if (!state.currentDownload && queue.length > 0) {
        state.currentDownload = queue[0];
        queue = queue.slice(1);
      }
      return { ...state, queue };
    default:
      return { ...state, [action.type]: action.payload }
  }
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
  },
  service: undefined,
  episodeListing: []
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