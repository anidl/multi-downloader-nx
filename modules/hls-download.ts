// build-in
import crypto from 'crypto';
import fs from 'fs';
import url from 'url';

// extra
import shlp from 'sei-helper';
import got, { Response } from 'got';

import { ProgressData } from '../@types/messageHandler';
import HLSEvents from './hlsEventEmitter';
import { levels } from 'log4js';
const console = undefined;

// The following function should fix an issue with downloading. For more information see https://github.com/sindresorhus/got/issues/1489
const fixMiddleWare = (res: Response) => {
  const isResponseOk = (response: Response) => {
    const {statusCode} = response;
    const limitStatusCode = response.request.options.followRedirect ? 299 : 399;

    return (statusCode >= 200 && statusCode <= limitStatusCode) || statusCode === 304;
  };
  if (isResponseOk(res)) {
    res.request.destroy();
  }
  return res;
};

export type HLSCallback = (data: ProgressData) => unknown;

export type M3U8Json = {
  segments: Record<string, unknown>[],
  mediaSequence?: number,
}

type Segment = {
  uri: string
  key: Key,
  byterange?: {
    offset: number,
    length: number
  }
}

type Key = {
  uri: string,
  iv: number[]
}

export type HLSOptions = {
  m3u8json: M3U8Json,
  identifier: string,
  output?: string,
  threads?: number,
  retries?: number,
  offset?: number,
  baseurl?: string,
  skipInit?: boolean,
  timeout?: number,
  fsRetryTime?: number,
  override?: 'Y'|'y'|'N'|'n'|'C'|'c'
}

type Data = {
  identifier: string,
  parts: {
    first: number,
    total: number,
    completed: number
  },
  m3u8json: M3U8Json,
  outputFile: string,
  threads: number,
  retries: number,
  offset: number,
  baseurl?: string
  skipInit?: boolean,
  keys: {
    [uri: string]: Buffer|string
  },
  timeout: number,
  checkPartLength: boolean,
  isResume: boolean,
  bytesDownloaded: number,
  waitTime: number,
  override?: string,
  dateStart: number
}

// hls class
class hlsDownload {
  private data: Data;
  constructor(options: HLSOptions){
    // check playlist
    if(
      !options
      || !options.m3u8json
      || !options.m3u8json.segments
      || options.m3u8json.segments.length === 0
    ){
      throw new Error('Playlist is empty!');
    }
    // init options
    this.data = {
      parts: {
        first: options.m3u8json.mediaSequence || 0,
        total: options.m3u8json.segments.length,
        completed: 0,
      },
      m3u8json: options.m3u8json,
      outputFile: options.output || 'stream.ts',
      threads: options.threads || 5,
      retries: options.retries || 4,
      offset: options.offset || 0,
      baseurl: options.baseurl,
      skipInit: options.skipInit,
      keys: {},
      timeout: options.timeout ? options.timeout : 60 * 1000,
      checkPartLength: true,
      isResume: options.offset ? options.offset > 0 : false,
      bytesDownloaded: 0,
      waitTime: options.fsRetryTime ?? 1000 * 5,
      identifier: options.identifier,
      override: options.override,
      dateStart: 0
    };
  }
  async download(){
    // set output
    const fn = this.data.outputFile;
    // try load resume file
    if(fs.existsSync(fn) && fs.existsSync(`${fn}.resume`) && this.data.offset < 1){
      try{
        HLSEvents.emit('message', { identifier: this.data.identifier, msg: 'Resume data found! Trying to resume...', severity: levels.INFO });
        const resumeData = JSON.parse(fs.readFileSync(`${fn}.resume`, 'utf-8'));
        if(
          resumeData.total == this.data.m3u8json.segments.length
            && resumeData.completed != resumeData.total
            && !isNaN(resumeData.completed)
        ){
          HLSEvents.emit('message', { identifier: this.data.identifier, msg: 'Resume data is ok!', severity: levels.INFO });
          this.data.offset = resumeData.completed;
          this.data.isResume = true;
        }
        else{
          HLSEvents.emit('message', { identifier: this.data.identifier, msg: 'Resume data is wrong!', severity: levels.WARN });
        }
      }
      catch(e){
        HLSEvents.emit('message', { identifier: this.data.identifier, msg: `Resume failed, downloading will be not resumed!\n${e}`, severity: levels.ERROR });
      }
    }
    // ask before rewrite file
    if (fs.existsSync(`${fn}`) && !this.data.isResume) {
      let rwts = this.data.override ?? await shlp.question(`[Q] File «${fn}» already exists! Rewrite? ([y]es/[N]o/[c]ontinue)`);
      rwts = rwts || 'N';
      if (['Y', 'y'].includes(rwts[0])) {
        fs.unlinkSync(fn);
      }
      else if (['C', 'c'].includes(rwts[0])) {
        HLSEvents.emit('end', { identifier: this.data.identifier });
        return { ok: true, parts: this.data.parts };
      }
      else {
        HLSEvents.emit('end', { identifier: this.data.identifier });
        return { ok: false, parts: this.data.parts };
      }
    }
    // show output filename
    if (fs.existsSync(fn) && this.data.isResume) {
      HLSEvents.emit('message', { identifier: this.data.identifier, msg: `Adding content to «${fn}»...`, severity: levels.INFO });
    }
    else{
      HLSEvents.emit('message', { identifier: this.data.identifier, msg: `Saving stream to «${fn}»...`, severity: levels.INFO });
    }
    // start time
    this.data.dateStart = Date.now();
    let segments = this.data.m3u8json.segments;
    // download init part
    if (segments[0].map && this.data.offset === 0 && !this.data.skipInit) {
      HLSEvents.emit('message', { identifier: this.data.identifier, msg: 'Download and save init part...', severity: levels.INFO });
      const initSeg = segments[0].map as Segment;
      if(segments[0].key){
        initSeg.key = segments[0].key as Key;
      }
      try{
        const initDl = await this.downloadPart(initSeg, 0, 0, this.data.identifier);
        fs.writeFileSync(fn, initDl.dec, { flag: 'a' });
        fs.writeFileSync(`${fn}.resume`, JSON.stringify({
          completed: 0,
          total: this.data.m3u8json.segments.length
        }));
      }
      catch(e: any){
        HLSEvents.emit('message', { identifier: this.data.identifier, msg: `Part init download error:\n\t${e.message}`, severity: levels.ERROR });
        HLSEvents.emit('end', { identifier: this.data.identifier });
        return { ok: false, parts: this.data.parts };
      }
    }
    else if(segments[0].map && this.data.offset === 0 && this.data.skipInit){
      HLSEvents.emit('message', { identifier: this.data.identifier, msg: 'Skipping init part can lead to broken video!', severity: levels.WARN });
    }
    // resuming ...
    if(this.data.offset > 0){
      segments = segments.slice(this.data.offset);
      HLSEvents.emit('message', { identifier: this.data.identifier, msg: `Resuming download from part ${this.data.offset+1}...`, severity: levels.INFO });
      this.data.parts.completed = this.data.offset;
    }
    // dl process
    for (let p = 0; p < segments.length / this.data.threads; p++) {
      // set offsets
      const offset = p * this.data.threads;
      const dlOffset = offset + this.data.threads;
      // map download threads
      const krq = new Map(), prq = new Map();
      const res = [];
      let errcnt = 0;
      for (let px = offset; px < dlOffset && px < segments.length; px++){
        const curp = segments[px];
        const key = curp.key as Key;
        if(key && !krq.has(key.uri) && !this.data.keys[key.uri as string]){
          krq.set(key.uri, this.downloadKey(key, px, this.data.offset, this.data.identifier));
        }
      }
      try {
        await Promise.all(krq.values());
      } catch (er: any) {
        HLSEvents.emit('message', { identifier: this.data.identifier, msg: `Key ${er.p + 1} download error:\n\t${er.message}`, severity: levels.ERROR });
        HLSEvents.emit('end', { identifier: this.data.identifier });
        return { ok: false, parts: this.data.parts };
      }
      for (let px = offset; px < dlOffset && px < segments.length; px++){
        const curp = segments[px] as Segment;
        prq.set(px, this.downloadPart(curp, px, this.data.offset, this.data.identifier));
      }
      for (let i = prq.size; i--;) {
        try {
          const r = await Promise.race(prq.values());
          prq.delete(r.p);
          res[r.p - offset] = r.dec;
        }
        catch (error: any) {
          HLSEvents.emit('message', { identifier: this.data.identifier, msg: `Part ${error.p + 1 + this.data.offset} download error:\n\t${error.message}`, severity: levels.ERROR });
          prq.delete(error.p);
          errcnt++;
        }
      }
      // catch error
      if (errcnt > 0) {
        HLSEvents.emit('message', { identifier: this.data.identifier, msg:`${errcnt} parts not downloaded`, severity: levels.ERROR });
        HLSEvents.emit('end', { identifier: this.data.identifier });
        return { ok: false, parts: this.data.parts };
      }
      // write downloaded
      for (const r of res) {
        let error = 0;
        while (error < 3) {
          try {
            fs.writeFileSync(fn, r, { flag: 'a' });
            break;
          } catch (err) {
            HLSEvents.emit('message', { identifier: this.data.identifier, msg: `Unable to write to file '${fn}' (Attempt ${error+1}/3)\n\t${err}`, severity: levels.ERROR });
            HLSEvents.emit('message', { identifier: this.data.identifier, msg: `Waiting ${Math.round(this.data.waitTime / 1000)}s before retrying`, severity: levels.INFO });
            await new Promise<void>((resolve) => setTimeout(() => resolve(), this.data.waitTime));
          }
          error++;
        }
        if (error === 3) {
          HLSEvents.emit('message', { identifier: this.data.identifier, msg: `Unable to write content to '${fn}'.`, severity: levels.ERROR });
          HLSEvents.emit('end', { identifier: this.data.identifier });
          return { ok: false, parts: this.data.parts };
        }
      }
      // log downloaded
      const totalSeg = segments.length + this.data.offset; // Add the sliced lenght back so the resume data will be correct even if an resumed download fails
      const downloadedSeg = dlOffset < totalSeg ? dlOffset : totalSeg;
      this.data.parts.completed = downloadedSeg + this.data.offset;
      const data = extFn.getDownloadInfo(
        this.data.dateStart, downloadedSeg, totalSeg,
        this.data.bytesDownloaded
      );
      fs.writeFileSync(`${fn}.resume`, JSON.stringify({
        completed: this.data.parts.completed,
        total: totalSeg
      }));
      //console.info(`${downloadedSeg} of ${totalSeg} parts downloaded [${data.percent}%] (${shlp.formatTime(parseInt((data.time / 1000).toFixed(0)))} | ${(data.downloadSpeed / 1000000).toPrecision(2)}Mb/s)`);
      HLSEvents.emit('progress', {
        identifier: this.data.identifier,
        total: this.data.parts.total,
        cur: this.data.parts.completed,
        bytes: this.data.bytesDownloaded,
        percent: data.percent,
        time: data.time,
        downloadSpeed: data.downloadSpeed
      });
    }
    // return result
    fs.unlinkSync(`${fn}.resume`);
    HLSEvents.emit('end', { identifier: this.data.identifier });
    return { ok: true, parts: this.data.parts };
  }
  async downloadPart(seg: Segment, segIndex: number, segOffset: number, identifier: string){
    const sURI = extFn.getURI(seg.uri, this.data.baseurl);
    let decipher, part, dec;
    const p = segIndex;
    try {
      if (seg.key != undefined) {
        decipher = await this.getKey(seg.key, p, segOffset, identifier);
      }
      part = await extFn.getData(p, sURI, {
        ...(seg.byterange ? {
          Range: `bytes=${seg.byterange.offset}-${seg.byterange.offset+seg.byterange.length-1}`
        } : {})
      }, segOffset, false, this.data.timeout, this.data.retries, [
        (res, retryWithMergedOptions) => {
          if(this.data.checkPartLength && res.headers['content-length']){
            if(!res.body || (res.body as any).length != res.headers['content-length']){
              // 'Part not fully downloaded'
              return retryWithMergedOptions();
            }
          }
          return res;
        }
      ], identifier);
      if(this.data.checkPartLength && !(part as any).headers['content-length']){
        this.data.checkPartLength = false;
        HLSEvents.emit('message', { identifier: this.data.identifier, msg: `Part ${segIndex+segOffset+1}: can't check parts size!`, severity: levels.WARN });
      }
      if (decipher == undefined) {
        this.data.bytesDownloaded += (part.body as Buffer).byteLength;
        return { dec: part.body, p };
      }
      dec = decipher.update(part.body as Buffer);
      dec = Buffer.concat([dec, decipher.final()]);
      this.data.bytesDownloaded += dec.byteLength;
    }
    catch (error: any) {
      error.p = p;
      throw error;
    }
    return { dec, p };
  }
  async downloadKey(key: Key, segIndex: number, segOffset: number, identifier: string){
    const kURI = extFn.getURI(key.uri, this.data.baseurl);
    if (!this.data.keys[kURI]) {
      try {
        const rkey = await extFn.getData(segIndex, kURI, {}, segOffset, true, this.data.timeout, this.data.retries, [
          (res, retryWithMergedOptions) => {
            if (!res || !res.body) {
              // 'Key get error'
              return retryWithMergedOptions();
            }
            if((res.body as any).length != 16){
              // 'Key not fully downloaded'
              return retryWithMergedOptions();
            }
            return res;
          }
        ], identifier);
        return rkey;
      }
      catch (error: any) {
        error.p = segIndex;
        throw error;
      }
    }
  }
  async getKey(key: Key, segIndex: number, segOffset: number, identifier: string){
    const kURI = extFn.getURI(key.uri, this.data.baseurl);
    const p = segIndex;
    if (!this.data.keys[kURI]) {
      try{
        const rkey = await this.downloadKey(key, segIndex, segOffset, identifier);
        if (!rkey)
          throw new Error();
        this.data.keys[kURI] = rkey.body;
      }
      catch (error: any) {
        error.p = p;
        throw error;
      }
    }
    // get ivs
    const iv = Buffer.alloc(16);
    const ivs = key.iv ? key.iv : [0, 0, 0, p + 1];
    for (let i = 0; i < ivs.length; i++) {
      iv.writeUInt32BE(ivs[i], i * 4);
    }
    return crypto.createDecipheriv('aes-128-cbc', this.data.keys[kURI], iv);
  }
}

const extFn = {
  getURI: (uri: string, baseurl?: string) => {
    const httpURI = /^https{0,1}:/.test(uri);
    if (!baseurl && !httpURI) {
      throw new Error('No base and not http(s) uri');
    }
    else if (httpURI) {
      return uri;
    }
    return baseurl + uri;
  },
  getDownloadInfo: (dateStart: number, partsDL: number, partsTotal: number, downloadedBytes: number) => {
    const dateElapsed = Date.now() - dateStart;
    const percentFxd = parseInt((partsDL / partsTotal * 100).toFixed());
    const percent = percentFxd < 100 ? percentFxd : (partsTotal == partsDL ? 100 : 99);
    const revParts = dateElapsed * (partsTotal / partsDL - 1);
    const downloadSpeed = downloadedBytes / (dateElapsed / 1000); //Bytes per second
    return { percent, time: revParts, downloadSpeed };
  },
  getData: (partIndex: number, uri: string, headers: Record<string, string>, segOffset: number, isKey: boolean, timeout: number, retry: number, afterResponse: ((res: Response, retryWithMergedOptions: () => Response) => Response)[], identifier: string) => {
    // get file if uri is local
    if (uri.startsWith('file://')) {
      return {
        body: fs.readFileSync(url.fileURLToPath(uri)),
      };
    }
    // base options
    headers = headers && typeof headers == 'object' ? headers : {};
    const options = { headers, retry, responseType: 'buffer', hooks: {
      beforeRequest: [
        (options: Record<string, Record<string, unknown>>) => {
          if(!options.headers['user-agent']){
            options.headers['user-agent'] = 'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:70.0) Gecko/20100101 Firefox/70.0';
          }
          //TODO: implement fix for hidive properly
          if ((options.url.hostname as string).match('hidive')) {
            options.headers['referrer'] = 'https://www.hidive.com/';
            options.headers['origin'] = 'https://www.hidive.com';
          } else if ((options.url.hostname as string).includes('animecdn')) {
            options.headers = {
              origin: 'https://www.animeonegai.com',
              referer: 'https://www.animeonegai.com/',
              range: options.headers['range']
            };
          }
          // console.log(' - Req:', options.url.pathname);
        }
      ],
      afterResponse: [(fixMiddleWare as (r: Response, s: () => Response) => Response)].concat(afterResponse || []),
      beforeRetry: [
        (_: any, error: Error, retryCount: number) => {
          if(error){
            const partType = isKey ? 'Key': 'Part';
            const partIndx = partIndex + 1 + segOffset;
            HLSEvents.emit('message', { identifier: identifier, msg: `${partType} ${partIndx}: ${retryCount + 1} attempt to retrieve data\n\t${error.message}`, severity: levels.WARN });
          }
        }
      ]
    }} as Record<string, unknown>;
    // proxy
    options.timeout = timeout;
    // do request
    return got(uri, options);
  }
};

export default hlsDownload;
