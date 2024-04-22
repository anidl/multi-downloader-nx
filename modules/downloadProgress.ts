import path from 'path';
import type { HLSCallback } from './hls-download';
import { console } from './log';
import cliProgress, { SingleBar } from 'cli-progress';
import shlp from 'sei-helper';
import HLSEvents from './hlsEventEmitter';
import { levels } from 'log4js';

export default function buildCLIHandler() {
  const mb = new cliProgress.MultiBar({
    clearOnComplete: true,
    stream: process.stdout,
    format: '{filename} [{bar}] {percentage}% | {speed} | {value}/{total} | {time}',
    hideCursor: true
  });
  const bars: Record<string, {
    bar: SingleBar,
    textPos: number,
    filename: string
  }> = {};

  HLSEvents.on('end', ({ identifier }) => {
    bars[identifier]?.bar.stop();
    delete bars[identifier];
  });
  HLSEvents.on('message', ({ identifier, severity, msg }) => {
    if (severity.isGreaterThanOrEqualTo(levels.WARN))
      console.log(severity, `${identifier.split(path.sep).pop() || ''}: ${msg}`);
    mb.remove(bars[identifier]?.bar);
  });
  HLSEvents.on('progress', ({ identifier, total, cur, downloadSpeed, time }) => {
    const filename = identifier.split(path.sep).pop() || '';
    if (!Object.prototype.hasOwnProperty.call(bars, identifier)) {
      bars[identifier] = {
        bar: mb.create(total, cur, {
          filename: filename.slice(0, 30),
          speed: `${(downloadSpeed / 1000000).toPrecision(2)}Mb/s`,
          time: `${shlp.formatTime(parseInt((time / 1000).toFixed(0)))}`
        }),
        textPos: 0,
        filename
      };
    }
    bars[identifier].bar.update(cur, {
      speed: `${(downloadSpeed / 1000000).toPrecision(2)}Mb/s`,
      time: `${shlp.formatTime(parseInt((time / 1000).toFixed(0)))}`,
    });
  });

  setInterval(() => {
    for (const item of Object.values(bars)) {
      if (item.filename.length < 30)
        continue;
      if (item.textPos === item.filename.length)
        item.textPos = 0;
      item.bar.update({
        filename: `${item.filename} ${item.filename}`.slice(item.textPos, item.textPos + 30)
      });
      item.textPos += 1;
    }
  }, 100);
}

