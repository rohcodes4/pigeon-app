const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
require("dotenv").config();

const DatabaseManager = require("./database/DatabaseManager.cjs");
const DiscordClient = require("./services/DiscordClient.cjs");
const SecurityManager = require("./security/SecurityManager.cjs");
const SyncManager = require("./sync/SyncManager.cjs");

let mainWindow;
let discordWindow;
let dbManager;
let discordClient;
let securityManager;
let syncManager;

// Store all renderer windows for broadcasting
const rendererWindows = new Set();

// Broadcast to all renderer windows
function broadcastToRenderers(channel, data) {
  rendererWindows.forEach(window => {
    if (!window.isDestroyed()) {
      window.webContents.send(channel, data);
    }
  });
}

async function initializeApp() {
  try {
    securityManager = new SecurityManager();
    await securityManager.initialize();

    dbManager = new DatabaseManager(securityManager);
    await dbManager.initialize();

    discordClient = new DiscordClient(dbManager, securityManager);

    // Setup Discord event listeners for broadcasting
    setupDiscordEventForwarding();

    syncManager = new SyncManager(dbManager, securityManager);

    console.log("[App] All services initialized");
  } catch (error) {
    console.error("[App] Failed to initialize:", error);
  }
}

function setupDiscordEventForwarding() {
  // Forward all Discord events to renderer processes
  discordClient.on('connected', (state) => {
    console.log('[App] Discord connected');
    broadcastToRenderers('discord:connected', state);
  });

  discordClient.on('disconnected', (data) => {
    console.log('[App] Discord disconnected');
    broadcastToRenderers('discord:disconnected', data);
  });

  discordClient.on('ready', (state) => {
    console.log('[App] Discord ready');
    broadcastToRenderers('discord:ready', state);
  });

  discordClient.on('newMessage', (data) => {
    // Broadcast new message to all windows
    broadcastToRenderers('discord:newMessage', data);
  });

  discordClient.on('messageUpdate', (data) => {
    broadcastToRenderers('discord:messageUpdate', data);
  });

  discordClient.on('messageDelete', (data) => {
    broadcastToRenderers('discord:messageDelete', data);
  });

  discordClient.on('channelUpdate', (channel) => {
    broadcastToRenderers('discord:channelUpdate', channel);
  });

  discordClient.on('channelsUpdate', (state) => {
    broadcastToRenderers('discord:channelsUpdate', state);
  });

  discordClient.on('guildUpdate', (state) => {
    broadcastToRenderers('discord:guildUpdate', state);
  });

  discordClient.on('error', (error) => {
    broadcastToRenderers('discord:error', {
      message: error.message,
      stack: error.stack
    });
  });

  discordClient.on('captchaRequired', (data) => {
    console.log('[App] CAPTCHA required');
    broadcastToRenderers('discord:captchaRequired', data);
  });

  discordClient.on('fatalError', (data) => {
    broadcastToRenderers('discord:fatalError', data);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1052,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    }
  });

  // Register window for event broadcasting
  rendererWindows.add(mainWindow);

  if (process.env.VITE_NODE_ENV === "development" && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, '..', '..', 'dist', 'index.html');
    mainWindow.loadFile(indexPath);
  }

  mainWindow.on("closed", () => {
    rendererWindows.delete(mainWindow);
    mainWindow = null;
  });

  setupIPCHandlers();
}

function setupIPCHandlers() {
  // Discord authentication
  ipcMain.handle("discord:open-login", async () => {
    try {
      const data = await openDiscordLogin();
      return data;
    } catch (error) {
      console.error("[IPC] Discord login error:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("discord:connect", async (event, token) => {
    try {
      console.log("[IPC] Connecting to Discord..." , token.slice(0, 8) + "...");
      await discordClient.connect(token);
      return { success: true };
    } catch (error) {
      console.error("[IPC] Discord connect error:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("discord:disconnect", async () => {
    try {
      discordClient.disconnect();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("discord:isConnected", async () => {
    return { success: true, data: discordClient.isConnected() };
  });

  ipcMain.handle("discord:getState", async () => {
    return { success: true, data: discordClient.getState() };
  });

  // Get Discord DMs
  ipcMain.handle("discord:get-dms", async () => {
    try {
      const dms = await discordClient.getDMs();
      return { success: true, data: dms };
    } catch (error) {
      console.error("[IPC] Get DMs error:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("discord:get-guilds", async () => {
    try {
      const guilds = await discordClient.getGuilds();
      return { success: true, data: guilds };
    } catch (error) {
      console.error("[IPC] Get Guilds error:", error);
      return { success: false, error: error.message };
    }
  });

  // Messages - from local DB (fast)
  ipcMain.handle("discord:get-messages", async (event, chatId, limit, offset) => {
    try {
      const messages = await discordClient.getMessages(chatId, limit, offset);
      return { success: true, data: messages };
    } catch (error) {
      console.error("[IPC] Get messages error:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("discord:get-stickers", async (event, locale) => {
    try {
      if (!discordClient.isConnected()) {
        return { success: false, error: "Discord not connected" };
      }
      const stickers = await discordClient.getStickerPacks(locale);
      return { success: true, data: stickers };
    } catch (error) {
      console.error("[IPC] Get stickers error:", error);
      return { success: false, error: error.message };
    } 
  });

  ipcMain.handle("discord:get-sticker-by-id", async (event, {stickerId}) => {
    try {
      if (!discordClient.isConnected()) {
        return { success: false, error: "Discord not connected" };
      }
      const sticker = await discordClient.getStickerById(stickerId);
      return { success: true, data: sticker };
    } catch (error) {
      console.error("[IPC] Get stickers by id error:", error);
      return { success: false, error: error.message };
    } 
  });

  ipcMain.handle("discord:delete-message", async (event, { chatId, messageId }) => {
    try {
      if (!discordClient.isConnected()) {
        return { success: false, error: "Discord not connected" };
      }
      const result = await discordClient.deleteMessage(chatId, messageId);
      return { success: true, data: result };
    } catch (error) {
      console.error("[IPC] Delete message error:", error);
      return { success: false, error: error.message };
    }
  });
  ipcMain.handle("discord:edit-message", async (event, { chatId, messageId, newContent }) => {
    try {
      if (!discordClient.isConnected()) { 
        return { success: false, error: "Discord not connected" };
      } 

      const result = await discordClient.editMessage(chatId, messageId, newContent);
      return { success: true, data: result };
    } catch (error) {
      console.error("[IPC] Edit message error:", error);
      return { success: false, error: error.message };
    } 
  });
  // Chat history - from Discord API (for loading older messages)
  ipcMain.handle("discord:get-chat-history", async (event, { chatId, limit = 50, beforeMessageId }) => {
    try {
      if (!discordClient.isConnected()) {
        return { success: false, error: "Discord not connected" };
      }
      const chatHistory = await discordClient.getChatHistory(chatId, limit, beforeMessageId);
      
      // Store fetched messages in DB for caching
      if (chatHistory && Array.isArray(chatHistory)) {
        for (const msg of chatHistory) {
          if (msg.author) {
            dbManager.createUser({
              id: msg.author.id,
              platform: "discord",
              username: msg.author.username,
              display_name: msg.author.global_name || msg.author.username,
              avatar_url: msg.author.avatar
                ? `https://cdn.discordapp.com/avatars/${msg.author.id}/${msg.author.avatar}.png`
                : null
            });
          }
          
          dbManager.createMessage({
            id: msg.id,
            chat_id: msg.channel_id,
            user_id: msg.author.id,
            content: msg.content,
            message_type: discordClient.getMessageType(msg),
            attachments: msg.attachments,
            reactions: msg.reactions,
            embeds: msg.embeds,
            timestamp: msg.timestamp,
            sync_status: "synced",
            mentions: msg.mentions,
            message_reference: msg.message_reference || null,
            referenced_message: msg.referenced_message || null,
            sticker_items: msg.sticker_items
          });
        }
      }
      
      return { success: true, data: chatHistory };
    } catch (error) {
      console.error("[IPC] Get chat history error:", error);
      return { success: false, error: error.message };
    }
  });

  // Send message
  ipcMain.handle("discord:send-message", async (event, { chatId, message, attachments , sticker_ids,message_reference}) => {
    try {
      if (!discordClient.isConnected()) {
        return { success: false, error: "Discord not connected" };
      }
      const result = await discordClient.sendMessage(chatId, message, attachments,sticker_ids,message_reference);
      return { success: true, data: result };
    } catch (error) {
      console.error("[IPC] Send message error:", error);
      if (error.captchaRequired) {
        return {
          success: false,
          error: error.message,
          captchaRequired: true,
          captchaData: error.captchaData
        };
      }
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("discord:send-message-with-captcha", async (event, { chatId, message, captchaToken, captchaData }) => {
    try {
      if (!discordClient.isConnected()) {
        return { success: false, error: "Discord not connected" };
      }
      const result = await discordClient.sendMessageWithCaptcha(chatId, message, captchaToken, captchaData);
      return { success: true, data: result };
    } catch (error) {
      console.error("[IPC] Send message with CAPTCHA error:", error);
      return { success: false, error: error.message };
    }
  });

  // Reactions
  ipcMain.handle("discord:add-reaction", async (event, { chatId, messageId, emoji }) => {
    try {
      if (!discordClient.isConnected()) {
        return { success: false, error: "Discord not connected" };
      }
      const result = await discordClient.addReaction(chatId, messageId, emoji);
      return { success: true, data: result };
    } catch (error) {
      console.error("[IPC] Add reaction error:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("discord:remove-reaction", async (event, { chatId, messageId, emoji }) => {
    try {
      if (!discordClient.isConnected()) {
        return { success: false, error: "Discord not connected" };
      }
      const result = await discordClient.removeReaction(chatId, messageId, emoji);
      return { success: true, data: result };
    } catch (error) {
      console.error("[IPC] Remove reaction error:", error);
      return { success: false, error: error.message };
    }
  });

  // Attachments
  ipcMain.handle("discord:attachments", async (event, { chatId, files }) => {
    try {
      if (!discordClient.isConnected()) {
        return { success: false, error: "Discord not connected" };
      }
      const result = await discordClient.attachments(chatId, files);
      return { success: true, data: result };
    } catch (error) {
      console.error("[IPC] Send attachments error:", error);
      if (error.captchaRequired) {
        return {
          success: false,
          error: error.message,
          captchaRequired: true,
          captchaData: error.captchaData
        };
      }
      return { success: false, error: error.message };
    }
  });

  // Database operations
  ipcMain.handle("db:get-chats", async () => {
    try {
      const chats = await dbManager.getChats();
      return { success: true, data: chats };
    } catch (error) {
      console.error("[IPC] Get chats error:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("db:get-messages", async (event, { chatId, limit = 50, offset = 0 }) => {
    try {
      const messages = await dbManager.getMessages(chatId, limit, offset);
      return { success: true, data: messages };
    } catch (error) {
      console.error("[IPC] Get messages error:", error);
      return { success: false, error: error.message };
    }
  });

  // Security
  ipcMain.handle("security:get-token", async () => {
    try {
      const token = await securityManager.getDiscordToken();
      return { success: true, data: token };
    } catch (error) {
      console.error("[IPC] Get token error:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("security:set-token", async (event, token) => {
    try {
      const data = await securityManager.clearDiscordToken(token);
      return { success: true, data: data };
    } catch (error) {
      console.error("[IPC] Set token error:", error);
      return { success: false, error: error.message };
    }
  });

  // Sync operations
  ipcMain.handle("sync:manual", async () => {
    try {
      await syncManager.performSync();
      return { success: true };
    } catch (error) {
      console.error("[IPC] Manual sync error:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("sync:get-status", async () => {
    try {
      const status = await syncManager.getSyncStatus();
      return { success: true, data: status };
    } catch (error) {
      console.error("[IPC] Get sync status error:", error);
      return { success: false, error: error.message };
    }
  });

  // App settings
  ipcMain.handle("app:get-settings", async () => {
    try {
      const settings = await dbManager.getSettings();
      return { success: true, data: settings };
    } catch (error) {
      console.error("[IPC] Get settings error:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("app:update-settings", async (event, settings) => {
    try {
      await dbManager.updateSettings(settings);
      return { success: true };
    } catch (error) {
      console.error("[IPC] Update settings error:", error);
      return { success: false, error: error.message };
    }
  });

  // App utilities
  ipcMain.handle("app:get-version", async () => {
    return { success: true, data: app.getVersion() };
  });

  ipcMain.handle("app:quit", async () => {
    app.quit();
    return { success: true };
  });

  ipcMain.handle("app:minimize", async () => {
    if (mainWindow) mainWindow.minimize();
    return { success: true };
  });

  ipcMain.handle("app:maximize", async () => {
    if (mainWindow) {
      mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
    }
    return { success: true };
  });

  ipcMain.handle("app:is-maximized", async () => {
    return { success: true, data: mainWindow ? mainWindow.isMaximized() : false };
  });
}

async function openDiscordLogin() {
  return new Promise((resolve, reject) => {
    if (discordWindow) {
      discordWindow.focus();
      return;
    }

    discordWindow = new BrowserWindow({
      width: 800,
      height: 600,
      show: false,
      webPreferences: {
        preload: path.join(__dirname, "discordPreload.cjs"),
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: true,
        sandbox: false
      }
    });

    const getRealisticUserAgent = () => {
      const chromeVersion = "120.0.0.0";
      switch (process.platform) {
        case "darwin":
          return `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
        case "linux":
          return `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
        default:
          return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
      }
    };

    discordWindow.webContents.setUserAgent(getRealisticUserAgent());
    discordWindow.loadURL("https://discord.com/login");

    if (process.env.VITE_NODE_ENV === "development") {
      discordWindow.webContents.openDevTools();
    }

    discordWindow.once("ready-to-show", () => {
      discordWindow.show();
    });

    ipcMain.once("send-discord-token", (event, token) => {
      console.log("[DiscordWindow] Got token");
      resolve({ success: true, data: token });

      if (discordWindow) {
        discordWindow.close();
        discordWindow = null;
      }
    });

    const pollTokenScript = `
    (function pollToken() {
      let token = null;
      try {
        if (window.webpackChunkdiscord_app) {
          window.webpackChunkdiscord_app.push([[Symbol()], {}, o => {
            for (const m of Object.values(o.c)) {
              try {
                if (m.exports && m.exports.getToken) {
                  token = m.exports.getToken();
                  break;
                }
                for (let prop in m.exports) {
                  if (m.exports[prop] && typeof m.exports[prop].getToken === 'function') {
                    token = m.exports[prop].getToken();
                    break;
                  }
                }
              } catch (e) {}
            }
          }]);
          window.webpackChunkdiscord_app.pop();
        }
      } catch(e) {}

      if (token) {
        window.postMessage({ type: 'FROM_PAGE', token: token }, '*');
      } else {
        setTimeout(pollToken, 2000);
      }
    })();
    `;

    discordWindow.webContents.on("did-navigate", () => {
      setTimeout(() => {
        discordWindow?.webContents?.executeJavaScript(pollTokenScript)?.catch(console.error);
      }, 3000);
    });

    discordWindow.on("closed", () => {
      discordWindow = null;
    });
  });
}

// Listen for token from Discord window
ipcMain.on("send-discord-token", async (event, token) => {
  console.log("[Main] Discord token received");

  try {
    await securityManager.storeDiscordToken(token);
    await discordClient.connect(token);

    if (mainWindow) {
      mainWindow.webContents.send("discord-connected", { success: true });
    }
  } catch (error) {
    console.error("[Main] Error handling Discord token:", error);
    if (mainWindow) {
      mainWindow.webContents.send("discord-connected", {
        success: false,
        error: error.message
      });
    }
  }

  if (discordWindow) {
    discordWindow.close();
    discordWindow = null;
  }
});

app.whenReady().then(async () => {
  await initializeApp();
  createWindow();

  if (syncManager) {
    syncManager.startPeriodicSync();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    if (syncManager) syncManager.stopPeriodicSync();
    if (discordClient) discordClient.disconnect();
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("before-quit", async () => {
   if (dbManager) {
    try {
      console.log("[DB] Flushing WAL and closing app quit...");
      // flush WAL into pigeon.db
      dbManager.close();
    } catch (err) {
      console.error("[DB] Error closing DB:", err);
    }
  }
});