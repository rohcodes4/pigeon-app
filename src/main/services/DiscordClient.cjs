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
    this.isConnected = false;
    this.heartbeatInterval = null;
    this.sessionId = null;
    this.sequenceNumber = null;
    this.userId = null;
    this.guilds = new Map();
    this.channels = new Map();
    this.users = new Map();

    // Discord endpoints here
    this.apiBase = "https://discord.com/api/v10";
    this.gatewayUrl = "wss://gateway.discord.gg/?v=10&encoding=json";

    // Realistic browser headers to avoid detection
    this.userAgent = this.getRealisticUserAgent();
  }

  getRealisticUserAgent() {
    const chromeVersion = "120.0.0.0";
    switch (process.platform) {
      case "darwin":
        return `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
      case "linux":
        return `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
      default: // Windows
        return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
    }
  }

  getRealisticHeaders(additionalHeaders = {}) {
    return {
      "User-Agent": this.userAgent,
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      DNT: "1",
      Connection: "keep-alive",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
      "Sec-CH-UA":
        '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      "Sec-CH-UA-Mobile": "?0",
      "Sec-CH-UA-Platform": `"${this.getRealisticOSName()}"`,
      ...additionalHeaders,
    };
  }

  // Add a small delay to make requests look more human-like
  async humanDelay() {
    const delay = Math.random() * 1000 + 500; // 500-1500ms
    return new Promise((resolve) => setTimeout(resolve, delay));
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
      this.isConnected = true;
      this.emit("connected");
    } catch (error) {
      console.error("[Discord] Connection failed:", error);
      this.isConnected = false;
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
        this.isConnected = false;
        this.emit("disconnected");
        this.cleanup();
      });

      this.ws.on("error", (error) => {
        console.error("[Discord] Gateway error:", error);
        this.isConnected = false;
        this.emit("error", error);
        reject(error);
      });

      // Set connection timeout
      setTimeout(() => {
        if (!this.isConnected) {
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

  async sendMessage(channelId, content) {
    await this.humanDelay();

    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        content: content,
        tts: false,
      });

      const options = {
        hostname: "discord.com",
        path: `/api/v10/channels/${channelId}/messages`,
        method: "POST",
        headers: this.getRealisticHeaders({
          Authorization: this.token,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        }),
      };

      const req = https.request(options, (res) => {
        let responseData = "";

        res.on("data", (chunk) => {
          responseData += chunk;
        });

        res.on("end", () => {
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
        reject(error);
      });

      req.write(data);
      req.end();
    });
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

    this.isConnected = false;
  }

  disconnect() {
    console.log("[Discord] Disconnecting...");
    this.cleanup();
    this.emit("disconnected");
  }

  isConnected() {
    return this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

module.exports = DiscordClient;
