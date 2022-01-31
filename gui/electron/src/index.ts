import { app, BrowserWindow } from 'electron';
import path from 'path/posix';
import json from '../../../package.json';
import registerMessageHandler from './messageHandler';
import fs from 'fs';
import dotenv from 'dotenv';
import express from "express";

if (fs.existsSync(path.join(__dirname, '.env')))
  dotenv.config({ path: path.join(__dirname, '.env'), debug: true });

if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = async () => {
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

  
  if (!process.env.USE_BROWSER) {
    const app = express();

    app.use(express.static(path.join('gui', 'electron', 'build')));

    await new Promise((resolve) => {
      app.listen(3000, () => {
        console.log('Express started');
        resolve(undefined);
      });
    })

  }
  
  mainWindow.loadURL('http://localhost:3000');
  mainWindow.webContents.openDevTools();
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', () => {
  process.exit(0);
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});