import { Menu, MenuItem, MenuItemConstructorOptions, shell } from 'electron';
import path from 'path';
import { getDataDirectory } from '.';
import json from '../../../package.json';

const template: (MenuItemConstructorOptions | MenuItem)[] = [
  {
    label: 'Edit',
    submenu: [
      {
        role: 'undo'
      },
      {
        role: 'redo'
      },
      {
        type: 'separator'
      },
      {
        role: 'cut'
      },
      {
        role: 'copy'
      },
      {
        role: 'paste'
      }
    ]
  },
  {
    label: 'Debug',
    submenu: [
      {
        role: 'toggleDevTools'
      },
      {
        label: 'Open log folder',
        click: () => {
          shell.openPath(path.join(getDataDirectory(), 'logs'));
        }
      },
      {
        role: 'forceReload'
      }
    ]
  },
  {
    label: 'Settings',
    submenu: [
      {
        label: 'Open settings folder',
        click: () => {
          shell.openPath(path.join(getDataDirectory(), 'config'));
        }
      },
      {
        label: 'Open settings file...',
        submenu: [
          {
            label: 'FFmpeg/Mkvmerge path',
            click: () => {
              shell.openPath(path.join(getDataDirectory(), 'config', 'bin-path.yml'));
            }
          },
          {
            label: 'Advanced options',
            sublabel: 'See the documention for the options you may enter here',
            click: () => {
              shell.openPath(path.join(getDataDirectory(), 'config', 'cli-defaults.yml'));
            }
          },
          {
            label: 'Output path',
            click: () => {
              shell.openPath(path.join(getDataDirectory(), 'config', 'dir-path.yml'));
            }
          }
        ]
      }
    ]
  },
  {
    label: 'Help',
    submenu: [
      {
        label: 'Version',
        sublabel: json.version
      },
      {
        label: 'GitHub',
        click: () => {
          shell.openExternal('https://github.com/anidl/multi-downloader-nx');
        }
      },
      {
        label: 'Report a Bug',
        click: () => {
          shell.openExternal(`https://github.com/anidl/multi-downloader-nx/issues/new?assignees=AnimeDL,AnidlSupport&labels=bug&template=bug.yml&title=BUG&version=${json.version}`);
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Contributors',
        click: () => {
          shell.openExternal('https://github.com/anidl/multi-downloader-nx/graphs/contributors');
        }
      },
      {
        label: 'Discord',
        click: () => {
          shell.openExternal('https://discord.gg/qEpbWen5vq');
        }
      }
    ]
  }
];

Menu.setApplicationMenu(Menu.buildFromTemplate(template));