const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Discord operations
  discord: {
    connect: (token) => ipcRenderer.invoke("discord:connect", token),
    openLogin: () => ipcRenderer.invoke("discord:open-login"),
    getDMs: () => ipcRenderer.invoke("discord:get-dms"),
    sendMessage: (chatId, message) =>
      ipcRenderer.invoke("discord:send-message", { chatId, message }),
    sendMessageWithCaptcha: (chatId, message, captchaToken, captchaData) =>
      ipcRenderer.invoke("discord:send-message-with-captcha", {
        chatId,
        message,
        captchaToken,
        captchaData,
      }),

    // Event listeners
    onConnected: (callback) => {
      ipcRenderer.on("discord-connected", (event, data) => callback(data));
    },

    onCaptchaRequired: (callback) => {
      ipcRenderer.on("discord:captcha-required", (event, captchaData) =>
        callback(captchaData)
      );
    },

    removeAllListeners: () => {
      ipcRenderer.removeAllListeners("discord-connected");
      ipcRenderer.removeAllListeners("discord:captcha-required");
    },
  },

  security: {
    getDiscordToken: () => ipcRenderer.invoke("security:get-token")
  },
  // Database operations

    database: {
    getChats: () => ipcRenderer.invoke("db:get-chats"),
    getMessages: (chatId, limit, offset) =>
      ipcRenderer.invoke("db:get-messages", { chatId, limit, offset }),

    // Settings
    getSettings: () => ipcRenderer.invoke("app:get-settings"),
    updateSettings: (settings) =>
      ipcRenderer.invoke("app:update-settings", settings),
  },

  // Sync operations
  sync: {
    manual: () => ipcRenderer.invoke("sync:manual"),
    getStatus: () => ipcRenderer.invoke("sync:get-status"),

    // Event listeners for sync events
    onSyncComplete: (callback) => {
      ipcRenderer.on("sync-complete", (event, data) => callback(data));
    },

    onSyncError: (callback) => {
      ipcRenderer.on("sync-error", (event, error) => callback(error));
    },

    onUpdatesReceived: (callback) => {
      ipcRenderer.on("updates-received", (event, data) => callback(data));
    },

    removeAllListeners: () => {
      ipcRenderer.removeAllListeners("sync-complete");
      ipcRenderer.removeAllListeners("sync-error");
      ipcRenderer.removeAllListeners("updates-received");
    },
  },

  // App utilities
  app: {
    getVersion: () => ipcRenderer.invoke("app:get-version"),
    quit: () => ipcRenderer.invoke("app:quit"),
    minimize: () => ipcRenderer.invoke("app:minimize"),
    maximize: () => ipcRenderer.invoke("app:maximize"),
    unmaximize: () => ipcRenderer.invoke("app:unmaximize"),
    isMaximized: () => ipcRenderer.invoke("app:is-maximized"),
  },

  // Legacy support for existing code
  openDiscordLogin: () => ipcRenderer.invoke("discord:open-login"),
  onDiscordToken: (callback) => {
    ipcRenderer.on("discord-connected", (event, data) => {
      if (data.success) {
        callback("connected");
      }
    });
  },
});
