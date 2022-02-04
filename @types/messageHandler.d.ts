import { HLSCallback } from 'hls-download';
import type { FunimationSearch } from './funiSearch';
import type { AvailableMuxer } from '../modules/module.args';

export interface MessageHandler {
  auth: (data: AuthData) => Promise<AuthResponse>;
  checkToken: () => Promise<CheckTokenResponse>;
  search: (data: SearchData) => Promise<SearchResponse>,
  availableDubCodes: () => Promise<string[]>,
  handleDefault: (name: string) => Promise<any>,
  resolveItems: (data: ResolveItemsData) => Promise<ResponseBase<QueueItem[]>>,
  listEpisodes: (id: string) => Promise<EpisodeListResponse>
}

export type QueueItem = {
  title: string,
  ids: string[],
  fileName: string,
  parent: {
    title: string,
    season: string
  },
  q: number,
  dubLang: string[],
}

export type ResolveItemsData = {
  id: string,
  dubLang: string[],
  all: boolean,
  but: boolean,
  e: string,
  fileName: string,
  q: number
}

export type SearchResponseItem = {
  image: string,
  name: string,
  desc?: string,
  id: string,
  lang?: string[],
  rating: number
};

export type Episode = {
  e: string,
  lang: string[],
  name: string,
  season: string,
  seasonTitle: string,
  episode: string,
  id: string
}

export type SearchResponse = ResponseBase<SearchResponseItem[]>
export type EpisodeListResponse = ResponseBase<Episode[]>

export type FuniEpisodeData = {
  title: string,
  episode: string,
  episodeID: string,
  seasonTitle: string,
  seasonNumber: string
};

export type AuthData = { username: string, password: string };
export type SearchData = { search: string, page?: number, 'search-type'?: string, 'search-locale'?: string };
export type FuniGetShowData = { id: number, e?: string, but: boolean, all: boolean };
export type FuniGetEpisodeData = { subs: FuniSubsData, fnSlug: FuniEpisodeData, callback?: HLSCallback, simul?: boolean; dubLang: string[], s: string }
export type FuniStreamData = { q: number, callback?: HLSCallback, x: number, fileName: string, numbers: number, novids?: boolean,
  timeout: number, partsize: number, fsRetryTime: number, noaudio?: boolean, mp4: boolean, ass: boolean, fontSize: number, fontName?: string, skipmux?: boolean,
  forceMuxer: AvailableMuxer | undefined, simul: boolean, skipSubMux: boolean, nocleanup: boolean }
export type FuniSubsData = { nosubs?: boolean, sub: boolean, dlsubs: string[] }

export type AuthResponse = ResponseBase<undefined>;
export type FuniSearchReponse = ResponseBase<FunimationSearch>;
export type FuniShowResponse = ResponseBase<FuniEpisodeData[]>;
export type FuniGetEpisodeResponse = ResponseBase<undefined>;
export type CheckTokenResponse = ResponseBase<undefined>;

export type ResponseBase<T> = ({
  isOk: true,
  value: T
} | {
  isOk: false,
  reason: Error
});

export type PossibleMessanges = keyof ServiceHandler;