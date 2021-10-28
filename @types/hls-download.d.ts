declare module 'hls-download' {
  export default class hlsDownload {
    constructor(options: {
      m3u8json: {
        segments: {}[],
        mediaSequence?: number,
      },
      output?: string,
      threads?: number,
      retries?: number,
      offset?: number,
      baseurl?: string,
      proxy?: string,
      skipInit?: boolean,
      timeout?: number
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