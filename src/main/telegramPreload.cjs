// telegramPreload.cjs
const { contextBridge, ipcRenderer } = require("electron");

console.log("[telegramPreload] preload loaded");

contextBridge.exposeInMainWorld("electronAPI", {
  sendTelegramAuth: (authData) => {
    console.log("[telegramPreload] Sending Telegram auth to main:", authData);
    ipcRenderer.send("telegram:auth", authData);
  }
});

window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  if (event.data?.type === "FROM_PAGE" && event.data.authData) {
    console.log("[telegramPreload] Received Telegram auth:", event.data.authData);
    ipcRenderer.send("telegram:auth", event.data.authData);
  }
});
