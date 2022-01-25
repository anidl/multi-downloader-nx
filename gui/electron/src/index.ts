import { app, BrowserWindow } from 'electron';
import json from '../../../package.json';
import registerMessageHandler from './messageHandler';

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
      preload: 'preload.js'
    },
  });

  mainWindow.loadURL('http://localhost:3000');

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