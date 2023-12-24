declare module 'mpd-parser' {
  export type Segment = {
    uri: string,
    timeline: number,
    duration: number,
    resolvedUri: string,
    map: {
      uri: string,
      resolvedUri: string,
    },
    number: number,
    presentationTime: number
  }

  export type Playlist = {
    attributes: {
      NAME: string,
      BANDWIDTH: number,
      CODECS: string,
      'PROGRAM-ID': number,
      // Following for video only
      'FRAME-RATE'?: number,
      AUDIO?: string, // audio stream name
      SUBTITLES?: string,
      RESOLUTION?: {
        width: number,
        height: number
      }
    },
    uri: string,
    endList: boolean,
    timeline: number,
    resolvedUri: string,
    targetDuration: number,
    discontinuitySequence: number,
    discontinuityStarts: [],
    timelineStarts: {
      start: number,
      timeline: number
    }[],
    mediaSequence: number,
    contentProtection?: {
      [type: string]: {
        pssh?: Uint8Array
      }
    }
    segments: Segment[]
  }

  export type Manifest = {
    allowCache: boolean,
    discontinuityStarts: [],
    segments: [],
    endList: true,
    duration: number,
    playlists: Playlist[],
    mediaGroups: {
      AUDIO: {
        audio: {
          [name: string]: {
            language: string,
            autoselect: boolean,
            default: boolean,
            playlists: Playlist[]
          }
        }
      }
    }
  }
  export function parse(manifest: string): Manifest
}
