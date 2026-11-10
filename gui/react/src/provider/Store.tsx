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

export type ServiceName = 'crunchy' | 'hidive' | 'adn';
export type StoreState = {
	episodeListing: Episode[];
	downloadOptions: DownloadOptions;
	optionsByService: Partial<Record<ServiceName, DownloadOptions>>;
	service: ServiceName | undefined;
	version: string;
};
export type StoreAction<T extends keyof StoreState> = {
	type: T;
	payload: StoreState[T];
	extraInfo?: Record<string, unknown>;
};

const defaultOptions: DownloadOptions = {
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
};
const initialState: StoreState = {
	service: undefined,
	episodeListing: [],
	downloadOptions: { ...defaultOptions },
	optionsByService: {},
	version: ''
};
const STORAGE_KEY = 'anidl.gui.preferences.v2';

const restored = (): StoreState => {
	try {
		const savedV2 = localStorage.getItem(STORAGE_KEY);
		const stored = JSON.parse(savedV2 || localStorage.getItem('anidl.gui.preferences.v1') || '{}') as Partial<StoreState>;
		const service = (['crunchy', 'hidive', 'adn'] as string[]).includes(stored.service || '') ? stored.service : undefined;
		const legacy = stored as Partial<StoreState>;
		const optionsByService: Partial<Record<ServiceName, DownloadOptions>> =
			stored.optionsByService && typeof stored.optionsByService === 'object'
				? stored.optionsByService
				: service && legacy.downloadOptions
					? { [service]: { ...defaultOptions, ...legacy.downloadOptions } }
					: {};
		return {
			...initialState,
			service,
			optionsByService,
			downloadOptions: { ...defaultOptions, ...(service ? optionsByService[service] : {}) }
		};
	} catch {
		return initialState;
	}
};

const Reducer = <T extends keyof StoreState>(state: StoreState, action: StoreAction<T>): StoreState => {
	if (action.type === 'service') {
		const next = action.payload as ServiceName | undefined;
		if (next === state.service) return state;
		const optionsByService = { ...state.optionsByService };
		if (state.service) optionsByService[state.service] = state.downloadOptions;
		return {
			...state,
			service: next,
			optionsByService,
			downloadOptions: { ...defaultOptions, ...(next ? optionsByService[next] : {}) },
			episodeListing: []
		};
	}
	if (action.type === 'downloadOptions') {
		const downloadOptions = action.payload as DownloadOptions;
		return {
			...state,
			downloadOptions,
			optionsByService: state.service ? { ...state.optionsByService, [state.service]: downloadOptions } : state.optionsByService
		};
	}
	return { ...state, [action.type]: action.payload };
};

const Store: FCWithChildren = ({ children }) => {
	const [state, dispatch] = React.useReducer(Reducer, initialState, restored);
	React.useEffect(() => {
		try {
			localStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({
					service: state.service,
					optionsByService: state.optionsByService
				})
			);
		} catch {
			// Private browsing can disable localStorage.
		}
	}, [state.service, state.optionsByService]);
	return <StoreContext.Provider value={[state, dispatch]}>{children}</StoreContext.Provider>;
};

/* Importent Notice -- The 'queue' generic will be overriden */
export const StoreContext = React.createContext<[StoreState, React.Dispatch<StoreAction<'downloadOptions'>>]>([initialState, undefined as any]);
export default Store;
