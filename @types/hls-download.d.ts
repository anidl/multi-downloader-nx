declare module 'hls-download' {
  import type { ProgressData } from './messageHandler';
  export type HLSCallback = (data: ProgressData) => unknown;
  export type HLSOptions = {
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
    override?: 'Y'|'y'|'N'|'n'|'C'|'c'
    callback?: HLSCallback
  }
  export default class hlsDownload {
    constructor(options: HLSOptions)
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