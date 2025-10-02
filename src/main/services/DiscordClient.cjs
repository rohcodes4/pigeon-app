const WebSocket = require("ws");
const https = require("https");
const { EventEmitter } = require("events");

class DiscordClient extends EventEmitter {
  constructor(dbManager, securityManager) {
    super();
    this.dbManager = dbManager;
    this.securityManager = securityManager;
    this.token = null;
    this.ws = null;
    this.connected = false;
    this.heartbeatInterval = null;
    this.sessionId = null;
    this.sequenceNumber = null;
    this.userId = null;
    this.guilds = new Map();
    this.channels = new Map();
    this.users = new Map();

    // Discord endpoints here
    this.apiBase = "https://discord.com/api/v9";
    this.gatewayUrl = "wss://gateway.discord.gg/?v=10&encoding=json";

    // Realistic browser headers to avoid detection
    this.userAgent = this.getRealisticUserAgent();

    // Rate limiting
    this.lastMessageTime = 0;
    this.messageCount = 0;
    this.rateLimitWindow = 60000;
    this.maxMessagesPerMinute = 10;
  }

  getRealisticUserAgent() {
    const chromeVersion = "140.0.0.0";
    switch (process.platform) {
      case "darwin":
        return `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
      case "linux":
        return `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
      default: // Windows
        return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
    }
  }

  generateNonce() {
    const timestamp = Date.now() - 1420070400000; // Discord epoch, different from normal one
    const random = Math.floor(Math.random() * 4096);
    return ((BigInt(timestamp) << 22n) | BigInt(random)).toString();
  }

  // Generate x-super-properties to prevent triggering the captcha thing
  getSuperProperties() {
    const props = {
      os:
        process.platform === "darwin"
          ? "Mac OS X"
          : process.platform === "linux"
          ? "Linux"
          : "Windows",
      browser: "Chrome",
      device: "",
      system_locale: "en-US",
      has_client_mods: false,
      browser_user_agent: this.getRealisticUserAgent(),
      browser_version: "140.0.0.0",
      os_version: process.platform === "darwin" ? "10.15.7" : "10.0.19041",
      referrer: "",
      referring_domain: "",
      referrer_current: "",
      referring_domain_current: "",
      release_channel: "stable",
      client_build_number: 446694,
      client_event_source: null,
    };
    return Buffer.from(JSON.stringify(props)).toString("base64");
  }

  getContextProperties() {
    const context = { location: "chat_input" };
    return Buffer.from(JSON.stringify(context)).toString("base64");
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
        '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
      "Sec-CH-UA-Mobile": "?0",
      "Sec-CH-UA-Platform": `"${this.getRealisticOSName()}"`,
      "x-discord-locale": "en-US",
      "x-discord-timezone": Intl.DateTimeFormat().resolvedOptions().timeZone,
      "x-super-properties": this.getSuperProperties(),
      "x-context-properties": this.getContextProperties(),
      "x-debug-options": "bugReporterEnabled",
      ...additionalHeaders,
    };
  }

  // Add a small delay to make requests look more human-like
  async humanDelay() {
    const delay = Math.random() * 1000 + 500; // 500-1500ms
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  // Check and enforce rate limiting
  async checkRateLimit() {
    const now = Date.now();

    if (now - this.lastMessageTime > this.rateLimitWindow) {
      this.messageCount = 0;
      this.lastMessageTime = now;
    }

    if (this.messageCount >= this.maxMessagesPerMinute) {
      const waitTime = this.rateLimitWindow - (now - this.lastMessageTime);
      console.log(`[Discord] Rate limit reached, waiting ${waitTime}ms`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      this.messageCount = 0;
      this.lastMessageTime = Date.now();
    }

    this.messageCount++;
  }

  async connect(token) {
    try {
      if (!this.securityManager.validateDiscordToken(token)) {
        throw new Error("Invalid Discord token format");
      }

      this.token = token;

      // Test token validity with a simple API call
      await this.testTokenValidity();

      // Store token securely
      await this.securityManager.storeDiscordToken(token);

      // Connect to Discord Gateway
      await this.connectToGateway();

      console.log("[Discord] Successfully connected");
      this.connected = true;
      this.emit("connected");
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

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          if (res.statusCode === 200) {
            try {
              const userData = JSON.parse(data);
              this.userId = userData.id;
              console.log(
                "[Discord] Token validated for user:",
                userData.username
              );
              resolve(userData);
            } catch (error) {
              reject(new Error("Failed to parse user data"));
            }
          } else {
            reject(
              new Error(`Token validation failed: ${res.statusCode} ${data}`)
            );
          }
        });
      });

      req.on("error", (error) => {
        reject(error);
      });

      req.end();
    });
  }

  connectToGateway() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.gatewayUrl);

      this.ws.on("open", () => {
        console.log("[Discord] Gateway connection opened");
      });

      this.ws.on("message", (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleGatewayMessage(message);

          if (message.t === "READY") {
            resolve();
          }
        } catch (error) {
          console.error("[Discord] Failed to parse gateway message:", error);
        }
      });

      this.ws.on("close", (code, reason) => {
        console.log(`[Discord] Gateway connection closed: ${code} ${reason}`);
        this.connected = false;
        this.emit("disconnected");
        this.cleanup();
      });

      this.ws.on("error", (error) => {
        console.error("[Discord] Gateway error:", error);
        this.connected = false;
        this.emit("error", error);
        reject(error);
      });

      // Set connection timeout
      setTimeout(() => {
        if (!this.connected) {
          reject(new Error("Gateway connection timeout"));
        }
      }, 15000);
    });
  }

  handleGatewayMessage(message) {
    const { op, t, d, s } = message;

    if (s !== null) {
      this.sequenceNumber = s;
    }

    switch (op) {
      case 10: // Hello
        this.startHeartbeat(d.heartbeat_interval);
        this.identify();
        break;

      case 11: // Heartbeat ACK
        console.log("[Discord] Heartbeat acknowledged");
        break;

      case 0: // Dispatch
        this.handleDispatch(t, d);
        break;

      case 1: // Heartbeat request
        this.sendHeartbeat();
        break;

      case 7: // Reconnect
        console.log("[Discord] Server requested reconnect");
        this.reconnect();
        break;

      case 9: // Invalid session
        console.log("[Discord] Invalid session, reconnecting");
        setTimeout(() => this.reconnect(), 5000);
        break;

      default:
        console.log(`[Discord] Unknown opcode: ${op}`);
    }
  }

  handleDispatch(eventType, data) {
    switch (eventType) {
      case "READY":
        this.sessionId = data.session_id;
        this.userId = data.user.id;
        console.log(
          `[Discord] Ready! Logged in as ${data.user.username}#${data.user.discriminator}`
        );

        // Store user data
        this.dbManager.createUser({
          id: data.user.id,
          platform: "discord",
          username: `${data.user.username}#${data.user.discriminator}`,
          display_name: data.user.global_name || data.user.username,
          avatar_url: data.user.avatar
            ? `https://cdn.discordapp.com/avatars/${data.user.id}/${data.user.avatar}.png`
            : null,
        });

        // Store guilds and channels
        this.processGuilds(data.guilds);
        this.processPrivateChannels(data.private_channels);
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

      case "GUILD_CREATE":
        this.processGuild(data);
        break;

      default:
        console.log(`[Discord] Unhandled event: ${eventType}`);
    }
  }

  startHeartbeat(interval) {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, interval);

    console.log(`[Discord] Heartbeat started with ${interval}ms interval`);
  }

  sendHeartbeat() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          op: 1,
          d: this.sequenceNumber,
        })
      );
    }
  }

  getRealisticOSName() {
    switch (process.platform) {
      case "win32":
        return "Windows";
      case "darwin":
        return "Mac OS X";
      case "linux":
        return "Linux";
      default:
        return "Windows"; // Default to Windows
    }
  }

  identify() {
    const payload = {
      op: 2,
      d: {
        token: this.token,
        intents: 513, // GUILDS (1) + DIRECT_MESSAGES (512)
        properties: {
          $os: this.getRealisticOSName(),
          $browser: "Chrome",
          $device: "desktop",
        },
      },
    };

    this.ws.send(JSON.stringify(payload));
    console.log("[Discord] Identification sent");
  }

  processGuilds(guilds) {
    for (const guild of guilds) {
      this.processGuild(guild);
    }
  }

  processGuild(guild) {
    this.guilds.set(guild.id, guild);

    if (guild.channels) {
      for (const channel of guild.channels) {
        if (channel.type === 0) {
          // Text channel
          this.channels.set(channel.id, {
            ...channel,
            guild_id: guild.id,
            guild_name: guild.name,
          });

          // Store as chat
          this.dbManager.createChat({
            id: channel.id,
            platform: "discord",
            type: "channel",
            name: `#${channel.name} (${guild.name})`,
            description: channel.topic,
            participant_count: guild.member_count,
            last_message_id: channel?.last_message_id,
            last_message_timestamp: channel?.last_message_timestamp
          });
        }
      }
    }
  }

  processPrivateChannels(channels) {
    for (const channel of channels) {
      this.channels.set(channel.id, channel);

      if (channel.type === 1) {
        // DM
        const recipient = channel.recipients[0];
        if (recipient) {
          // Store user
          this.dbManager.createUser({
            id: recipient.id,
            platform: "discord",
            username: `${recipient.username}#${recipient.discriminator}`,
            display_name: recipient.global_name || recipient.username,
            avatar_url: recipient.avatar
              ? `https://cdn.discordapp.com/avatars/${recipient.id}/${recipient.avatar}.png`
              : null,
          });

          // Store chat
          this.dbManager.createChat({
            id: channel.id,
            platform: "discord",
            type: "dm",
            name: recipient.global_name || recipient.username,
            participant_count: 2,
            avatar_url: recipient.avatar
              ? `https://cdn.discordapp.com/avatars/${recipient.id}/${recipient.avatar}.png`
              : null,
               last_message_id: channel?.last_message_id,
            last_message_timestamp: channel?.last_message_timestamp,

          });
        }
      } else if (channel.type === 3) {
        // Group DM
        const names = channel.recipients.map((r) => r.username).join(", ");

        this.dbManager.createChat({
          id: channel.id,
          platform: "discord",
          type: "group",
          name: channel.name || names,
          participant_count: channel.recipients.length + 1,
           last_message_id: channel?.last_message_id,
            last_message_timestamp: channel?.last_message_timestamp

        });

        // Store all recipients
        for (const recipient of channel.recipients) {
          this.dbManager.createUser({
            id: recipient.id,
            platform: "discord",
            username: `${recipient.username}#${recipient.discriminator}`,
            display_name: recipient.global_name || recipient.username,
            avatar_url: recipient.avatar
              ? `https://cdn.discordapp.com/avatars/${recipient.id}/${recipient.avatar}.png`
              : null,
          });
        }
      }
    }
  }

  handleNewMessage(messageData) {
    // Store message in database
    this.dbManager.createMessage({
      id: messageData.id,
      chat_id: messageData.channel_id,
      user_id: messageData.author.id,
      content: messageData.content,
      message_type: this.getMessageType(messageData),
      attachments: messageData.attachments,
      embeds: messageData.embeds,
      timestamp: messageData.timestamp,
      sync_status: "synced",
    });

    // Store author if not exists
    this.dbManager.createUser({
      id: messageData.author.id,
      platform: "discord",
      username: `${messageData.author.username}#${messageData.author.discriminator}`,
      display_name:
        messageData.author.global_name || messageData.author.username,
      avatar_url: messageData.author.avatar
        ? `https://cdn.discordapp.com/avatars/${messageData.author.id}/${messageData.author.avatar}.png`
        : null,
    });

    this.emit("message", messageData);
  }

  handleMessageUpdate(messageData) {
    // Handle message edits
    this.dbManager.createMessage({
      id: messageData.id,
      chat_id: messageData.channel_id,
      user_id: messageData.author?.id,
      content: messageData.content,
      message_type: this.getMessageType(messageData),
      attachments: messageData.attachments,
      embeds: messageData.embeds,
      timestamp: messageData.timestamp,
      is_edited: 1,
      sync_status: "synced",
    });
  }

  handleMessageDelete(data) {
    // Mark message as deleted
    const stmt = this.dbManager.db.prepare(`
      UPDATE messages 
      SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    stmt.run(data.id);
  }

  handleChannelUpdate(channelData) {
    this.channels.set(channelData.id, channelData);

    // Update chat information
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
           last_message_id: channel?.last_message_id,
            last_message_timestamp: channel?.last_message_timestamp

      });
    }
  }

  getMessageType(messageData) {
    if (messageData.attachments && messageData.attachments.length > 0) {
      const attachment = messageData.attachments[0];
      if (attachment.content_type?.startsWith("image/")) {
        return "image";
      }
      return "file";
    }

    if (messageData.embeds && messageData.embeds.length > 0) {
      return "embed";
    }

    return "text";
  }

  async getDMs() {
    try {
      const dms = await this.dbManager.getChats("discord");
      return dms.filter((chat) => chat.type === "dm" || chat.type === "group");
    } catch (error) {
      console.error("[Discord] Failed to get DMs:", error);
      throw error;
    }
  }

   async getGuilds() {
    try {
      return this.guilds;
    }
    catch (error) { 
      console.error("[Discord] Failed to get Guilds:", error);
      throw error;
    } 
  }

  async getMessages(chatId, limit = 50, offset = 0) {
    try {
      const msg = await this.dbManager.getMessages(chatId, limit, offset);
      return msg;
    } catch (error) {
      console.error("[Discord] Failed to get DMs:", error);
      throw error;
    }
  }

  async attachments(channelId,files) {
    try {
      // Rate limiting check
      await this.checkRateLimit();

      // Human-like delay
      await this.humanDelay();

      return new Promise((resolve, reject) => {
        const data = JSON.stringify({
          files: files
        
        });

        const options = {
          hostname: "discord.com",
          path: `/api/v9/channels/${channelId}/attachments`,
          method: "POST",
          headers: this.getRealisticHeaders({
            Authorization: this.token,
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(data),
            Referer: `https://discord.com/channels/@me/${channelId}`,
            "Accept-Encoding": "identity",
          }),
        };

        const req = https.request(options, (res) => {
          let responseData = "";

          res.on("data", (chunk) => {
            responseData += chunk;
          });

          res.on("end", () => {
            console.log(`[Discord] Response status: ${res.statusCode}`);
            console.log(`[Discord] Response data: ${responseData}`);

            if (res.statusCode === 200 || res.statusCode === 201) {
              try {
                const attachment = JSON.parse(responseData);

                // Store sent message in database
                // this.dbManager.createMessage({
                //   id: messageData.id,
                //   chat_id: messageData.channel_id,
                //   user_id: messageData.author.id,
                //   content: messageData.content,
                //   message_type: "text",
                //   timestamp: messageData.timestamp,
                //   sync_status: "synced",
                // });

                resolve(attachment);
              } catch (error) {
                reject(new Error("Failed to parse response"));
              }
            } else if (res.statusCode === 400) {
              // Handle CAPTCHA
              try {
                const errorData = JSON.parse(responseData);
                if (
                  errorData.captcha_key &&
                  errorData.captcha_key.includes("captcha-required")
                ) {
                  const captchaError = new Error("CAPTCHA required");
                  captchaError.captchaRequired = true;
                  captchaError.captchaData = {
                    sitekey: errorData.captcha_sitekey,
                    service: errorData.captcha_service,
                    sessionId: errorData.captcha_session_id,
                    rqdata: errorData.captcha_rqdata,
                    rqtoken: errorData.captcha_rqtoken,
                  };
                  console.log(
                    "[Discord] CAPTCHA required:",
                    captchaError.captchaData
                  );

                  this.emit("captchaRequired", captchaError.captchaData);

                  reject(captchaError);
                  return;
                }
              } catch (parseError) {}

              reject(
                new Error(
                  `Attachment send failed: ${res.statusCode} ${responseData}`
                )
              );
            } else {
              reject(
                new Error(
                  `Attachment send failed: ${res.statusCode} ${responseData}`
                )
              );
            }
          });
        });

        req.on("error", (error) => {
          console.error("[Discord] Request error:", error);
          reject(error);
        });

        req.write(data);
        req.end();
      });
    } catch (error) {
      console.error("[Discord] Send message error:", error);
      throw error;
    } 
  }

   async getChatHistory(channelId,limit = 50, beforeMessageId = null) {
    try {
      // Rate limiting check
      await this.checkRateLimit();

      // Human-like delay
      await this.humanDelay();

      return new Promise((resolve, reject) => {
    
       
        let url=`/api/v9/channels/${channelId}/messages?limit=${limit}`;
        if(beforeMessageId){
          url+=`&before=${beforeMessageId}`;
        }
        const options = {
          hostname: "discord.com",
          path: url,
          method: "GET",
          headers: this.getRealisticHeaders({
            Authorization: this.token,
            "Content-Type": "application/json",
        
            Referer: `https://discord.com/channels/@me/${channelId}`,
            "Accept-Encoding": "identity",
          }),
        };

        const req = https.request(options, (res) => {
          let responseData = "";

          res.on("data", (chunk) => {
            responseData += chunk;
          });

          res.on("end", () => {
            console.log(`[Discord] Response status: ${res.statusCode}`);
            console.log(`[Discord] Response data: ${responseData}`);

            if (res.statusCode === 200 || res.statusCode === 201) {
              try {
                const chatHistory = JSON.parse(responseData);

                // Store sent message in database
                // this.dbManager.createMessage({
                //   id: messageData.id,
                //   chat_id: messageData.channel_id,
                //   user_id: messageData.author.id,
                //   content: messageData.content,
                //   message_type: "text",
                //   timestamp: messageData.timestamp,
                //   sync_status: "synced",
                // });

                resolve(chatHistory);
              } catch (error) {
                reject(new Error("Failed to parse response"));
              }
            } else if (res.statusCode === 400) {
              // Handle CAPTCHA
              try {
                const errorData = JSON.parse(responseData);
                if (
                  errorData.captcha_key &&
                  errorData.captcha_key.includes("captcha-required")
                ) {
                  const captchaError = new Error("CAPTCHA required");
                  captchaError.captchaRequired = true;
                  captchaError.captchaData = {
                    sitekey: errorData.captcha_sitekey,
                    service: errorData.captcha_service,
                    sessionId: errorData.captcha_session_id,
                    rqdata: errorData.captcha_rqdata,
                    rqtoken: errorData.captcha_rqtoken,
                  };
                  console.log(
                    "[Discord] CAPTCHA required:",
                    captchaError.captchaData
                  );

                  this.emit("captchaRequired", captchaError.captchaData);

                  reject(captchaError);
                  return;
                }
              } catch (parseError) {}

              reject(
                new Error(
                  `chathistory retrieve failed: ${res.statusCode} ${responseData}`
                )
              );
            } else {
              reject(
                new Error(
                  `chathistory retrieve send failed: ${res.statusCode} ${responseData}`
                )
              );
            }
          });
        });

        req.on("error", (error) => {
          console.error("[Discord] Request error:", error);
          reject(error);
        });
        req.end();
      });
    } catch (error) {
      console.error("[Discord] Send message error:", error);
      throw error;
    } 
  }
  async sendMessage(channelId, content, attachments = []) {
    try {
      // Rate limiting check
      await this.checkRateLimit();

      // Human-like delay
      await this.humanDelay();

      return new Promise((resolve, reject) => {
        const nonce = this.generateNonce();
        const data = JSON.stringify({
          attachments: attachments,
          mobile_network_type: "unknown",
          content: content,
          nonce: nonce,
          tts: false,
          flags: 0,
        });

        const options = {
          hostname: "discord.com",
          path: `/api/v9/channels/${channelId}/messages`,
          method: "POST",
          headers: this.getRealisticHeaders({
            Authorization: this.token,
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(data),
            Referer: `https://discord.com/channels/@me/${channelId}`,
            "Accept-Encoding": "identity",
          }),
        };

        const req = https.request(options, (res) => {
          let responseData = "";

          res.on("data", (chunk) => {
            responseData += chunk;
          });

          res.on("end", () => {
            console.log(`[Discord] Response status: ${res.statusCode}`);
            console.log(`[Discord] Response data: ${responseData}`);

            if (res.statusCode === 200 || res.statusCode === 201) {
              try {
                const messageData = JSON.parse(responseData);

                // Store sent message in database
                this.dbManager.createMessage({
                  id: messageData.id,
                  chat_id: messageData.channel_id,
                  user_id: messageData.author.id,
                  content: messageData.content,
                  message_type: "text",
                  timestamp: messageData.timestamp,
                  sync_status: "synced",
                });

                resolve(messageData);
              } catch (error) {
                reject(new Error("Failed to parse response"));
              }
            } else if (res.statusCode === 400) {
              // Handle CAPTCHA
              try {
                const errorData = JSON.parse(responseData);
                if (
                  errorData.captcha_key &&
                  errorData.captcha_key.includes("captcha-required")
                ) {
                  const captchaError = new Error("CAPTCHA required");
                  captchaError.captchaRequired = true;
                  captchaError.captchaData = {
                    sitekey: errorData.captcha_sitekey,
                    service: errorData.captcha_service,
                    sessionId: errorData.captcha_session_id,
                    rqdata: errorData.captcha_rqdata,
                    rqtoken: errorData.captcha_rqtoken,
                  };
                  console.log(
                    "[Discord] CAPTCHA required:",
                    captchaError.captchaData
                  );

                  this.emit("captchaRequired", captchaError.captchaData);

                  reject(captchaError);
                  return;
                }
              } catch (parseError) {}

              reject(
                new Error(
                  `Message send failed: ${res.statusCode} ${responseData}`
                )
              );
            } else {
              reject(
                new Error(
                  `Message send failed: ${res.statusCode} ${responseData}`
                )
              );
            }
          });
        });

        req.on("error", (error) => {
          console.error("[Discord] Request error:", error);
          reject(error);
        });

        req.write(data);
        req.end();
      });
    } catch (error) {
      console.error("[Discord] Send message error:", error);
      throw error;
    }
  }

  // resend message with CAPTCHA
  async sendMessageWithCaptcha(channelId, content, captchaToken, captchaData) {
    try {
      await this.checkRateLimit();

      await this.humanDelay();

      return new Promise((resolve, reject) => {
        const nonce = this.generateNonce();
        const data = JSON.stringify({
          mobile_network_type: "unknown",
          content: content,
          nonce: nonce,
          tts: false,
          flags: 0,
          captcha_key: captchaToken,
          captcha_rqtoken: captchaData.rqtoken,
        });

        const options = {
          hostname: "discord.com",
          path: `/api/v9/channels/${channelId}/messages`,
          method: "POST",
          headers: this.getRealisticHeaders({
            Authorization: this.token,
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(data),
            Referer: `https://discord.com/channels/@me/${channelId}`,
          }),
        };

        const req = https.request(options, (res) => {
          let responseData = "";

          res.on("data", (chunk) => {
            responseData += chunk;
          });

          res.on("end", () => {
            console.log(`[Discord] CAPTCHA Response status: ${res.statusCode}`);
            console.log(`[Discord] CAPTCHA Response data: ${responseData}`);

            if (res.statusCode === 200 || res.statusCode === 201) {
              try {
                const messageData = JSON.parse(responseData);

                // Store sent message in database
                this.dbManager.createMessage({
                  id: messageData.id,
                  chat_id: messageData.channel_id,
                  user_id: messageData.author.id,
                  content: messageData.content,
                  message_type: "text",
                  timestamp: messageData.timestamp,
                  sync_status: "synced",
                });

                console.log(
                  "[Discord] Message sent successfully after CAPTCHA"
                );
                resolve(messageData);
              } catch (error) {
                reject(new Error("Failed to parse response"));
              }
            } else {
              reject(
                new Error(
                  `Message send failed after CAPTCHA: ${res.statusCode} ${responseData}`
                )
              );
            }
          });
        });

        req.on("error", (error) => {
          console.error("[Discord] CAPTCHA Request error:", error);
          reject(error);
        });

        req.write(data);
        req.end();
      });
    } catch (error) {
      console.error("[Discord] Send message with CAPTCHA error:", error);
      throw error;
    }
  }

  reconnect() {
    console.log("[Discord] Attempting to reconnect...");
    this.cleanup();

    setTimeout(() => {
      if (this.token) {
        this.connect(this.token).catch((error) => {
          console.error("[Discord] Reconnection failed:", error);
        });
      }
    }, 5000);
  }

  cleanup() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.ws) {
      this.ws.removeAllListeners();
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close();
      }
      this.ws = null;
    }

    this.connected = false;
  }

  disconnect() {
    console.log("[Discord] Disconnecting...");
    this.cleanup();
    this.emit("disconnected");
  }

  isConnected() {
    return this.connected && this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

module.exports = DiscordClient;
