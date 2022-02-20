declare module 'm3u8-parsed' {
  export type M3U8 = {
    allowCache: boolean,
    discontinuityStarts: [],
    segments: {
      duration: number,
      byterange?: {
        length: number,
        offset: number
      },
      uri: string,
      key: {
        method: string,
        uri: string,
      },
      timeline: number
    }[],
    version: number,
    mediaGroups: {
      [type: string]: {
        [index: string]: {
          [language: string]: {
            default: boolean,
            autoselect: boolean,
            language: string,
            uri: string
          }
        }
      }
    },
    playlists: {
      uri: string,
      timeline: number,
      attributes: {
        'CLOSED-CAPTIONS': string,
        'AUDIO': string,
        'FRAME-RATE': number,
        'RESOLUTION': {
          width: number,
          height: number
        },
        'CODECS': string,
        'AVERAGE-BANDWIDTH': string,
        'BANDWIDTH': number
      }
    }[],
  }
  export default function (data: string): M3U8;
}