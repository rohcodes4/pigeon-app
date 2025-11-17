// services/TelegramClient.cjs
const { TelegramClient, Api } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");
const { EventEmitter } = require("events");
const { CustomFile } = require("telegram/client/uploads");
const moment = require("moment");
const fs = require("fs");
const path = require("path");
const os = require("os");
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

  async formatShortMessage(msg, mainWindow) {
    const senderId = msg.userId?.value?.toString(); // DM sender
    const chatId = senderId; // DM chat = sender
    const getEntitySafely = async (id) => {
      if (!id) return null;
      try {
        return await this.client.getEntity(id);
      } catch {
        return null; // no crash
      }
    };
    const senderEntity = await getEntitySafely(senderId);
    const chatEntity = senderEntity; // in DM, chat = user

    const formatttedMessage = {
      _id: msg.id.toString(),
      timestamp: new Date(msg.date * 1000).toISOString(),

      raw_text: msg.message || "",

      message: {
        id: msg.id,
        date: new Date(msg.date * 1000).toISOString(),
        text: msg.message || "",
        from_id: senderId,
        to_id: senderId, // DM always 1-to-1
        reply_to: null,
        forward: null,
        edited: false,
        media: null,
        reactions: [],
      },

      sender: senderEntity
        ? {
            id: senderEntity.id,
            username: senderEntity.username || null,
            first_name: senderEntity.firstName || null,
            last_name: senderEntity.lastName || null,
            photo: senderEntity.photo || null,
          }
        : null,

      chat: chatEntity
        ? {
            id: chatEntity.id,
            title:
              [chatEntity.firstName, chatEntity.lastName]
                .filter(Boolean)
                .join(" ") || chatEntity.username,
            username: chatEntity.username || null,
            type: "private",
          }
        : null,
    };
    const safe = (obj) => {
      try {
        return JSON.parse(JSON.stringify(obj));
      } catch {
        return null;
      }
    };
    mainWindow.webContents.send(
      "telegram:newMessage",
      safe(formatttedMessage) // prevents IPC crash
    );

    const updated = await this.getSingleDialog(chatEntity?.id);
    if (updated) {
      mainWindow.webContents.send("telegram:dialog-updated", updated);
    }
  }

  async connectExisting(mainWindow) {
    try {
      await this.init(); // loads saved session & initializes client
      await this.client.connect();

      // Check if the saved session is still authorized
      const isAuthorized = await this.client.checkAuthorization();

      if (!isAuthorized) {
        console.log("[Telegram] Session expired or not authorized");
        mainWindow.webContents.send("telegram:not-logged-in");
        return false;
      }

      // Successfully connected with existing session
      const user = await this.client.getMe();
      console.log("[Telegram] Connected as", user.username);

      global.telegramClient = this.client;
      global.telegramUser = user;

      // Notify renderer
      mainWindow.webContents.send("telegram:connected", user);

      this.client.addEventHandler(async (event) => {
        try {
          const msg = event.message;
          if (event.className === "UpdateShortMessage") {
            await this.formatShortMessage(event, mainWindow);
            return;
          }

          if (!msg?.id) return;

          // ------------------------------
          // SAFE ENTITY FETCH
          // ------------------------------
          const getEntitySafely = async (id) => {
            if (!id) return null;
            try {
              return await this.client.getEntity(id);
            } catch {
              return null; // no crash
            }
          };

          let senderEntity = await getEntitySafely(msg.fromId || msg.senderId);

          const chatEntity = await getEntitySafely(msg.peerId);

          const safe = (obj) => {
            try {
              return JSON.parse(JSON.stringify(obj));
            } catch {
              return null;
            }
          };
          if (!senderEntity) {
            try {
              const full = await this.client.getMessages(msg.peerId, {
                ids: msg.id,
              });
              const m = full[0];

              if (m && m.sender) {
                senderEntity = safe(m.sender);
              }
            } catch (e) {
              console.log("Failed to fetch full message for sender:", e);
            }
          }

          // ------------------------------
          // SAFE MEDIA HANDLER
          // ------------------------------
          const getMediaInfo = async (msg) => {
            if (!msg || !msg.media) return null;
            const media = msg.media;

            try {
              // PHOTO
              if (media.photo) {
                const buffer = await this.client.downloadMedia(msg);
                return {
                  type: "photo",
                  mimeType: "image/jpeg",
                  data: `data:image/jpeg;base64,${buffer.toString("base64")}`,
                  caption: msg.message || "",
                };
              }

              // DOCUMENT / VIDEO / AUDIO / STICKER
              if (media.document) {
                const mime =
                  media.document.mimeType || "application/octet-stream";
                const buffer = await this.client.downloadMedia(msg);

                let type = "document";
                if (mime.startsWith("video")) type = "video";
                if (mime.startsWith("audio")) type = "audio";
                if (mime.includes("voice")) type = "voice";
                if (mime.includes("sticker")) type = "sticker";

                return {
                  type,
                  mimeType: mime,
                  name:
                    media.document.attributes?.find((a) => a.fileName)
                      ?.fileName || null,
                  size: media.document.size || null,
                  data: `data:${mime};base64,${buffer.toString("base64")}`,
                  caption: msg.message || "",
                };
              }

              // WEBPAGE
              if (media.webpage) {
                return {
                  type: "webpage",
                  title: media.webpage.title,
                  url: media.webpage.url,
                  description: media.webpage.description,
                };
              }

              // POLL
              if (media.poll) {
                return {
                  type: "poll",
                  question: media.poll.question,
                  options: media.poll.answers?.map((a) => a.text),
                };
              }
            } catch (err) {
              console.warn("Media parse failed:", err);
            }

            return null;
          };

          // ------------------------------
          // REACTION PARSER
          // ------------------------------
          const getReactions = (msg) => {
            if (!msg.reactions) return [];
            try {
              return msg.reactions.results?.map((r) => ({
                reaction: r.reaction.emoticon || r.reaction,
                count: r.count,
              }));
            } catch {
              return [];
            }
          };

          // ------------------------------
          // FORMAT FINAL MESSAGE SAFELY
          // ------------------------------
          const formattedMessage = {
            _id: msg.id.toString(),
            timestamp: new Date(msg.date * 1000).toISOString(),

            raw_text: msg.message || "",

            message: {
              id: msg.id,
              date: new Date(msg.date * 1000).toISOString(),
              text: msg.message || "",
              from_id: msg.fromId?.userId?.toString() || null,
              to_id: msg.peerId?.chatId?.toString() || null,
              reply_to: safe(msg.replyTo),
              forward: safe(msg.fwdFrom),
              edited: !!msg.editDate,
              media: await getMediaInfo(msg),
              reactions: getReactions(msg),
            },

            sender: senderEntity
              ? {
                  id: senderEntity.id,
                  username: senderEntity.username || null,
                  first_name: senderEntity.firstName || null,
                  last_name: senderEntity.lastName || null,
                  photo: senderEntity.photo || null,
                }
              : null,

            chat: chatEntity
              ? {
                  id: chatEntity.id,
                  title: chatEntity.title || null,
                  username: chatEntity.username || null,
                  type: chatEntity.className || "unknown",
                }
              : null,
          };

          // ------------------------------
          // SAFE IPC SEND
          // ------------------------------
          mainWindow.webContents.send(
            "telegram:newMessage",
            safe(formattedMessage) // prevents IPC crash
          );

          const updated = await this.getSingleDialog(chatEntity?.id);
          if (updated) {
            mainWindow.webContents.send("telegram:dialog-updated", updated);
          }
        } catch (e) {
          console.error("Error in telegram event handler:", e);
        }
      });

      return true;
    } catch (error) {
      console.error("[Telegram] connectExisting error:", error);
      mainWindow.webContents.send("telegram:connect-error", error.message);
      return false;
    }
  }

  // === GLOBAL SAFE LOCK + CACHE ===
  async getDialogsForChat(entity) {
    const inputDialogPeer = new Api.InputDialogPeer({
      peer: entity, // entity returned from getEntity(chatId)
    });
    const dialogs = await this.client.invoke(
      new Api.messages.GetPeerDialogs({
        peers: [inputDialogPeer], // ONLY the chat you care about
      })
    );
    return dialogs;
  }

  async getSingleDialog(chatId) {
    try {
      // 1) CACHE: refresh only every 10 seconds
      const now = Date.now();
      // if (!_dialogsCache || now - _dialogsCacheTime > 10000) {
      //   // 2) LOCK: prevent multiple parallel getDialogs() calls
      //   while (_dialogLock) {
      //     await new Promise((r) => setTimeout(r, 150));
      //   }

      //   _dialogLock = true;
      //   try {
      //     _dialogsCache = await this.client.getDialogs();
      //     _dialogsCacheTime = Date.now();
      //   } catch (err) {
      //     console.error("getDialogs error:", err);
      //   } finally {
      //     _dialogLock = false;
      //   }
      // }

      // // 3) FIND DIALOG FROM CACHE
      // const dialogs = _dialogsCache || [];
      // const dialog = dialogs.find((d) => {
      //   const id = d.entity?.id?.value;
      //   return String(id) === String(chatId);
      // });
      const entity = await this.client.getEntity(chatId);
      const dialogs = await this.getDialogsForChat(entity);
      const dialog = dialogs.dialogs[0];
      if (!dialog) return null;

      const message = dialogs.messages[0];

      // Determine chat type
      let chat_type = "private";
      if (entity.className === "Channel") {
        chat_type = entity.megagroup ? "group" : "channel";
      } else if (entity.className === "Chat") {
        chat_type = "group";
      } else if (entity.className === "User") {
        chat_type = "private";
      }

      const name =
        entity.title ||
        [entity.firstName, entity.lastName].filter(Boolean).join(" ") ||
        "Unknown";

      // 4) RETURN EXACT STRUCTURE (no changes)
      return {
        _id: entity.id?.value,
        id: entity.id?.value,
        chat_type,
        name,
        lastMessage: message?.message || "",
        last_message: message?.message || "",
        unread: dialog.unreadCount || 0,
        read: dialog.unreadCount === 0,
        isPinned: dialog.pinned || false,
        is_dialog: true,
        is_typing: false,
        last_seen: moment(message.date * 1000).toISOString(),
        last_ts: moment(message.date * 1000).format("YYYY-MM-DDTHH:mm:ss"),
        timestamp: moment(message.date * 1000).format("YYYY-MM-DDTHH:mm:ss"),
        count: dialogs.messages?.length || 0,
        summary: "",
        sync_enabled: null,
        platform: "Telegram",
        photo_url: `http://api.pigeon.chat/chat_photo/${entity.id?.toString()}`,
      };
    } catch (err) {
      console.error("getSingleDialog error:", err);
      return null;
    }
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

  async getMessages(chatId, limit = 10, offset = 0) {
    try {
      const messages = await this.client.getMessages(chatId, {
        limit,
        addOffset: offset,
      });

      const formattedMessages = await Promise.all(
        messages.map(async (msg) => {
          const safe = (obj) => {
            if (!obj) return null;
            return JSON.parse(JSON.stringify(obj)); // remove class refs
          };

          const sender = safe(msg?.sender);
          const chat = safe(msg?.chat);
          const getMediaInfo = async (msg) => {
            if (!msg || !msg.media) return null;
            const media = msg.media;

            try {
              // PHOTO
              if (media.photo) {
                const buffer = await this.client.downloadMedia(msg);
                return {
                  type: "photo",
                  mimeType: "image/jpeg",
                  data: `data:image/jpeg;base64,${buffer.toString("base64")}`,
                  caption: msg.message || "",
                };
              }

              // DOCUMENT / VIDEO / AUDIO / STICKER
              if (media.document) {
                const mime =
                  media.document.mimeType || "application/octet-stream";
                const buffer = await this.client.downloadMedia(msg);

                let type = "document";
                if (mime.startsWith("video")) type = "video";
                if (mime.startsWith("audio")) type = "audio";
                if (mime.includes("voice")) type = "voice";
                if (mime.includes("sticker")) type = "sticker";

                return {
                  type,
                  mimeType: mime,
                  name:
                    media.document.attributes?.find((a) => a.fileName)
                      ?.fileName || null,
                  size: media.document.size || null,
                  data: `data:${mime};base64,${buffer.toString("base64")}`,
                  caption: msg.message || "",
                };
              }

              // WEBPAGE
              if (media.webpage) {
                return {
                  type: "webpage",
                  title: media.webpage.title,
                  url: media.webpage.url,
                  description: media.webpage.description,
                };
              }

              // POLL
              if (media.poll) {
                return {
                  type: "poll",
                  question: media.poll.question,
                  options: media.poll.answers?.map((a) => a.text),
                };
              }
            } catch (err) {
              console.warn("Media parse failed:", err);
            }

            return null;
          };

          // ------------------------------
          // REACTION PARSER
          // ------------------------------
          const getReactions = (msg) => {
            if (!msg.reactions) return [];
            try {
              return msg.reactions.results?.map((r) => ({
                reaction: r.reaction.emoticon || r.reaction,
                count: r.count,
              }));
            } catch {
              return [];
            }
          };
          return {
            _id: msg.id?.toString(),
            timestamp: moment(msg.date * 1000).toISOString(),
            raw_text: msg.message || "",
            message: {
              id: msg.id,
              date: moment(msg.date * 1000).toISOString(),
              text: msg.message || "",
              from_id: msg.fromId ? msg.fromId.toString() : null,
              to_id: msg.peerId ? msg.peerId.toString() : null,
              reply_to: msg.replyTo ? JSON.stringify(msg.replyTo) : null,
              forward: msg.fwdFrom || null,
              edited: !!msg.editDate,
              media: await getMediaInfo(msg),
              reactions: getReactions(msg),
              has_media: !!msg.media,
              has_document: !!msg.document,
              has_photo: !!msg.photo,
              has_video: !!msg.video,
              has_voice: !!msg.voice,
              has_sticker: !!msg.sticker,
            },
            sender: sender
              ? {
                  id: sender.id || null,
                  username: sender.username || null,
                  first_name: sender.firstName || null,
                  last_name: sender.lastName || null,
                  phone: sender.phone || null,
                  is_bot: sender.bot || false,
                }
              : null,
            chat: chat
              ? {
                  id: chat.id || chatId,
                  title: chat.title || null,
                  username: chat.username || null,
                  first_name: chat.firstName || null,
                  last_name: chat.lastName || null,
                  photo: chat.photo ? { photo_id: chat.photo.photoId } : null,
                  access_hash: chat.accessHash || null,
                  type: chat.className || "unknown",
                  _: chat._ || "unknown",
                  participants_count: chat.participantsCount || null,
                  megagroup: chat.megagroup || false,
                  broadcast: chat.broadcast || false,
                }
              : null,
          };
        })
      );

      // ✅ Deep clone before sending to renderer
      return JSON.parse(JSON.stringify(formattedMessages));
    } catch (error) {
      console.error("[Telegram] getMessages error:", error);
      return [];
    }
  }
  async getMediaInfo(ms) {
    if (!ms) return null;

    const messages = await this.client.getMessages(ms.chat.id, {
      ids: [ms.message.id],
    });

    const msg = messages[0];
    const media = msg?.media;
    if (!msg) return null;
    try {
      // PHOTO
      if (media.photo) {
        const buffer = await this.client.downloadMedia(msg);
        return {
          type: "photo",
          mimeType: "image/jpeg",
          data: `data:image/jpeg;base64,${buffer.toString("base64")}`,
          caption: msg.message || "",
        };
      }

      // DOCUMENT / VIDEO / AUDIO / STICKER
      if (media.document) {
        const mime = media.document.mimeType || "application/octet-stream";
        const buffer = await this.client.downloadMedia(msg);

        let type = "document";
        if (mime.startsWith("video")) type = "video";
        if (mime.startsWith("audio")) type = "audio";
        if (mime.includes("voice")) type = "voice";
        if (mime.includes("sticker")) type = "sticker";

        return {
          type,
          mimeType: mime,
          name:
            media.document.attributes?.find((a) => a.fileName)?.fileName ||
            null,
          size: media.document.size || null,
          data: `data:${mime};base64,${buffer.toString("base64")}`,
          caption: msg.message || "",
        };
      }

      // WEBPAGE
      if (media.webpage) {
        return {
          type: "webpage",
          title: media.webpage.title,
          url: media.webpage.url,
          description: media.webpage.description,
        };
      }

      // POLL
      if (media.poll) {
        return {
          type: "poll",
          question: media.poll.question,
          options: media.poll.answers?.map((a) => a.text),
        };
      }
    } catch (err) {
      console.warn("Media parse failed:", err);
    }

    return null;
  }
  async getDialogs() {
    const dialogs = await this.client.getDialogs();
    const chatList = dialogs.map((dialog) => {
      const entity = dialog.entity;
      const message = dialog.message;

      // Determine chat type
      let chat_type = "private";
      if (entity.className === "Channel") {
        chat_type = entity.megagroup ? "group" : "channel";
      } else if (entity.className === "Chat") {
        chat_type = "group";
      } else if (entity.className === "User") {
        chat_type = "private";
      }

      // Get display name
      const name =
        entity.title ||
        [entity.firstName, entity.lastName].filter(Boolean).join(" ") ||
        "Unknown";

      // Compose chat object in your required shape
      return {
        _id: entity.id?.value,
        id: entity.id?.value,
        chat_type,
        name,
        lastMessage: message?.message || "",
        last_message: message?.message || "",
        unread: dialog.unreadCount || 0,
        read: dialog.unreadCount === 0,
        isPinned: dialog.pinned || false,
        is_dialog: true,
        is_typing: false,
        last_seen: moment(dialog.date * 1000).toISOString(),
        last_ts: moment(dialog.date * 1000).format("YYYY-MM-DDTHH:mm:ss"),
        timestamp: moment(dialog.date * 1000).format("YYYY-MM-DDTHH:mm:ss"),
        count: dialog.messages?.length || 0,
        summary: "",
        sync_enabled: null,
        platform: "Telegram",
        photo_url: `http://api.pigeon.chat/chat_photo/${entity.id?.toString()}`,
      };
    });
    return chatList;
  }

  // ------------------------------
  // MESSAGE ACTIONS
  // ------------------------------

  async searchMessages(chatId, query, limit = 50) {
    try {
      const messages = await this.client.searchMessages(chatId, {
        filter: undefined,
        limit,
        search: query,
      });
      return messages;
    } catch (err) {
      console.error("[Telegram] searchMessages error:", err);
      return [];
    }
  }

  async getMessageReplies(chatId, messageId) {
    try {
      const replies = await this.client.getMessages(chatId, {
        replyTo: messageId,
      });
      return replies;
    } catch (err) {
      console.error("[Telegram] getMessageReplies error:", err);
      return [];
    }
  }

  async getMessageForwardInfo(chatId, messageId) {
    try {
      const msg = await this.getMessageById(chatId, messageId);
      return msg?.fwdFrom || null;
    } catch (err) {
      console.error("[Telegram] getMessageForwardInfo error:", err);
      return null;
    }
  }

  async getMessageReactions(chatId, messageId) {
    try {
      const msg = await this.getMessageById(chatId, messageId);
      return msg?.reactions?.results || [];
    } catch (err) {
      console.error("[Telegram] getMessageReactions error:", err);
      return [];
    }
  }

  async getPinnedMessages(chatId) {
    try {
      const chat = await this.client.getEntity(chatId);
      return chat.pinnedMessage ? [chat.pinnedMessage] : [];
    } catch (err) {
      console.error("[Telegram] getPinnedMessages error:", err);
      return [];
    }
  }

  async pinMessage(chatId, messageId) {
    try {
      await this.client.pinMessage(chatId, messageId);
      return true;
    } catch (err) {
      console.error("[Telegram] pinMessage error:", err);
      return false;
    }
  }

  async unpinMessage(chatId, messageId) {
    try {
      await this.client.unpinMessage(chatId, messageId);
      return true;
    } catch (err) {
      console.error("[Telegram] unpinMessage error:", err);
      return false;
    }
  }

  async deleteMessage(chatId, messageId) {
    try {
      await this.client.deleteMessages(chatId, [Number(messageId)], {
        revoke: true,
      });
      return true;
    } catch (err) {
      console.error("[Telegram] deleteMessage error:", err);
      return false;
    }
  }

  async markAsRead(chatId) {
    try {
      await this.client.markAsRead(chatId);
      return true;
    } catch (err) {
      console.error("[Telegram] markAsRead error:", err);
      return false;
    }
  }

  // ------------------------------
  // SENDING
  // ------------------------------
  async sendPhoto(chatId, photo, caption = "", filename = "photo.jpg") {
    // const buffer = Buffer.from(photo);
    const buffer = Buffer.from(new Uint8Array(photo));

    const file = new CustomFile(filename, buffer.length, "", buffer);
    return await this.client.sendFile(chatId, {
      file: file,
      caption
    });
  }

  async sendDocument(chatId, document, caption = "") {
    return await this.client.sendFile(chatId, { file: document, caption });
  }

  // async sendVideo(chatId, video, caption = "", filename = "video.mp4") {
  //    const buffer = Buffer.from(new Uint8Array(video));
     
  //   const file = new CustomFile(filename, buffer.length, null, buffer);
  //   console.log(buffer?.constructor?.name, buffer?.byteLength ?? buffer?.length);

  //   return await this.client.sendFile(chatId, { file: file, caption, fileSize: buffer.length,     // ensures video properly uploads
  //   supportsStreaming: true,     // allow streaming playback
  //   workers: 4, });
  // }

  async sendVideo(chatId, video, caption = "", filename = "video.mp4") {
  const buffer = Buffer.from(new Uint8Array(video));
  
  // If >20MB → must use file path
  const MAX_BUFFER_MB = 20 * 1024 * 1024;

  let file;

  if (buffer.length > MAX_BUFFER_MB) {
    // create temp file
    const tmpPath = path.join(os.tmpdir(), `${Date.now()}-${filename}`);
    await fs.promises.writeFile(tmpPath, buffer);

    file = new CustomFile(filename, buffer.length, tmpPath);
  } else {
    // under 20MB → buffer method works fine
    file = new CustomFile(filename, buffer.length, null, buffer);
  }

  return await this.client.sendFile(chatId, {
    file,
    caption,
    fileSize: buffer.length,
    supportsStreaming: false,
  });
}

  async sendVoice(chatId, voice, caption = "") {
    return await this.client.sendFile(chatId, {
      file: voice,
      voice: true,
      caption,
    });
  }

  async sendSticker(chatId, sticker) {
    return await this.client.sendFile(chatId, { file: sticker, sticker: true });
  }

  async replyMessage(chatId, messageId, message) {
    return await this.client.sendMessage(chatId, {
      message,
      replyTo: messageId,
    });
  }

  async forwardMessage(chatId, fromChatId, messageId) {
    return await this.client.forwardMessages(chatId, {
      fromPeer: fromChatId,
      id: [messageId],
    });
  }

  // ------------------------------
  // CHAT / GROUP INFO
  // ------------------------------
  async getChatInfo(chatId) {
    try {
      const chat = await this.client.getEntity(chatId);
      return chat;
    } catch (err) {
      console.error("[Telegram] getChatInfo error:", err);
      return null;
    }
  }

  async getParticipants(chatId) {
    try {
      const participants = await this.client.getParticipants(chatId);
      return participants;
    } catch (err) {
      console.error("[Telegram] getParticipants error:", err);
      return [];
    }
  }

  async joinChat(chatId) {
    try {
      await this.client.joinChannel(chatId);
      return true;
    } catch (err) {
      console.error("[Telegram] joinChat error:", err);
      return false;
    }
  }

  async leaveChat(chatId) {
    try {
      await this.client.leaveChannel(chatId);
      return true;
    } catch (err) {
      console.error("[Telegram] leaveChat error:", err);
      return false;
    }
  }

  // ------------------------------
  // PROFILE / USER
  // ------------------------------
  async getUserInfo(userId) {
    try {
      const user = await this.client.getEntity(userId);
      return user;
    } catch (err) {
      console.error("[Telegram] getUserInfo error:", err);
      return null;
    }
  }

  async updateProfilePhoto(photo) {
    try {
      await this.client.updateProfile({ photo });
      return true;
    } catch (err) {
      console.error("[Telegram] updateProfilePhoto error:", err);
      return false;
    }
  }

  async updateBio(bio) {
    try {
      await this.client.updateProfile({ about: bio });
      return true;
    } catch (err) {
      console.error("[Telegram] updateBio error:", err);
      return false;
    }
  }

  // ------------------------------
  // TYPING & STATUS
  // ------------------------------
  async sendTyping(chatId) {
    try {
      await this.client.sendChatAction(chatId, "typing");
    } catch (err) {
      console.error("[Telegram] sendTyping error:", err);
    }
  }

  async sendUploading(chatId) {
    try {
      await this.client.sendChatAction(chatId, "upload_photo");
    } catch (err) {
      console.error("[Telegram] sendUploading error:", err);
    }
  }

  async sendRecording(chatId) {
    try {
      await this.client.sendChatAction(chatId, "record_voice");
    } catch (err) {
      console.error("[Telegram] sendRecording error:", err);
    }
  }

  // ------------------------------
  // UTILITY / ADVANCED
  // ------------------------------
  async downloadFile(msg) {
    try {
      const buffer = await this.client.downloadMedia(msg);
      return buffer;
    } catch (err) {
      console.error("[Telegram] downloadFile error:", err);
      return null;
    }
  }

  async downloadMediaById(chatId, messageId) {
    const messages = await this.client.getMessages(chatId, {
      ids: [messageId],
    });
    if (!messages.length) return null;
    return await this.downloadFile(messages[0]);
  }

  async uploadFile(chatId, file) {
    try {
      return await this.client.sendFile(chatId, { file });
    } catch (err) {
      console.error("[Telegram] uploadFile error:", err);
      return null;
    }
  }

  async getMessageLink(chatId, messageId) {
    try {
      const msg = await this.getMessageById(chatId, messageId);
      return msg?.link || null;
    } catch (err) {
      console.error("[Telegram] getMessageLink error:", err);
      return null;
    }
  }

  async openMessageThread(chatId, messageId) {
    try {
      return await this.client.getMessages(chatId, { replyTo: messageId });
    } catch (err) {
      console.error("[Telegram] openMessageThread error:", err);
      return [];
    }
  }
}

module.exports = TelegramService;
