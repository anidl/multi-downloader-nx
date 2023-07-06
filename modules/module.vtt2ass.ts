// const
const cssPrefixRx = /\.rmp-container>\.rmp-content>\.rmp-cc-area>\.rmp-cc-container>\.rmp-cc-display>\.rmp-cc-cue /g;

import { console } from './log';

// colors
import colors from './module.colors.json';
const defaultStyleName = 'Default';
const defaultStyleFont = 'Arial';

// predefined
let relGroup = '';
let fontSize = 0;
let tmMrg = 0;
let rFont = '';

type Css = Record<string, {
  params: string;
  list: string[];
}>

type Vtt = {
  caption: string;
  time: {
      start: string;
      end: string;
      ext: unknown;
  };
  text?: string | undefined;
};

function loadCSS(cssStr: string): Css {
  const css = cssStr.replace(cssPrefixRx, '').replace(/[\r\n]+/g, '\n').split('\n');
  const defaultSFont = rFont == '' ? defaultStyleFont : rFont;
  let defaultStyle = `${defaultSFont},40,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,1,0,2,20,20,20,1`; //base for nonDialog
  const styles: Record<string, {
    params: string,
    list: string[]
  }> = { [defaultStyleName]: { params: defaultStyle, list: [] } };
  const classList: Record<string, number> = { [defaultStyleName]: 1 };
  for (const i in css) {
    let clx, clz, clzx, rgx;
    const l = css[i];
    if (l === '') continue;
    const m = l.match(/^(.*)\{(.*)\}$/);
    if (!m) {
      console.error(`[WARN] VTT2ASS: Invalid css in line ${i}: ${l}`);
      continue;
    }

    if (m[1] === '') {
      const style = parseStyle(defaultStyleName, m[2], defaultStyle);
      styles[defaultStyleName].params = style;
      defaultStyle = style;
    } else {
      clx = m[1].replace(/\./g, '').split(',');
      clz = clx[0].replace(/-C(\d+)_(\d+)$/i, '').replace(/-(\d+)$/i, '');
      classList[clz] = (classList[clz] || 0) + 1;
      rgx = classList[clz];
      const classSubNum = rgx > 1 ? `-${rgx}` : '';
      clzx = clz + classSubNum;
      const style = parseStyle(clzx, m[2], defaultStyle);
      styles[clzx] = { params: style, list: clx };
    }
  }
  return styles;
}

function parseStyle(stylegroup: string, line: string, style: any) {
  const defaultSFont = rFont == '' ? defaultStyleFont : rFont; //redeclare cause of let

  if (stylegroup.startsWith('Subtitle') || stylegroup.startsWith('Song')) { //base for dialog, everything else use defaultStyle
    style = `${defaultSFont},${fontSize},&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2.6,0,2,20,20,46,1`;
  }

  // Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour,
  // BackColour, Bold, Italic, Underline, StrikeOut,
  // ScaleX, ScaleY, Spacing, Angle, BorderStyle,
  // Outline, Shadow, Alignment, MarginL, MarginR,
  // MarginV, Encoding
  style = style.split(',');
  for (const s of line.split(';')) {
    if (s == '') continue;
    const st = s.trim().split(':');
    let cl, arr, transformed_str;
    switch (st[0]) {
    case 'font-family':
      if (rFont != '') { //do rewrite if rFont is specified
        if (stylegroup.startsWith('Subtitle') || stylegroup.startsWith('Song')) {
          style[0] = rFont; //dialog to rFont
        } else {
          style[0] = defaultStyleFont; //non-dialog to Arial
        }
      } else { //otherwise keep default style
        style[0] = st[1].match(/[\s"]*([^",]*)/)![1];
      }
      break;
    case 'font-size':
      style[1] = getPxSize(st[1], style[1]); //scale it based on input style size... so for dialog, this is the dialog font size set in config, for non dialog, it's 40 from default font size
      break;
    case 'color':
      cl = getColor(st[1]);
      if (cl !== null) {
        if (cl == '&H0000FFFF') {
          style[2] = style[3] = '&H00FFFFFF';
        }
        else {
          style[2] = style[3] = cl;
        }
      }
      break;
    case 'font-weight':
      if (stylegroup.startsWith('Subtitle') || stylegroup.startsWith('Song')) { //don't touch font-weight if dialog
        break;
      }
      // console.info("Changing bold weight");
      // console.info(stylegroup);
      if (st[1] === 'bold') {
        style[6] = -1;
        break;
      }
      if (st[1] === 'normal') {
        break;
      }
      break;
    case 'font-style':
      if (st[1] === 'italic') {
        style[7] = -1;
        break;
      }
      break;
    case 'background':
      if (st[1] === 'none') {
        break;
      }
      break;
    case 'text-shadow':
      if (stylegroup.startsWith('Subtitle') || stylegroup.startsWith('Song')) { //don't touch shadow if dialog
        break;
      }
      arr = transformed_str = st[1].split(',').map(r => r.trim());
      arr = arr.map(r => { return (r.split(' ').length > 3 ? r.replace(/(\d+)px black$/, '') : r.replace(/black$/, '')).trim(); });
      transformed_str[1] = arr.map(r => r.replace(/-/g, '').replace(/px/g, '').replace(/(^| )0( |$)/g, ' ').trim()).join(' ');
      arr = transformed_str[1].split(' ');
      if (arr.length != 10) {
        console.info(`[WARN] VTT2ASS: Can't properly parse text-shadow: ${s.trim()}`);
        break;
      }
      arr = [...new Set(arr)];
      if (arr.length > 1) {
        console.info(`[WARN] VTT2ASS: Can't properly parse text-shadow: ${s.trim()}`);
        break;
      }
      style[16] = arr[0];
      break;
    default:
      console.error(`[WARN] VTT2ASS: Unknown style: ${s.trim()}`);
    }
  }
  return style.join(',');
}

function getPxSize(size_line: string, font_size: number) {
  const m = size_line.trim().match(/([\d.]+)(.*)/);
  if (!m) {
    console.error(`[WARN] VTT2ASS: Unknown size: ${size_line}`);
    return;
  }
  let size = parseFloat(m[1]);
  if (m[2] === 'em') size *= font_size;
  return Math.round(size);
}

function getColor(c: string) {
  if (c[0] !== '#') {
    c = colors[c as keyof typeof colors];
  }
  else if (c.length < 7) {
    c = `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}`;
  }
  const m = c.match(/#(..)(..)(..)/);
  if (!m) return null;
  return `&H00${m[3]}${m[2]}${m[1]}`.toUpperCase();
}

function loadVTT(vttStr: string): Vtt[] {
  const rx = /^([\d:.]*) --> ([\d:.]*)\s?(.*?)\s*$/;
  const lines = vttStr.replace(/\r?\n/g, '\n').split('\n');
  const data = [];
  let record: null|Vtt = null;
  let lineBuf = [];
  for (const l of lines) {
    const m = l.match(rx);
    if (m) {
      let caption = '';
      if (lineBuf.length > 0) {
        caption = lineBuf.pop()!;
      }
      if (caption !== '' && lineBuf.length > 0) {
        lineBuf.pop();
      }
      if (record !== null) {
        record.text = lineBuf.join('\n');
        data.push(record);
      }
      record = {
        caption,
        time: {
          start: m[1],
          end: m[2],
          ext: m[3].split(' ').map(x => x.split(':')).reduce((p, c) => ((p as any)[c[0]] = c[1]) && p, {}),
        }
      };
      lineBuf = [];
      continue;
    }
    lineBuf.push(l);
  }
  if (record !== null) {
    if (lineBuf[lineBuf.length - 1] === '') {
      lineBuf.pop();
    }
    record.text = lineBuf.join('\n');
    data.push(record);
  }
  return data;
}

function convert(css: Css, vtt: Vtt[]) {
  const stylesMap: Record<string, string> = {};
  let ass = [
    '\ufeff[Script Info]',
    'Title: ' + relGroup,
    'ScriptType: v4.00+',
    'WrapStyle: 0',
    'PlayResX: 1280',
    'PlayResY: 720',
    'ScaledBorderAndShadow: yes',
    '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
  ];
  for (const s in css) {
    ass.push(`Style: ${s},${css[s].params}`);
    css[s].list.forEach(x => stylesMap[x] = s);
  }
  ass = ass.concat([
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text'
  ]);
  const events: {
    subtitle: string[],
    caption: string[],
    capt_pos: string[],
    song_cap: string[],
  } = {
    subtitle: [],
    caption: [],
    capt_pos: [],
    song_cap: [],
  };
  const linesMap: Record<string, number> = {};
  for (const l in vtt) {
    const x = convertLine(stylesMap, vtt[l]);
    if (x.ind !== '' && linesMap[x.ind] !== undefined) {
      if (x.subInd > 1) {
        const fx = convertLine(stylesMap, vtt[parseInt(l) - x.subInd + 1]);
        if (x.style != fx.style) {
          x.text = `{\\r${x.style}}${x.text}{\\r}`;
        }
      }
      events[x.type as keyof typeof events][linesMap[x.ind]] += '\\N' + x.text;
    }
    else {
      events[x.type as keyof typeof events].push(x.res);
      if (x.ind !== '') {
        linesMap[x.ind] = events[x.type as keyof typeof events].length - 1;
      }
    }

  }
  if (events.subtitle.length > 0) {
    ass = ass.concat(
      //`Comment: 0,0:00:00.00,0:00:00.00,${defaultStyleName},,0,0,0,,** Subtitles **`,
      events.subtitle
    );
  }
  if (events.caption.length > 0) {
    ass = ass.concat(
      //`Comment: 0,0:00:00.00,0:00:00.00,${defaultStyleName},,0,0,0,,** Captions **`,
      events.caption
    );
  }
  if (events.capt_pos.length > 0) {
    ass = ass.concat(
      //`Comment: 0,0:00:00.00,0:00:00.00,${defaultStyleName},,0,0,0,,** Captions with position **`,
      events.capt_pos
    );
  }
  if (events.song_cap.length > 0) {
    ass = ass.concat(
      //`Comment: 0,0:00:00.00,0:00:00.00,${defaultStyleName},,0,0,0,,** Song captions **`,
      events.song_cap
    );
  }
  return ass.join('\r\n') + '\r\n';
}

function convertLine(css: Record<string, string>, l: Record<any, any>) {
  const start = convertTime(l.time.start);
  const end = convertTime(l.time.end);
  const txt = convertText(l.text);
  let type = txt.style.match(/Caption/i) ? 'caption' : (txt.style.match(/SongCap/i) ? 'song_cap' : 'subtitle');
  type = type == 'caption' && l.time.ext.position !== undefined ? 'capt_pos' : type;
  if (l.time.ext.align === 'left') {
    txt.text = `{\\an7}${txt.text}`;
  }
  let ind = '', subInd = 1;
  const sMinus = 0; // (19.2 * 2);
  if (l.time.ext.position !== undefined) {
    const pos = parseInt(l.time.ext.position);
    const PosX = pos < 0 ? (1280 / 100 * (100 - pos)) : ((1280 - sMinus) / 100 * pos);
    const line = parseInt(l.time.ext.line) || 0;
    const PosY = line < 0 ? (720 / 100 * (100 - line)) : ((720 - sMinus) / 100 * line);
    txt.text = `{\\pos(${parseFloat(PosX.toFixed(3))},${parseFloat(PosY.toFixed(3))})}${txt.text}`;
  }
  else if (l.time.ext.line !== undefined && type == 'caption') {
    const line = parseInt(l.time.ext.line);
    const PosY = line < 0 ? (720 / 100 * (100 - line)) : ((720 - sMinus) / 100 * line);
    txt.text = `{\\pos(640,${parseFloat(PosY.toFixed(3))})}${txt.text}`;
  }
  else {
    const indregx = txt.style.match(/(.*)_(\d+)$/);
    if (indregx !== null) {
      ind = indregx[1];
      subInd = parseInt(indregx[2]);
    }
  }
  const style = css[txt.style as any] || defaultStyleName;
  const res = `Dialogue: 0,${start},${end},${style},,0,0,0,,${txt.text}`;
  return { type, ind, subInd, start, end, style, text: txt.text, res };
}

function convertText(text: string) {
  const m = text.match(/<c\.([^>]*)>([\S\s]*)<\/c>/);
  let style = '';
  if (m) {
    style = m[1];
    text = m[2];
  }
  const xtext = text
    // .replace(/<c[^>]*>[^<]*<\/c>/g, '')
    // .replace(/<ruby[^>]*>[^<]*<\/ruby>/g, '')
    .replace(/ \\N$/g, '\\N')
    .replace(/<[^>]>/g, '')
    .replace(/\\N$/, '')
    .replace(/\r/g, '')
    .replace(/\n/g, '\\N')
    .replace(/\\N +/g, '\\N')
    .replace(/ +\\N/g, '\\N')
    .replace(/(\\N)+/g, '\\N')
    .replace(/<b[^>]*>([^<]*)<\/b>/g, '{\\b1}$1{\\b0}')
    .replace(/<i[^>]*>([^<]*)<\/i>/g, '{\\i1}$1{\\i0}')
    .replace(/<u[^>]*>([^<]*)<\/u>/g, '{\\u1}$1{\\u0}')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/<[^>]>/g, '')
    .replace(/\\N$/, '')
    .replace(/ +$/, '');
  text = xtext;
  return { style, text };
}

function convertTime(tm: string) {
  const m = tm.match(/([\d:]*)\.?(\d*)/);
  if (!m) return '0:00:00.00';
  return toSubTime(m[0]);
}

function toSubTime(str: string) {
  const n = [];
  let sx;
  const x: any[] = str.split(/[:.]/).map(x => Number(x));
  x[3] = '0.' + ('00' + x[3]).slice(-3);
  sx = (x[0] * 60 * 60 + x[1] * 60 + x[2] + Number(x[3]) - tmMrg).toFixed(2);
  sx = sx.toString().split('.');
  n.unshift(sx[1]);
  sx = Number(sx[0]);
  n.unshift(('0' + ((sx % 60).toString())).slice(-2));
  n.unshift(('0' + ((Math.floor(sx / 60) % 60).toString())).slice(-2));
  n.unshift((Math.floor(sx / 3600) % 60).toString());
  return n.slice(0, 3).join(':') + '.' + n[3];
}

function vtt(group: string | undefined, xFontSize: number | undefined, vttStr: string, cssStr: string, timeMargin?: number, replaceFont?: string) {
  relGroup = group ?? '';
  fontSize = xFontSize && xFontSize > 0 ? xFontSize : 34; // 1em to pix
  tmMrg = timeMargin ? timeMargin : 0; //
  rFont = replaceFont ? replaceFont : rFont;
  return convert(
    loadCSS(cssStr),
    loadVTT(vttStr)
  );
}

export { vtt };
