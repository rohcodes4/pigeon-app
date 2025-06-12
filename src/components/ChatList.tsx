import React, { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, Users, Clock, Pin, ChevronRight, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ChatFilter } from "@/components/ChatFilter";

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

interface ChatListProps {
  onSelectChat: (chat: Chat) => void;
  selectedChat: Chat | null;  
  onChatsUpdate?: (chats: Chat[]) => void;
}

type FilterType = "all" | "telegram" | "discord" | "unread" | "pinned" | "groups" | "dms";

export const ChatList = ({ onSelectChat, selectedChat, onChatsUpdate }: ChatListProps) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [expandedGuilds, setExpandedGuilds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const { user } = useAuth();
  const userId = user.id;

  // Mock Telegram chats
  const mockTelegramChats: Chat[] = [
    {
      id: "tg_1",
      name: "React Developers",
      platform: "telegram",
      lastMessage: "Check out this new React 19 feature!",
      timestamp: "2 hours ago",
      unreadCount: 3,
      participants: 1247,
      isGroup: true,
      isPinned: false,
      avatar: "RD"
    },
    {
      id: "tg_2", 
      name: "John Smith",
      platform: "telegram",
      lastMessage: "Hey, are we still meeting tomorrow?",
      timestamp: "5 minutes ago",
      unreadCount: 1,
      participants: 2,
      isGroup: false,
      isPinned: true,
      avatar: "JS"
    },
    {
      id: "tg_3",
      name: "Tech News",
      platform: "telegram", 
      lastMessage: "AI breakthrough in quantum computing",
      timestamp: "1 hour ago",
      unreadCount: 0,
      participants: 5432,
      isGroup: true,
      isPinned: false,
      avatar: "TN"
    },
    {
      id: "tg_4",
      name: "Sarah Wilson",
      platform: "telegram",
      lastMessage: "Thanks for the code review!",
      timestamp: "3 hours ago", 
      unreadCount: 0,
      participants: 2,
      isGroup: false,
      isPinned: false,
      avatar: "SW"
    },
    {
      id: "tg_5",
      name: "JavaScript Café",
      platform: "telegram",
      lastMessage: "Anyone tried the new Vite 5 features?",
      timestamp: "6 hours ago",
      unreadCount: 7,
      participants: 892,
      isGroup: true,
      isPinned: true,
      avatar: "JC"
    }
  ];

  useEffect(() => {
    async function fetchChats() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('synced_groups')
          .select('*')
          .eq('user_id', userId)
          .eq('is_synced', true);

        if (error) {
          console.error("Error fetching chats:", error);
          const allChats = mockTelegramChats;
          setChats(allChats);
          onChatsUpdate?.(allChats);
          return;
        }

        const chatsData: Chat[] = (data ?? []).map((row: any) => ({
          id: row.group_id,
          name: row.group_name,
          platform: row.platform,
          lastMessage: row.last_message || "No messages yet",
          timestamp: row.last_message_timestamp || "Unknown",
          unreadCount: row.unread_count || 0,
          participants: row.member_count || (row.is_group ? 0 : 2),
          isGroup: row.is_group ?? true,
          isPinned: row.is_pinned ?? false,
          avatar: row.group_avatar || (row.group_name ? row.group_name.split(' ').map((w:string) => w[0]).join('') : "NA"),
          guild_id: row.metadata?.guild_id,
          channel_type: row.metadata?.channel_type,
        }));

        // Combine real Discord chats with mock Telegram chats
        const allChats = [...chatsData, ...mockTelegramChats];
        setChats(allChats);
        onChatsUpdate?.(allChats);
      } catch (err) {
        console.error("Fetch error:", err);
        const allChats = mockTelegramChats;
        setChats(allChats);
        onChatsUpdate?.(allChats);
      } finally {
        setLoading(false);
      }
    }

    if (userId) fetchChats();
  }, [userId]);

  const togglePin = async (chatId: string | number) => {
    setChats(prevChats => {
      const updatedChats = prevChats.map(chat => 
        chat.id === chatId 
          ? { ...chat, isPinned: !chat.isPinned }
          : chat
      );
      onChatsUpdate?.(updatedChats);
      return updatedChats;
    });

    // Update in database for real chats (not mock Telegram ones)
    if (typeof chatId === 'string' && !chatId.startsWith('tg_')) {
      try {
        const currentChat = chats.find(c => c.id === chatId);
        await supabase
          .from('synced_groups')
          .update({ is_pinned: !currentChat?.isPinned })
          .eq('group_id', chatId)
          .eq('user_id', userId);
      } catch (error) {
        console.error('Error updating pin status:', error);
      }
    }
  };

  const fetchChannelsForGuild = async (guildId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('get-discord-channels', {
        body: { user_id: userId, guild_id: guildId }
      });

      if (error) {
        console.error('Failed to fetch channels:', error);
        return;
      }

      // Refresh chat list to include new channels
      const { data: updatedChats } = await supabase
        .from('synced_groups')
        .select('*')
        .eq('user_id', userId)
        .eq('is_synced', true);

      if (updatedChats) {
        const chatsData: Chat[] = updatedChats.map((row: any) => ({
          id: row.group_id,
          name: row.group_name,
          platform: row.platform,
          lastMessage: row.last_message || "No messages yet",
          timestamp: row.last_message_timestamp || "Unknown",
          unreadCount: row.unread_count || 0,
          participants: row.member_count || (row.is_group ? 0 : 2),
          isGroup: row.is_group ?? true,
          isPinned: row.is_pinned ?? false,
          avatar: row.group_avatar || (row.group_name ? row.group_name.split(' ').map((w:string) => w[0]).join('') : "NA"),
          guild_id: row.metadata?.guild_id,
          channel_type: row.metadata?.channel_type,
        }));
        const allChats = [...chatsData, ...mockTelegramChats];
        setChats(allChats);
        onChatsUpdate?.(allChats);
      }
    } catch (err) {
      console.error('Error fetching channels:', err);
    }
  };

  const toggleGuildExpansion = async (guildId: string) => {
    const newExpanded = new Set(expandedGuilds);
    if (expandedGuilds.has(guildId)) {
      newExpanded.delete(guildId);
    } else {
      newExpanded.add(guildId);
      await fetchChannelsForGuild(guildId);
    }
    setExpandedGuilds(newExpanded);
  };

  // Filter chats based on active filter
  const filteredChats = React.useMemo(() => {
    return chats.filter(chat => {
      switch (activeFilter) {
        case "telegram":
          return chat.platform === "telegram";
        case "discord":
          return chat.platform === "discord";
        case "unread":
          return chat.unreadCount > 0;
        case "pinned":
          return chat.isPinned;
        case "groups":
          return chat.isGroup;
        case "dms":
          return !chat.isGroup;
        default:
          return true;
      }
    });
  }, [chats, activeFilter]);

  // Group filtered chats by Discord guilds and standalone chats
  const groupedChats = React.useMemo(() => {
    const guilds: { [key: string]: Chat[] } = {};
    const standalone: Chat[] = [];

    filteredChats.forEach(chat => {
      if (chat.platform === 'discord' && chat.guild_id && !chat.name.startsWith('#')) {
        if (!guilds[chat.id]) {
          guilds[chat.id] = [];
        }
      } else if (chat.platform === 'discord' && chat.guild_id) {
        if (!guilds[chat.guild_id]) {
          guilds[chat.guild_id] = [];
        }
        guilds[chat.guild_id].push(chat);
      } else {
        standalone.push(chat);
      }
    });

    return { guilds, standalone };
  }, [filteredChats]);

  // Sort chats: pinned first, then by timestamp
  const sortedStandaloneChats = [...groupedChats.standalone].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  if (loading) return <div>Loading chats...</div>;

  return (
    <div className="space-y-4">
      <ChatFilter activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      <ScrollArea className="h-[600px]">
        <div className="space-y-2 p-4">
          {/* Standalone chats (Telegram, Discord DMs) */}
          {sortedStandaloneChats.map((chat) => (
            <ChatItem
              key={chat.id}
              chat={chat}
              onSelect={onSelectChat}
              onTogglePin={togglePin}
              isSelected={selectedChat?.id === chat.id}
            />
          ))}

          {/* Discord Servers with Channels */}
          {Object.entries(groupedChats.guilds).map(([guildId, channels]) => {
            const guildChat = chats.find(c => c.id === guildId);
            if (!guildChat) return null;

            const isExpanded = expandedGuilds.has(guildId);

            return (
              <div key={guildId} className="space-y-1">
                {/* Guild Header */}
                <div
                  onClick={() => toggleGuildExpansion(guildId)}
                  className="p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md bg-white hover:bg-gray-50 flex items-center gap-2"
                >
                  <ChevronRight className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-90")} />
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-purple-500 text-white text-xs">
                      {guildChat.avatar !== "NA" ? (
                        <img src={guildChat.avatar} alt={guildChat.name} />
                      ) : (
                        guildChat.name.substring(0, 2)
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm">{guildChat.name}</span>
                  <Badge variant="outline" className="text-xs text-purple-600 ml-auto">
                    discord
                  </Badge>
                </div>

                {/* Guild Channels */}
                {isExpanded && (
                  <div className="ml-6 space-y-1">
                    {channels.map((channel) => (
                      <div
                        key={channel.id}
                        onClick={() => onSelectChat(channel)}
                        className={cn(
                          "p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md flex items-center gap-2",
                          selectedChat?.id === channel.id
                            ? "bg-blue-50 border-blue-200 shadow-sm"
                            : "bg-white hover:bg-gray-50"
                        )}
                      >
                        <Hash className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{channel.name.replace('#', '')}</span>
                        {channel.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs min-w-[20px] h-5 ml-auto">
                            {channel.unreadCount}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

const ChatItem = ({ 
  chat, 
  onSelect, 
  onTogglePin, 
  isSelected 
}: { 
  chat: Chat; 
  onSelect: (chat: Chat) => void; 
  onTogglePin: (chatId: string | number) => void;
  isSelected: boolean;
}) => (
  <div
    onClick={() => onSelect(chat)}
    className={cn(
      "p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md",
      isSelected
        ? "bg-blue-50 border-blue-200 shadow-sm"
        : "bg-white hover:bg-gray-50"
    )}
  >
    <div className="flex items-start justify-center gap-3">
      <div className="flex flex-col justify-center items-center gap-2">
        <div className="relative w-max">
          <Avatar className="w-12 h-12">
            <AvatarFallback
              className={cn(
                "text-white font-semibold",
                chat.platform === "telegram" ? "bg-blue-500" : "bg-purple-500"
              )}
            >
              {chat.avatar !== "NA" ? (
                <img src={chat.avatar} alt={chat.name} />
              ) : (
                chat.name.substring(0, 2)
              )}
            </AvatarFallback>
          </Avatar>

          {chat.isPinned && (
            <Pin className="w-3 h-3 text-blue-600 absolute -top-1 -right-1" />
          )}
        </div>
        <Badge
          variant="outline"
          className={cn(
            "text-xs",
            chat.platform === "telegram" ? "text-blue-600" : "text-purple-600"
          )}
        >
          {chat.platform}
        </Badge>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm truncate text-black">{chat.name}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin(chat.id);
              }}
            >
              <Pin className={cn("w-3 h-3", chat.isPinned ? "text-blue-600" : "text-gray-400")} />
            </Button>
            {chat.unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs min-w-[20px] h-5">
                {chat.unreadCount}
              </Badge>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
          {chat.lastMessage}
        </p>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {chat.timestamp}
          </div>
          <div className="flex items-center gap-1">
            {chat.isGroup ? (
              <Users className="w-3 h-3" />
            ) : (
              <MessageCircle className="w-3 h-3" />
            )}
            {chat.participants}
          </div>
        </div>
      </div>
    </div>
  </div>
);
