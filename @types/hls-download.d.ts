declare module 'hls-download' {
  export type HLSCallback = (data: {
    total: number,
    cur: number,
    percent: number|string,
    time: number,
    downloadSpeed: number
  }) => unknown;
  export default class hlsDownload {
    constructor(options: {
      m3u8json: {
        segments: Record<string, unknown>[],
        mediaSequence?: number,
      },
      output?: string,
      threads?: number,
      retries?: number,
      offset?: number,
      baseurl?: string,
      proxy?: string,
      skipInit?: boolean,
      timeout?: number,
      fsRetryTime?: number,
      callback?: HLSCallback
    })
    async download() : Promise<{
      ok: boolean,
      parts: {
        first: number,
        total: number,
        compleated: number
      }
    }>
  }
}