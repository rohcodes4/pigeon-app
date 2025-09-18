const { EventEmitter } = require("events");
const https = require("https");

class SyncManager extends EventEmitter {
  constructor(dbManager, securityManager) {
    super();
    this.dbManager = dbManager;
    this.securityManager = securityManager;

    // Sync configuration
    this.syncInterval = 60 * 1000; // 1 minute
    this.updateInterval = 30 * 60 * 1000; // 30 minutes
    this.batchSize = 100;

    // Backend configuration
    this.backendUrl = process.env.BACKEND_URL || "https://api.pingr.world";
    this.apiVersion = "v1";

    // Sync state
    this.isSyncing = false;
    this.lastSyncTime = null;
    this.lastUpdateTime = null;
    this.syncErrors = [];

    // Timers
    this.syncTimer = null;
    this.updateTimer = null;
  }

  startPeriodicSync() {
    console.log("[Sync] Starting periodic sync...");

    // Initial sync
    this.performSync();

    // Schedule periodic syncs
    this.syncTimer = setInterval(() => {
      this.performSync();
    }, this.syncInterval);

    // Schedule periodic updates from backend
    this.updateTimer = setInterval(() => {
      this.performUpdate();
    }, this.updateInterval);
  }

  stopPeriodicSync() {
    console.log("[Sync] Stopping periodic sync...");

    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }

  async performSync() {
    if (this.isSyncing) {
      console.log("[Sync] Sync already in progress, skipping...");
      return;
    }

    this.isSyncing = true;
    console.log("[Sync] Starting sync operation...");

    try {
      // Update sync state
      await this.dbManager.updateSyncState("discord", "push", {
        timestamp: new Date().toISOString(),
        status: "syncing",
      });

      // Get pending messages to sync
      const pendingMessages = await this.dbManager.getPendingSyncMessages(
        this.batchSize
      );

      if (pendingMessages.length === 0) {
        console.log("[Sync] No pending messages to sync");
        this.lastSyncTime = new Date();
        this.emit("sync-complete", { messageCount: 0 });
        return;
      }

      console.log(`[Sync] Syncing ${pendingMessages.length} messages...`);

      // Prepare sync payload
      const syncPayload = await this.prepareSyncPayload(pendingMessages);

      // Send to backend
      const result = await this.sendToBackend("/sync/messages", syncPayload);

      if (result.success) {
        // Update sync status for successfully synced messages
        await this.markMessagesSynced(pendingMessages.map((m) => m.id));

        console.log(
          `[Sync] Successfully synced ${pendingMessages.length} messages`
        );
        this.emit("sync-complete", { messageCount: pendingMessages.length });
      } else {
        throw new Error(result.error || "Sync failed");
      }

      // Update sync state
      await this.dbManager.updateSyncState("discord", "push", {
        timestamp: new Date().toISOString(),
        messageId: pendingMessages[pendingMessages.length - 1].id,
        status: "completed",
      });

      this.lastSyncTime = new Date();
      this.syncErrors = []; // Clear errors on successful sync
    } catch (error) {
      console.error("[Sync] Sync failed:", error);

      // Store error
      this.syncErrors.push({
        timestamp: new Date(),
        error: error.message,
      });

      // Update sync state with error
      await this.dbManager.updateSyncState("discord", "push", {
        timestamp: new Date().toISOString(),
        status: "error",
      });

      this.emit("sync-error", error);
    } finally {
      this.isSyncing = false;
    }
  }

  async performUpdate() {
    console.log("[Sync] Starting update from backend...");

    try {
      // Get last update timestamp
      const lastUpdateState = await this.dbManager.getSyncState(
        "discord",
        "pull"
      );
      const lastTimestamp =
        lastUpdateState?.last_sync_timestamp || new Date(0).toISOString();

      // Request updates from backend
      const updates = await this.getFromBackend(
        `/sync/updates?since=${encodeURIComponent(lastTimestamp)}`
      );

      if (updates.success && updates.data.length > 0) {
        console.log(
          `[Sync] Received ${updates.data.length} updates from backend`
        );

        // Process updates
        await this.processUpdates(updates.data);

        // Update sync state
        await this.dbManager.updateSyncState("discord", "pull", {
          timestamp: new Date().toISOString(),
          messageId: updates.data[updates.data.length - 1].id,
          status: "completed",
        });

        this.emit("updates-received", { updateCount: updates.data.length });
      } else {
        console.log("[Sync] No new updates from backend");
      }

      this.lastUpdateTime = new Date();
    } catch (error) {
      console.error("[Sync] Update failed:", error);

      await this.dbManager.updateSyncState("discord", "pull", {
        timestamp: new Date().toISOString(),
        status: "error",
      });

      this.emit("update-error", error);
    }
  }

  async prepareSyncPayload(messages) {
    // Get user device ID (generate if not exists)
    let deviceId = await this.getDeviceId();

    const payload = {
      deviceId: deviceId,
      timestamp: new Date().toISOString(),
      platform: "discord",
      messages: [],
    };

    for (const message of messages) {
      // Sanitize and prepare message data
      const messageData = {
        id: message.id,
        chatId: message.chat_id,
        userId: message.user_id,
        content: message.content_encrypted || message.content,
        messageType: message.message_type,
        timestamp: message.timestamp,
        isEdited: !!message.is_edited,
        attachments: message.attachments ? JSON.parse(message.attachments) : [],
        embeds: message.embeds ? JSON.parse(message.embeds) : [],
        reactions: message.reactions ? JSON.parse(message.reactions) : [],
      };

      // Encrypt sensitive data if not already encrypted
      if (
        !message.content_encrypted &&
        this.isSensitiveContent(message.content)
      ) {
        messageData.content = this.securityManager.encrypt(message.content);
        messageData.isEncrypted = true;
      }

      payload.messages.push(messageData);
    }

    return payload;
  }

  async processUpdates(updates) {
    const transaction = this.dbManager.db.transaction(() => {
      for (const update of updates) {
        switch (update.type) {
          case "message":
            this.processMessageUpdate(update);
            break;
          case "chat":
            this.processChatUpdate(update);
            break;
          case "user":
            this.processUserUpdate(update);
            break;
          case "deletion":
            this.processDeletion(update);
            break;
          default:
            console.warn("[Sync] Unknown update type:", update.type);
        }
      }
    });

    transaction();
  }

  processMessageUpdate(update) {
    const messageData = update.data;

    // Decrypt content if encrypted
    if (messageData.isEncrypted) {
      try {
        messageData.content = this.securityManager.decrypt(messageData.content);
      } catch (error) {
        console.error("[Sync] Failed to decrypt message content:", error);
        messageData.content = "[Encrypted content - decryption failed]";
      }
    }

    this.dbManager.createMessage({
      id: messageData.id,
      chat_id: messageData.chatId,
      user_id: messageData.userId,
      content: messageData.content,
      message_type: messageData.messageType || "text",
      attachments: messageData.attachments,
      embeds: messageData.embeds,
      reactions: messageData.reactions,
      timestamp: messageData.timestamp,
      is_edited: messageData.isEdited || 0,
      sync_status: "synced",
    });
  }

  processChatUpdate(update) {
    const chatData = update.data;

    this.dbManager.createChat({
      id: chatData.id,
      platform: chatData.platform || "discord",
      type: chatData.type,
      name: chatData.name,
      description: chatData.description,
      avatar_url: chatData.avatarUrl,
      participant_count: chatData.participantCount || 0,
    });
  }

  processUserUpdate(update) {
    const userData = update.data;

    this.dbManager.createUser({
      id: userData.id,
      platform: userData.platform || "discord",
      username: userData.username,
      display_name: userData.displayName,
      avatar_url: userData.avatarUrl,
    });
  }

  processDeletion(update) {
    const { itemType, itemId } = update.data;

    switch (itemType) {
      case "message":
        const stmt = this.dbManager.db.prepare(`
          UPDATE messages 
          SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `);
        stmt.run(itemId);
        break;

      case "chat":
        const chatStmt = this.dbManager.db.prepare(`
          UPDATE chats 
          SET is_active = 0, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `);
        chatStmt.run(itemId);
        break;
    }
  }

  async sendToBackend(endpoint, data) {
    return new Promise((resolve, reject) => {
      const payload = JSON.stringify(data);

      const options = {
        hostname: new URL(this.backendUrl).hostname,
        port: new URL(this.backendUrl).port || 443,
        path: `/${this.apiVersion}${endpoint}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
          "User-Agent": "Pigeon Desktop Client",
          Authorization: `Bearer ${this.getApiKey()}`,
        },
      };

      const req = https.request(options, (res) => {
        let responseData = "";

        res.on("data", (chunk) => {
          responseData += chunk;
        });

        res.on("end", () => {
          try {
            const result = JSON.parse(responseData);

            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(result);
            } else {
              resolve({
                success: false,
                error: result.error || "Request failed",
              });
            }
          } catch (error) {
            resolve({ success: false, error: "Invalid response format" });
          }
        });
      });

      req.on("error", (error) => {
        reject(error);
      });

      req.write(payload);
      req.end();
    });
  }

  async getFromBackend(endpoint) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: new URL(this.backendUrl).hostname,
        port: new URL(this.backendUrl).port || 443,
        path: `/${this.apiVersion}${endpoint}`,
        method: "GET",
        headers: {
          "User-Agent": "Pigeon Desktop Client",
          Authorization: `Bearer ${this.getApiKey()}`,
        },
      };

      const req = https.request(options, (res) => {
        let responseData = "";

        res.on("data", (chunk) => {
          responseData += chunk;
        });

        res.on("end", () => {
          try {
            const result = JSON.parse(responseData);

            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(result);
            } else {
              resolve({
                success: false,
                error: result.error || "Request failed",
              });
            }
          } catch (error) {
            resolve({ success: false, error: "Invalid response format" });
          }
        });
      });

      req.on("error", (error) => {
        reject(error);
      });

      req.end();
    });
  }

  async markMessagesSynced(messageIds) {
    const placeholders = messageIds.map(() => "?").join(",");
    const stmt = this.dbManager.db.prepare(`
      UPDATE messages 
      SET sync_status = 'synced', updated_at = CURRENT_TIMESTAMP 
      WHERE id IN (${placeholders})
    `);

    stmt.run(...messageIds);
  }

  async getDeviceId() {
    const settings = await this.dbManager.getSettings();

    if (settings.deviceId) {
      return settings.deviceId;
    }

    // Generate new device ID
    const deviceId = this.securityManager.generateSecureId(16);
    await this.dbManager.updateSettings({ deviceId });

    return deviceId;
  }

  getApiKey() {
    // This should be a real one in prod
    return process.env.PIGEON_API_KEY || "demo-api-key";
  }

  isSensitiveContent(content) {
    if (!content || typeof content !== "string") {
      return false;
    }

    // Define patterns that indicate sensitive content
    const sensitivePatterns = [
      /password/i,
      /token/i,
      /secret/i,
      /key/i,
      /credential/i,
      /auth/i,
      /login/i,
      /private/i,
      /confidential/i,
      /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/, // Credit card
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
    ];

    return sensitivePatterns.some((pattern) => pattern.test(content));
  }

  async getSyncStatus() {
    const pushState = await this.dbManager.getSyncState("discord", "push");
    const pullState = await this.dbManager.getSyncState("discord", "pull");
    const pendingCount = await this.dbManager
      .getPendingSyncMessages(1)
      .then((result) => (result.length > 0 ? "yes" : "no"));

    return {
      lastSyncTime: this.lastSyncTime,
      lastUpdateTime: this.lastUpdateTime,
      isSyncing: this.isSyncing,
      pushState: pushState,
      pullState: pullState,
      hasPendingMessages: pendingCount === "yes",
      errorCount: this.syncErrors.length,
      lastErrors: this.syncErrors.slice(-5), // Last 5 errors
    };
  }

  // Manual sync trigger
  async triggerManualSync() {
    console.log("[Sync] Manual sync triggered");
    await this.performSync();
  }

  // Force update from backend
  async triggerManualUpdate() {
    console.log("[Sync] Manual update triggered");
    await this.performUpdate();
  }
}

module.exports = SyncManager;
