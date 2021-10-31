export type CrunchyEpMeta = {
  mediaId: string,
  seasonTitle: string,
  episodeNumber: string,
  episodeTitle: string,
  playback?: string
}

export type ParseItem = {
  isSelected?: boolean,
  type?: string,
  id: string,
  title: string,
  playback?: string,
  season_number?: number|string,
  is_premium_only?: boolean,
  hide_metadata?: boolean,
  seq_id?: string,
  f_num?: string,
  s_num?: string
  external_id?: string,
  ep_num?: string
  last_public?: string,
  subtitle_locales?: string[],
  availability_notes?: string
}