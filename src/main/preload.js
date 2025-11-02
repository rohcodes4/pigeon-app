const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  discord: {
    connect: (token) => ipcRenderer.invoke("discord:connect", token),
    getUserId: () => ipcRenderer.invoke("discord:getUserId"),
    disconnect: () => ipcRenderer.invoke("discord:disconnect"),
    isConnected: () => ipcRenderer.invoke("discord:isConnected"),
    getState: () => ipcRenderer.invoke("discord:getState"),
    openLogin: () => ipcRenderer.invoke("discord:open-login"),
    getDMs: () => ipcRenderer.invoke("discord:get-dms"),
    getGuilds: () => ipcRenderer.invoke("discord:get-guilds"),
    getMessages: (chatId, limit, offset) =>
      ipcRenderer.invoke("discord:get-messages", chatId, limit, offset),
    getChatHistory: (chatId, limit, beforeMessageId) =>
      ipcRenderer.invoke("discord:get-chat-history", {
        chatId,
        limit,
        beforeMessageId,
      }),
    sendMessage: (
      chatId,
      message,
      attachments,
      sticker_ids,
      message_reference
    ) =>
      ipcRenderer.invoke("discord:send-message", {
        chatId,
        message,
        attachments,
        sticker_ids,
        message_reference,
      }),
    deleteMessage: (chatId, messageId) =>
      ipcRenderer.invoke("discord:delete-message", { chatId, messageId }),
    editMessage: (chatId, messageId, newContent) =>
      ipcRenderer.invoke("discord:edit-message", {
        chatId,
        messageId,
        newContent,
      }),
    getStickerById: (stickerId) =>
      ipcRenderer.invoke("discord:get-sticker-by-id", { stickerId }),
    getStickers: (locale) => ipcRenderer.invoke("discord:get-stickers", locale),
    // New method to handle captcha when sending messages
    sendMessageWithCaptcha: (chatId, message, captchaToken, captchaData) =>
      ipcRenderer.invoke("discord:send-message-with-captcha", {
        chatId,
        message,
        captchaToken,
        captchaData,
      }),
    addReaction: (chatId, messageId, emoji) =>
      ipcRenderer.invoke("discord:add-reaction", { chatId, messageId, emoji }),
    removeReaction: (chatId, messageId, emoji) =>
      ipcRenderer.invoke("discord:remove-reaction", {
        chatId,
        messageId,
        emoji,
      }),
    attachments: (chatId, files) =>
      ipcRenderer.invoke("discord:attachments", { chatId, files }),

    // FIXED EVENT LISTENERS - pass only data, not the event object
    onConnected: (callback) => {
      const handler = (_event, data) => callback(data); // Fixed: extract data from event
      ipcRenderer.on("discord:connected", handler);
      return () => ipcRenderer.removeListener("discord:connected", handler);
    },

    onDisconnected: (callback) => {
      const handler = (_event, data) => callback(data);
      ipcRenderer.on("discord:disconnected", handler);
      return () => ipcRenderer.removeListener("discord:disconnected", handler);
    },

    onReady: (callback) => {
      const handler = (_event, state) => callback(state);
      ipcRenderer.on("discord:ready", handler);
      return () => ipcRenderer.removeListener("discord:ready", handler);
    },

    onNewMessage: (callback) => {
      const handler = (_event, data) => callback(data); // Fixed
      ipcRenderer.on("discord:newMessage", handler);
      return () => ipcRenderer.removeListener("discord:newMessage", handler);
    },

    onMessageUpdate: (callback) => {
      const handler = (_event, data) => callback(data);
      ipcRenderer.on("discord:messageUpdate", handler);
      return () => ipcRenderer.removeListener("discord:messageUpdate", handler);
    },

    onMessageDelete: (callback) => {
      const handler = (_event, data) => callback(data);
      ipcRenderer.on("discord:messageDelete", handler);
      return () => ipcRenderer.removeListener("discord:messageDelete", handler);
    },

    onChannelUpdate: (callback) => {
      const handler = (_event, channel) => callback(channel);
      ipcRenderer.on("discord:channelUpdate", handler);
      return () => ipcRenderer.removeListener("discord:channelUpdate", handler);
    },

    onChannelsUpdate: (callback) => {
      const handler = (_event, state) => callback(state);
      ipcRenderer.on("discord:channelsUpdate", handler);
      return () =>
        ipcRenderer.removeListener("discord:channelsUpdate", handler);
    },

    onGuildUpdate: (callback) => {
      const handler = (_event, state) => callback(state);
      ipcRenderer.on("discord:guildUpdate", handler);
      return () => ipcRenderer.removeListener("discord:guildUpdate", handler);
    },

    onError: (callback) => {
      const handler = (_event, error) => callback(error);
      ipcRenderer.on("discord:error", handler);
      return () => ipcRenderer.removeListener("discord:error", handler);
    },

    onCaptchaRequired: (callback) => {
      const handler = (_event, captchaData) => callback(captchaData);
      ipcRenderer.on("discord:captchaRequired", handler);
      return () =>
        ipcRenderer.removeListener("discord:captchaRequired", handler);
    },

    onFatalError: (callback) => {
      const handler = (_event, data) => callback(data);
      ipcRenderer.on("discord:fatalError", handler);
      return () => ipcRenderer.removeListener("discord:fatalError", handler);
    },
  },
  telegram: {
    loginPhone: (phone) => ipcRenderer.invoke("telegram:login-phone", phone),
    loginQR: () => ipcRenderer.invoke("telegram:login-qr"),
    sendMessage: (chatId, message) =>
      ipcRenderer.invoke("telegram:send-message", { chatId, message }),
    getDialogs: () => ipcRenderer.invoke("telegram:get-dialogs"),
    verifyCode: (code) => ipcRenderer.send("telegram:verify-code", code),
    sendPassword: (password) =>
      ipcRenderer.send("telegram:2fa-submit", password),
    onQR: (callback) =>
      ipcRenderer.on("telegram:qr-generated", (_, qrImage) =>
        callback(qrImage)
      ),
    onCodeSent: (callback) =>
      ipcRenderer.on("telegram:code-sent", (_, data) => callback(data)),
    onPasswordRequired: (callback) =>
      ipcRenderer.on("telegram:password-required", callback),
    onConnected: (callback) =>
      ipcRenderer.on("telegram:connected", (_, user) => callback(user)),
    onNewMessage: (callback) =>
      ipcRenderer.on("telegram:newMessage", (_, msg) => callback(msg)),
    onLoginError: (callback) =>
      ipcRenderer.on("telegram:login-error", (_, error) => callback(error)),
    onPasswordInvalid: (callback) =>
      ipcRenderer.on("telegram:password-invalid", callback),
    onQRExpired: (callback) => ipcRenderer.on("telegram:qr-expired", callback),
    onLoginSuccess: (callback) =>
      ipcRenderer.on("telegram:login-success", (_, user) => callback(user)),
    connectExisting: () => ipcRenderer.invoke("telegram:connect-existing"),
  },
  security: {
    getDiscordToken: () => ipcRenderer.invoke("security:get-token"),
    clearDiscordToken: () => ipcRenderer.invoke("security:set-token", null),
  },

  database: {
    getChats: () => ipcRenderer.invoke("db:get-chats"),
    getMessages: (chatId, limit, offset) =>
      ipcRenderer.invoke("db:get-messages", { chatId, limit, offset }),
    getMessagesForSummary: (chatId, timeRange) =>
      ipcRenderer.invoke("db:get-messages-for-summary", { chatId, timeRange }),
    getSettings: () => ipcRenderer.invoke("app:get-settings"),
    updateSettings: (settings) =>
      ipcRenderer.invoke("app:update-settings", settings),
  },
  sync: {
    manual: () => ipcRenderer.invoke("sync:manual"),
    getStatus: () => ipcRenderer.invoke("sync:get-status"),

    onSyncComplete: (callback) => {
      const handler = (_event, data) => callback(data);
      ipcRenderer.on("sync-complete", handler);
      return () => ipcRenderer.removeListener("sync-complete", handler);
    },

    onSyncError: (callback) => {
      const handler = (_event, error) => callback(error);
      ipcRenderer.on("sync-error", handler);
      return () => ipcRenderer.removeListener("sync-error", handler);
    },

    onUpdatesReceived: (callback) => {
      const handler = (_event, data) => callback(data);
      ipcRenderer.on("updates-received", handler);
      return () => ipcRenderer.removeListener("updates-received", handler);
    },
  },

  app: {
    getVersion: () => ipcRenderer.invoke("app:get-version"),
    quit: () => ipcRenderer.invoke("app:quit"),
    minimize: () => ipcRenderer.invoke("app:minimize"),
    maximize: () => ipcRenderer.invoke("app:maximize"),
    isMaximized: () => ipcRenderer.invoke("app:is-maximized"),
  },

  // Legacy support
  openDiscordLogin: () => ipcRenderer.invoke("discord:open-login"),
  onDiscordToken: (callback) => {
    const handler = (_event, data) => {
      if (data.success) callback("connected");
    };
    ipcRenderer.on("discord-connected", handler);
    return () => ipcRenderer.removeListener("discord-connected", handler);
  },
});
