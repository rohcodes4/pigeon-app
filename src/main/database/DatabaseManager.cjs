const Database = require("better-sqlite3");
const path = require("path");
const { app } = require("electron");
const CryptoJS = require("crypto-js");
const fs = require("fs");
class DatabaseManager {
  constructor(securityManager) {
    this.securityManager = securityManager;
    this.db = null;
    this.dbPath = !app.isPackaged
  ? path.join(__dirname, "pigeon.db")  // fixed file in project folder
  : path.join(app.getPath("userData"), "pigeon.db"); // production
  }

  async initialize() {
    try {
      this.db = new Database(this.dbPath);
      this.db.pragma("journal_mode = WAL");
      this.db.pragma("foreign_keys = ON");

      await this.createTables();
      await this.createIndexes();

      console.log("[DB] Database initialized successfully");
    } catch (error) {
      console.error("[DB] Initialization error:", error);
      throw error;
    }
  }

  createTables() {
    const tables = [
      // Users table for storing user infos
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        platform TEXT NOT NULL,
        username TEXT,
        display_name TEXT,
        avatar_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Chats table for storing chat infos
      `CREATE TABLE IF NOT EXISTS chats (
        id TEXT PRIMARY KEY,
        platform TEXT NOT NULL,
        type TEXT NOT NULL, -- 'dm', 'group', 'channel'
        name TEXT,
        description TEXT,
        avatar_url TEXT,
        participant_count INTEGER DEFAULT 0,
        last_message_id TEXT,
        last_message_timestamp DATETIME,
        is_active BOOLEAN DEFAULT 1,
        is_pinned BOOLEAN DEFAULT 0,
        is_muted BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Messages table
      `CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        chat_id TEXT NOT NULL,
        user_id TEXT,
        content TEXT,
        content_encrypted TEXT, -- encrypted sensitive content
        message_type TEXT DEFAULT 'text', -- 'text', 'image', 'file', 'embed'
        reply_to_id TEXT,
        edit_history TEXT, -- JSON array of edits
        attachments TEXT, -- JSON array of attachments
        embeds TEXT, -- JSON array of embeds
        reactions TEXT, -- JSON array of reactions
        timestamp DATETIME NOT NULL,
        is_edited BOOLEAN DEFAULT 0,
        is_deleted BOOLEAN DEFAULT 0,
        sync_status TEXT DEFAULT 'pending', -- 'pending', 'synced', 'failed'
        mentions TEXT,
        message_reference TEXT,
        referenced_message TEXT,
        sticker_items TEXT,
        channel_type INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`,

      // Chat participants
      `CREATE TABLE IF NOT EXISTS chat_participants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        role TEXT DEFAULT 'member', -- 'owner', 'admin', 'member'
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        left_at DATETIME,
        is_active BOOLEAN DEFAULT 1,
        FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(chat_id, user_id)
      )`,

      // Platform credentials (encrypted)
      `CREATE TABLE IF NOT EXISTS platform_credentials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        platform TEXT NOT NULL UNIQUE,
        credentials_encrypted TEXT NOT NULL, -- encrypted token/credentials
        user_id TEXT,
        expires_at DATETIME,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Sync state for tracking synchronization
      `CREATE TABLE IF NOT EXISTS sync_state (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        platform TEXT NOT NULL,
        last_sync_timestamp DATETIME,
        last_sync_message_id TEXT,
        sync_direction TEXT, -- 'pull', 'push', 'both'
        status TEXT DEFAULT 'idle', -- 'idle', 'syncing', 'error'
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(platform, sync_direction)
      )`,

      // Application settings
      `CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        value_type TEXT DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // AI insights and summaries
      `CREATE TABLE IF NOT EXISTS ai_insights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id TEXT NOT NULL,
        insight_type TEXT NOT NULL, -- 'summary', 'task', 'sentiment', 'topic'
        content TEXT NOT NULL,
        confidence_score REAL,
        time_range_start DATETIME,
        time_range_end DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
      )`,

      // Bookmarks and favorites
      `CREATE TABLE IF NOT EXISTS bookmarks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_type TEXT NOT NULL, -- 'message', 'chat'
        item_id TEXT NOT NULL,
        tags TEXT, -- JSON array of tags
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(item_type, item_id)
      )`,

      // Notifications settings
      `CREATE TABLE IF NOT EXISTS notification_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id TEXT,
        platform TEXT,
        notification_type TEXT NOT NULL, -- 'all', 'mentions', 'none'
        keywords TEXT, -- JSON array of keywords to notify on
        schedule_start TIME, -- notification start time
        schedule_end TIME, -- notification end time
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(chat_id, platform)
      )`,
    ];

    const transaction = this.db.transaction(() => {
      for (const table of tables) {
        this.db.exec(table);
      }
    });

    transaction();
  }

  createIndexes() {
    const indexes = [
      "CREATE INDEX IF NOT EXISTS idx_messages_chat_timestamp ON messages(chat_id, timestamp DESC)",
      "CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id)",
      "CREATE INDEX IF NOT EXISTS idx_messages_sync_status ON messages(sync_status)",
      "CREATE INDEX IF NOT EXISTS idx_chats_platform ON chats(platform)",
      "CREATE INDEX IF NOT EXISTS idx_chats_last_message ON chats(last_message_timestamp DESC)",
      "CREATE INDEX IF NOT EXISTS idx_users_platform ON users(platform)",
      "CREATE INDEX IF NOT EXISTS idx_chat_participants_chat ON chat_participants(chat_id)",
      "CREATE INDEX IF NOT EXISTS idx_ai_insights_chat ON ai_insights(chat_id)",
      "CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights(insight_type)",
      "CREATE INDEX IF NOT EXISTS idx_bookmarks_item ON bookmarks(item_type, item_id)",
    ];

    const transaction = this.db.transaction(() => {
      for (const index of indexes) {
        this.db.exec(index);
      }
    });

    transaction();
  }

  // User operations
  async createUser(userData) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO users (id, platform, username, display_name, avatar_url, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    return stmt.run(
      userData.id,
      userData.platform,
      userData.username,
      userData.display_name,
      userData.avatar_url
    );
  }

  async getUser(userId) {
    const stmt = this.db.prepare("SELECT * FROM users WHERE id = ?");
    return stmt.get(userId);
  }

  // Chat operations
  async createChat(chatData) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO chats 
      (id, platform, type, name, description, avatar_url, participant_count,last_message_id, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?,?, CURRENT_TIMESTAMP)
    `);
    return stmt.run(
      chatData.id,
      chatData.platform,
      chatData.type,
      chatData.name,
      chatData.description,
      chatData.avatar_url,
      chatData.participant_count,
      chatData.last_message_id
    );
  }

  async getChats(platform = null) {
    let stmt;
    if (platform) {
      stmt = this.db.prepare(
        "SELECT * FROM chats WHERE platform = ? AND is_active = 1 ORDER BY last_message_timestamp DESC"
      );
      return stmt.all(platform);
    } else {
      stmt = this.db.prepare(
        "SELECT * FROM chats WHERE is_active = 1 ORDER BY last_message_timestamp DESC"
      );
      return stmt.all();
    }
  }

  async updateChatLastMessage(chatId, messageId, timestamp) {
    const stmt = this.db.prepare(`
      UPDATE chats 
      SET last_message_id = ?, last_message_timestamp = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(messageId, timestamp, chatId);
  }

  // Message operations
  async createMessage(messageData) {

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO messages 
      (id, chat_id, user_id, content, content_encrypted, message_type, reply_to_id, 
       attachments, embeds, reactions, timestamp, is_edited, sync_status,mentions,message_reference,referenced_message,sticker_items,channel_type, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    // Encrypt sensitive content if needed
    const encryptedContent = messageData.sensitive
      ? this.securityManager.encrypt(messageData.content)
      : null;

    const result = stmt.run(
      messageData.id,
      messageData.chat_id,
      messageData.user_id,
      messageData.sensitive ? null : messageData.content,
      encryptedContent,
      messageData.message_type,
      messageData.reply_to_id,
      JSON.stringify(messageData.attachments || []),
      JSON.stringify(messageData.embeds || []),
      JSON.stringify(messageData.reactions || []),
      messageData.timestamp,
      messageData.is_edited || 0,
      messageData.sync_status || "pending",
       JSON.stringify(messageData.mentions || []),
        JSON.stringify(messageData.message_reference || []),
         JSON.stringify(messageData.referenced_message || []),
           JSON.stringify(messageData.sticker_items || []),
          messageData.channel_type
    );

    // Update chat's last message
    await this.updateChatLastMessage(
      messageData.chat_id,
      messageData.id,
      messageData.timestamp
    );

    return result;
  }

  async getMessages(chatId, limit = 50, offset = 0) {
    const stmt = this.db.prepare(`
      SELECT m.*, u.username, u.display_name, u.avatar_url as user_avatar
      FROM messages m
      LEFT JOIN users u ON m.user_id = u.id
      WHERE m.chat_id = ? AND m.is_deleted = 0
      ORDER BY m.timestamp DESC
      LIMIT ? OFFSET ?
    `);

    const messages = stmt.all(chatId, limit, offset);

    // Decrypt sensitive content
    return messages.map((message) => {
      if (message.content_encrypted) {
        try {
          message.content = this.securityManager.decrypt(
            message.content_encrypted
          );
        } catch (error) {
          console.error("[DB] Failed to decrypt message content:", error);
          message.content = "[Encrypted content - decryption failed]";
        }
      }
      return message;
    });
  }

async getMessagesForSummary(
  chatId,
  timeRange
) {
  const now = Date.now();
  let cutoffTime = 0;

  switch (timeRange) {
    case "5m":
      cutoffTime = now - 5 * 60 * 1000;
      break;
    case "15m":
      cutoffTime = now - 15 * 60 * 1000;
      break;
    case "30m":
      cutoffTime = now - 30 * 60 * 1000;
      break;
    case "1h":
      cutoffTime = now - 60 * 60 * 1000;
      break;
    case "6h":
      cutoffTime = now - 6 * 60 * 60 * 1000;
      break;
    case "24h":
    default:
      cutoffTime = now - 24 * 60 * 60 * 1000;
  }

    // Prepare query
  let query = `
    SELECT m.*, u.username, u.display_name, u.avatar_url as user_avatar
    FROM messages m
    LEFT JOIN users u ON m.user_id = u.id
    WHERE m.is_deleted = 0
      AND m.timestamp >= ?
  `;
  const params = [new Date(cutoffTime).toISOString()];

  // If chatId is provided, filter by it
  if (chatId) {
    query += " AND m.chat_id = ?";
    params.push(chatId);
  }

  query += " ORDER BY m.timestamp DESC";

  const stmt = this.db.prepare(query);
  const messages = stmt.all(...params);

  // Decrypt sensitive content
  return messages.map((message) => {
    if (message.content_encrypted) {
      try {
        message.content = this.securityManager.decrypt(message.content_encrypted);
      } catch (error) {
        console.error("[DB] Failed to decrypt message content:", error);
        message.content = "[Encrypted content - decryption failed]";
      }
    }
    return message;
  });
}



  async updateMessageSyncStatus(messageId, status) {
    const stmt = this.db.prepare(`
      UPDATE messages 
      SET sync_status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(status, messageId);
  }

  // Credentials operations
  async storeCredentials(platform, credentials) {
    const encryptedCredentials = this.securityManager.encrypt(
      JSON.stringify(credentials)
    );
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO platform_credentials 
      (platform, credentials_encrypted, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `);
    return stmt.run(platform, encryptedCredentials);
  }

  async getCredentials(platform) {
    const stmt = this.db.prepare(
      "SELECT * FROM platform_credentials WHERE platform = ? AND is_active = 1"
    );
    const result = stmt.get(platform);

    if (result) {
      try {
        const decryptedCredentials = this.securityManager.decrypt(
          result.credentials_encrypted
        );
        return JSON.parse(decryptedCredentials);
      } catch (error) {
        console.error("[DB] Failed to decrypt credentials:", error);
        return null;
      }
    }

    return null;
  }

  // Sync state operations
  async updateSyncState(platform, direction, data) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO sync_state 
      (platform, sync_direction, last_sync_timestamp, last_sync_message_id, status, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    return stmt.run(
      platform,
      direction,
      data.timestamp,
      data.messageId,
      data.status
    );
  }

  async getSyncState(platform, direction) {
    const stmt = this.db.prepare(
      "SELECT * FROM sync_state WHERE platform = ? AND sync_direction = ?"
    );
    return stmt.get(platform, direction);
  }

  // Settings operations
  async updateSettings(settings) {
    const transaction = this.db.transaction(() => {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO app_settings (key, value, value_type, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `);

      for (const [key, value] of Object.entries(settings)) {
        const valueType = typeof value;
        const stringValue =
          valueType === "object" ? JSON.stringify(value) : String(value);
        stmt.run(key, stringValue, valueType);
      }
    });

    transaction();
  }

  async getSettings() {
    const stmt = this.db.prepare("SELECT * FROM app_settings");
    const rows = stmt.all();

    const settings = {};
    for (const row of rows) {
      let value = row.value;
      switch (row.value_type) {
        case "number":
          value = Number(value);
          break;
        case "boolean":
          value = value === "true";
          break;
        case "object":
          try {
            value = JSON.parse(value);
          } catch (e) {
            console.error("[DB] Failed to parse JSON setting:", row.key);
          }
          break;
      }
      settings[row.key] = value;
    }

    return settings;
  }

  // Get pending sync messages
  async getPendingSyncMessages(limit = 100) {
    const stmt = this.db.prepare(`
      SELECT * FROM messages 
      WHERE sync_status = 'pending'
      ORDER BY timestamp ASC
      LIMIT ?
    `);
    return stmt.all(limit);
  }

  close() {
    if (this.db) {
      this.db.pragma("wal_checkpoint(FULL)");
      this.db.close();
      console.log("[DB] Database connection closed");
    }
  }
}

module.exports = DatabaseManager;
