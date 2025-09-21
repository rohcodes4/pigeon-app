import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
    last_ts: d.last_message_timestamp || d.updated_at || null,
    name: d.name || "Unknown",
    photo_url: d.avatar_url || null,
    platform: "discord",
    read: true, // Discord object doesn’t have read status
    summary: d.description || "",
    sync_enabled: null,
    timestamp: d.last_message_timestamp || d.updated_at || null,
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
      has_sticker: false
    },
    sender: {
      id: discordMsg.user_id || null,
      username: discordMsg.username || null,
      first_name: discordMsg.display_name || null,
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
