import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface FullChatObject {
  chat: {
    id: number;
    title: string | null;
    username: string | null;
    first_name: string | null;
    last_name: string | null;
    photo: { photo_id: number | null } | null;
    access_hash?: number | null;
    type?: string | null;
    _: string | null;
    participants_count?: number | null;
    megagroup?: boolean;
    broadcast?: boolean;
  };
  chat_type: string | null;
  count?: number | null;
  id: number;
  isPinned: boolean;
  is_dialog: boolean;
  is_typing: boolean;
  lastMessage: string | null;
  last_message: string | null;
  last_seen: string | null;
  last_ts: string | null;
  name: string | null;
  photo_url: string | null;
  platform: string;
  read?: boolean;
  summary: string | null;
  sync_enabled?: boolean | null;
  timestamp: string | null;
  unread?: number;
  _id: number;
}

export const mapToFullChat = (obj: any): FullChatObject => {
  const chatId = obj.chat?.id  || obj.chat_id || obj.id || 0;
  const chatTitle = obj.chat?.title || obj.title || obj.chat_title || obj.name || obj.first_name || "No Name";
  const username = obj.chat?.username || obj.username || null;
  const first_name = obj.chat?.first_name || obj.first_name || null;
  const last_name = obj.chat?.last_name || obj.last_name || null;
  const photo = obj.chat?.photo || obj.photo || null;
  const photo_url = obj.photo_url || (photo?.photo_id ? `http://localhost:9007/chat_photo/${chatId}` : null);

  return {
    chat: {
      id: chatId,
      title: chatTitle,
      username,
      first_name,
      last_name,
      photo: photo ? { photo_id: photo.photo_id || null } : null,
      access_hash: obj.access_hash ?? null,
      type: obj.chat_type || obj.type || "unknown",
      _: obj._ || "unknown",
      participants_count: obj.participants_count ?? null,
      megagroup: obj.megagroup ?? false,
      broadcast: obj.broadcast ?? false,
    },
    chat_type: obj.chat_type || obj.type || "unknown",
    count: obj.count ?? null,
    id: chatId,
    isPinned: obj.isPinned ?? false,
    is_dialog: obj.is_dialog ?? false,
    is_typing: obj.is_typing ?? false,
    lastMessage: obj.lastMessage || obj.last_message || null,
    last_message: obj.last_message || obj.lastMessage || null,
    last_seen: obj.last_seen || null,
    last_ts: obj.timestamp || obj.last_ts || null,
    name: obj.name || chatTitle,
    photo_url,
    platform: obj.platform || "Telegram",
    read: obj.read ?? true,
    summary: obj.summary || null,
    sync_enabled: obj.sync_enabled ?? null,
    timestamp: obj.timestamp || null,
    unread: obj.unread ?? 0,
    _id: chatId,
  };
};