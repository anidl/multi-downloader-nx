// build-in
import crypto from 'crypto';
import fs from 'fs/promises';
import fsp from 'fs';
import url from 'url';

import { console } from './log';
import { ProgressData } from '../@types/messageHandler';
import { ofetch } from 'ofetch';
import Helper from './module.helper';

export type HLSCallback = (data: ProgressData) => unknown;

export type M3U8Json = {
  segments: Record<string, unknown>[];
  mediaSequence?: number;
};

type Segment = {
  uri: string;
  key: Key;
  byterange?: {
    offset: number;
    length: number;
  };
};

type Key = {
  uri: string;
  iv: number[];
};

export type HLSOptions = {
  m3u8json: M3U8Json;
  output?: string;
  threads?: number;
  retries?: number;
  offset?: number;
  baseurl?: string;
  skipInit?: boolean;
  timeout?: number;
  fsRetryTime?: number;
  override?: 'Y' | 'y' | 'N' | 'n' | 'C' | 'c';
  callback?: HLSCallback;
};

type Data = {
  parts: {
    first: number;
    total: number;
    completed: number;
  };
  m3u8json: M3U8Json;
  outputFile: string;
  threads: number;
  retries: number;
  offset: number;
  baseurl?: string;
  skipInit?: boolean;
  keys: {
    [uri: string]: Buffer | string;
  };
  timeout: number;
  checkPartLength: boolean;
  isResume: boolean;
  bytesDownloaded: number;
  waitTime: number;
  callback?: HLSCallback;
  override?: string;
  dateStart: number;
};

// hls class
class hlsDownload {
  private data: Data;
  constructor(options: HLSOptions) {
    // check playlist
    if (!options || !options.m3u8json || !options.m3u8json.segments || options.m3u8json.segments.length === 0) {
      throw new Error('Playlist is empty!');
    }
    // init options
    this.data = {
      parts: {
        first: options.m3u8json.mediaSequence || 0,
        total: options.m3u8json.segments.length,
        completed: 0
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
      checkPartLength: false,
      isResume: options.offset ? options.offset > 0 : false,
      bytesDownloaded: 0,
      waitTime: options.fsRetryTime ?? 1000 * 5,
      callback: options.callback,
      override: options.override,
      dateStart: 0
    };
  }
  async download() {
    // set output
    const fn = this.data.outputFile;
    // try load resume file
    if (fsp.existsSync(fn) && fsp.existsSync(`${fn}.resume`) && this.data.offset < 1) {
      try {
        console.info('Resume data found! Trying to resume...');
        const resumeData = JSON.parse(await fs.readFile(`${fn}.resume`, 'utf-8'));
        if (resumeData.total == this.data.m3u8json.segments.length && resumeData.completed != resumeData.total && !isNaN(resumeData.completed)) {
          console.info('Resume data is ok!');
          this.data.offset = resumeData.completed;
          this.data.isResume = true;
        } else {
          console.warn(' Resume data is wrong!');
          console.warn({
            resume: { total: resumeData.total, dled: resumeData.completed },
            current: { total: this.data.m3u8json.segments.length }
          });
        }
      } catch (e) {
        console.error('Resume failed, downloading will be not resumed!');
        console.error(e);
      }
    }
    // ask before rewrite file
    if (fsp.existsSync(`${fn}`) && !this.data.isResume) {
      let rwts = this.data.override ?? (await Helper.question(`[Q] File «${fn}» already exists! Rewrite? ([y]es/[N]o/[c]ontinue)`));
      rwts = rwts || 'N';
      if (['Y', 'y'].includes(rwts[0])) {
        console.info(`Deleting «${fn}»...`);
        await fs.unlink(fn);
      } else if (['C', 'c'].includes(rwts[0])) {
        return { ok: true, parts: this.data.parts };
      } else {
        return { ok: false, parts: this.data.parts };
      }
    }
    // show output filename
    if (fsp.existsSync(fn) && this.data.isResume) {
      console.info(`Adding content to «${fn}»...`);
    } else {
      console.info(`Saving stream to «${fn}»...`);
    }
    // start time
    this.data.dateStart = Date.now();
    let segments = this.data.m3u8json.segments;
    // download init part
    if (segments[0].map && this.data.offset === 0 && !this.data.skipInit) {
      console.info('Download and save init part...');
      const initSeg = segments[0].map as Segment;
      if (segments[0].key) {
        initSeg.key = segments[0].key as Key;
      }
      try {
        const initDl = await this.downloadPart(initSeg, 0, 0);
        await fs.writeFile(fn, initDl.dec, { flag: 'a' });
        await fs.writeFile(
          `${fn}.resume`,
          JSON.stringify({
            completed: 0,
            total: this.data.m3u8json.segments.length
          })
        );
        console.info('Init part downloaded.');
      } catch (e: any) {
        console.error(`Part init download error:\n\t${e.message}`);
        return { ok: false, parts: this.data.parts };
      }
    } else if (segments[0].map && this.data.offset === 0 && this.data.skipInit) {
      console.warn('Skipping init part can lead to broken video!');
    }
    // resuming ...
    if (this.data.offset > 0) {
      segments = segments.slice(this.data.offset);
      console.info(`Resuming download from part ${this.data.offset + 1}...`);
      this.data.parts.completed = this.data.offset;
    }
    // dl process
    for (let p = 0; p < segments.length / this.data.threads; p++) {
      // set offsets
      const offset = p * this.data.threads;
      const dlOffset = offset + this.data.threads;
      // map download threads
      const krq = new Map(),
        prq = new Map();
      const res = [];
      let errcnt = 0;
      for (let px = offset; px < dlOffset && px < segments.length; px++) {
        const curp = segments[px];
        const key = curp.key as Key;
        if (key && !krq.has(key.uri) && !this.data.keys[key.uri as string]) {
          krq.set(key.uri, this.downloadKey(key, px, this.data.offset));
        }
      }
      try {
        await Promise.all(krq.values());
      } catch (er: any) {
        console.error(`Key ${er.p + 1} download error:\n\t${er.message}`);
        return { ok: false, parts: this.data.parts };
      }
      for (let px = offset; px < dlOffset && px < segments.length; px++) {
        const curp = segments[px] as Segment;
        prq.set(px, this.downloadPart(curp, px, this.data.offset));
      }
      for (let i = prq.size; i--; ) {
        try {
          const r = await Promise.race(prq.values());
          prq.delete(r.p);
          res[r.p - offset] = r.dec;
        } catch (error: any) {
          console.error('Part %s download error:\n\t%s', error.p + 1 + this.data.offset, error.message);
          prq.delete(error.p);
          errcnt++;
        }
      }
      // catch error
      if (errcnt > 0) {
        console.error(`${errcnt} parts not downloaded`);
        return { ok: false, parts: this.data.parts };
      }
      // write downloaded
      for (const r of res) {
        let error = 0;
        while (error < 3) {
          try {
            await fs.writeFile(fn, r, { flag: 'a' });
            break;
          } catch (err) {
            console.error(err);
            console.error(`Unable to write to file '${fn}' (Attempt ${error + 1}/3)`);
            console.info(`Waiting ${Math.round(this.data.waitTime / 1000)}s before retrying`);
            await new Promise<void>((resolve) => setTimeout(() => resolve(), this.data.waitTime));
          }
          error++;
        }
        if (error === 3) {
          console.error(`Unable to write content to '${fn}'.`);
          return { ok: false, parts: this.data.parts };
        }
      }
      // log downloaded
      const totalSeg = segments.length + this.data.offset; // Add the sliced lenght back so the resume data will be correct even if an resumed download fails
      const downloadedSeg = dlOffset < totalSeg ? dlOffset : totalSeg;
      this.data.parts.completed = downloadedSeg + this.data.offset;
      const data = extFn.getDownloadInfo(this.data.dateStart, downloadedSeg, totalSeg, this.data.bytesDownloaded);
      await fs.writeFile(
        `${fn}.resume`,
        JSON.stringify({
          completed: this.data.parts.completed,
          total: totalSeg
        })
      );
      console.info(
        `${downloadedSeg} of ${totalSeg} parts downloaded [${data.percent}%] (${Helper.formatTime(parseInt((data.time / 1000).toFixed(0)))} | ${(
          data.downloadSpeed / 1000000
        ).toPrecision(2)}Mb/s)`
      );
      if (this.data.callback)
        this.data.callback({
          total: this.data.parts.total,
          cur: this.data.parts.completed,
          bytes: this.data.bytesDownloaded,
          percent: data.percent,
          time: data.time,
          downloadSpeed: data.downloadSpeed
        });
    }
    // return result
    await fs.unlink(`${fn}.resume`);
    return { ok: true, parts: this.data.parts };
  }
  async downloadPart(seg: Segment, segIndex: number, segOffset: number) {
    const sURI = extFn.getURI(seg.uri, this.data.baseurl);
    let decipher, part, dec;
    const p = segIndex;
    try {
      if (seg.key != undefined) {
        decipher = await this.getKey(seg.key, p, segOffset);
      }
      part = await extFn.getData(
        p,
        sURI,
        {
          ...(seg.byterange
            ? {
              Range: `bytes=${seg.byterange.offset}-${seg.byterange.offset + seg.byterange.length - 1}`
            }
            : {})
        },
        segOffset,
        false
      );
      // if (this.data.checkPartLength) {
      //   this.data.checkPartLength = false;
      //   console.warn(`Part ${segIndex + segOffset + 1}: can't check parts size!`);
      // }
      if (decipher == undefined) {
        this.data.bytesDownloaded += Buffer.from(part).byteLength;
        return { dec: Buffer.from(part), p };
      }
      dec = decipher.update(Buffer.from(part));
      dec = Buffer.concat([dec, decipher.final()]);
      this.data.bytesDownloaded += dec.byteLength;
    } catch (error: any) {
      error.p = p;
      throw error;
    }
    return { dec, p };
  }
  async downloadKey(key: Key, segIndex: number, segOffset: number) {
    const kURI = extFn.getURI(key.uri, this.data.baseurl);
    if (!this.data.keys[kURI]) {
      try {
        const rkey = await extFn.getData(segIndex, kURI, {}, segOffset, true);
        return rkey;
      } catch (error: any) {
        error.p = segIndex;
        throw error;
      }
    }
  }
  async getKey(key: Key, segIndex: number, segOffset: number) {
    const kURI = extFn.getURI(key.uri, this.data.baseurl);
    const p = segIndex;
    if (!this.data.keys[kURI]) {
      try {
        const rkey = await this.downloadKey(key, segIndex, segOffset);
        if (!rkey) throw new Error();
        this.data.keys[kURI] = Buffer.from(rkey);
      } catch (error: any) {
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
    } else if (httpURI) {
      return uri;
    }
    return baseurl + uri;
  },
  getDownloadInfo: (dateStart: number, partsDL: number, partsTotal: number, downloadedBytes: number) => {
    const dateElapsed = Date.now() - dateStart;
    const percentFxd = parseInt(((partsDL / partsTotal) * 100).toFixed());
    const percent = percentFxd < 100 ? percentFxd : partsTotal == partsDL ? 100 : 99;
    const revParts = dateElapsed * (partsTotal / partsDL - 1);
    const downloadSpeed = downloadedBytes / (dateElapsed / 1000); //Bytes per second
    return { percent, time: revParts, downloadSpeed };
  },
  getData: async (partIndex: number, uri: string, headers: Record<string, string>, segOffset: number, isKey: boolean) => {
    // get file if uri is local
    if (uri.startsWith('file://')) {
      const buffer = await fs.readFile(url.fileURLToPath(uri));
      return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    }
    // do request
    return await ofetch(uri, {
      method: 'GET',
      headers: headers,
      responseType: 'arrayBuffer',
      retry: 10,
      retryDelay: 1000,
      async onRequestError({ error }) {
        const partType = isKey ? 'Key' : 'Part';
        const partIndx = partIndex + 1 + segOffset;
        console.warn('%s %s: attempt to retrieve data', partType, partIndx);
        console.error(`\t${error.message}`);
      }
    });
  }
};

export default hlsDownload;
