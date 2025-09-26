const CryptoJS = require("crypto-js");
const { app } = require("electron");
const crypto = require("crypto");

class SecurityManager {
  constructor() {
    this.store = null; // Will be initialized in initialize() method
    this.masterKey = null;
    this.isInitialized = false;
  }

  async initialize() {
    // Dynamic import for electron-store ES module
    const { default: Store } = await import("electron-store");

    this.store = new Store({
      name: "secure-config",
      encryptionKey: "pigeon-security-key", // TODO: CHANGE THIS IN PROD
      schema: {
        masterKey: {
          type: "string",
        },
        salt: {
          type: "string",
        },
      },
    });

    try {
      // Generate or retrieve master key
      await this.initializeMasterKey();
      this.isInitialized = true;
      console.log("[Security] Security manager initialized");
    } catch (error) {
      console.error("[Security] Failed to initialize:", error);
      throw error;
    }
  }

  async initializeMasterKey() {
    let masterKey = this.store.get("masterKey");
    let salt = this.store.get("salt");

    if (!masterKey || !salt) {
      // Generate new master key and salt
      salt = crypto.randomBytes(32).toString("hex");
      const appId = app.getName() + app.getVersion();
      masterKey = crypto
        .pbkdf2Sync(appId, salt, 10000, 32, "sha512")
        .toString("hex");

      this.store.set("masterKey", masterKey);
      this.store.set("salt", salt);
      console.log("[Security] Generated new master key");
    }

    this.masterKey = masterKey;
    this.salt = salt;
  }

  encrypt(text) {
    if (!this.masterKey) {
      throw new Error("Security manager not initialized");
    }

    try {
      const encrypted = CryptoJS.AES.encrypt(text, this.masterKey).toString();
      return encrypted;
    } catch (error) {
      console.error("[Security] Encryption failed:", error);
      throw error;
    }
  }

  decrypt(encryptedText) {
    if (!this.masterKey) {
      throw new Error("Security manager not initialized");
    }

    try {
      const bytes = CryptoJS.AES.decrypt(encryptedText, this.masterKey);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);

      if (!decrypted) {
        throw new Error("Decryption failed - invalid data");
      }

      return decrypted;
    } catch (error) {
      console.error("[Security] Decryption failed:", error);
      throw error;
    }
  }

  async storeDiscordToken(token) {
    try {
      const tokenData = {
        token: token,
        timestamp: Date.now(),
        platform: "discord",
      };

      const encryptedToken = this.encrypt(JSON.stringify(tokenData));
      this.store.set("discord_token", encryptedToken);
      console.log("[Security] Discord token stored securely");

      return true;
    } catch (error) {
      console.error("[Security] Failed to store Discord token:", error);
      throw error;
    }
  }

  async getDiscordToken() {
    try {
      const encryptedToken = this.store.get("discord_token");

      if (!encryptedToken) {
        return null;
      }

      const decryptedData = this.decrypt(encryptedToken);
      const tokenData = JSON.parse(decryptedData);

      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      if (Date.now() - tokenData.timestamp > maxAge) {
        console.warn("[Security] Discord token is old, may need refresh");
      }

      return tokenData.token;
    } catch (error) {
      console.error("[Security] Failed to retrieve Discord token:", error);
      return null;
    }
  }

  async clearDiscordToken() {
    try {
      this.store.delete("discord_token");
      console.log("[Security] Discord token cleared");
    } catch (error) {
      console.error("[Security] Failed to clear Discord token:", error);
    }
  }

  // Store other platform tokens securely
  async storePlatformToken(platform, token, additionalData = {}) {
    try {
      const tokenData = {
        token: token,
        timestamp: Date.now(),
        platform: platform,
        ...additionalData,
      };

      const encryptedToken = this.encrypt(JSON.stringify(tokenData));
      this.store.set(`${platform}_token`, encryptedToken);
      console.log(`[Security] ${platform} token stored securely`);

      return true;
    } catch (error) {
      console.error(`[Security] Failed to store ${platform} token:`, error);
      throw error;
    }
  }

  async getPlatformToken(platform) {
    // For telegram which we'll integrate later
    try {
      const encryptedToken = this.store.get(`${platform}_token`);

      if (!encryptedToken) {
        return null;
      }

      const decryptedData = this.decrypt(encryptedToken);
      const tokenData = JSON.parse(decryptedData);

      return tokenData;
    } catch (error) {
      console.error(`[Security] Failed to retrieve ${platform} token:`, error);
      return null;
    }
  }

  async clearPlatformToken(platform) {
    try {
      this.store.delete(`${platform}_token`);
      console.log(`[Security] ${platform} token cleared`);
    } catch (error) {
      console.error(`[Security] Failed to clear ${platform} token:`, error);
    }
  }

  generateSecureId(length = 32) {
    return crypto.randomBytes(length).toString("hex");
  }

  // Hash sensitive data for comparison without storing plaintext
  hashData(data, salt = null) {
    const actualSalt =
      salt || this.salt || crypto.randomBytes(16).toString("hex");
    const hash = crypto
      .pbkdf2Sync(data, actualSalt, 10000, 64, "sha512")
      .toString("hex");
    return { hash, salt: actualSalt };
  }

  // Verify hashed data
  verifyHash(data, hash, salt) {
    const { hash: computedHash } = this.hashData(data, salt);
    return computedHash === hash;
  }

  // Sanitize sensitive data for logging
  sanitizeForLog(data) {
    if (typeof data === "string") {
      if (data.length > 10) {
        return data.substring(0, 4) + "***" + data.substring(data.length - 4);
      }
      return "***";
    }

    if (typeof data === "object" && data !== null) {
      const sanitized = { ...data };
      const sensitiveFields = ["token", "password", "secret", "key", "auth"];

      for (const field of sensitiveFields) {
        if (sanitized[field]) {
          sanitized[field] = this.sanitizeForLog(sanitized[field]);
        }
      }

      return sanitized;
    }

    return data;
  }

  // Validate Discord token format
  validateDiscordToken(token) {
    const tokenRegex = /^[A-Za-z0-9+/=._-]+$/;

    if (!token || typeof token !== "string") {
      return false;
    }

    if (token.length < 50 || token.length > 100) {
      return false;
    }

    return tokenRegex.test(token);
  }

  // Secure data comparison to prevent timing attacks
  secureCompare(a, b) {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  async clearAllCredentials() {
    try {
      this.store.clear();
      console.log("[Security] All credentials cleared");
    } catch (error) {
      console.error("[Security] Failed to clear credentials:", error);
    }
  }

  getSecurityStatus() {
    return {
      initialized: !!this.masterKey,
      hasDiscordToken: !!this.store.get("discord_token"),
      storeSize: this.store.size,
      masterKeyLength: this.masterKey ? this.masterKey.length : 0,
    };
  }
}

module.exports = SecurityManager;
