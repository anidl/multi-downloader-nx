import type { Font, MergerInput, SubtitleInput } from './modules/module.merger';
import type { LanguageItem } from '../modules/module.langsData';

export type sxItem = {
  language: LanguageItem,
  path: string,
  file: string
  title: string,
  fonts: Font[]
}

export type DownloadedMedia = {
  type: 'Video',
  lang: LanguageItem,
  path: string,
  uncut?: boolean,
  isPrimary?: boolean
} | {
  type: 'Audio',
  lang: LanguageItem,
  path: string,
  uncut?: boolean,
  isPrimary?: boolean
} | {
  type: 'Chapters',
  lang: LanguageItem,
  path: string
} | ({
  type: 'Subtitle',
  signs?: boolean,
  cc: boolean
} & sxItem )

export type DownloadedMediaMap = {
  version: string;
  files: DownloadedMedia[];
}