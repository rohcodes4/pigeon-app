const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openDiscordLogin: () => {
    console.log('[MainWindow preload] Requesting open-discord-login');
    ipcRenderer.send('open-discord-login');
  },
  onDiscordToken: (callback) => {
    ipcRenderer.on('discord-token', (event, token) => {
      console.log('[MainWindow preload] Received discord-token:', token);
      callback(token);
    });
  }
});
