
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, Users, Clock, Pin } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data - will be replaced with real Supabase data
const mockChats = [
  {
    id: 1,
    name: "Crypto Traders Elite",
    platform: "telegram",
    lastMessage: "Anyone have thoughts on the BTC movement today? I'm seeing some interesting patterns...",
    timestamp: "2 minutes ago",
    unreadCount: 5,
    participants: 156,
    isGroup: true,
    isPinned: true,
    avatar: "CTE",
  },
  {
    id: 2,
    name: "Sarah Johnson",
    platform: "telegram",
    lastMessage: "Thanks for the project update! Looking forward to the presentation tomorrow",
    timestamp: "15 minutes ago",
    unreadCount: 2,
    participants: 2,
    isGroup: false,
    isPinned: false,
    avatar: "SJ",
  },
  {
    id: 3,
    name: "Development Team",
    platform: "discord",
    lastMessage: "The new feature is ready for testing. Can someone review the PR?",
    timestamp: "1 hour ago",
    unreadCount: 8,
    participants: 12,
    isGroup: true,
    isPinned: true,
    avatar: "DT",
  },
  {
    id: 4,
    name: "Marketing Squad",
    platform: "discord",
    lastMessage: "Campaign results are looking promising! CTR is up 23% from last month",
    timestamp: "3 hours ago",
    unreadCount: 3,
    participants: 8,
    isGroup: true,
    isPinned: false,
    avatar: "MS",
  },
  {
    id: 5,
    name: "Alex Rodriguez",
    platform: "telegram",
    lastMessage: "Let's schedule a call for tomorrow to discuss the quarterly goals",
    timestamp: "5 hours ago",
    unreadCount: 1,
    participants: 2,
    isGroup: false,
    isPinned: false,
    avatar: "AR",
  },
];

interface ChatListProps {
  onSelectChat: (chat: any) => void;
  selectedChat: any;
}

export const ChatList = ({ onSelectChat, selectedChat }: ChatListProps) => {
  // Sort chats: pinned first, then by timestamp
  const sortedChats = [...mockChats].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  return (
    <ScrollArea className="h-[600px]">
      <div className="space-y-2 p-4">
        {sortedChats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => onSelectChat(chat)}
            className={cn(
              "p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md",
              selectedChat?.id === chat.id
                ? "bg-blue-50 border-blue-200 shadow-sm"
                : "bg-white hover:bg-gray-50"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="relative">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className={cn(
                    "text-white font-semibold",
                    chat.platform === "telegram" ? "bg-blue-500" : "bg-purple-500"
                  )}>
                    {chat.avatar}
                  </AvatarFallback>
                </Avatar>
                {chat.isPinned && (
                  <Pin className="w-3 h-3 text-blue-600 absolute -top-1 -right-1" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm truncate">{chat.name}</h3>
                    <Badge variant="outline" className={cn(
                      "text-xs",
                      chat.platform === "telegram" ? "text-blue-600" : "text-purple-600"
                    )}>
                      {chat.platform}
                    </Badge>
                  </div>
                  {chat.unreadCount > 0 && (
                    <Badge variant="destructive" className="text-xs min-w-[20px] h-5">
                      {chat.unreadCount}
                    </Badge>
                  )}
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
                    {chat.isGroup ? <Users className="w-3 h-3" /> : <MessageCircle className="w-3 h-3" />}
                    {chat.participants}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
