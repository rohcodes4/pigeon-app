const WebSocket = require("ws");
const https = require("https");
const { EventEmitter } = require("events");

class DiscordClient extends EventEmitter {
  constructor(dbManager, securityManager) {
    super();
    this.dbManager = dbManager;
    this.securityManager = securityManager;

    // Connection state
    this.token = null;
    this.ws = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 5000;

    // Session management
    this.heartbeatInterval = null;
    this.heartbeatAcknowledged = true;
    this.sessionId = null;
    this.sequenceNumber = null;
    this.userId = null;

    // Data stores
    this.guilds = new Map();
    this.channels = new Map();
    this.users = new Map();

    // API configuration
    this.apiBase = "https://discord.com/api/v10";
    this.gatewayUrl = "wss://gateway.discord.gg/?v=10&encoding=json";
    this.userAgent = this.getRealisticUserAgent();

    // Rate limiting - more conservative
    this.rateLimits = {
      message: { count: 0, lastReset: Date.now(), perMinute: 15 },
      general: { count: 0, lastReset: Date.now(), perSecond: 5 },
    };
  }

  getRealisticUserAgent() {
    const chromeVersion = "140.0.0.0";
    const platforms = {
      darwin: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`,
      linux: `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`,
      win32: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`,
    };
    return platforms[process.platform] || platforms.win32;
  }

  generateNonce() {
    const timestamp = Date.now() - 1420070400000;
    const random = Math.floor(Math.random() * 4096);
    return ((BigInt(timestamp) << 22n) | BigInt(random)).toString();
  }

  getSuperProperties() {
    const osMap = { darwin: "Mac OS X", linux: "Linux", win32: "Windows" };
    return Buffer.from(
      JSON.stringify({
        os: osMap[process.platform] || "Windows",
        browser: "Chrome",
        device: "",
        system_locale: "en-US",
        browser_user_agent: this.userAgent,
        browser_version: "140.0.0.0",
        os_version: process.platform === "darwin" ? "10.15.7" : "10",
        referrer: "",
        referring_domain: "",
        referrer_current: "",
        referring_domain_current: "",
        release_channel: "stable",
        client_build_number: 446694,
        client_event_source: null,
      })
    ).toString("base64");
  }

  getRealisticHeaders(additionalHeaders = {}) {
    return {
      "User-Agent": this.userAgent,
      Accept: "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      DNT: "1",
      Connection: "keep-alive",
      Origin: "https://discord.com",
      Referer: "https://discord.com/channels/@me",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
      "Sec-CH-UA":
        '"Chromium";v="140", "Not A(Brand";v="24", "Google Chrome";v="140"',
      "Sec-CH-UA-Mobile": "?0",
      "Sec-CH-UA-Platform": `"${
        process.platform === "darwin"
          ? "macOS"
          : process.platform === "linux"
          ? "Linux"
          : "Windows"
      }"`,
      "x-discord-locale": "en-US",
      "x-discord-timezone": Intl.DateTimeFormat().resolvedOptions().timeZone,
      "x-super-properties": this.getSuperProperties(),
      "x-debug-options": "bugReporterEnabled",
      ...additionalHeaders,
    };
  }

  async humanDelay(min = 800, max = 2000) {
    const delay = Math.random() * (max - min) + min;
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  async checkRateLimit(type = "general") {
    const limit = this.rateLimits[type];
    if (!limit) return;

    const now = Date.now();
    const window = type === "message" ? 60000 : 1000;

    if (now - limit.lastReset >= window) {
      limit.count = 0;
      limit.lastReset = now;
    }

    const maxRate = type === "message" ? limit.perMinute : limit.perSecond;

    if (limit.count >= maxRate) {
      const waitTime = window - (now - limit.lastReset);
      console.log(`[Discord] Rate limit, waiting ${waitTime}ms`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      limit.count = 0;
      limit.lastReset = Date.now();
    }

    limit.count++;
  }

  // Get current state for broadcasting
  getState() {
    return {
      connected: this.connected,
      userId: this.userId,
      guilds: Array.from(this.guilds.values()),
      channels: Array.from(this.channels.values()),
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  async connect(token) {
    try {
      if (!this.securityManager.validateDiscordToken(token)) {
        throw new Error("Invalid Discord token format");
      }

      this.token = token;
      console.log("[Discord] Connecting with token:", token.slice(0, 8) + "...");
      await this.testTokenValidity();
      await this.securityManager.storeDiscordToken(token);
      await this.connectToGateway();

      console.log("[Discord] Successfully connected");
      this.connected = true;
      this.reconnectAttempts = 0;
      this.emit("connected", this.getState());
    } catch (error) {
      console.error("[Discord] Connection failed:", error);
      this.connected = false;
      this.emit("error", error);
      throw error;
    }
  }

  async testTokenValidity() {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: "discord.com",
        path: "/api/v10/users/@me",
        method: "GET",
        headers: this.getRealisticHeaders({
          Authorization: this.token,
          "Accept-Encoding": "identity",
        }),
      };

      const req = https.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode === 200) {
            const userData = JSON.parse(data);
            this.userId = userData.id;
            console.log("[Discord] Token validated:", userData.username);
            resolve(userData);
          } else {
            reject(new Error(`Token validation failed: ${res.statusCode}`));
          }
        });
      });

      req.on("error", reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error("Token validation timeout"));
      });
      req.end();
    });
  }

  connectToGateway() {
  return new Promise((resolve, reject) => {
    if (this.connecting) {
      console.warn("[Discord] Already connecting — skipping duplicate attempt");
      return;
    }
    this.connecting = true;

    if (this.ws) {
      try { this.ws.terminate(); } catch {}
      this.ws = null;
    }

    console.log("[Discord] Connecting to gateway:", this.gatewayUrl);
    this.ws = new WebSocket(this.gatewayUrl);

    let resolved = false;
    let timeout;

    // Timeout safeguard (will clear on success)
    timeout = setTimeout(() => {
      if (!resolved) {
        console.error("[Discord] Gateway timeout — no READY/RESUMED received");
        this.ws?.terminate();
        this.connecting = false;
        reject(new Error("Gateway timeout"));
      }
    }, 20000);

    this.ws.on("open", () => {
      console.log("[Discord] Gateway WebSocket opened");
    });

    this.ws.on("message", (data) => {
      let message;
      try {
        message = JSON.parse(data.toString());
      } catch (err) {
        console.error("[Discord] Parse error:", err);
        return;
      }

      this.handleGatewayMessage(message);

      if (message.op === 10) {
        this.startHeartbeat(message.d.heartbeat_interval);
        setTimeout(() => this.identify(), 250);
      }

      if ((message.t === "READY" || message.t === "RESUMED") && !resolved) {
        resolved = true;
        clearTimeout(timeout);
        this.connecting = false;
        console.log("[Discord] Gateway handshake complete ✅");
        this.connected = true;
        this.sessionId = message.d.session_id;
        resolve();
      }
    });

    this.ws.on("close", (code, reason) => {
      clearTimeout(timeout);
      this.connecting = false;
      console.warn(`[Discord] Gateway closed: ${code} ${reason}`);
      this.connected = false;
      this.emit("disconnected", { code, reason: reason?.toString() });
      this.handleDisconnection(code);
    });

    this.ws.on("error", (err) => {
      clearTimeout(timeout);
      this.connecting = false;
      console.error("[Discord] Gateway error:", err);
      if (!resolved) reject(err);
    });
  });
}



  handleDisconnection(code) {
    this.cleanup();

    const noReconnectCodes = [4004, 4010, 4011, 4012, 4013, 4014];
    if (noReconnectCodes.includes(code)) {
      console.error("[Discord] Fatal error, cannot reconnect");
      this.emit("fatalError", { code });
      return;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
      console.log(`[Discord] Reconnecting in ${delay}ms`);

      setTimeout(() => {
        this.reconnectAttempts++;
        this.reconnect();
      }, delay);
    }
  }

  handleGatewayMessage(message) {
    const { op, t, d, s } = message;

    if (s !== null && s !== undefined) {
      this.sequenceNumber = s;
    }

    switch (op) {
      case 10: // Hello
        this.startHeartbeat(d.heartbeat_interval);
        setTimeout(() => this.identify(), 100);

        break;
      case 11: // Heartbeat ACK
        this.heartbeatAcknowledged = true;
        break;
      case 0: // Dispatch
        this.handleDispatch(t, d);
        break;
      case 1: // Heartbeat request
        this.sendHeartbeat();
        break;
      case 7: // Reconnect
        this.reconnect();
        break;
      case 9: // Invalid session
        this.sessionId = null;
        this.sequenceNumber = null;
        setTimeout(() => this.identify(), 5000);
        break;
    }
  }

  handleDispatch(eventType, data) {
    switch (eventType) {
      case "READY":
        this.handleReady(data);
        break;
      case "MESSAGE_CREATE":
        this.handleNewMessage(data);
        break;
      case "MESSAGE_UPDATE":
        this.handleMessageUpdate(data);
        break;
      case "MESSAGE_DELETE":
        this.handleMessageDelete(data);
        break;
      case "CHANNEL_CREATE":
      case "CHANNEL_UPDATE":
        this.handleChannelUpdate(data);
        break;
      case "CHANNEL_DELETE":
        this.handleChannelDelete(data);
        break;
      case "GUILD_CREATE":
        this.processGuild(data);
        this.emit("guildUpdate", this.getState());
        break;
      case "GUILD_UPDATE":
        this.processGuild(data);
        this.emit("guildUpdate", this.getState());
        break;
      case "GUILD_DELETE":
        this.guilds.delete(data.id);
        this.emit("guildUpdate", this.getState());
        break;
    }
  }

  handleReady(data) {
    this.sessionId = data.session_id;
    this.userId = data.user.id;
    console.log(`[Discord] Ready! Logged in as ${data.user.username}`);

    this.dbManager.createUser({
      id: data.user.id,
      platform: "discord",
      username: data.user.username,
      display_name: data.user.global_name || data.user.username,
      avatar_url: data.user.avatar
        ? `https://cdn.discordapp.com/avatars/${data.user.id}/${data.user.avatar}.png`
        : null,
    });

    this.processGuilds(data.guilds);
    this.processPrivateChannels(data.private_channels || []);

    this.emit("ready", this.getState());
  }

  startHeartbeat(interval) {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatAcknowledged = true;

    this.heartbeatInterval = setInterval(() => {
      if (!this.heartbeatAcknowledged) {
        console.warn("[Discord] Heartbeat not acked, reconnecting");
        this.reconnect();
        return;
      }

      this.heartbeatAcknowledged = false;
      this.sendHeartbeat();
    }, interval);

    console.log(`[Discord] Heartbeat started: ${interval}ms`);
  }

  sendHeartbeat() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ op: 1, d: this.sequenceNumber }));
    }
  }

  identify() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const payload = {
      op: 2,
      d: {
        token: this.token,
        intents: 33281, // GUILDS + GUILD_MESSAGES + DIRECT_MESSAGES
        properties: {
          os:
            process.platform === "darwin"
              ? "Mac OS X"
              : process.platform === "linux"
              ? "Linux"
              : "Windows",
          browser: "Chrome",
          device: "",
        },
      },
    };
  if (this.identifying) {
    console.warn("[Discord] Identification already in progress — skipping");
    return;
  }

  this.identifying = true;
  this.ws.send(JSON.stringify(payload));
  console.log("[Discord] Identification payload sent");

  // Reset identifying flag after 5s (prevents duplicates)
  setTimeout(() => (this.identifying = false), 5000);
  }

  processGuilds(guilds) {
    guilds.forEach((guild) => this.processGuild(guild));
  }

  processGuild(guild) {
    this.guilds.set(guild.id, guild);

    if (guild.channels) {
      guild.channels.forEach((channel) => {
        if (channel.type === 0) {
          this.channels.set(channel.id, {
            ...channel,
            guild_id: guild.id,
            guild_name: guild.name,
          });

          this.dbManager.createChat({
            id: channel.id,
            platform: "discord",
            type: "channel",
            name: `#${channel.name} (${guild.name})`,
            description: channel.topic,
            participant_count: guild.member_count,
            last_message_id: channel.last_message_id,
          });
        }
      });
    }
  }

  processPrivateChannels(channels) {
    channels.forEach((channel) => {
      this.channels.set(channel.id, channel);

      if (channel.type === 1 && channel.recipients && channel.recipients[0]) {
        const recipient = channel.recipients[0];

        this.dbManager.createUser({
          id: recipient.id,
          platform: "discord",
          username: recipient.username,
          display_name: recipient.global_name || recipient.username,
          avatar_url: recipient.avatar
            ? `https://cdn.discordapp.com/avatars/${recipient.id}/${recipient.avatar}.png`
            : null,
        });

        this.dbManager.createChat({
          id: channel.id,
          platform: "discord",
          type: "dm",
          name: recipient.global_name || recipient.username,
          participant_count: 2,
          avatar_url: recipient.avatar
            ? `https://cdn.discordapp.com/avatars/${recipient.id}/${recipient.avatar}.png`
            : null,
          last_message_id: channel.last_message_id,
        });
      } else if (channel.type === 3) {
        const names = channel.recipients.map((r) => r.username).join(", ");

        this.dbManager.createChat({
          id: channel.id,
          platform: "discord",
          type: "group",
          name: channel.name || names,
          participant_count: channel.recipients.length + 1,
          last_message_id: channel.last_message_id,
        });

        channel.recipients.forEach((recipient) => {
          this.dbManager.createUser({
            id: recipient.id,
            platform: "discord",
            username: recipient.username,
            display_name: recipient.global_name || recipient.username,
            avatar_url: recipient.avatar
              ? `https://cdn.discordapp.com/avatars/${recipient.id}/${recipient.avatar}.png`
              : null,
          });
        });
      }
    });

    this.emit("channelsUpdate", this.getState());
  }

  handleNewMessage(messageData) {
    // Store user
    if (messageData.author) {
      this.dbManager.createUser({
        id: messageData.author.id,
        platform: "discord",
        username: messageData.author.username,
        display_name:
          messageData.author.global_name || messageData.author.username,
        avatar_url: messageData.author.avatar
          ? `https://cdn.discordapp.com/avatars/${messageData.author.id}/${messageData.author.avatar}.png`
          : null,
      });
    }

    // Store message
    this.dbManager.createMessage({
      id: messageData.id,
      chat_id: messageData.channel_id,
      user_id: messageData.author.id,
      content: messageData.content,
      message_type: this.getMessageType(messageData),
      attachments: messageData.attachments,
      reactions: messageData.reactions,
      embeds: messageData.embeds,
      timestamp: messageData.timestamp,
      sync_status: "synced",
      mentions: messageData.mentions,
      message_reference: messageData.message_reference || null,
      referenced_message: messageData.referenced_message || null,
      sticker_items : messageData.sticker_items
    });

    // Emit event for real-time UI update
    this.emit("newMessage", {
      chatId: messageData.channel_id,
      message: messageData,
    });
  }

  handleMessageUpdate(messageData) {
    if (messageData.author) {
      this.dbManager.createMessage({
        id: messageData.id,
        chat_id: messageData.channel_id,
        user_id: messageData.author.id,
        content: messageData.content,
        message_type: this.getMessageType(messageData),
        attachments: messageData.attachments,
        reactions: messageData.reactions,
        embeds: messageData.embeds,
        timestamp: messageData.timestamp,
        is_edited: 1,
        sync_status: "synced",
         mentions: messageData.mentions,
      message_reference: messageData.message_reference || null,
      referenced_message: messageData.referenced_message || null,
      sticker_items: messageData.sticker_items
      });

      this.emit("messageUpdate", {
        chatId: messageData.channel_id,
        message: messageData,
      });
    }
  }

  handleMessageDelete(data) {
    const stmt = this.dbManager.db.prepare(`
      UPDATE messages 
      SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    stmt.run(data.id);

    this.emit("messageDelete", {
      chatId: data.channel_id,
      messageId: data.id,
    });
  }

  handleChannelUpdate(channelData) {
    this.channels.set(channelData.id, channelData);

    if (channelData.type === 1 || channelData.type === 3) {
      const chatName =
        channelData.type === 1
          ? channelData.recipients[0]?.global_name ||
            channelData.recipients[0]?.username
          : channelData.name ||
            channelData.recipients.map((r) => r.username).join(", ");

      this.dbManager.createChat({
        id: channelData.id,
        platform: "discord",
        type: channelData.type === 1 ? "dm" : "group",
        name: chatName,
        participant_count: channelData.recipients
          ? channelData.recipients.length + 1
          : 2,
        last_message_id: channelData.last_message_id,
      });
    }

    this.emit("channelUpdate", channelData);
    this.emit("channelsUpdate", this.getState());
  }

  handleChannelDelete(channelData) {
    this.channels.delete(channelData.id);
    this.emit("channelDelete", channelData);
    this.emit("channelsUpdate", this.getState());
  }

  getMessageType(messageData) {
    if (messageData.attachments?.length > 0) {
      const attachment = messageData.attachments[0];
      if (attachment.content_type?.startsWith("image/")) return "image";
      if (attachment.content_type?.startsWith("video/")) return "video";
      return "file";
    }
    if (messageData.embeds?.length > 0) return "embed";
    return "text";
  }

  // API Methods
  async getDMs() {
    const chats = await this.dbManager.getChats("discord");
    return chats.filter((chat) => chat.type === "dm" || chat.type === "group");
  }

  async getGuilds() {
    return Array.from(this.guilds.values());
  }

  async getMessages(chatId, limit = 50, offset = 0) {
    return await this.dbManager.getMessages(chatId, limit, offset);
  }

  async getChatHistory(channelId, limit = 50, beforeMessageId = null) {
    try {
       return await this.makeRequest({
      path: `/api/v9/channels/${channelId}/messages?limit=${limit}${
        beforeMessageId ? `&before=${beforeMessageId}` : ""
      }`,
      method: "GET",
      channelId,
    });
    } catch (error) {
      console.error("[Discord] getChatHistory error:", error);
      throw error;
    }
   
  }

  async sendMessage(channelId, content, attachments = [],sticker_ids=[],message_reference = null
) {
    await this.checkRateLimit("message");
    await this.humanDelay();

    const nonce = this.generateNonce();
    const data = {
      content,
      nonce,
      tts: false,
      flags: 0,
      ...(attachments?.length ? { attachments } : {}),
      ...(sticker_ids?.length ? { sticker_ids } : {}),
       ...(message_reference ? { message_reference } : {}),
    };

    return this.makeRequest({
      path: `/api/v10/channels/${channelId}/messages`,
      method: "POST",
      data,
      channelId,
    });
  }

  async addReaction(channelId, messageId, emoji) {
    await this.checkRateLimit("general");
    await this.humanDelay();

    return this.makeRequest({
      path: `/api/v10/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(
        emoji
      )}/@me`,
      method: "PUT",
      channelId,
    });
  }

   async getStickerById(stickerId) {
    await this.checkRateLimit("general");
    await this.humanDelay();
    return this.makeRequest({
      path: `/stickers/${stickerId}.json`,
      method: "GET",
    });
  }
   async getStickerPacks(locale = "en-US") {
    await this.checkRateLimit("general");
    await this.humanDelay();
    return this.makeRequest({
      path: `api/v9/sticker-packs?/locale=${locale}`,
      method: "GET",
    });
  }
  async removeReaction(channelId, messageId, emoji) {
    await this.checkRateLimit("general");
    await this.humanDelay();

    return this.makeRequest({
      path: `/api/v10/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(
        emoji
      )}/@me`,
      method: "DELETE",
      channelId,
    });
  }

    async deleteMessages(channelId, messageId) {
    await this.checkRateLimit("general");
    await this.humanDelay();

    return this.makeRequest({
      path: `/api/v9/channels/${channelId}/messages/${messageId}`,
      method: "DELETE",
      channelId,
    });
  }

    async updateMessages(channelId, messageId,content) {
    await this.checkRateLimit("general");
    await this.humanDelay();

    return this.makeRequest({
      path: `/api/v9/channels/${channelId}/messages/${messageId}`,
      method: "PATCH",
      data:{content},
      channelId,
    });
  }

  async attachments(channelId, files) {
    await this.checkRateLimit("general");
    await this.humanDelay();

    return this.makeRequest({
      path: `/api/v10/channels/${channelId}/attachments`,
      method: "POST",
      data: { files },
      channelId,
    });
  }

  // Unified request handler
  makeRequest({ path, method = "GET", data = null, channelId = null }) {
    console.log(`[Discord] Making request: ${method} ${path}`);
    return new Promise((resolve, reject) => {
      const body = data ? JSON.stringify(data) : null;

      const options = {
        hostname: "discord.com",
        path,
        method,
        headers: this.getRealisticHeaders({
          Authorization: this.token,
          "Accept-Encoding": "identity",
          ...(body && {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(body),
          }),
          ...(channelId && {
            Referer: `https://discord.com/channels/@me/${channelId}`,
          }),
        }),
      };

      const req = https.request(options, (res) => {
        let responseData = "";
        res.on("data", (chunk) => (responseData += chunk));
        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsed = responseData ? JSON.parse(responseData) : {};

              // Store sent messages
              if (
                method === "POST" &&
                path.includes("/messages") &&
                parsed.id
              ) {
                this.dbManager.createMessage({
                  id: parsed.id,
                  chat_id: parsed.channel_id,
                  user_id: parsed.author.id,
                  content: parsed.content,
                  attachments: parsed.attachments,
                  reactions: parsed.reactions,
                  message_type: "text",
                  timestamp: parsed.timestamp,
                  sync_status: "synced",
                   mentions: parsed.mentions,
      message_reference: parsed.message_reference || null,
      referenced_message: parsed.referenced_message || null,
      sticker_items : parsed.sticker_items
                });
              }
              this.emit("newMessage", {
                chatId: parsed.channel_id,
                message: parsed,
              });

              resolve(parsed);
            } catch (error) {
              resolve(responseData);
            }
          } else if (res.statusCode === 429) {
            const retryAfter = res.headers["retry-after"] || 1;
            console.warn(`[Discord] Rate limited, retry after ${retryAfter}s`);
            setTimeout(() => {
              this.makeRequest({ path, method, data, channelId })
                .then(resolve)
                .catch(reject);
            }, retryAfter * 1000);
          } else if (res.statusCode === 400) {
            try {
              const errorData = JSON.parse(responseData);
              if (errorData.captcha_key?.includes("captcha-required")) {
                const captchaError = new Error("CAPTCHA required");
                captchaError.captchaRequired = true;
                captchaError.captchaData = {
                  sitekey: errorData.captcha_sitekey,
                  service: errorData.captcha_service,
                  sessionId: errorData.captcha_session_id,
                  rqdata: errorData.captcha_rqdata,
                  rqtoken: errorData.captcha_rqtoken,
                };
                this.emit("captchaRequired", captchaError.captchaData);
                reject(captchaError);
                return;
              }
            } catch (e) {}
            reject(
              new Error(`Request failed: ${res.statusCode} ${responseData}`)
            );
          } else {
            reject(
              new Error(`Request failed: ${res.statusCode} ${responseData}`)
            );
          }
        });
      });

      req.on("error", reject);
      req.setTimeout(15000, () => {
        req.destroy();
        reject(new Error("Request timeout"));
      });

      if (body) req.write(body);
      req.end();
    });
  }

  async sendMessageWithCaptcha(channelId, content, captchaToken, captchaData) {
    await this.checkRateLimit("message");
    await this.humanDelay();

    const nonce = this.generateNonce();
    const data = {
      content,
      nonce,
      tts: false,
      flags: 0,
      captcha_key: captchaToken,
      captcha_rqtoken: captchaData.rqtoken,
    };

    return this.makeRequest({
      path: `/api/v10/channels/${channelId}/messages`,
      method: "POST",
      data,
      channelId,
    });
  }

  reconnect() {
    console.log("[Discord] Reconnecting...");
    this.cleanup();

    if (this.token) {
      this.connect(this.token).catch((error) => {
        console.error("[Discord] Reconnection failed:", error);
      });
    }
  }

  cleanup() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.ws) {
      this.ws.removeAllListeners();
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close(1000, "Client cleanup");
      }
      this.ws = null;
    }

    this.heartbeatAcknowledged = true;
    this.connected = false;
  }

  disconnect() {
    console.log("[Discord] Disconnecting...");
    this.reconnectAttempts = this.maxReconnectAttempts;
       if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.ws) {
      this.ws.removeAllListeners();
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close(4001, "Client cleanup");
      }
      this.ws = null;
    }

    this.heartbeatAcknowledged = true;
    this.connected = false;
    this.emit("disconnected", { intentional: true });
  }

  isConnected() {
    return this.connected && this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

module.exports = DiscordClient;
