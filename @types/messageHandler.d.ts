import { HLSCallback } from 'hls-download';
import type { FunimationShow as FunimationSearch } from './funiSearch';

export interface MessageHandler {
  auth: (data: AuthData) => Promise<AuthResponse>;
}

export type FuniEpisodeData = {
  title: string,
  episode: string,
  episodeID: string
};

export type AuthData = { username: string, password: string };
export type FuniSearchData = { search: string };
export type FuniGetShowData = { id: number, e?: string, but: boolean, all: boolean };
export type FuniGetEpisodeData = { fnSlug: FuniEpisodeData, callback?: HLSCallback, simul?: boolean; dubLang: string[], s: string }

export type AuthResponse = ResponseBase<undefined>;
export type FuniSearchReponse = ResponseBase<FunimationSearch>;
export type FuniShowResponse = ResponseBase<FuniEpisodeData[]>;
export type FuniGetEpisodeResponse = ResponseBase<undefined>;

export type ResponseBase<T> = ({
  isOk: true,
  value: T
} | {
  isOk: false,
  reason: Error
});

export type PossibleMessanges = keyof ServiceHandler;