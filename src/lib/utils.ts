import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
type ReactionChip = {
  icon: string;
  count: number;
};

type MessageItem = {
  id: any;
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

// Mapper for Discord message → MessageItem
export function mapDiscordMessageToItem(discordMsg: any): MessageItem {
  const attachments = JSON.parse(discordMsg.attachments || "[]");
  const embeds = JSON.parse(discordMsg.embeds || "[]");
  const reactions = JSON.parse(discordMsg.reactions || "[]");

  // Extract if message has link
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const hasLink = urlRegex.test(discordMsg.content);

  return {
    id: discordMsg.id,
    originalId: discordMsg.id,
    timestamp: discordMsg.timestamp,
    name: discordMsg.display_name || discordMsg.username,
    avatar: discordMsg.user_avatar,
    platform: "Discord",
    channel: discordMsg.chat_id || discordMsg.channel_id || null,
    server: "Discord", // or pass actual guild name if available
    date: new Date(discordMsg.timestamp),
    message: discordMsg.content,
    tags: [], // you can plug in logic for hashtags/keywords
    reactions: reactions.map((r: any) => ({
      emoji: r.emoji?.name || r.emoji,
      count: r.count || 1,
    })),
    hasLink,
    hasMedia: attachments.length > 0 || embeds.length > 0,
    media: attachments.length || embeds.length ? [...attachments, ...embeds] : null,
    link: hasLink ? discordMsg.content.match(urlRegex)?.[0] ?? null : null,
    replyTo: discordMsg.reply_to_id,
  };
}

export function mapDiscordToTelegramSchema(d: any) {
  return {
    chat: null, // Telegram-only
    chat_type: d.type === "dm" ? "dm" : "group",
    count: d.participant_count || null,
    id: d.id ? String(d.id) : null,
    isPinned: !!d.is_pinned,
    is_dialog: d.type === "dm",
    is_typing: false,
    lastMessage: null, // not provided
    last_message: null,
    last_seen: null,
    last_ts:  snowflakeToDate(d.last_message_id)  || null,
    name: d.name || "Unknown",
    photo_url: d.avatar_url || null,
    platform: "discord",
    read: true, // Discord object doesn’t have read status
    summary: d.description || "",
    sync_enabled: null,
    timestamp: snowflakeToDate(d.last_message_id) || null,
    unread: null, // no unread count
    _id: d.id ? String(d.id) : null,
  };
}

export function mapDiscordMessageToTelegram(discordMsg) {
  return {
    _id: discordMsg.id || null,
    timestamp: discordMsg.timestamp || null,
    raw_text: discordMsg.content || null,
    message: {
      id: discordMsg.id || null,
      date: discordMsg.timestamp || null,
      text: discordMsg.content || null,
      from_id: discordMsg.user_id ? `PeerUser(user_id=${discordMsg.user_id})` : null,
      to_id: null, // Discord doesn't have `to_id` in same sense
      reply_to: discordMsg.reply_to_id || null,
      forward: null,
      edited: discordMsg.is_edited === 1,
      media: null, // Discord attachments can be mapped here
      has_media: (discordMsg.attachments && discordMsg.attachments.length > 0) || false,
      has_document: false,
      has_photo: false,
      has_video: false,
      has_voice: false,
      has_sticker: false,
    },
    sender: {
      id: discordMsg.user_id || null,
      username: discordMsg?.author?.username || discordMsg.username|| null,
      first_name: discordMsg?.author?.global_name || discordMsg.display_name || null,
      last_name: null,
      phone: null,
      is_bot: false, // Discord API has bot flag, but your object doesn’t
    },
    chat: {
      id: discordMsg.chat_id || null,
      title: discordMsg.chat_id || null, // no explicit chat name in message
      username: null,
      first_name: null,
      last_name: null,
      photo: {
        photo_id: null
      },
      access_hash: null,
      type: discordMsg.message_type || "text",
      _: "unknown",
      participants_count: discordMsg.participant_count || null,
      megagroup: false,
      broadcast: false
    }
  };
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

export function snowflakeToDate(id) {
  if (!id) return null;
  const discordEpoch = 1420070400000n;
  const utcMs = Number((BigInt(id) >> 22n) + discordEpoch);

  // Create a Date in UTC
  const date = new Date(utcMs);

  // Format to IST (shifted)
  // Format like "YYYY-MM-DDTHH:mm:ss"
  return date.toISOString().slice(0, 19);
}
