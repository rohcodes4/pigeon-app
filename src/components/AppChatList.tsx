import { ChatListItem } from "./ChatListItem";

interface Chat {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  unread: number;
  platform: string;
  aiSummary: string;
  lastUpdated: string;
  isPinned: boolean;
  isMuted: boolean;
}

interface AppChatListProps {
  chats: Chat[];
  onSelect: (id: string) => void;
  selectedId: string | null;
  onAISummary: (id: string) => void;
  onPin: (id: string) => void;
  onMute: (id: string) => void;
  onOpenPlatform: (chat: Chat) => void;
  onAction: (id: string) => void; 
}
export const AppChatList: React.FC<AppChatListProps> = ({
  chats,
  onSelect,
  selectedId,
  onAISummary,
  onPin,
  onMute,
  onOpenPlatform,
  onAction,
}) => {
  // Pinned chats first
  const sortedChats = [...chats].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

  return (
    <div className="flex flex-col gap-1">
      {sortedChats.map((chat) => (
        <ChatListItem
          key={chat.id}
          chat={chat}
          selected={selectedId === chat.id}
          onSelect={() => onSelect(chat.id)}
          onPin={() => onPin(chat.id)}
          onMute={() => onMute(chat.id)}
          onAISummary={() => onAISummary(chat.id)}
          onAction={() => onAction(chat.id)}
          onOpenPlatform={() => onOpenPlatform(chat)}
        />
      ))}
    </div>
  );
};