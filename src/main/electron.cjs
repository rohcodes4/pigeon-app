const { app, BrowserWindow, ipcMain, session } = require("electron");
const path = require("path");
const Database = require("better-sqlite3");
const WebSocket = require("ws");
const CryptoJS = require("crypto-js");
const Store = require("electron-store");
require("dotenv").config();

const DatabaseManager = require("./database/DatabaseManager.cjs");
const DiscordClient = require("./services/DiscordClient.cjs");
const SecurityManager = require("./security/SecurityManager.cjs");
const SyncManager = require("./sync/SyncManager.cjs");

console.log("VITE_DEV_SERVER_URL:", process.env.VITE_DEV_SERVER_URL);

let mainWindow;
let discordWindow;
let dbManager;
let discordClient;
let securityManager;
let syncManager;

app.commandLine.appendSwitch("allow-file-access-from-files");
app.commandLine.appendSwitch("disable-site-isolation-trials");

async function initializeApp() {
  try {
    // Initialize security manager first
    securityManager = new SecurityManager();
    await securityManager.initialize();

    // Initialize database with encryption
    dbManager = new DatabaseManager(securityManager);
    await dbManager.initialize();

    // Initialize Discord client
    discordClient = new DiscordClient(dbManager, securityManager);

    // Set up Discord client event listeners for CAPTCHA handling
    discordClient.on("captchaRequired", (captchaData) => {
      console.log("[App] CAPTCHA required, forwarding to renderer");
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("discord:captcha-required", captchaData);
      }
    });

    // Initialize sync manager
    syncManager = new SyncManager(dbManager, securityManager);

    console.log("[App] All services initialized successfully");
  } catch (error) {
    console.error("[App] Failed to initialize services:", error);
    // Don't quit the app immediately, let it continue without some services
    // app.quit();
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1052,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
    },
  });

  // Enhanced security settings
  session.defaultSession.webSecurity = true;
  session.defaultSession.setPermissionRequestHandler(
    (webContents, permission, callback) => {
      const allowedPermissions = ["notifications"];
      const granted = allowedPermissions.includes(permission);
      callback(granted);
    }
  );

  if (process.env.VITE_NODE_ENV === "development") {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(process.resourcesPath, "dist", "index.html");
    mainWindow.loadFile(indexPath);
  }

  mainWindow.on("closed", () => {
    console.log("Main window closed");
    mainWindow = null;
  });

  setupIPCHandlers();
}

function setupIPCHandlers() {
  // Discord authentication
  ipcMain.handle("discord:open-login", async () => {
    try {
      await openDiscordLogin();
      return { success: true };
    } catch (error) {
      console.error("[IPC] Discord login error:", error);
      return { success: false, error: error.message };
    }
  });

  // Get Discord DMs
  ipcMain.handle("discord:get-dms", async () => {
    try {
      if (!discordClient.isConnected()) {
        return { success: false, error: "Discord not connected" };
      }
      const dms = await discordClient.getDMs();
      return { success: true, data: dms };
    } catch (error) {
      console.error("[IPC] Get DMs error:", error);
      return { success: false, error: error.message };
    }
  });

  // Send Discord message
  ipcMain.handle("discord:send-message", async (event, { chatId, message }) => {
    try {
      if (!discordClient.isConnected()) {
        return { success: false, error: "Discord not connected" };
      }
      const result = await discordClient.sendMessage(chatId, message);
      return { success: true, data: result };
    } catch (error) {
      console.error("[IPC] Send message error:", error);

      if (error.captchaRequired) {
        return {
          success: false,
          error: error.message,
          captchaRequired: true,
          captchaData: error.captchaData,
        };
      }

      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(
    "discord:send-message-with-captcha",
    async (event, { chatId, message, captchaToken, captchaData }) => {
      try {
        if (!discordClient.isConnected()) {
          return { success: false, error: "Discord not connected" };
        }
        const result = await discordClient.sendMessageWithCaptcha(
          chatId,
          message,
          captchaToken,
          captchaData
        );
        return { success: true, data: result };
      } catch (error) {
        console.error("[IPC] Send message with CAPTCHA error:", error);
        return { success: false, error: error.message };
      }
    }
  );

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

  ipcMain.handle(
    "db:get-messages",
    async (event, { chatId, limit = 50, offset = 0 }) => {
      try {
        const messages = await dbManager.getMessages(chatId, limit, offset);
        return { success: true, data: messages };
      } catch (error) {
        console.error("[IPC] Get messages error:", error);
        return { success: false, error: error.message };
      }
    }
  );

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
    if (mainWindow) {
      mainWindow.minimize();
    }
    return { success: true };
  });

  ipcMain.handle("app:maximize", async () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
    return { success: true };
  });

  ipcMain.handle("app:unmaximize", async () => {
    if (mainWindow) {
      mainWindow.unmaximize();
    }
    return { success: true };
  });

  ipcMain.handle("app:is-maximized", async () => {
    return {
      success: true,
      data: mainWindow ? mainWindow.isMaximized() : false,
    };
  });
}

async function openDiscordLogin() {
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
      sandbox: false,
    },
  });

  // Set realistic User-Agent based on platform
  const getRealisticUserAgent = () => {
    const chromeVersion = "120.0.0.0";
    switch (process.platform) {
      case "darwin":
        return `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
      case "linux":
        return `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
      default: // Windows
        return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
    }
  };

  discordWindow.webContents.setUserAgent(getRealisticUserAgent());

  discordWindow.loadURL("https://discord.com/login");

  if (process.env.VITE_NODE_ENV === "development") {
    discordWindow.webContents.openDevTools();
  }

  discordWindow.once("ready-to-show", () => {
    console.log("[DiscordWindow] ready-to-show");
    discordWindow.show();
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
    } catch(e) {
      console.error('[DiscordWindow] error during token poll', e);
    }

    if (token) {
      window.postMessage({ type: 'FROM_PAGE', token: token }, '*');
    } else {
      setTimeout(pollToken, 2000);
    }
  })();
`;

  discordWindow.webContents.on("did-navigate", () => {
    console.log(
      "[DiscordWindow] did-navigate event fired, injecting poll script"
    );
    setTimeout(() => {
      discordWindow.webContents
        .executeJavaScript(pollTokenScript)
        .catch(console.error);
    }, 3000);
  });

  discordWindow.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription) => {
      console.error("[DiscordWindow] Fail load:", errorDescription);
    }
  );

  discordWindow.on("closed", () => {
    console.log("[DiscordWindow] closed");
    discordWindow = null;
  });
}

// Listen for the token sent by discordPreload.js from Discord window
ipcMain.on("send-discord-token", async (event, token) => {
  console.log("[Main] Discord token received");

  try {
    // Store token securely
    await securityManager.storeDiscordToken(token);

    // Initialize Discord client with token
    await discordClient.connect(token);

    if (mainWindow) {
      mainWindow.webContents.send("discord-connected", { success: true });
      console.log("[Main] Discord connection confirmation sent to mainWindow");
    }
  } catch (error) {
    console.error("[Main] Error handling Discord token:", error);
    if (mainWindow) {
      mainWindow.webContents.send("discord-connected", {
        success: false,
        error: error.message,
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

  // Start sync manager if it was initialized successfully
  if (syncManager) {
    syncManager.startPeriodicSync();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    // Clean shutdown
    if (syncManager) {
      syncManager.stopPeriodicSync();
    }
    if (discordClient) {
      discordClient.disconnect();
    }
    if (dbManager) {
      dbManager.close();
    }
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("before-quit", async () => {
  // Perform final sync before quitting
  if (syncManager) {
    try {
      await syncManager.performSync();
    } catch (error) {
      console.error("[App] Error during final sync:", error);
    }
  }
});
