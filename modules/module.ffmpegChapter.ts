import fs from 'fs';

export function convertChaptersToFFmpegFormat(inputFilePath: string): string {
  const content = fs.readFileSync(inputFilePath, 'utf-8');

  const chapterMatches = Array.from(content.matchAll(/CHAPTER(\d+)=([\d:.]+)/g));
  const nameMatches = Array.from(content.matchAll(/CHAPTER(\d+)NAME=([^\n]+)/g));

  const chapters = chapterMatches.map((m) => ({
    index: parseInt(m[1], 10),
    time: m[2],
  })).sort((a, b) => a.index - b.index);

  const nameDict: Record<number, string> = {};
  nameMatches.forEach((m) => {
    nameDict[parseInt(m[1], 10)] = m[2];
  });

  let ffmpegContent = ';FFMETADATA1\n';
  let startTimeInNs = 0;

  for (let i = 0; i < chapters.length; i++) {
    const chapterStartTime = timeToNanoSeconds(chapters[i].time);
    const chapterEndTime = (i + 1 < chapters.length)
      ? timeToNanoSeconds(chapters[i + 1].time)
      : chapterStartTime + 1000000000;

    const chapterName = nameDict[chapters[i].index] || `Chapter ${chapters[i].index}`;

    ffmpegContent += '[CHAPTER]\n';
    ffmpegContent += 'TIMEBASE=1/1000000000\n';
    ffmpegContent += `START=${startTimeInNs}\n`;
    ffmpegContent += `END=${chapterEndTime}\n`;
    ffmpegContent += `title=${chapterName}\n`;

    startTimeInNs = chapterEndTime;
  }

  return ffmpegContent;
}

export function timeToNanoSeconds(time: string): number {
  const parts = time.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const secondsAndMs = parts[2].split('.');
  const seconds = parseInt(secondsAndMs[0], 10);
  const milliseconds = parseInt(secondsAndMs[1], 10);

  return (hours * 3600 + minutes * 60 + seconds) * 1000000000 + milliseconds * 1000000;
}