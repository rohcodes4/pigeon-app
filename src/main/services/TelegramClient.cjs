// services/TelegramClient.cjs
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");
const { EventEmitter } = require("events");
const qrcode = require("qrcode");
const { ipcMain } = require("electron");
class TelegramService extends EventEmitter {
  constructor(dbManager, securityManager) {
    super();
    this.dbManager = dbManager;
    this.securityManager = securityManager;

    this.apiId = 23377974;
    this.apiHash = "b6697c981876c0f5e7ce602e3586ffe1";
    this.client = null;
    this.session = null;
    this.user = null;
  }

  async init() {
    const savedSession = await this.securityManager.getTelegramSession();
    this.session = new StringSession(savedSession || "");
    this.client = new TelegramClient(this.session, this.apiId, this.apiHash, {
      connectionRetries: 5,
      appVersion: "1.0",
      deviceModel: "ElectronApp",
      systemVersion: "Windows 10",
      langCode: "en",
    });
  }

  verifyCode(code) {
    ipcMain.emit("telegram:code-entered", code);
  }
  async connectWithPhone(mainWindow, phoneNumber) {
    try {
      await this.init();
      await this.client.connect();

      console.log("[Telegram] Sending login code to:", phoneNumber);

      // Step 1: Send the code
      const sentCode = await this.client.sendCode(
        { apiId: this.apiId, apiHash: this.apiHash },
        phoneNumber
      );

      console.log("[Telegram] Code sent, waiting for user input...");
      mainWindow.webContents.send("telegram:code-sent", { phone: phoneNumber });

      // Step 2: Sign in with callback-based OTP + optional 2FA password
      const user = await this.client.signInUser(
        { apiId: this.apiId, apiHash: this.apiHash },
        {
          phoneNumber,

          // Wait for user to enter OTP (renderer -> main via IPC)
          phoneCode: async () => {
            return await new Promise((resolve) => {
              const listener = (_event, otpCode) => {
                console.log("[Telegram] Received OTP from renderer:", otpCode);
                resolve(otpCode);
                ipcMain.removeListener("telegram:verify-code", listener);
              };
              ipcMain.on("telegram:verify-code", listener);
            });
          },

          // Handle 2FA password if needed
          password: async (hint) => {
            console.log("[Telegram] 2FA required, hint:", hint);
            mainWindow.webContents.send("telegram:password-required", hint);

            return await new Promise((resolve) => {
              const listener = (_event, userPassword) => {
                console.log("[Telegram] Received 2FA password from renderer");
                ipcMain.removeListener("telegram:2fa-submit", listener);
                resolve(userPassword);
              };
              ipcMain.on("telegram:2fa-submit", listener);
            });
          },

          onError: async (err) => {
            console.error("[Telegram] Phone login error:", err);

            if (err?.message?.includes("PHONE_CODE_INVALID")) {
              mainWindow.webContents.send("telegram:code-invalid");
            } else if (err?.message?.includes("PHONE_CODE_EXPIRED")) {
              mainWindow.webContents.send("telegram:code-expired");
            } else if (err?.message?.includes("PASSWORD_HASH_INVALID")) {
              mainWindow.webContents.send("telegram:password-invalid");
            } else {
              mainWindow.webContents.send("telegram:login-error", err.message);
            }

            // Stop further retry attempts by Telegram
            return true;
          },
        }
      );

      // Step 3: On success
      this.user = user;
      await this._onLoginSuccess();

      mainWindow.webContents.send("telegram:login-success", user);
      console.log("[Telegram] Phone login success:", user);
      return true;
    } catch (error) {
      console.error("[Telegram] Phone login failed:", error);

      if (error?.message?.includes("PASSWORD_HASH_INVALID")) {
        mainWindow.webContents.send("telegram:password-invalid");
      } else {
        mainWindow.webContents.send("telegram:login-error", error.message);
      }

      this.emit("error", error);
      return false;
    }
  }

  async connectWithQR(mainWindow) {
    try {
      await this.init();
      await this.client.connect();

      const apiId = this.apiId; // your stored Telegram API ID
      const apiHash = this.apiHash; // your stored Telegram API Hash

      console.log("[Telegram] Generating QR for login...");

      const user = await this.client.signInUserWithQrCode(
        { apiId, apiHash },
        {
          qrCode: async (code) => {
            // Convert the Telegram QR token to a base64 URL
            const qrUrl = `tg://login?token=${code.token.toString(
              "base64url"
            )}`;

            // Generate an image to show in your frontend (Electron renderer)
            const qrImage = await qrcode.toDataURL(qrUrl);
            mainWindow.webContents.send("telegram:qr-generated", qrImage);

            console.log(
              `[Telegram] QR Code generated (expires in ${Math.floor(
                (code.expires - Date.now()) / 1000
              )}s)`
            );
          },

          password: async (hint) => {
            // Optional 2FA password if user has it enabled
            mainWindow.webContents.send("telegram:password-required");

            const password = await new Promise((resolve) => {
              const listener = (event, userPassword) => {
                console.log(
                  "[Telegram] Received password from renderer",
                  userPassword
                );
                resolve(userPassword);
                ipcMain.removeListener("telegram:2fa-submit", listener);
              };
              ipcMain.on("telegram:2fa-submit", listener);
            });

            console.log("[Telegram] Received password from renderer");
            return password;
          },

          onError: async (err) => {
            console.error("[Telegram] QR login error:", err);
            // Handle invalid password or expired QR etc.
            if (err?.message?.includes("PASSWORD_HASH_INVALID")) {
              mainWindow.webContents.send("telegram:password-invalid");
            } else if (err?.message?.includes("AUTH_KEY_UNREGISTERED")) {
              mainWindow.webContents.send("telegram:qr-expired");
            } else {
              mainWindow.webContents.send("telegram:login-error", err.message);
            }

            // Stop auth process
            return true;
          },
        }
      );

      this.user = user;
      await this._onLoginSuccess();

      console.log("[Telegram] QR login success:", user);
      mainWindow.webContents.send("telegram:login-success", user);
      return true;
    } catch (error) {
      console.error("[Telegram] QR login failed:", error);
      this.emit("error", error);
      return false;
    }
  }

  async _onLoginSuccess() {
    this.sessionString = this.client.session.save();
    await this.securityManager.saveTelegramSession(this.sessionString);
    this.emit("connected", { user: this.user });

    this.listenForMessages();
  }

  listenForMessages() {
    this.client.addEventHandler(async (event) => {
      const msg = event.message;
      const chat = await msg.getChat();
      const sender = await msg.getSender();

      await this.dbManager.createUser({
        id: sender.id.toString(),
        platform: "telegram",
        username: sender.username || sender.firstName,
        display_name: `${sender.firstName || ""} ${
          sender.lastName || ""
        }`.trim(),
        avatar_url: null,
      });

      await this.dbManager.createChat({
        id: chat.id.toString(),
        platform: "telegram",
        type: chat.isUser ? "dm" : chat.isGroup ? "group" : "channel",
        name: chat.title || sender.username || sender.firstName,
        participant_count: chat.participantsCount || 0,
        last_message_id: msg.id.toString(),
      });

      await this.dbManager.createMessage({
        id: msg.id.toString(),
        chat_id: chat.id.toString(),
        user_id: sender.id.toString(),
        content: msg.message || "[media message]",
        timestamp: new Date(msg.date * 1000).toISOString(),
        message_type: msg.media ? "media" : "text",
        sync_status: "synced",
      });

      this.emit("newMessage", { chatId: chat.id.toString(), message: msg });
    }, new NewMessage({}));
  }

  async sendMessage(chatId, message) {
    await this.client.sendMessage(chatId, { message });
  }

  async getDialogs() {
    const dialogs = await this.client.getDialogs();
    return dialogs.map((d) => ({
      id: d.id.toString(),
      name: d.title,
      type: d.isUser ? "dm" : d.isGroup ? "group" : "channel",
    }));
  }
}

module.exports = TelegramService;
