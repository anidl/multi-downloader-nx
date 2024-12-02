import { parse as mpdParse } from 'mpd-parser';
import { LanguageItem, findLang, languages } from './module.langsData';
import { console } from './log';

type Segment = {
  uri: string;
  timeline: number;
  duration: number;
  map: {
    uri: string;
    byterange?: {
      length: number,
      offset: number
    };
  };
  byterange?: {
    length: number,
    offset: number
  };
  number?: number;
  presentationTime?: number;
}

export type PlaylistItem = {
  pssh_wvd?: string,
  pssh_prd?: string,
  bandwidth: number,
  segments: Segment[]
}


type AudioPlayList = {
  language: LanguageItem,
  default: boolean
} & PlaylistItem

type VideoPlayList = {
  quality: {
    width: number,
    height: number
  }
} & PlaylistItem

export type MPDParsed = {
  [server: string]: {
    audio: AudioPlayList[],
    video: VideoPlayList[]
  }
}

function extractPSSH(
  manifest: string,
  schemeIdUri: string,
  psshTagNames: string[]
): string | null {
  const regex = new RegExp(
    `<ContentProtection[^>]*schemeIdUri=["']${schemeIdUri}["'][^>]*>([\\s\\S]*?)</ContentProtection>`,
    'i'
  );
  const match = regex.exec(manifest);
  if (match && match[1]) {
    const innerContent = match[1];
    for (const tagName of psshTagNames) {
      const psshRegex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, 'i');
      const psshMatch = psshRegex.exec(innerContent);
      if (psshMatch && psshMatch[1]) {
        return psshMatch[1].trim();
      }
    }
  }
  return null;
}

export async function parse(manifest: string, language?: LanguageItem, url?: string) {
  if (!manifest.includes('BaseURL') && url) {
    manifest = manifest.replace(/(<MPD*\b[^>]*>)/gm, `$1<BaseURL>${url}</BaseURL>`);
  }
  const parsed = mpdParse(manifest);
  const ret: MPDParsed = {};

  // Audio Loop
  for (const item of Object.values(parsed.mediaGroups.AUDIO.audio)){
    for (const playlist of item.playlists) {
      const host = new URL(playlist.resolvedUri).hostname;
      if (!Object.prototype.hasOwnProperty.call(ret, host))
        ret[host] = { audio: [], video: [] };


      if (playlist.sidx && playlist.segments.length == 0) {
        const options: RequestInit = {
          method: 'head'
        };
        if (playlist.sidx.uri.includes('animecdn')) options.headers = {
          'origin': 'https://www.animeonegai.com',
          'referer': 'https://www.animeonegai.com/',
        };
        const item = await fetch(playlist.sidx.uri, options);
        if (!item.ok) console.warn(`${item.status}: ${item.statusText}, Unable to fetch byteLength for audio stream ${Math.round(playlist.attributes.BANDWIDTH/1024)}KiB/s`);
        const byteLength = parseInt(item.headers.get('content-length') as string);
        let currentByte = playlist.sidx.map.byterange.length;
        while (currentByte <= byteLength) {
          playlist.segments.push({
            'duration': 0,
            'map': {
              'uri': playlist.resolvedUri,
              'resolvedUri': playlist.resolvedUri,
              'byterange': playlist.sidx.map.byterange
            },
            'uri': playlist.resolvedUri,
            'resolvedUri': playlist.resolvedUri,
            'byterange': {
              'length': 500000,
              'offset': currentByte
            },
            timeline: 0,
            number: 0,
            presentationTime: 0
          });
          currentByte = currentByte + 500000;
        }
      }

      //Find and add audio language if it is found in the MPD
      let audiolang: LanguageItem;
      const foundlanguage = findLang(languages.find(a => a.code === item.language)?.cr_locale ?? 'unknown');
      if (item.language) {
        audiolang = foundlanguage;
      } else {
        audiolang = language ? language : foundlanguage;
      }
      const pItem: AudioPlayList = {
        bandwidth: playlist.attributes.BANDWIDTH,
        language: audiolang,
        default: item.default,
        segments: playlist.segments.map((segment): Segment => {
          const uri = segment.resolvedUri;
          const map_uri = segment.map.resolvedUri;
          return {
            duration: segment.duration,
            map: { uri: map_uri, byterange: segment.map.byterange },
            number: segment.number,
            presentationTime: segment.presentationTime,
            timeline: segment.timeline,
            byterange: segment.byterange,
            uri
          };
        })
      };

      const playreadyPssh = extractPSSH(
        manifest,
        'urn:uuid:9A04F079-9840-4286-AB92-E65BE0885F95',
        ['cenc:pssh', 'mspr:pro']
      );

      if (playlist.contentProtection &&
        playlist.contentProtection?.['com.widevine.alpha'].pssh)
        pItem.pssh_wvd = arrayBufferToBase64(playlist.contentProtection['com.widevine.alpha'].pssh);
  
      if (playreadyPssh)
        pItem.pssh_prd = playreadyPssh;

      ret[host].audio.push(pItem);
    }
  }

  // Video Loop
  for (const playlist of parsed.playlists) {
    const host = new URL(playlist.resolvedUri).hostname;
    if (!Object.prototype.hasOwnProperty.call(ret, host))
      ret[host] = { audio: [], video: [] };

    if (playlist.sidx && playlist.segments.length == 0) {
      const options: RequestInit = {
        method: 'head'
      };
      if (playlist.sidx.uri.includes('animecdn')) options.headers = {
        'origin': 'https://www.animeonegai.com',
        'referer': 'https://www.animeonegai.com/',
      };
      const item = await fetch(playlist.sidx.uri, options);
      if (!item.ok) console.warn(`${item.status}: ${item.statusText}, Unable to fetch byteLength for video stream ${playlist.attributes.RESOLUTION?.height}x${playlist.attributes.RESOLUTION?.width}@${Math.round(playlist.attributes.BANDWIDTH/1024)}KiB/s`);
      const byteLength = parseInt(item.headers.get('content-length') as string);
      let currentByte = playlist.sidx.map.byterange.length;
      while (currentByte <= byteLength) {
        playlist.segments.push({
          'duration': 0,
          'map': {
            'uri': playlist.resolvedUri,
            'resolvedUri': playlist.resolvedUri,
            'byterange': playlist.sidx.map.byterange
          },
          'uri': playlist.resolvedUri,
          'resolvedUri': playlist.resolvedUri,
          'byterange': {
            'length': 2000000,
            'offset': currentByte
          },
          timeline: 0,
          number: 0,
          presentationTime: 0
        });
        currentByte = currentByte + 2000000;
      }
    }

    const pItem: VideoPlayList = {
      bandwidth: playlist.attributes.BANDWIDTH,
      quality: playlist.attributes.RESOLUTION!,
      segments: playlist.segments.map((segment): Segment => {
        const uri = segment.resolvedUri;
        const map_uri = segment.map.resolvedUri;
        return {
          duration: segment.duration,
          map: { uri: map_uri, byterange: segment.map.byterange },
          number: segment.number,
          presentationTime: segment.presentationTime,
          timeline: segment.timeline,
          byterange: segment.byterange,
          uri
        };
      })
    };

    const playreadyPssh = extractPSSH(
      manifest,
      'urn:uuid:9A04F079-9840-4286-AB92-E65BE0885F95',
      ['cenc:pssh', 'mspr:pro']
    );

    if (playlist.contentProtection &&
      playlist.contentProtection?.['com.widevine.alpha'].pssh)
      pItem.pssh_wvd = arrayBufferToBase64(playlist.contentProtection['com.widevine.alpha'].pssh);

    if (playreadyPssh)
      pItem.pssh_prd = playreadyPssh;

    ret[host].video.push(pItem);
  }

  return ret;
}

function arrayBufferToBase64(buffer: Uint8Array): string {
  return Buffer.from(buffer).toString('base64');
}
