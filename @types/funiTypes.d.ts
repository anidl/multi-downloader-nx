import { LanguageItem } from '../modules/module.langsData';

export type FunimationMediaDownload = {
  id: string,
  title: string,
  showTitle: string,
  image: string
}

export type Subtitle = {
  url: string,
  lang: LanguageItem,
  ext: string,
  out?: string,
  closedCaption?: boolean
}