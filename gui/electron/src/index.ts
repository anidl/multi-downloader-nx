import { app, BrowserWindow } from 'electron';
import path from 'path/posix';
import json from '../../../package.json';
import registerMessageHandler from './messageHandler';
import fs from 'fs';
import dotenv from 'dotenv';

if (fs.existsSync(path.join(__dirname, '.env')))
  dotenv.config({ path: path.join(__dirname, '.env'), debug: true });

if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = (): void => {
  registerMessageHandler();
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    title: json.name,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js')
    },
  });

  const htmlFile = path.join(__dirname, '..', 'build', 'index.html');

  if (!process.env.USE_BROWSER) {
    mainWindow.loadFile(htmlFile);
  } else {
    mainWindow.loadURL('http://localhost:3000');
  }

  mainWindow.webContents.openDevTools();
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});