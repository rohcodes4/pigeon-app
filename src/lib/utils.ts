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
  chat_id?:string;
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
  text: string;
  mentions: any;
  tags: string[];
  reactions: ReactionChip[];
  hasLink: boolean;
  hasMedia: boolean;
  media: any;
  stickerItems: any;
  referenced_message:any;
  message_reference?: any;
  sticker_items?: any;
  link: string | null;
  replyTo: any;
  sender?: any;
};
const safeParse = (val: any) => {
  if (!val) return [];
  if (typeof val === "object") return val;
  try {
    return JSON.parse(val);
  } catch {
    return [];
  }
};



// Mapper for Discord message → MessageItem
export function mapDiscordMessageToItem(discordMsg: any): MessageItem {
  const attachments = Array.isArray(discordMsg.attachments)?discordMsg.attachments:JSON.parse(discordMsg.attachments || "[]");
  const embeds = Array.isArray(discordMsg.embeds)?discordMsg.embeds: JSON.parse(discordMsg.embeds || "[]");
  const reactions = Array.isArray(discordMsg.reactions)?discordMsg.reactions: JSON.parse(discordMsg.reactions || "[]");
  const refrence_message = safeParse(discordMsg.referenced_message); 
  const mentions = Array.isArray(discordMsg.mentions)?discordMsg.mentions: JSON.parse(discordMsg.mentions || "[]"); 
  const sticker_items = Array.isArray(discordMsg.sticker_items)?discordMsg.sticker_items: JSON.parse(discordMsg.sticker_items || "[]"); 
  const message_reference = safeParse(discordMsg.message_reference); 
  
   // Extract if message has link
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const hasLink = urlRegex.test(discordMsg.content);

  return {
    id: discordMsg.id,
    chat_id: discordMsg.chat_id,
    originalId: discordMsg.id,
    timestamp: discordMsg.timestamp,
    name: discordMsg.display_name || discordMsg.username || discordMsg.name || discordMsg?.author?.global_name || discordMsg?.author?.username,
    avatar: discordMsg.user_avatar || discordMsg.avatar || discordMsg?.author?.avatar,
    platform: "Discord",
    channel: discordMsg.chat_id || discordMsg.channel_id || null,
    server: "Discord", // or pass actual guild name if available
    date: new Date(discordMsg.timestamp),
    message: discordMsg.content,
    text: discordMsg.content,
    tags: [], // you can plug in logic for hashtags/keywords
    reactions: reactions.map((r: any) => ({
      emoji: r.emoji?.name || r.emoji,
      count: r.count || 1,
    })),
    mentions:mentions,
    referenced_message:refrence_message,
    message_reference: message_reference,
    sticker_items: sticker_items,
    hasLink,
    hasMedia: attachments.length > 0 || embeds.length > 0,
    media: (attachments.length > 0 || embeds.length > 0) ? [...attachments, ...embeds] : null,
    sender:{
      id: discordMsg.user_id || discordMsg.author.id
    },
    link: hasLink ? discordMsg.content.match(urlRegex)?.[0] ?? null : null,
    stickerItems: discordMsg.sticker_items ?? null,
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
    last_ts:  snowflakeToDate(d.last_message_id)  || d.last_message_id,
    name: d.name || "Unknown",
    photo_url:d.type=="dm"? d.avatar_url || null : safeParse(d.avatar_url),
    platform: "discord",
    read: true, // Discord object doesn’t have read status
    summary: d.description || "",
    sync_enabled: null,
    timestamp: snowflakeToDate(d.last_message_id) || d.last_message_id,
    unread: null, // no unread count
    _id: d.id ? String(d.id) : null,
  };
}

export function mapDiscordMessageToTelegram(discordMsg) {
  const attachments = discordMsg.attachments || [];
  const embeds = discordMsg.embeds || [];
  const reactions = discordMsg.reactions || [];
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
      media: attachments.length || embeds.length ? [...attachments, ...embeds] : null,
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

const ADMINISTRATOR = 1n << 3n;   // 8
const VIEW_CHANNEL  = 1n << 10n; // 1024
const SEND_MESSAGES = 1n << 11n; // 2048
  function applyOverwriteSet(permissions, overwrites = [], memberRoleIds = [], userId, guildId) {
  // 1) @everyone overwrite (id === guildId)
  const everyoneOw = overwrites.find(o => o.type === 0 && (o.id === guildId || o.id === String(guildId)));
  if (everyoneOw) {
    permissions &= ~BigInt(everyoneOw.deny || "0");
    permissions |= BigInt(everyoneOw.allow || "0");
  }

  // 2) Aggregate role overwrites for this member
  let roleDeny = 0n, roleAllow = 0n;
  for (const ow of overwrites) {
    if (ow.type !== 0) continue;
    if (!memberRoleIds.includes(ow.id)) continue;
    roleDeny  |= BigInt(ow.deny || "0");
    roleAllow |= BigInt(ow.allow || "0");
  }
  permissions &= ~roleDeny;
  permissions |= roleAllow;

  // 3) Member-specific overwrite (highest precedence)
  const memberOw = overwrites.find(o => o.type === 1 && o.id === userId);
  if (memberOw) {
    permissions &= ~BigInt(memberOw.deny || "0");
    permissions |= BigInt(memberOw.allow || "0");
  }

  return permissions;
}

// Compute base permissions (OR of @everyone + all member roles)
function computeBasePermissions(member, guildRoles = [], guildId) {
  let perms = 0n;
  // find @everyone role by id OR name (robust)
  const everyoneRole = guildRoles.find(r => r.id === guildId || r.name === '@everyone');
  if (everyoneRole) perms |= BigInt(everyoneRole.permissions || "0");

  // member.roles may be at member.roles or member.role_ids - handle both
  const memberRoleIds = member?.roles || member?.role_ids || [];
  for (const rid of memberRoleIds) {
    const role = guildRoles.find(r => r.id === rid);
    if (role) perms |= BigInt(role.permissions || "0");
  }
  return perms;
}
  // Compute final perms for a channel, including ancestor (category) overwrites
function computeChannelPermsWithParents(channel, guild, member, channelsById, debug = false) {
  const guildRoles = guild.roles || [];
  const guildId = guild.id;
  const memberRoleIds = member?.roles || member?.role_ids || [];
  const userId = member?.user?.id || member?.id; // tolerate both shapes

  // 1) base perms
  let permissions = computeBasePermissions(member, guildRoles, guildId);

  // 2) Admin/owner shortcuts
  if ((permissions & ADMINISTRATOR) !== 0n || guild.owner_id === userId) {
    if (debug) console.log(`[debug] ${channel.name}: admin or owner => full perms`);
    return { canView: true, canSend: true, permissions };
  }

  // 3) gather ancestor (category) chain (root-most first)
  const chain = [];
  let pid = channel.parent_id;
  while (pid) {
    const p = channelsById.get(pid);
    if (!p) break;
    chain.push(p);
    pid = p.parent_id;
  }
  // chain currently [immediateParent, parentOfParent, ...] -> reverse to root-first
  chain.reverse();

  // 4) apply each ancestor's overwrites (root -> ... -> immediateParent)
  for (const ancestor of chain) {
    permissions = applyOverwriteSet(permissions, ancestor.permission_overwrites || [], memberRoleIds, userId, guildId);
  }

  // 5) apply channel overwrites
  permissions = applyOverwriteSet(permissions, channel.permission_overwrites || [], memberRoleIds, userId, guildId);

  const canView = (permissions & VIEW_CHANNEL) !== 0n;
  const canSend = canView && (permissions & SEND_MESSAGES) !== 0n;

  if (debug) {
    console.log(`[debug] ${guild.name} / ${channel.name} -> perms: ${permissions.toString()} canView:${canView} canSend:${canSend}`);
    // optional: print which ancestor overwrites were applied
  }

  return { canView, canSend, permissions };
}
  
  export function buildGuildChannelsWithPermissions(guilds, currentUserId, debug = false) {
  const tempDCchannel = {};

  if (!Array.isArray(guilds)) return tempDCchannel;

  for (const guild of guilds) {
    // build channels map for parent traversal
    const channels = guild.channels || [];
    const channelsById = new Map();
    // support both flattened channels or category-with-children structure
    for (const ch of channels) {
      channelsById.set(ch.id, ch);
      // if 'children' exists (your category structure) also map children
      if (Array.isArray(ch.children) && ch.children.length) {
        for (const child of ch.children) {
          channelsById.set(child.id, child);
        }
      }
    }

    // find member object for current user
    const member = (guild.members || []).find(m => (m.user && m.user.id === currentUserId) || m.id === currentUserId);
    if (!member) continue;

    // iterate channels (preserve original list shape)
    const updatedChannels = channels.map(channel => {
      // channel might be a category (type 4) or child under 'children' — handle both
      const ch = channel;
      const { canView, canSend } = computeChannelPermsWithParents(ch, guild, member, channelsById, debug);
      return { ...ch, canView, canSend };
    });

    tempDCchannel[guild.id] = updatedChannels;
  }

  return tempDCchannel;
}