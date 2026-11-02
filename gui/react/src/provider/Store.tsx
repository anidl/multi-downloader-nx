import React from 'react';
import { Episode } from '../../../../@types/messageHandler';
import { dubLanguageCodes } from '../../../../modules/module.langsData';

export type DownloadOptions = {
	q: number;
	id: string;
	e: string;
	dubLang: typeof dubLanguageCodes;
	dlsubs: string[];
	fileName: string;
	dlVideoOnce: boolean;
	all: boolean;
	but: boolean;
	novids: boolean;
	hslang?: string;
	simul: boolean;
	noaudio: boolean;
};

export type StoreState = {
	episodeListing: Episode[];
	downloadOptions: DownloadOptions;
	service: 'crunchy' | 'hidive' | 'adn' | undefined;
	version: string;
};

export type StoreAction<T extends keyof StoreState> = {
	type: T;
	payload: StoreState[T];
	extraInfo?: Record<string, unknown>;
};

const Reducer = <T extends keyof StoreState>(state: StoreState, action: StoreAction<T>): StoreState => {
	switch (action.type) {
		default:
			return { ...state, [action.type]: action.payload };
	}
};

const initialState: StoreState = {
	downloadOptions: {
		id: '',
		q: 0,
		e: '',
		dubLang: ['jpn'],
		dlsubs: ['all'],
		fileName: '',
		dlVideoOnce: false,
		all: false,
		but: false,
		noaudio: false,
		novids: false,
		simul: false
	},
	service: undefined,
	episodeListing: [],
	version: ''
};

const STORAGE_KEY = 'anidl.gui.preferences.v1';

// Persist interface preferences, never passwords or account credentials.
const restorePreferences = (): StoreState => {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return initialState;
		const saved = JSON.parse(raw) as Partial<StoreState>;
		const service = ['crunchy', 'hidive', 'adn'].includes(saved.service ?? '') ? saved.service : undefined;
		const options = saved.downloadOptions;
		if (!options || typeof options !== 'object') return { ...initialState, service };
		return {
			...initialState,
			service,
			downloadOptions: {
				...initialState.downloadOptions,
				...options,
				id: typeof options.id === 'string' ? options.id : '',
				e: typeof options.e === 'string' ? options.e : '',
				dubLang: Array.isArray(options.dubLang) ? options.dubLang : initialState.downloadOptions.dubLang,
				dlsubs: Array.isArray(options.dlsubs) ? options.dlsubs : initialState.downloadOptions.dlsubs,
				q: Number.isInteger(options.q) && options.q >= 0 && options.q <= 10 ? options.q : 0
			}
		};
	} catch {
		return initialState;
	}
};

const Store: FCWithChildren = ({ children }) => {
	const [state, dispatch] = React.useReducer(Reducer, initialState, restorePreferences);
	React.useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify({
				service: state.service,
				downloadOptions: state.downloadOptions
			}));
		} catch {
			// Local storage may be disabled by the browser.
		}
	}, [state.service, state.downloadOptions]);
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

	return <StoreContext.Provider value={[state, dispatch]}>{children}</StoreContext.Provider>;
};

/* Importent Notice -- The 'queue' generic will be overriden */
export const StoreContext = React.createContext<[StoreState, React.Dispatch<StoreAction<'downloadOptions'>>]>([initialState, undefined as any]);
export default Store;
