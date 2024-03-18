import { parse as mpdParse } from 'mpd-parser';
import { LanguageItem, findLang, languages } from './module.langsData';

type Segment = {
  uri: string;
  timeline: number;
  duration: number;
  map: {
    uri: string;
  };
  number: number;
  presentationTime: number;
}

export type PlaylistItem = {
  pssh?: string,
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

export function parse(manifest: string, language?: LanguageItem, url?: string) {
  if (!manifest.includes('BaseURL') && url) {
    manifest = manifest.replace(/(<MPD*\b[^>]*>)/gm, `$1<BaseURL>${url}</BaseURL>`);
  }
  const parsed = mpdParse(manifest);
  const ret: MPDParsed = {};

  for (const item of Object.values(parsed.mediaGroups.AUDIO.audio)){
    for (const playlist of item.playlists) {
      const host = new URL(playlist.resolvedUri).hostname;
      if (!Object.prototype.hasOwnProperty.call(ret, host))
        ret[host] = { audio: [], video: [] };

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
            map: { uri: map_uri },
            number: segment.number,
            presentationTime: segment.presentationTime,
            timeline: segment.timeline,
            uri
          };
        })
      };

      if (playlist.contentProtection &&
        playlist.contentProtection?.['com.widevine.alpha'].pssh)
        pItem.pssh = arrayBufferToBase64(playlist.contentProtection['com.widevine.alpha'].pssh);

      ret[host].audio.push(pItem);
    }
  }

  for (const playlist of parsed.playlists) {
    const host = new URL(playlist.resolvedUri).hostname;
    if (!Object.prototype.hasOwnProperty.call(ret, host))
      ret[host] = { audio: [], video: [] };

    const pItem: VideoPlayList = {
      bandwidth: playlist.attributes.BANDWIDTH,
      quality: playlist.attributes.RESOLUTION!,
      segments: playlist.segments.map((segment): Segment => {
        const uri = segment.resolvedUri;
        const map_uri = segment.map.resolvedUri;
        return {
          duration: segment.duration,
          map: { uri: map_uri },
          number: segment.number,
          presentationTime: segment.presentationTime,
          timeline: segment.timeline,
          uri
        };
      })
    };

    if (playlist.contentProtection &&
      playlist.contentProtection?.['com.widevine.alpha'].pssh)
      pItem.pssh = arrayBufferToBase64(playlist.contentProtection['com.widevine.alpha'].pssh);

    ret[host].video.push(pItem);
  }

  return ret;
}

function arrayBufferToBase64(buffer: Uint8Array): string {
  return Buffer.from(buffer).toString('base64');
}
