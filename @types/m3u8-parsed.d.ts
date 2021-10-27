declare module 'm3u8-parsed' {
  export default function (data: string): {
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
    mediaGroups?: {
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
    playlists?: {
      uri: string,
      timeline: number,
      attributes: {
        "CLOSED-CAPTIONS": string,
        "AUDIO": string,
        "FRAME-RATE": number,
        "RESOLUTION": {
          width: number,
          height: number
        },
        "CODECS": string,
        "AVERAGE-BANDWIDTH": string,
        "BANDWIDTH": number
      }
    }[],
  }
}