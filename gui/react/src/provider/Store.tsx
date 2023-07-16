import React from 'react';
import { Episode } from '../../../../@types/messageHandler';
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
  episodeListing: Episode[];
  downloadOptions: DownloadOptions,
  service: 'crunchy'|'funi'|'hidive'|undefined,
  version: string,
}

export type StoreAction<T extends (keyof StoreState)> = {
  type: T,
  payload: StoreState[T],
  extraInfo?: Record<string, unknown>
}

const Reducer = <T extends keyof StoreState,>(state: StoreState, action: StoreAction<T>): StoreState => {
  switch(action.type) {
  default:
    return { ...state, [action.type]: action.payload };
  }
};

const initialState: StoreState = {
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
  version: '',
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
export const StoreContext = React.createContext<[StoreState, React.Dispatch<StoreAction<'downloadOptions'>>]>([initialState, undefined as any]);
export default Store;