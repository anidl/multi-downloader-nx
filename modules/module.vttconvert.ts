// vtt loader
export type Record = {
  text?: string,
  time_start?: string,
  time_end?: string,
  ext_param?: unknown
};
export type NullRecord = Record | null;

function loadVtt(vttStr: string) {
  const rx = /^([\d:.]*) --> ([\d:.]*)\s?(.*?)\s*$/;
  const lines = vttStr.replace(/\r?\n/g, '\n').split('\n');
  const data: Record[] = []; let lineBuf: string[] = [], record: NullRecord = null;
  // check  lines
  for (const l of lines) {
    const m = l.match(rx);
    if (m) {
      if (lineBuf.length > 0) {
        lineBuf.pop();
      }
      if (record !== null) {
        record.text = lineBuf.join('\n');
        data.push(record);
      }
      record = {
        time_start: m[1],
        time_end: m[2],
        ext_param: m[3].split(' ').map(x => x.split(':')).reduce((p: any, c: any) => (p[c[0]] = c[1]) && p, {}),
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

// ass specific
function convertToAss(vttStr: string, lang: string, fontSize: number, fontName?: string){
  let ass = [
    '\ufeff[Script Info]',
    `Title: ${lang}`,
    'ScriptType: v4.00+',
    'PlayResX: 1280',
    'PlayResY: 720',
    'WrapStyle: 0',
    'ScaledBorderAndShadow: yes',
    '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, '
            + 'Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, '
            + 'BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    `Style: Main,${fontName || 'Noto Sans'},${fontSize},&H00FFFFFF,&H000000FF,&H00020713,&H00000000,0,0,0,0,100,100,0,0,1,3,0,2,10,10,10,1`,
    `Style: MainTop,${fontName || 'Noto Sans'},${fontSize},&H00FFFFFF,&H000000FF,&H00020713,&H00000000,0,0,0,0,100,100,0,0,1,3,0,8,10,10,10,1`,
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
  ];
    
  const vttData = loadVtt(vttStr);
  for (const l of vttData) {
    const line = convertToAssLine(l, 'Main');
    ass = ass.concat(line);
  }
    
  return ass.join('\r\n') + '\r\n';
}

function convertToAssLine(l: Record, style: string) {
  const start = convertTime(l.time_start as string);
  const end = convertTime(l.time_end as string);
  const text = convertToAssText(l.text as string);
    
  // debugger 
  if ((l.ext_param as any).line === '7%') {
    style = 'MainTop';
  }
      
  if ((l.ext_param as any).line === '10%') {
    style = 'MainTop';
  }
    
  return  `Dialogue: 0,${start},${end},${style},,0,0,0,,${text}`;
}

function convertToAssText(text: string) {
  text = text
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
  return text;
}

// srt specific
function convertToSrt(vttStr: string){
  let srt: string[] = [], srtLineIdx = 0;
    
  const vttData = loadVtt(vttStr);
  for (const l of vttData) {
    srtLineIdx++;
    const line = convertToSrtLine(l, srtLineIdx);
    srt = srt.concat(line);
  }
    
  return srt.join('\r\n') + '\r\n';
}

function convertToSrtLine(l: Record, idx: number) : string {
  const bom = idx == 1 ? '\ufeff' : '';
  const start = convertTime(l.time_start as string, true);
  const end = convertTime(l.time_end as string, true);
  const text = l.text;
  return `${bom}${idx}\r\n${start} --> ${end}\r\n${text}\r\n`;
}

// time parser
function convertTime(time: string, srtFormat = false) {
  const mTime = time.match(/([\d:]*)\.?(\d*)/);
  if (!mTime){
    return srtFormat ? '00:00:00,000' : '0:00:00.00';
  }
  return toSubsTime(mTime[0], srtFormat);
}

function toSubsTime(str: string, srtFormat: boolean) : string {
    
  const n: string[] = [], x: (string|number)[] = str.split(/[:.]/).map(x => Number(x)); let sx;
    
  const msLen = srtFormat ? 3 : 2;
  const hLen = srtFormat ? 2 : 1;
    
  x[3] = '0.' + ('' + x[3]).padStart(3, '0');
  sx = (x[0] as number)*60*60 + (x[1] as number)*60 + (x[2] as number) + Number(x[3]);
  sx = sx.toFixed(msLen).split('.');
    
    
  n.unshift(padTimeNum((srtFormat ? ',' : '.'), sx[1], msLen));
  sx = Number(sx[0]);
    
  n.unshift(padTimeNum(':', sx%60, 2));
  n.unshift(padTimeNum(':', Math.floor(sx/60)%60, 2));
  n.unshift(padTimeNum('',  Math.floor(sx/3600)%60, hLen));
    
  return n.join('');
}

function padTimeNum(sep: string, input: string|number , pad:number){
  return sep + ('' + input).padStart(pad, '0');
}

// export module
const _default = (vttStr: string, toSrt: boolean, lang = 'English', fontSize: number, fontName?: string) => {
  const convert = toSrt ? convertToSrt : convertToAss;
  return convert(vttStr, lang, fontSize, fontName);  
};
export default _default;
