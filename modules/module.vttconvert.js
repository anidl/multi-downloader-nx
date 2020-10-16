// vtt loader
function loadVtt(vttStr) {
    const rx = /^([\d:.]*) --> ([\d:.]*)\s?(.*?)\s*$/;
    const lines = vttStr.replace(/\r?\n/g, '\n').split('\n');
    let data = [], lineBuf = [], record = null;
    // check  lines
    for (let l of lines) {
        let m = l.match(rx);
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
                ext_param: m[3].split(' ').map(x => x.split(':')).reduce((p, c) => (p[c[0]] = c[1]) && p, {}),
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
function convertToAss(vttStr){
    let ass = [
        '\ufeff[Script Info]',
        'Title: English',
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
        'Style: Main,Noto Sans,55,&H00FFFFFF,&H000000FF,&H00020713,&H00000000,0,0,0,0,100,100,0,0,1,3,0,2,10,10,10,1',
        'Style: MainTop,Noto Sans,55,&H00FFFFFF,&H000000FF,&H00020713,&H00000000,0,0,0,0,100,100,0,0,1,3,0,8,10,10,10,1',
        '',
        '[Events]',
        'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
    ];
    
    let vttData = loadVtt(vttStr);
    for (let l of vttData) {
        l = convertToAssLine(l, 'Main');
        ass = ass.concat(l);
    }
    
    return ass.join('\r\n') + '\r\n';
}

function convertToAssLine(l, style) {
    let start = convertTime(l.time_start);
    let end = convertTime(l.time_end);
    let text = convertToAssText(l.text);
    
    // debugger
    if (l.ext_param.align != 'middle') {
        console.log('[WARN] Detected specific align param, please contact developer');
        cosnole.log(l);
    }
    if (l.ext_param.vertical) {
        console.log('[WARN] Detected specific vertical param, please contact developer');
        cosnole.log(l);
    }
    if (l.ext_param.line && l.ext_param.line != '7%') {
        console.log('[WARN] Detected specific line param, please contact developer');
        cosnole.log(l);
    }
    if (l.ext_param.position) {
        console.log('[WARN] Detected specific position param, please contact developer');
        cosnole.log(l);
    }
    if (l.text.match(/<font/)){
        console.log('[WARN] Detected specific color param, please contact developer');
        cosnole.log(l);
    }
    
    if (l.ext_param.line === '7%') {
        style = 'MainTop';
    }
    
    return  `Dialogue: 0,${start},${end},${style},,0,0,0,,${text}`;
}

function convertToAssText(text) {
    text = text
        .replace(/\r/g, '')
        .replace(/\n/g, '\\N')
        .replace(/\\N +/g, '\\N')
        .replace(/ +\\N/g, '\\N')
        .replace(/(\\N)+/g, '\\N')
        .replace(/<b[^>]*>([^<]*)<\/b>/g, '{\\b1}$1{\\b0}')
        .replace(/<i[^>]*>([^<]*)<\/i>/g, '{\\i1}$1{\\i0}')
        .replace(/<u[^>]*>([^<]*)<\/u>/g, '{\\u1}$1{\\u0}')
        // .replace(/<c[^>]*>[^<]*<\/c>/g, '')
        // .replace(/<ruby[^>]*>[^<]*<\/ruby>/g, '')
        .replace(/<[^>]>/g, '')
        .replace(/\\N$/, '')
        .replace(/ +$/, '');
    return text;
}

// srt specific
function convertToSrt(vttStr){
    let srt = [], srtLineIdx = 0;
    
    let vttData = loadVtt(vttStr);
    for (let l of vttData) {
        srtLineIdx++;
        l = convertToSrtLine(l, srtLineIdx);
        srt = srt.concat(l);
    }
    
    return srt.join('\r\n') + '\r\n';
}

function convertToSrtLine(l, idx) {
    let bom = idx == 1 ? '\ufeff' : '';
    let start = convertTime(l.time_start, true);
    let end = convertTime(l.time_end, true);
    let text = l.text;
    return `${bom}${idx}\r\n${start} --> ${end}\r\n${text}\r\n`;
}

// time parser
function convertTime(time, srtFormat) {
    let mTime = time.match(/([\d:]*)\.?(\d*)/);
    if (!mTime){
        return srtFormat ? '00:00:00,000' : '0:00:00.00';
    }
    return toSubsTime(mTime[0], srtFormat);
}

function toSubsTime(str, srtFormat) {
    
    let n = [], x, sx;
    x = str.split(/[:.]/).map(x => Number(x));
    
    let msLen = srtFormat ? 3 : 2;
    let hLen = srtFormat ? 2 : 1;
    
    x[3] = '0.' + ('' + x[3]).padStart(3, '0');
    sx = x[0]*60*60 + x[1]*60 + x[2] + Number(x[3])
    sx = sx.toFixed(msLen).split('.');
    
    
    n.unshift(padTimeNum('.', sx[1], msLen));
    sx = Number(sx[0]);
    
    n.unshift(padTimeNum(':', sx%60, 2));
    n.unshift(padTimeNum(':', Math.floor(sx/60)%60, 2));
    n.unshift(padTimeNum('',  Math.floor(sx/3600)%60, hLen));
    
    return n.join('');
}

function padTimeNum(sep, input, pad){
    return sep + ('' + input).padStart(pad, '0');
}

// export module
module.exports = (vttStr, toSrt) => {
    const convert = toSrt ? convertToSrt : convertToAss;
    return convert(vttStr);
};
