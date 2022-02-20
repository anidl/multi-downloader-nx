declare module 'iso-639' {
  export type iso639Type = {
    [key: string]: {
      '639-1'?: string,
      '639-2'?: string
    }
  }
  export const iso_639_2: iso639Type;
}