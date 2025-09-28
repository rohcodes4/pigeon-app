// Type declarations for Electron IPC API
export interface ElectronAPI {
  discord: {
    connect: (token: string) => Promise<{ success: boolean; error?: string }>;
    openLogin: () => Promise<{ success: boolean; error?: string }>;
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
    
    sendMessage: (
      chatId: string,
      message: string,
      attachments?: Array<{ id: string; filename: string; uploaded_filename: string }>
    ) => Promise<{
      success: boolean;
      data?: {
        id: string;
        content: string;
        timestamp: string;
      };
      error?: string;
    }>;
    onConnected: (
      callback: (data: { success: boolean; error?: string }) => void
    ) => void;
    removeAllListeners: () => void;
  };
  security: {
    getDiscordToken: () => Promise<{
      success: boolean;
      data?: string;
      error?: string;
    }>;
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
  }
}

export {};
