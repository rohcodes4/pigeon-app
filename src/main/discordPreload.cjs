const { contextBridge, ipcRenderer } = require('electron');

console.log('[discordPreload] preload loaded');

contextBridge.exposeInMainWorld('electronAPI', {
  sendDiscordToken: (token) => {
    console.log('[discordPreload] Sending token to main process:', token);
    ipcRenderer.send('send-discord-token', token);
  }
});

// Listen to messages from page context
window.addEventListener('message', (event) => {
  // Only accept messages from current window
  if (event.source !== window) return;

  if (event.data?.type === 'FROM_PAGE' && event.data.token) {
    console.log('[discordPreload] Received token from page context:', event.data.token);
    ipcRenderer.send('send-discord-token', event.data.token);
  }
});
