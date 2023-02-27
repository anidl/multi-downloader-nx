import { AuthResponse, CheckTokenResponse, EpisodeListResponse, FolderTypes, QueueItem, ResolveItemsData, ResponseBase, SearchData, SearchResponse } from "./messageHandler"

export type WSMessage<T extends keyof MessageTypes, P extends 0|1 = 0> = {
  name: T,
  data: MessageTypes[T][P]
}

export type WSMessageWithID<T extends keyof MessageTypes, P extends 0|1 = 0> = WSMessage<T, P> & {
  id: string
}

export type UnknownWSMessage = {
  name: keyof MessageTypes,
  data: MessageTypes[keyof MessageTypes][0],
  id: string
}

export type MessageTypes = {
  'auth': [AuthData, AuthResponse],
  'checkToken': [undefined, CheckTokenResponse],
  'search': [SearchData, SearchResponse],
  'default': [string, unknown],
  'availableDubCodes': [undefined, string[]],
  'availableSubCodes': [undefined, string[]],
  'resolveItems': [ResolveItemsData, ResponseBase<QueueItem[]>],
  'listEpisodes': [string, EpisodeListResponse],
  'downloadItem': [unknown, undefined],
  'isDownloading': [undefined, boolean],
  'writeToClipboard': [string, undefined],
  'openFolder': [FolderTypes, undefined],
  'changeProvider': [undefined, boolean],
  'type': [undefined, 'funi'|'crunchy'|undefined],
  'setup': ['funi'|'crunchy'|undefined, undefined],
  'openFile': [[FolderTypes, string], undefined],
  'openURL': [string, undefined]
}