const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
require('dotenv').config();

console.log('VITE_DEV_SERVER_URL:', process.env.VITE_DEV_SERVER_URL);

let mainWindow;
let discordWindow;

app.commandLine.appendSwitch('allow-file-access-from-files');
app.commandLine.appendSwitch('disable-site-isolation-trials');


function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1052,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false  // disable for testing local resource loading
    }
  });

  if (process.env.VITE_NODE_ENV==="development") {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
      const indexPath = path.join(process.resourcesPath, 'dist', 'index.html');
      mainWindow.loadFile(indexPath);
      // mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    console.log('Main window closed');
    mainWindow = null;
  });

  ipcMain.on('open-discord-login', () => {
    console.log('[Main] open-discord-login requested');
    openDiscordLogin();
  });
}

function openDiscordLogin() {
  if (discordWindow) {
    discordWindow.focus();
    return;
  }

  discordWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'discordPreload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      sandbox: false
    }
  });

  discordWindow.webContents.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36'
  );

  discordWindow.loadURL('https://discord.com/login');

  discordWindow.webContents.openDevTools();

  discordWindow.once('ready-to-show', () => {
    console.log('[DiscordWindow] ready-to-show');
    discordWindow.show();
  });

  const pollTokenScript = `
  (function pollToken() {
    let token = null;
    try {
      window.webpackChunkdiscord_app.push([[Symbol()], {}, o => {
        for (const m of Object.values(o.c)) {
          if (m.exports && m.exports.getToken) {
            token = m.exports.getToken();
            break;
          }
        }
      }]);
      window.webpackChunkdiscord_app.pop();
    } catch(e) {
      console.error('[DiscordWindow] error during token poll', e);
    }

    console.log('[DiscordWindow] Current token:', token);

    if (token) {
      // Send token to preload context via postMessage
      window.postMessage({ type: 'FROM_PAGE', token: token }, '*');
    } else {
      setTimeout(pollToken, 1000);
    }
  })();
`;


  discordWindow.webContents.on('did-navigate', () => {
    console.log('[DiscordWindow] did-navigate event fired, injecting poll script');
    discordWindow.webContents.executeJavaScript(pollTokenScript).catch(console.error);
  });

  discordWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('[DiscordWindow] Fail load:', errorDescription);
  });

  discordWindow.webContents.on('console-message', (event, level, message) => {
    console.log(`[DiscordWindow console] ${message}`);
  });

  discordWindow.on('closed', () => {
    console.log('[DiscordWindow] closed');
    discordWindow = null;
  });
}

// Listen for the token sent by discordPreload.js from Discord window
ipcMain.on('send-discord-token', (event, token) => {
  console.log('[Main] Discord token received:', token);

  if (mainWindow) {
    mainWindow.webContents.send('discord-token', token);
    console.log('[Main] Token sent to mainWindow');
  } else {
    console.warn('[Main] Main window not available to send token');
  }

  if (discordWindow) {
    discordWindow.close();
    discordWindow = null;
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () =>
  process.platform !== 'darwin' && app.quit()
);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
