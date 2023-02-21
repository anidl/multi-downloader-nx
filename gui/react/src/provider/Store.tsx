import React from 'react';
import { Episode, QueueItem } from '../../../../@types/messageHandler';
import { dubLanguageCodes } from '../../../../modules/module.langsData';

export type DownloadOptions = {
  q: number,
  id: string,
  e: string,
  dubLang: typeof dubLanguageCodes,
  dlsubs: string[],
  fileName: string,
  dlVideoOnce: boolean,
  all: boolean,
  but: boolean,
  novids: boolean,
  noaudio: boolean
}

export type StoreState = {
  downloadQueue: boolean,
  queue: QueueItem[],
  episodeListing: Episode[];
  downloadOptions: DownloadOptions,
  service: 'crunchy'|'funi'|undefined,
  currentDownload?: QueueItem,
  finish?: undefined
}

export type StoreAction<T extends (keyof StoreState)> = {
  type: T,
  payload: StoreState[T],
  extraInfo?: Record<string, unknown>
}

const Reducer = <T extends keyof StoreState,>(state: StoreState, action: StoreAction<T>): StoreState => {
  switch(action.type) {
    case "queue":
      state.queue = action.extraInfo?.force ? action.payload as QueueItem[] : state.queue.concat(action.payload as QueueItem[]);
      if (state.currentDownload === undefined && state.queue.length > 0 && state.downloadQueue) {
        state.currentDownload = state.queue[0];
        state.queue = state.queue.slice(1);
      }
      return { ...state };
    case "finish":
      if (state.queue.length > 0 && state.downloadQueue) {
        state.currentDownload = state.queue[0];
        state.queue = state.queue.slice(1);
      } else {
        state.currentDownload = undefined;
      }
      return { ...state }
    case 'downloadQueue':
      state.downloadQueue = action.payload as boolean;
      if (state.queue.length > 0 && state.downloadQueue && state.currentDownload === undefined) {
        state.currentDownload = state.queue[1];
        state.queue = state.queue.slice(1);
      }
      return {...state}
    default:
      return { ...state, [action.type]: action.payload }
  }
};

const initialState: StoreState = {
  downloadQueue: false,
  queue: [],
  downloadOptions: {
    id: '',
    q: 0,
    e: '',
    dubLang: [ 'jpn' ],
    dlsubs: [ 'all' ],
    fileName: '',
    dlVideoOnce: false,
    all: false,
    but: false,
    noaudio: false,
    novids: false
  },
  service: undefined,
  episodeListing: [],
};

const Store: FCWithChildren = ({children}) => {
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