import { Playlist, parse as mpdParse } from 'mpd-parser';
import { LanguageItem } from './module.langsData';

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

type PlayListTypeItem = {
  type: 'audio',
  language: LanguageItem
} | {
  type: 'video',
  quality: {
    width: number,
    height: number
  }
}

export type PlaylistItem = {
  pssh?: string,
  bandwidth: number,
  segments: Segment[]
} & PlayListTypeItem

export type MPDParsed = {
  [server: string]: {
    [type in 'audio'|'video']: PlaylistItem[]
  }
}

export function parse(manifest: string, language: LanguageItem) {
  const parsed = mpdParse(manifest);
  const ret: MPDParsed = {};

  for (const item of Object.values(parsed.mediaGroups.AUDIO.audio)){
    for (const playlist of item.playlists) {
      const host = new URL(playlist.resolvedUri).hostname;
      if (!Object.prototype.hasOwnProperty.call(ret, host))
        ret[host] = { audio: [], video: [] };

      const pItem: PlaylistItem = {
        bandwidth: playlist.attributes.BANDWIDTH,
        language: language,
        type: 'audio',
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

    const pItem: PlaylistItem = {
      bandwidth: playlist.attributes.BANDWIDTH,
      type: 'video',
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
