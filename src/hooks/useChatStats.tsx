
import { useMemo } from "react";

interface Chat {
  id: number | string;
  name: string;
  platform: "telegram" | "discord";
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  participants: number;
  isGroup: boolean;
  isPinned: boolean;
  avatar: string;
  guild_id?: string;
  channel_type?: number;
}

export const useChatStats = (chats: Chat[]) => {
  return useMemo(() => {
    const activeChats = chats.length;
    const unreadMessages = chats.reduce((sum, chat) => sum + chat.unreadCount, 0);
    const totalParticipants = chats.reduce((sum, chat) => sum + chat.participants, 0);
    const aiSummaries = Math.floor(chats.length * 0.6); // Mock calculation: 60% of chats have AI summaries

    return {
      activeChats,
      unreadMessages,
      totalParticipants,
      aiSummaries,
    };
  }, [chats]);
};
