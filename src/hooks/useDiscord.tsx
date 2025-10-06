// hooks/useDiscord.tsx
import { useState, useEffect, useCallback, useRef } from 'react';

// Types
interface DiscordState {
  connected: boolean;
  userId: string | null;
  guilds: any[];
  channels: any[];
  reconnectAttempts: number;
}

interface Message {
  id: string;
  chat_id: string;
  user_id: string;
  username?: string;
  display_name?: string;
  user_avatar?: string;
  content: string;
  message_type: string;
  attachments?: any[];
  reactions?: any[];
  embeds?: any[];
  timestamp: string;
  is_edited?: number;
  is_deleted?: number;
}
type ReactionChip = { icon: string; count: number };
type MessageItem = {
  id: any;
  chat_id?: string;
  originalId: any;
  timestamp: string;
  telegramMessageId?: number; // Telegram message ID for replies
  name: string;
  avatar: string;
  platform: "Discord" | "Telegram";
  channel: string | null;
  server: string;
  date: Date;
  message: string;
  tags: string[];
  reactions: ReactionChip[];
  hasLink: boolean;
  hasMedia: boolean;
  media: any;
  link: string | null;
  replyTo: any;
};

// Get electronAPI safely
const electronAPI = (window as any).electronAPI;

// Main Discord connection hook
export function useDiscord() {
  const [state, setState] = useState<DiscordState>({
    connected: false,
    userId: null,
    guilds: [],
    channels: [],
    reconnectAttempts: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Setup event listeners
    const cleanupConnected = electronAPI.discord.onConnected((newState: DiscordState) => {
      setState(newState);
      setIsLoading(false);
      setError(null);
    });

    const cleanupDisconnected = electronAPI.discord.onDisconnected(() => {
      setState(prev => ({ ...prev, connected: false }));
    });

    const cleanupReady = electronAPI.discord.onReady((newState: DiscordState) => {
      setState(newState);
      setIsLoading(false);
    });

    const cleanupError = electronAPI.discord.onError((err: { message: string }) => {
      setError(err.message);
      setIsLoading(false);
    });

    // Get initial state
    electronAPI.discord.getState().then((response: any) => {
      if (response.success) {
        setState(response.data);
      }
    });

    return () => {
      cleanupConnected();
      cleanupDisconnected();
      cleanupReady();
      cleanupError();
    };
  }, []);

  const connect = useCallback(async (token: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await electronAPI.discord.connect(token);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await electronAPI.discord.disconnect();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    ...state,
    isLoading,
    error,
    connect,
    disconnect
  };
}

// Hook for real-time messages with local DB caching
export function useDiscordMessages(chatId: string | null) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Load messages from local DB
  const loadMessages = useCallback(async (limit = 100, offset = 0) => {
    if (!chatId) return;
    
    setLoading(true);
    try {
      const response = await electronAPI.discord.getMessages(chatId, limit, offset);
      if (response.success) {
        if (offset === 0) {
          setMessages(response.data);
        } else {
          setMessages(prev => [...prev, ...response.data]);
        }
        setHasMore(response.data.length === limit);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  // Listen for real-time message events
  useEffect(() => {
    if (!chatId) return;

    // New message
    const cleanupNewMessage = electronAPI.discord.onNewMessage((data: any) => {
      if (data.chatId === chatId) {
        setMessages(prev => {
          // Prevent duplicates
          if (prev.some(m => m.id === data.message.id)) return prev;
          return [data.message, ...prev];
        });
      }
    });

    // Message update
    const cleanupMessageUpdate = electronAPI.discord.onMessageUpdate((data: any) => {
      if (data.chatId === chatId) {
        setMessages(prev => 
          prev.map(m => m.id === data.message.id ? { ...m, ...data.message } : m)
        );
      }
    });

    // Message delete
    const cleanupMessageDelete = electronAPI.discord.onMessageDelete((data: any) => {
      if (data.chatId === chatId) {
        setMessages(prev => prev.filter(m => m.id !== data.messageId));
      }
    });

    // Load initial messages
    loadMessages();

    return () => {
      cleanupNewMessage();
      cleanupMessageUpdate();
      cleanupMessageDelete();
    };
  }, [chatId, loadMessages]);

  const sendMessage = useCallback(async (content: string, attachments = []) => {
    if (!chatId) throw new Error('No chat selected');
    const response = await electronAPI.discord.sendMessage(chatId, content, attachments);
    if (!response.success) throw new Error(response.error);
    return response.data;
  }, [chatId]);

  const loadMore = useCallback(() => {
    return loadMessages(50, messages.length);
  }, [messages.length, loadMessages]);

  return {
    messagesList: messages,
    loading,
    hasMore,
    sendMessage,
    loadMore,
    refresh: () => loadMessages(100, 0)
  };
}

// Hook for channels and guilds
export function useDiscordChannels() {
  const [guilds, setGuilds] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [dms, setDms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [guildsRes, dmsRes] = await Promise.all([
        electronAPI.discord.getGuilds(),
        electronAPI.discord.getDMs()
      ]);

      if (guildsRes.success) {
        const guildsArray = Array.from(guildsRes.data.values ? guildsRes.data.values() : guildsRes.data);
        setGuilds(guildsArray);
        
        // Extract channels from guilds
        const allChannels: any[] = [];
        guildsArray.forEach((guild: any) => {
          if (guild.channels) {
            guild.channels.forEach((channel: any) => {
              allChannels.push({
                ...channel,
                guild_id: guild.id,
                guild_name: guild.name
              });
            });
          }
        });
        setChannels(allChannels);
      }

      if (dmsRes.success) {
        setDms(dmsRes.data);
      }
    } catch (error) {
      console.error('Failed to load channels:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Listen for updates
    const cleanupGuildUpdate = electronAPI.discord.onGuildUpdate((state: any) => {
      const guildsArray = Array.from(state.guilds || []);
      setGuilds(guildsArray);
    });

    const cleanupChannelsUpdate = electronAPI.discord.onChannelsUpdate((state: any) => {
      const channelsArray = Array.from(state.channels || []);
      setChannels(channelsArray);
    });

    // Load initial data
    loadData();

    return () => {
      cleanupGuildUpdate();
      cleanupChannelsUpdate();
    };
  }, [loadData]);

  const getGuildChannels = useCallback((guildId: string) => {
    return channels.filter(ch => ch.guild_id === guildId);
  }, [channels]);

  return {
    guilds,
    channels,
    dms,
    loading,
    getGuildChannels,
    refresh: loadData
  };
}

// Hook for chat history (fetch from Discord API, not DB)
export function useDiscordChatHistory(chatId: string | null) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadHistory = useCallback(async (beforeMessageId?: string) => {
    if (!chatId || loading) return;

    setLoading(true);
    try {
      const response = await electronAPI.discord.getChatHistory(
        chatId,
        100,
        beforeMessageId
      );
      
      if (response.success) {
        const messages = response.data;
        console.log('history res', response)
        
        if (messages.length === 0) {
          setHasMore(false);
        } else {
          setHistory(prev => beforeMessageId ? [...prev, ...messages] : messages);
          setHasMore(true)
        }
      } else {
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    } finally {
      setLoading(false);
    }
  }, [chatId, loading]);

  useEffect(()=>{
    console.log('history',history)
  },[history])

  const loadMore = useCallback(() => {
    if (history.length > 0 && hasMore) {
      const oldestMessage = history[history.length - 1];
      loadHistory(oldestMessage.id);
    }
  }, [history, hasMore, loadHistory]);

  useEffect(() => {
    if (chatId) {
      setHistory([]);
      setHasMore(true);
      loadHistory();
    }
  }, [chatId]);

  return {
    history,
    loading,
    hasMore,
    loadMore,
    refresh: () => loadHistory()
  };
}

// Hook for reactions
export function useDiscordReactions(chatId: string) {
  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    const response = await electronAPI.discord.addReaction(chatId, messageId, emoji);
    if (!response.success) throw new Error(response.error);
    return response.data;
  }, [chatId]);

  const removeReaction = useCallback(async (messageId: string, emoji: string) => {
    const response = await electronAPI.discord.removeReaction(chatId, messageId, emoji);
    if (!response.success) throw new Error(response.error);
    return response.data;
  }, [chatId]);

  return { addReaction, removeReaction };
}

// Hook for connection status
export function useDiscordConnectionStatus() {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    const cleanupConnected = electronAPI.discord.onConnected(() => {
      setStatus('connected');
      setReconnectAttempts(0);
    });

    const cleanupDisconnected = electronAPI.discord.onDisconnected(() => {
      setStatus('disconnected');
    });

    const cleanupReady = electronAPI.discord.onReady((state: any) => {
      setStatus('connected');
      setReconnectAttempts(state.reconnectAttempts || 0);
    });

    // Check initial status
    electronAPI.discord.isConnected().then((response: any) => {
      if (response.success) {
        setStatus(response.data ? 'connected' : 'disconnected');
      }
    });

    return () => {
      cleanupConnected();
      cleanupDisconnected();
      cleanupReady();
    };
  }, []);

  return {
    status,
    reconnectAttempts,
    isConnected: status === 'connected',
    isConnecting: status === 'connecting'
  };
}

// Hook for chats list (from local DB)
export function useDiscordChats() {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadChats = useCallback(async () => {
    setLoading(true);
    try {
      const response = await electronAPI.database.getChats();
      if (response.success) {
        setChats(response.data);
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Listen for channel updates to refresh chats
    const cleanupChannelsUpdate = electronAPI.discord.onChannelsUpdate(() => {
      loadChats();
    });

    // Initial load
    loadChats();

    return () => {
      cleanupChannelsUpdate();
    };
  }, [loadChats]);

  return {
    chats,
    loading,
    refresh: loadChats
  };
}

// Hook for CAPTCHA handling
export function useDiscordCaptcha() {
  const [captchaData, setCaptchaData] = useState<any>(null);
  const [showCaptcha, setShowCaptcha] = useState(false);

  useEffect(() => {
    const cleanup = electronAPI.discord.onCaptchaRequired((data: any) => {
      setCaptchaData(data);
      setShowCaptcha(true);
    });

    return cleanup;
  }, []);

  const closeCaptcha = useCallback(() => {
    setShowCaptcha(false);
    setCaptchaData(null);
  }, []);

  return {
    captchaData,
    showCaptcha,
    closeCaptcha
  };
}