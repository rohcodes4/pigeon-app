// Type declarations for Electron IPC API
export interface ElectronAPI {
  discord: {
    connect: (token: string) => Promise<{ success: boolean; error?: string }>;
    getUserId: () => Promise<{ success: boolean; data?: any; error?: string }>;
    disconnect: () => Promise<{ success: boolean; error?: string }>;
    openLogin: () => Promise<{ success: boolean; data: any; error?: string }>;
    getDMs: () => Promise<{
      success: boolean;
      data?: Array<{
        id: string;
        platform: string;
        type: "dm" | "group" | "channel";
        name: string;
        participant_count: number;
        last_message_timestamp?: string;
      }>;
      error?: string;
    }>;
    getGuilds: () => Promise<{
      success: boolean;
      data?: Array<any>;
      error?: string;
    }>;
    attachments: (
      chatId: string,
      files: Array<any>
    ) => Promise<{ success: boolean; data?: any; error?: string }>;

    getChatHistory: (
      chatId: string,
      limit?: number,
      beforeMessageId?: string
    ) => Promise<{
      success: boolean;
      data?: Array<any>;
      error?: string;
    }>;
    onNewMessage: (callback: (data: any) => void) => () => void;
    sendMessage: (
      chatId: string,
      message: string,
      attachments?: Array<{
        id: string;
        filename: string;
        uploaded_filename: string;
      }>,
      sticker_ids?: Array<string>,
      message_reference?: any
    ) => Promise<{
      success: boolean;
      data?: {
        id: string;
        content: string;
        timestamp: string;
      };
      error?: string;
    }>;
    addReaction: (
      chatId: string,
      messageId: string,
      emoji: string
    ) => Promise<{
      success: boolean;
      error?: string;
    }>;
    removeReaction: (
      chatId: string,
      messageId: string,
      emoji: string
    ) => Promise<{
      success: boolean;
      error?: string;
    }>;
    deleteMessage: (
      chatId: string,
      messageId: string
    ) => Promise<{
      success: boolean;
      error?: string;
    }>;
    editMessage: (
      chatId: string,
      messageId: string,
      newContent: string
    ) => Promise<{
      success: boolean;
      data?: any;
      error?: string;
    }>;
    getStickers: (locale?: string) => Promise<{
      success: boolean;
      data?: Array<any>;
      error?: string;
    }>;
    getStickerById: (stickerId?: string) => Promise<{
      success: boolean;
      data?: Array<any>;
      error?: string;
    }>;

    onConnected: (
      callback: (data: { success: boolean; error?: string }) => void
    ) => void;
    removeAllListeners: () => void;
  };
  telegram: {
    // === Actions ===
    loginPhone: (
      phone: string
    ) => Promise<{ success: boolean; error?: string }>;
    verifyCode: (code: string) => Promise<{ success: boolean; error?: string }>;
    checkPassword: (
      password: string
    ) => Promise<{ success: boolean; error?: string }>;
    loginQR: () => Promise<{ success: boolean; error?: string }>;
    reconnectFromSaved: () => Promise<{ success: boolean; error?: string }>;
    disconnect: () => Promise<{ success: boolean; error?: string }>;

    // === Message & Chat ===
    sendMessage: (
      chatId: string,
      message: string
    ) => Promise<{ success: boolean; error?: string }>;
    getChatHistory: (
      chatId: string,
      limit?: number,
      offset?: number,
      olderId?: string
    ) => Promise<{
      success: boolean;
      data?: Array<any>;
      error?: string;
    }>;
    deleteMessage: (
      chatId: string,
      messageId: string
    ) => Promise<{ success: boolean; error?: string }>;
    getDialogs: () => Promise<{
      success: boolean;
      data?: Array<{
        id: string;
        platform: "telegram";
        type: "dm" | "group" | "channel";
        name: string;
        participant_count: number;
        last_message_timestamp?: string;
      }>;
      error?: string;
    }>;
    getMediaInfo: (message: any) => Promise<{
      success: boolean;
      data?: any;
      error?: string;
    }>;
    getUserId: () => Promise<{ success: boolean; data?: any; error?: string }>;
    openLogin: () => Promise<{ success: boolean; data?: any; error?: string }>;

    // === Event listeners ===
    onQR: (callback: (qrImage: string) => void) => void;
    onLoginError: (callback: (error: string) => void) => void;
    onQRExpired: (callback: () => void) => void;
    onLoginSuccess: (callback: (user) => void) => void;
    onDialogUpdated: (callback: (dialog: any) => void) => () => void;

    onPasswordInvalid: (callback: () => void) => void;
    onCodeSent: (callback: (data: any) => void) => void;
    onPasswordRequired: (callback: () => void) => void;
    sendPassword: (
      password: string
    ) => Promise<{ success: boolean; error?: string }>;
    onConnected: (
      callback: (user: {
        id: string;
        username?: string;
        firstName?: string;
        lastName?: string;
      }) => void
    ) => void;
    onNewMessage: (callback: (msg: any) => void) => () => void;

    connectExisting: () => Promise<{ success: boolean; error?: string }>;

    // === Message & Chat ===
    sendMessage: (
      chatId: string,
      message: string
    ) => Promise<{ success: boolean; error?: string }>;
    sendPhoto: (
      chatId: any,
      file: any,
      caption?: string,
      filename?: string
    ) => Promise<{ success: boolean; error?: string }>;
    sendDocument: (
      chatId: string,
      document: any,
      caption?: string
    ) => Promise<{ success: boolean; error?: string }>;
    sendVideo: (
      chatId: string,
      video: any,
      caption?: string,
      filename?: string
    ) => Promise<{ success: boolean; error?: string }>;
    sendVoice: (
      chatId: string,
      voice: any,
      caption?: string
    ) => Promise<{ success: boolean; error?: string }>;
    sendSticker: (
      chatId: string,
      sticker: any
    ) => Promise<{ success: boolean; error?: string }>;
    replyMessage: (
      chatId: string,
      messageId: string,
      message: string
    ) => Promise<{ success: boolean; error?: string }>;
    forwardMessage: (
      chatId: string,
      fromChatId: string,
      messageId: string
    ) => Promise<{ success: boolean; error?: string }>;

    getChatHistory: (
      chatId: string,
      limit?: number,
      offset?: number,
      olderId?: string
    ) => Promise<{
      success: boolean;
      data?: Array<any>;
      error?: string;
    }>;
    searchMessages: (
      chatId: string,
      query: string,
      limit?: number
    ) => Promise<{ success: boolean; data?: any; error?: string }>;
    getPinnedMessages: (
      chatId: string
    ) => Promise<{ success: boolean; data?: any; error?: string }>;
    pinMessage: (
      chatId: string,
      messageId: string
    ) => Promise<{ success: boolean; error?: string }>;
    unpinMessage: (
      chatId: string,
      messageId: string
    ) => Promise<{ success: boolean; error?: string }>;
    markAsRead: (
      chatId: any
    ) => Promise<{ success: boolean; error?: string }>;

    // === Chat / Group Info ===
    getChatInfo: (
      chatId: string
    ) => Promise<{ success: boolean; data?: any; error?: string }>;
    getParticipants: (
      chatId: string
    ) => Promise<{ success: boolean; data?: any; error?: string }>;
    joinChat: (chatId: string) => Promise<{ success: boolean; error?: string }>;
    leaveChat: (
      chatId: string
    ) => Promise<{ success: boolean; error?: string }>;

    // === Profile / User ===
    getUserInfo: (
      userId: string
    ) => Promise<{ success: boolean; data?: any; error?: string }>;
    updateProfilePhoto: (
      photo: string
    ) => Promise<{ success: boolean; error?: string }>;
    updateBio: (bio: string) => Promise<{ success: boolean; error?: string }>;

    // === Typing & Status ===
    sendTyping: (
      chatId: string
    ) => Promise<{ success: boolean; error?: string }>;
    sendUploading: (
      chatId: string
    ) => Promise<{ success: boolean; error?: string }>;
    sendRecording: (
      chatId: string
    ) => Promise<{ success: boolean; error?: string }>;

    // === Utility / Advanced ===
    downloadFile: (
      message: any
    ) => Promise<{ success: boolean; data?: any; error?: string }>;
    downloadMediaById: (
      chatId: string,
      messageId: string
    ) => Promise<{ success: boolean; data?: any; error?: string }>;
    uploadFile: (
      chatId: string,
      file: string
    ) => Promise<{ success: boolean; error?: string }>;
    getMessageLink: (
      chatId: string,
      messageId: string
    ) => Promise<{ success: boolean; data?: string; error?: string }>;
    openMessageThread: (
      chatId: string,
      messageId: string
    ) => Promise<{ success: boolean; data?: any; error?: string }>;
  };

  security: {
    getDiscordToken: () => Promise<{
      success: boolean;
      data?: string;
      error?: string;
    }>;
    clearDiscordToken: () => Promise<{ success: boolean; error?: string }>;
  };

  database: {
    getChats: () => Promise<{
      success: boolean;
      data?: Array<{
        id: string;
        platform: string;
        type: string;
        name: string;
        description?: string;
        avatar_url?: string;
        participant_count: number;
        last_message_timestamp?: string;
        is_pinned: boolean;
        is_muted: boolean;
      }>;
      error?: string;
    }>;

    getMessages: (
      chatId: string,
      limit?: number,
      offset?: number
    ) => Promise<{
      success: boolean;
      data?: Array<{
        id: string;
        chat_id: string;
        user_id: string;
        content: string;
        message_type: string;
        timestamp: string;
        is_edited: boolean;
        username?: string;
        display_name?: string;
        user_avatar?: string;
      }>;
      error?: string;
    }>;

    getMessagesForSummary: (
      chatId,
      timeRange?
    ) => Promise<{
      success: boolean;
      data?: Array;
      error?: any;
    }>;

    getSettings: () => Promise<{
      success: boolean;
      data?: Record<string, any>;
      error?: string;
    }>;
    updateSettings: (settings: Record<string, any>) => Promise<{
      success: boolean;
      error?: string;
    }>;
  };

  sync: {
    manual: () => Promise<{ success: boolean; error?: string }>;
    getStatus: () => Promise<{
      success: boolean;
      data?: {
        lastSyncTime: Date | null;
        lastUpdateTime: Date | null;
        isSyncing: boolean;
        hasPendingMessages: boolean;
        errorCount: number;
        lastErrors: Array<{ timestamp: Date; error: string }>;
      };
      error?: string;
    }>;
    onSyncComplete: (
      callback: (data: { messageCount: number }) => void
    ) => void;
    onSyncError: (callback: (error: Error) => void) => void;
    onUpdatesReceived: (
      callback: (data: { updateCount: number }) => void
    ) => void;
    removeAllListeners: () => void;
  };

  app: {
    getVersion: () => Promise<{ success: boolean; data?: string }>;
    quit: () => Promise<{ success: boolean }>;
    minimize: () => Promise<{ success: boolean }>;
    maximize: () => Promise<{ success: boolean }>;
    unmaximize: () => Promise<{ success: boolean }>;
    isMaximized: () => Promise<{ success: boolean; data?: boolean }>;
  };

  // Legacy support
  openDiscordLogin: () => Promise<{ success: boolean; error?: string }>;
  onDiscordToken: (callback: (token: string) => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    Buffer: typeof Buffer;
  }
}

export {};
