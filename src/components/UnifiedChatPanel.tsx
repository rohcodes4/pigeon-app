import React, { useEffect, useRef } from "react";
import discord from "@/assets/images/discordColor.png";
import telegram from "@/assets/images/telegramColor.png";
import discordWhite from "@/assets/images/discord.png";
import { FaCopy } from "react-icons/fa";
import { FaReply } from "react-icons/fa";
import telegramWhite from "@/assets/images/telegram.png";
import { IoIosMore } from "react-icons/io";
import aiAll from "@/assets/images/aiAll.png";

import {
  Link2,
  Send,
  X,
  SendHorizonal,
  SmilePlus,
  SmilePlusIcon,
  Heart,
    ChevronDown, 
  Pin,
  Plus,
  VolumeX,
} from "lucide-react";
import moreIcon from "@/assets/images/moreIcon.png";
import pinIcon from "@/assets/images/pinIcon.png";
import replyIcon from "@/assets/images/replyIcon.png";
import taskIcon from "@/assets/images/sidebar/Chat.png";
import smartIcon from "@/assets/images/sidebar/Chat.png";
import { FaDiscord, FaTelegramPlane } from "react-icons/fa";
import ChatAvatar from "./ChatAvatar";
import { useAuth } from "@/hooks/useAuth";
import {
  sendReaction,
  getMessageById,
  sendMessage,
  createBookmark,
} from "@/utils/apiHelpers";
import { toast } from "@/hooks/use-toast";

// Types
type ReactionChip = { icon: string; count: number };
type MessageItem = {
  id: any;
  originalId: any;
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
  link: string | null;
  replyTo: any;
};

// Dummy data generation
const platforms = ["Discord", "Telegram"] as const;
const tags = ["alpha", "presale", "airdrop"];
const channels = ["#general", "#alpha", "#announcements", null];
const names = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank"];
const messages = [
  "Check out this new project! https://example.com",
  "Alpha is live now!",
  "Presale starts tomorrow.",
  "Airdrop confirmed for next week.",
  "Join the discussion in #alpha.",
  "Here's the link: https://airdrop.com",
  "Excited for the launch!",
  "Anyone got whitelist?",
  "Big news coming soon.",
  "Don't miss the presale event!",
];

const servers = ["POW'S GEM CALLS", "CRYPTOCAT", "BOTMASTER"];

function randomFrom<T>(arr: readonly T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysBack: number) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return date;
}

function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// function formatTime(date: Date) {
//   return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
// }

function formatTime(dateObj) {
  // Add 5 hours and 30 minutes (330 minutes total)
  const adjustedDate = new Date(dateObj.getTime() + (5.5 * 60 * 60 * 1000));
  
  return adjustedDate.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}
function gravatarUrl(seed: string) {
  try {
    // Handle Unicode characters safely
    const safeSeed = seed.replace(/[^\x00-\x7F]/g, ""); // Remove non-ASCII characters
    if (!safeSeed)
      return `https://www.gravatar.com/avatar/default?d=identicon&s=80`;
    return `https://www.gravatar.com/avatar/${btoa(safeSeed)}?d=identicon&s=80`;
  } catch (error) {
    // Fallback to default avatar
    return `https://www.gravatar.com/avatar/default?d=identicon&s=80`;
  }
}

// Generate 30 dummy messages, oldest first
const dummyMessages = Array.from({ length: 30 }, (_, i) => {
  const date = randomDate(5);
  const platform = randomFrom(platforms);
  const channel = randomFrom(channels);
  const server = randomFrom(servers);
  const name = randomFrom(names);
  const message = randomFrom(messages);
  const messageTags = tags.filter(() => Math.random() < 0.3);
  const reactions: ReactionChip[] = [
    { icon: "👍", count: Math.floor(Math.random() * 10) },
    { icon: "💬", count: Math.floor(Math.random() * 5) },
  ].filter(() => Math.random() < 0.7) as ReactionChip[];
  const hasLink = message.includes("http");
  return {
    id: i + 1,
    originalId: undefined, // Dummy messages don't have originalId
    telegramMessageId: undefined, // Dummy messages don't have telegramMessageId
    name,
    avatar: gravatarUrl(name + platform),
    platform,
    channel,
    server,
    date,
    message,
    tags: messageTags,
    reactions,
    hasLink,
    link: hasLink ? message.match(/https?:\/\/\S+/)?.[0] : null,
    replyTo: null as any, // Add this to fix TypeScript errors
  };
}).sort((a, b) => a.date.getTime() - b.date.getTime()); // oldest first

const platformIcon = (platform: string) =>
  platform === "Discord" ? discord : telegram;

interface UnifiedChatPanelProps {
  selectedChat?: any | string;
}

const UnifiedChatPanel: React.FC<UnifiedChatPanelProps> = ({
  selectedChat = "all-channels",
}) => {
  // Flag to toggle between real data and dummy data for design inspiration
  const USE_DUMMY_DATA = false; // Set to true to use dummy data, false for real data
  const { user } = useAuth();

  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  // Preserve scroll position when older messages are prepended
  const scrollRestoreRef = React.useRef<{
    prevHeight: number;
    prevTop: number;
  } | null>(null);
  const [replyTo, setReplyTo] = React.useState<null | MessageItem>(null);
  const [messages, setMessages] = React.useState<MessageItem[]>(
    USE_DUMMY_DATA ? (dummyMessages as unknown as MessageItem[]) : []
  );
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [hasMoreMessages, setHasMoreMessages] = React.useState(true);
  const [isNewChat, setIsNewChat] = React.useState(false);
  const [menuPositions, setMenuPositions] = React.useState({});
  const [shouldAutoScroll, setShouldAutoScroll] = React.useState(true);
  const [pinLoading, setPinLoading] = React.useState({});
const [pinnedMessages, setPinnedMessages] = React.useState([]);
const [showScrollToBottom, setShowScrollToBottom] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  // Page size for fetching messages from backend
  const PAGE_SIZE = 100;

  const pinMessage = async (messageId) => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem("access_token");

  const formData = new FormData();
  formData.append("message_id", messageId);

  const response = await fetch(`${BACKEND_URL}/pins`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Pin request failed: ${response.status}`);
  }

  return response.json();
};

const getMenuPosition = (buttonElement) => {
  if (!buttonElement) return 'bottom-[110%]';
  
  const rect = buttonElement.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const menuHeight = 500; // Approximate height of your menu
  
  // If there's not enough space above, show below
  if (rect.top < menuHeight) {
    return 'top-[110%]';
  }
  // Otherwise show above
  return 'bottom-[110%]';
};

const unpinMessage = async (pinId) => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem("access_token");

  const response = await fetch(`${BACKEND_URL}/pins/${pinId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Unpin request failed: ${response.status}`);
  }

  return response.json();
};

const handlePin = async (msg) => {
  const messageId = msg.originalId || msg.id;

  if (!messageId) {
    toast({
      title: "Cannot pin message",
      description: "This message cannot be pinned",
      variant: "destructive",
    });
    return;
  }

  const isPinned = isMessagePinned(messageId?.toString());

  try {
    setPinLoading((prev) => ({ ...prev, [msg.id]: true }));

    if (isPinned) {
      // Unpin the message - use pin.id, not pin._id
      console.log("Attempting to unpin message with ID:", messageId);
      console.log("All pinned messages:", pinnedMessages);
      
      const pinToRemove = pinnedMessages.find(pin => pin.message_id === messageId?.toString());
      console.log("Pin to remove:", pinToRemove);
      
      if (pinToRemove && pinToRemove.id) {
        console.log("Using pin ID for deletion:", pinToRemove.id);
        
        await unpinMessage(pinToRemove.id);
        
        // Remove from local pinned messages state using pin.id
        setPinnedMessages((prev) => prev.filter(pin => pin.id !== pinToRemove.id));

        toast({
          title: "Message unpinned",
          description: "Message has been unpinned successfully",
        });
      } else {
        // If pin not found in local state, try to fetch latest pins and try again
        console.log("Pin not found in local state, fetching latest pins...");
        
        try {
          const chatIdForFetch = selectedChat?.id || null;
          console.log("Fetching pins for chat:", chatIdForFetch);
          
          const latestPins = await getPinnedMessages(chatIdForFetch);
          console.log("Latest pins from server:", latestPins);
          
          const serverPin = latestPins.find(pin => pin.message_id === messageId?.toString());
          console.log("Server pin found:", serverPin);
          
          if (serverPin && serverPin.id) {
            console.log("Using server pin ID for deletion:", serverPin.id);
            await unpinMessage(serverPin.id);
            
            // Update local state with fresh data minus the removed pin
            setPinnedMessages(latestPins.filter(pin => pin.id !== serverPin.id));
            
            toast({
              title: "Message unpinned",
              description: "Message has been unpinned successfully",
            });
          } else {
            console.error("Server pin not found or missing id");
            toast({
              title: "Cannot unpin message",
              description: "Pin not found on server",
              variant: "destructive",
            });
          }
        } catch (fetchError) {
          console.error("Failed to fetch latest pins:", fetchError);
          toast({
            title: "Cannot unpin message", 
            description: "Failed to fetch pin data: " + fetchError.message,
            variant: "destructive",
          });
        }
      }
    } else {
      // Pin the message
      console.log("Attempting to pin message with ID:", messageId);
      
      const result = await pinMessage(messageId.toString());
      console.log("Pin result:", result);
      
      // Update local pinned messages state
      setPinnedMessages((prev) => [result, ...prev]);

      toast({
        title: "Message pinned",
        description: "Message has been pinned successfully",
      });
    }
  } catch (error) {
    console.error("Error with pin/unpin:", error);
    
    if (error.message.includes("already pinned")) {
      toast({
        title: "Already pinned",
        description: "This message is already pinned",
        variant: "destructive",
      });
    } else if (error.message.includes("Pin not found")) {
      toast({
        title: "Pin not found",
        description: "This pin may have been removed already",
        variant: "destructive",
      });
    } else {
      const action = isPinned ? "unpin" : "pin";
      toast({
        title: `Failed to ${action} message`,
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  } finally {
    setPinLoading((prev) => ({ ...prev, [msg.id]: false }));
  }
};
const isMessagePinned = (messageId) => {
  return pinnedMessages.some(pin => pin.message_id === messageId);
};

const fetchPinnedMessages = React.useCallback(async (chatId = null) => {
  try {
    const pins = await getPinnedMessages(chatId);
    console.log("Fetched pins:", pins);
    setPinnedMessages(pins);
  } catch (error) {
    console.error("Failed to fetch pinned messages:", error);
  }
}, []);

const getPinnedMessages = async (chatId = null) => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem("access_token");

  let url = `${BACKEND_URL}/pins`;
  if (chatId !== null) {
    url += `?chat_id=${chatId}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Get pins request failed: ${response.status}`);
  }

  return response.json();
};

  // Auto-scroll to bottom when messages change
const scrollToBottom = React.useCallback(() => {
  const container = messagesContainerRef.current;
  if (!container) return;
  
  // Scroll the container itself to the bottom
  requestAnimationFrame(() => {
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    requestAnimationFrame(() => {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    });
  });
  
  // Hide the scroll button after scrolling
  setShowScrollToBottom(false);
}, []);
  const [showAttachMenu, setShowAttachMenu] = React.useState(false);
  const attachRef = React.useRef(null);
  const [uploadedFiles, setUploadedFiles] = React.useState([]);
  const fileInputRef = React.useRef(null);
  console.log("selectedChat", selectedChat);
  const getFileType = (file) => {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";
    return "doc";
  };

  const openInTelegram = (msg = null) => {
    console.log("🔍 === DEBUG: openInTelegram START ===");
    console.log("🔍 openInTelegram called with msg:", msg);

    if (!selectedChat) {
      console.log("❌ No selectedChat available");
      return;
    }

    console.log("✅ selectedChat exists:", selectedChat);

    // Get chatId from selectedChat
    const chatId = selectedChat.id || selectedChat._id;
    console.log("🔍 Using chatId from selectedChat:", chatId);

    // Use the preserved original chat type from the API response
    let chatType;

    console.log("🔍 === DEBUG: GETTING CHAT TYPE FROM PRESERVED API DATA ===");

    if (msg && msg.originalChatType) {
      // Use the preserved chat type from the original API response
      chatType = msg.originalChatType;
      console.log(
        "✅ Got chatType from preserved API data (msg.originalChatType):",
        chatType
      );
    } else {
      // Fallback: Use heuristics from selectedChat if originalChatType is not available
      console.log("⚠️ No preserved chat type found, using fallback heuristics");

      const chatIdStr = String(chatId);
      const chatIdLength = chatIdStr.length;

      if (selectedChat.participants_count !== undefined) {
        chatType = "Chat";
        console.log("✅ Fallback: Determined Chat (found participants_count)");
      } else if (
        selectedChat.username ||
        (selectedChat.name && selectedChat.name.startsWith("@"))
      ) {
        chatType = "Channel";
        console.log("✅ Fallback: Determined Channel (found username/@)");
      } else if (chatIdLength <= 10 && !selectedChat.title) {
        chatType = "User";
        console.log("✅ Fallback: Determined User (short ID + no title)");
      } else if (chatIdLength > 10) {
        chatType = "Channel";
        console.log("✅ Fallback: Determined Channel (long ID)");
      } else {
        chatType = "Chat";
        console.log("✅ Fallback: Defaulted to Chat");
      }
    }

    console.log("🔍 Final chatType determined:", chatType);

    let webUrl;

    console.log("🔍 === DEBUG: URL GENERATION ===");

    if (chatType === "User") {
      // Direct Message - no prefix
      webUrl = `https://web.telegram.org/a/#${chatId}`;
      console.log("📱 Generated URL for Direct Message:", webUrl);
    } else if (chatType === "Channel") {
      // Supergroup/Channel - needs -100 prefix
      webUrl = `https://web.telegram.org/a/#-100${chatId}`;
      console.log("📱 Generated URL for Channel/Supergroup:", webUrl);
    } else if (chatType === "Chat") {
      // Regular Group - needs - prefix
      webUrl = `https://web.telegram.org/a/#-${chatId}`;
      console.log("📱 Generated URL for Regular Group:", webUrl);
    } else {
      // Fallback - assume regular group
      console.log("⚠️ Unknown chat type, assuming regular group");
      webUrl = `https://web.telegram.org/a/#-${chatId}`;
      console.log("📱 Generated URL (fallback):", webUrl);
    }

    console.log("🔗 === DEBUG: OPENING URL ===");
    console.log("🔗 Final URL to open:", webUrl);
    console.log("🔍 === DEBUG: openInTelegram END ===");

    window.open(webUrl, "_blank");
  };

React.useEffect(() => {
  // Only auto-scroll if it's a new chat or shouldAutoScroll is explicitly set
  if (shouldAutoScroll || isNewChat) {
    // Use setTimeout to ensure DOM has updated after messages render
    setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    // Reset the new chat flag after scrolling
    if (isNewChat) {
      setIsNewChat(false);
    }
  }
}, [messages, shouldAutoScroll, isNewChat, scrollToBottom]);

  const groupedByDate: { [date: string]: typeof messages } =
    React.useMemo(() => {
      const groups: { [date: string]: typeof messages } = {};
      messages.forEach((msg) => {
        const dateKey = formatDate(msg.date);
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(msg);
      });
      return groups;
    }, [messages]);

  // 2. Add these state variables inside your component (around line 150):
  const [bookmarkLoading, setBookmarkLoading] = React.useState<{
    [key: string]: boolean;
  }>({});

  // Reaction state management
  const [reactionLoading, setReactionLoading] = React.useState<{
    [key: string]: boolean;
  }>({});
  const [showReactionPicker, setShowReactionPicker] = React.useState<{
    [key: string]: boolean;
  }>({});
  // Local UI reactions (emoji counts) keyed by message id
  const [localReactions, setLocalReactions] = React.useState<{
    [messageId: string]: { [emoji: string]: number };
  }>({});

  // Common emoji reactions
  const commonReactions = ["👍", "❤️", "🔥", "😢", "😡", "🎉", "💯", "👏"];

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      setReactionLoading((prev) => ({ ...prev, [messageId]: true }));

      const isObjectId = /^[a-f\d]{24}$/i.test(messageId);
      console.log(
        `Reaction attempt: messageId="${messageId}", isObjectId=${isObjectId}, emoji="${emoji}"`
      );
      if (isObjectId) {
        // Create rollback snapshot visible to catch
        let rollbackSnapshot = messages;
        try {
          // Determine if user already reacted with this emoji (toggle behavior)
          const msg = messages.find(
            (m) => String(m.originalId || m.id) === String(messageId)
          );
          const already = !!msg?.reactions?.find((r: any) => r.icon === emoji);

          // Optimistic update
          rollbackSnapshot = messages;
          setMessages((prev) =>
            prev.map((m) => {
              if (String(m.originalId || m.id) !== String(messageId)) return m;
              const existing = [...(m.reactions || [])];
              const idx = existing.findIndex((r) => r.icon === emoji);
              if (already) {
                if (idx >= 0) {
                  const next = [...existing];
                  const newCount = Math.max(0, (existing[idx].count || 1) - 1);
                  if (newCount === 0) next.splice(idx, 1);
                  else next[idx] = { ...existing[idx], count: newCount };
                  return { ...m, reactions: next };
                }
                return m;
              } else {
                if (idx >= 0) {
                  const next = [...existing];
                  next[idx] = {
                    ...existing[idx],
                    count: (existing[idx].count || 0) + 1,
                  };
                  return { ...m, reactions: next };
                }
                return {
                  ...m,
                  reactions: [...existing, { icon: emoji, count: 1 }],
                };
              }
            })
          );

          const res = await sendReaction(messageId, emoji, {
            clear: already,
          });
          console.log(
            `Reaction ${emoji} sent to backend for message ${messageId} (sent_to_telegram=${res?.sent_to_telegram})`
          );
          // If backend returns updated reactions snapshot, reflect it in UI immediately
          const toChips = (results: any[]) =>
            results
              .map((r: any) => {
                const emoticon =
                  typeof r?.reaction?.emoticon === "string"
                    ? r.reaction.emoticon
                    : typeof r?.reaction === "string"
                    ? r.reaction
                    : null;
                const normalized =
                  emoticon === "❤" || emoticon === "♥️" ? "❤️" : emoticon;
                return normalized
                  ? { icon: normalized, count: r?.count || 0 }
                  : null;
              })
              .filter(Boolean) as Array<{ icon: string; count: number }>;

          if (res && res.reactions) {
            const updated = Array.isArray(res.reactions?.results)
              ? toChips(res.reactions.results)
              : [];
            setMessages((prev) =>
              prev.map((m) =>
                String(m.originalId || m.id) === String(messageId)
                  ? { ...m, reactions: updated }
                  : m
              )
            );
          } else {
            // Fallback: refetch message by id to ensure we have the latest reactions
            try {
              const fresh = await getMessageById(messageId);
              const reactionResults =
                (fresh?.message?.reactions &&
                  fresh.message.reactions.results) ||
                [];
              const parsed = Array.isArray(reactionResults)
                ? toChips(reactionResults)
                : [];
              setMessages((prev) =>
                prev.map((m) =>
                  String(m.originalId || m.id) === String(messageId)
                    ? { ...m, reactions: parsed }
                    : m
                )
              );
            } catch (e) {
              // ignore
            }
          }
        } catch (backendError) {
          console.warn(
            "Backend reaction failed, reverting optimistic update:",
            backendError
          );
          // Rollback
          setMessages((_) => rollbackSnapshot);
        }
      } else {
        // Dummy/local message
        console.log(
          `Reaction ${emoji} logged locally for dummy message ${messageId}`
        );
      }

      // Close reaction picker
      setShowReactionPicker((prev) => ({ ...prev, [messageId]: false }));
    } catch (error) {
      console.error("Failed to send reaction:", error);
    } finally {
      setReactionLoading((prev) => ({ ...prev, [messageId]: false }));
    }
  };

  const toggleReactionPicker = (messageId: string) => {
    setShowReactionPicker((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  };

  // Close reaction picker when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".reaction-picker")) {
        setShowReactionPicker({});
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleBookmark = async (
    msg: any,
    type: "bookmark" | "pin" = "bookmark"
  ) => {
    // For API data, use the original message ID from the database
    const messageId = msg.originalId || msg.id; // Use originalId if available, fallback to current id

    console.log("Bookmarking message:", {
      messageId,
      originalId: msg.originalId,
      id: msg.id,
      type,
    });

    if (!messageId) {
      toast({
        title: "Cannot bookmark message",
        description: "This message cannot be bookmarked",
        variant: "destructive",
      });
      return;
    }

    try {
      setBookmarkLoading((prev) => ({ ...prev, [msg.id]: true }));

      const result = await createBookmark(messageId.toString(), type);
      console.log("Bookmark result:", result);

      const actionText = type === "pin" ? "pinned" : "bookmarked";
      console.log(`Message ${actionText} successfully`);

      // Show success feedback
      toast({
        title: `Message ${actionText}`,
        description: `Message has been ${actionText} successfully`,
      });
    } catch (error) {
      console.error(`Error ${type}ing message:`, error);
      toast({
        title: `Failed to ${type} message`,
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setBookmarkLoading((prev) => ({ ...prev, [msg.id]: false }));
    }
  };

  // Function to fetch messages for a selected chat
  const fetchMessages = React.useCallback(
    async (
      chatId: number | string,
      beforeTimestamp?: string,
      append = false
    ) => {
      if (!chatId) return;

      // If using dummy data, don't fetch from API
      if (USE_DUMMY_DATA) {
        setMessages(dummyMessages);
        return;
      }

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setHasMoreMessages(true); // Reset pagination state for new chat
      }

      try {
        const token = localStorage.getItem("access_token");

        // Determine the endpoint based on the type of chat selection
        let endpoint: string;

        if (chatId === "all-channels") {
          endpoint = `${import.meta.env.VITE_BACKEND_URL}/chats/all/messages`;
        } else if (typeof chatId === "object" && chatId && "id" in chatId) {
          // This is a smart filter object
          endpoint = `${import.meta.env.VITE_BACKEND_URL}/filters/${
            (chatId as any).id
          }/messages`;
        } else {
          // This is a regular chat ID
          endpoint = `${
            import.meta.env.VITE_BACKEND_URL
          }/chats/${chatId}/messages`;
        }

        // Add pagination parameter if loading older messages
        const params = new URLSearchParams();
        params.append("limit", String(PAGE_SIZE));
        if (beforeTimestamp) {
          params.append("before", beforeTimestamp);
        }
        if (params.toString()) {
          endpoint += `?${params.toString()}`;
        }

        const response = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Debug: Log the first message's chat object to see what we're getting
        if (data.length > 0) {
          console.log("First message chat object:", data[0].chat);
        }

        // Transform the messages to match our component's expected format
        const transformedMessages = data.map((msg: any, index: number) => {
          // Extract chat name and determine channel from the message data
          let chatName = "Unknown";
          let channelName = null; // Default to null (no channel)

          if (chatId === "all-channels" && msg.chat) {
            // For "all-channels", extract chat name based on the chat type
            // For Telegram, always set channel to null since we don't have topic/channel data
            // Discord channels will be handled separately when we add Discord support
            if (msg.chat._ === "Channel") {
              // For Telegram channels, use title or username as chat name
              chatName = msg.chat.title || msg.chat.username || "Unknown";
              channelName = null; // No channel display for Telegram
            } else if (msg.chat._ === "Chat") {
              // For Telegram groups, use title or username as chat name, no channel
              chatName = msg.chat.title || msg.chat.username || "Unknown";
              channelName = null; // No channel for groups
            } else if (msg.chat._ === "User") {
              // For users/bots (direct messages), use first_name or username as chat name, no channel
              chatName = msg.chat.first_name || msg.chat.username || "Unknown";
              channelName = null; // No channel for direct messages
            } else {
              // Fallback
              chatName =
                msg.chat.title ||
                msg.chat.username ||
                msg.chat.first_name ||
                "Unknown";
              channelName = null;
            }
          } else {
            // For specific chats, use the selected chat name
            chatName = selectedChat?.name || "Chat";
            channelName = null; // No channel for specific chat view
          }

          // Parse Telegram reactions from message payload if present
          const reactionResults =
            (msg?.message?.reactions && msg.message.reactions.results) || [];
          const parsedReactions = Array.isArray(reactionResults)
            ? (reactionResults
                .map((r: any) => {
                  const emoticon =
                    typeof r?.reaction?.emoticon === "string"
                      ? r.reaction.emoticon
                      : typeof r?.reaction === "string"
                      ? r.reaction
                      : null;
                  const normalized =
                    emoticon === "❤" || emoticon === "♥️" ? "❤️" : emoticon;
                  return normalized
                    ? { icon: normalized, count: r?.count || 0 }
                    : null;
                })
                .filter(Boolean) as Array<{ icon: string; count: number }>)
            : [];

          return {
            id: msg._id || msg.id || String(index + 1),
            originalId: msg._id || msg.id,
            telegramMessageId: msg.message?.id, // Store the Telegram message ID for replies
            name: msg.sender?.first_name || msg.sender?.username || "Unknown",
            avatar: msg.sender?.id
              ? `${import.meta.env.VITE_BACKEND_URL}/contact_photo/${
                  msg.sender.id
                }`
              : gravatarUrl(
                  msg.sender?.first_name || msg.sender?.username || "Unknown"
                ),
            platform: "Telegram" as const,
            channel: channelName, // Will be null for DMs and groups, channel name for channels
            server: chatName, // Always the chat/group/channel name
            date: new Date(msg.timestamp),
            message: msg.raw_text || "",
            tags: [],
            reactions: parsedReactions,
            hasLink: (msg.raw_text || "").includes("http"),
            link: (msg.raw_text || "").match(/https?:\/\/\S+/)?.[0] || null,
            replyTo: null as any,
            originalChatType: msg.chat?._ || null,
            // telegramMessageId already set above; keep a single definition only
          };
        });

        // Sort messages by date (oldest first) so newest appear at bottom
        transformedMessages.sort((a, b) => a.date.getTime() - b.date.getTime());

        // Check if we got fewer messages than requested (indicating we've reached the end)
        if (data.length < PAGE_SIZE) {
          setHasMoreMessages(false);
        }

        if (append) {
          // Prepend older messages to the existing list
          setShouldAutoScroll(false); // Don't auto-scroll when loading more
          setMessages((prevMessages) => [
            ...transformedMessages,
            ...prevMessages,
          ]);
        } else {
          // Replace messages for new chat
          setShouldAutoScroll(true); // Enable auto-scroll for new chat
          setMessages(transformedMessages);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
        if (!append) {
          setMessages([]); // Set empty array on error only if not appending
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [selectedChat?.name] // Only depend on the name, not the entire object
  );

  // Function to load more messages when scrolling to top
  const loadMoreMessages = React.useCallback(() => {
    if (loadingMore || loading || !hasMoreMessages || messages.length === 0)
      return;

    // Get the timestamp of the oldest message
    const oldestMessage = messages[0];
    if (!oldestMessage) return;

    const beforeTimestamp = oldestMessage.date.toISOString();

    if (selectedChat?.id) {
      // Check if this is a smart filter or regular chat
      if (selectedChat.name && selectedChat.keywords !== undefined) {
        // This is a smart filter
        fetchMessages(selectedChat, beforeTimestamp, true);
      } else {
        // This is a regular chat
        fetchMessages(selectedChat.id, beforeTimestamp, true);
      }
    } else if (selectedChat === "all-channels") {
      fetchMessages("all-channels", beforeTimestamp, true);
    }
  }, [
    loadingMore,
    loading,
    hasMoreMessages,
    messages,
    selectedChat,
    fetchMessages,
  ]);

  // Scroll event handler for infinite loading
const handleScroll = React.useCallback(
  (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    const threshold = 100; // Load more when within 100px of top

    // Check if user has scrolled up from bottom (show scroll button)
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    setShowScrollToBottom(!isNearBottom);

    const isScrollable = scrollHeight > clientHeight + threshold;

    if (
      scrollTop <= threshold &&
      hasMoreMessages &&
      !loadingMore &&
      !loading &&
      isScrollable
    ) {
      scrollRestoreRef.current = {
        prevHeight: container.scrollHeight,
        prevTop: container.scrollTop,
      };
      loadMoreMessages();
    }
  },
  [hasMoreMessages, loadingMore, loading, loadMoreMessages]
);

  // After messages update, restore scroll position when we just prepended older items
  React.useEffect(() => {
    if (!loadingMore && scrollRestoreRef.current) {
      const container = messagesContainerRef.current;
      if (container) {
        const { prevHeight, prevTop } = scrollRestoreRef.current;
        const delta = container.scrollHeight - prevHeight;
        container.scrollTop = prevTop + delta;
      }
      scrollRestoreRef.current = null;
    }
  }, [messages, loadingMore]);

  const handleSend = async () => {
    if (!inputRef.current || !inputRef.current.value.trim()) {
      return;
    }

    const messageText = inputRef.current.value.trim();

    // Check if we have a valid chat selected and it's not "all-channels"
    if (!selectedChat || selectedChat === "all-channels") {
      toast({
        title: "No chat selected",
        description: "Please select a specific chat to send messages",
        variant: "destructive",
      });
      return;
    }

    // Check if this is a smart filter (not a real chat)
    if (selectedChat.keywords !== undefined) {
      toast({
        title: "Cannot send to smart filter",
        description: "Please select a real chat instead of a smart filter",
        variant: "destructive",
      });
      return;
    }

    const chatId = selectedChat.id;
    if (!chatId) {
      toast({
        title: "Invalid chat",
        description: "The selected chat is not valid",
        variant: "destructive",
      });
      return;
    }

    // Prevent multiple sends
    if (isSending) {
      return;
    }

    setIsSending(true);

    // Create optimistic message for immediate UI feedback
    const optimisticMessage: MessageItem = {
      id: `temp-${Date.now()}`, // Temporary ID
      originalId: null,
      telegramMessageId: undefined,
      name: user?.username || user?.first_name || "You",
      avatar: user?.photo_url || gravatarUrl(user?.username || "You"),
      platform: "Telegram" as const,
      channel: selectedChat.channel || null,
      server: selectedChat.name || "Chat",
      date: new Date(),
      message: messageText,
      tags: [],
      reactions: [],
      hasLink: messageText.includes("http"),
      link: messageText.match(/https?:\/\/\S+/)?.[0] || null,
      replyTo: replyTo
        ? {
            id: replyTo.id,
            name: replyTo.name,
            message: replyTo.message,
          }
        : null,
    };

    // Add optimistic message to UI
    setMessages((prev) => [...prev, optimisticMessage]);

    // Clear input and reply state immediately for better UX
    const originalValue = inputRef.current.value;
    const originalReplyTo = replyTo;
    inputRef.current.value = "";
    setReplyTo(null);
    setShouldAutoScroll(true);

    try {
      // Send message to backend/Telegram
      const replyToId = originalReplyTo?.telegramMessageId;
      const result = await sendMessage(chatId, messageText, replyToId);

      console.log("Message sent successfully:", result);

      // Show success toast
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully",
      });

      // Remove optimistic message since the real one will come from the database
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== optimisticMessage.id)
      );
    } catch (error) {
      console.error("Failed to send message:", error);

      // Remove optimistic message on error
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== optimisticMessage.id)
      );

      // Restore input and reply state on error
      if (inputRef.current) {
        inputRef.current.value = originalValue;
      }
      setReplyTo(originalReplyTo);

      // Show user-friendly error message
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      if (errorMessage.includes("No Telegram session")) {
        toast({
          title: "No Telegram session",
          description:
            "Please reconnect your Telegram account to send messages",
          variant: "destructive",
        });
      } else if (errorMessage.includes("404")) {
        toast({
          title: "Chat not found",
          description: "This chat is no longer accessible",
          variant: "destructive",
        });
      } else if (errorMessage.includes("403")) {
        toast({
          title: "Permission denied",
          description:
            "You don't have permission to send messages to this chat",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Failed to send message",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsSending(false);
    }
  };

  React.useEffect(() => {
    const handleClick = () => setOpenMenuId(null);
    if (openMenuId !== null) {
      window.addEventListener("click", handleClick);
      return () => window.removeEventListener("click", handleClick);
    }
  }, [openMenuId]);

  // Silent refresh that avoids toggling loading states and only appends new messages
const refreshLatest = React.useCallback(async () => {
  if (USE_DUMMY_DATA) return;
  try {
    const token = localStorage.getItem("access_token");
    let endpoint: string | null = null;

    if (selectedChat === "all-channels") {
      endpoint = `${
        import.meta.env.VITE_BACKEND_URL
      }/chats/all/messages?limit=${PAGE_SIZE}`;
    } else if (
      selectedChat &&
      typeof selectedChat === "object" &&
      (selectedChat as any).id
    ) {
      if (
        (selectedChat as any).name &&
        (selectedChat as any).keywords !== undefined
      ) {
        endpoint = `${import.meta.env.VITE_BACKEND_URL}/filters/${
          (selectedChat as any).id
        }/messages?limit=${PAGE_SIZE}`;
      } else {
        endpoint = `${import.meta.env.VITE_BACKEND_URL}/chats/${
          (selectedChat as any).id
        }/messages?limit=${PAGE_SIZE}`;
      }
    } else {
      console.log(
        "DEBUG: No valid selectedChat, skipping refresh",
        selectedChat
      );
      return;
    }

    console.log("DEBUG: Refreshing from endpoint:", endpoint);
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      console.log(
        "DEBUG: Response not OK:",
        response.status,
        response.statusText
      );
      return;
    }
    const data = await response.json();

    const toChips = (results: any[]) =>
      results
        .map((r: any) => {
          const emoticon =
            typeof r?.reaction?.emoticon === "string"
              ? r.reaction.emoticon
              : typeof r?.reaction === "string"
              ? r.reaction
              : null;
          const normalized =
            emoticon === "❤" || emoticon === "♥️" ? "❤️" : emoticon;
          return normalized
            ? { icon: normalized, count: r?.count || 0 }
            : null;
        })
        .filter(Boolean) as Array<{ icon: string; count: number }>;

    const transformed = (data || []).map((msg: any, index: number) => {
      const reactionResults =
        ((msg?.message || {}).reactions || {}).results || [];
      const parsedReactions = Array.isArray(reactionResults)
        ? toChips(reactionResults)
        : [];
      const chatName = msg.chat
        ? msg.chat.title ||
          msg.chat.username ||
          msg.chat.first_name ||
          "Unknown"
        : selectedChat && typeof selectedChat === "object"
        ? (selectedChat as any).name || "Chat"
        : "Unknown";
      return {
        id: msg._id || msg.id || String(index + 1),
        originalId: msg._id || msg.id,
        telegramMessageId: msg.message?.id, // Store the Telegram message ID for replies
        name: msg.sender?.first_name || msg.sender?.username || "Unknown",
        avatar: msg.sender?.id
          ? `${import.meta.env.VITE_BACKEND_URL}/contact_photo/${
              msg.sender.id
            }`
          : gravatarUrl(
              msg.sender?.first_name || msg.sender?.username || "Unknown"
            ),
        platform: "Telegram" as const,
        channel: null,
        server: chatName,
        date: new Date(msg.timestamp),
        message: msg.raw_text || "",
        tags: [],
        reactions: parsedReactions,
        hasLink: (msg.raw_text || "").includes("http"),
        link: (msg.raw_text || "").match(/https?:\/\/\S+/)?.[0] || null,
        replyTo: null as any,
        originalChatType: msg.chat?._ || null,
      } as MessageItem;
    });

    transformed.sort((a, b) => a.date.getTime() - b.date.getTime());

    console.log("DEBUG: API returned", data.length, "messages");
    console.log("DEBUG: Transformed", transformed.length, "messages");

    setMessages((prev) => {
      const idOf = (x: any) => String(x.originalId || x.id);
      const prevMap = new Map(prev.map((m) => [idOf(m), m]));
      let changed = false;
      for (const m of transformed) {
        const key = idOf(m);
        if (prevMap.has(key)) {
          // Update existing entry (reactions/timestamp/etc.)
          const old = prevMap.get(key)!;
          // Preserve any local fields (e.g., replyTo)
          const merged = { ...old, ...m };
          prevMap.set(key, merged);
          changed = true;
        } else {
          prevMap.set(key, m);
          changed = true;
        }
      }
      if (!changed) return prev;
      // Return in chronological order
      return Array.from(prevMap.values()).sort(
        (a, b) => a.date.getTime() - b.date.getTime()
      );
    });
    
    // Don't set shouldAutoScroll to true - this prevents auto-scroll during polling
    // Only scroll when it's a new chat or user explicitly sends a message
    
  } catch (e) {
    console.error("DEBUG: refreshLatest error:", e);
  }
}, [USE_DUMMY_DATA, selectedChat]);

  // Fetch messages when selectedChat changes or on initial mount
React.useEffect(() => {
  // Set flag to indicate this is a new chat (should auto-scroll)
  setIsNewChat(true);
  
  if (!USE_DUMMY_DATA) {
    if (selectedChat?.id) {
      if (selectedChat.name && selectedChat.keywords !== undefined) {
        fetchMessages(selectedChat);
        fetchPinnedMessages();
      } else {
        fetchMessages(selectedChat.id);
        fetchPinnedMessages(selectedChat.id);
        markChatAsRead(selectedChat.id);
      }
    } else if (selectedChat === "all-channels") {
      fetchMessages("all-channels");
      fetchPinnedMessages();
    } else {
      setMessages([]);
      setPinnedMessages([]);
    }
  } else {
    setMessages(dummyMessages);
    setPinnedMessages([]);
  }
  setShowAttachMenu(false);
  setReplyTo(null);
  if (inputRef.current) {
    inputRef.current.value = "";
  }
  setUploadedFiles([]);
}, [selectedChat?.id, selectedChat, fetchMessages, fetchPinnedMessages, USE_DUMMY_DATA]);

  // Polling: refresh current view every 30s (no websockets)
  React.useEffect(() => {
    if (USE_DUMMY_DATA) return;
    let timer: any = null;
    const poll = async () => {
      try {
        await refreshLatest();
      } catch (_) {
        // ignore transient polling errors
      } finally {
        timer = setTimeout(poll, 10000);
      }
    };
    timer = setTimeout(poll, 100);
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [USE_DUMMY_DATA, selectedChat, refreshLatest]);

  // Function to mark chat as read
  const markChatAsRead = async (chatId) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/chats/${chatId}/read`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: "read=true",
        }
      );

      if (response.ok) {
        console.log(`Chat ${chatId} marked as read`);
      }
    } catch (error) {
      console.error("Failed to mark chat as read:", error);
    }
  };

  return (
    <div className="relative h-[calc(100vh-136px)] flex flex-col flex-shrink-0 min-w-0">
      {/* Selected Chat Info */}
      {selectedChat && (
        <div className="px-6 py-4 border-b border-[#23272f]  flex-shrink-0 relative z-0">
          <div className="flex  items-center gap-3">
            {selectedChat === "all-channels" ? (
              <img
                src={aiAll}
                alt="All Channels"
                className="w-10 h-10 rounded-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : selectedChat.keywords !== undefined ? (
              // Smart filter avatar
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#3474ff] text-white text-xs font-bold">
                {selectedChat.name
                  ?.split(" ")
                  .map((word: string) => word[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            ) : (
              // Regular chat avatar
              <img
                src={selectedChat.photo_url}
                onError={(e) => {
                  // On error (image fail to load), fallback to gravatar url
                  const target = e.currentTarget;
                  target.onerror = null; // Prevent infinite loop in case gravatar also fails
                  target.src = gravatarUrl(selectedChat.name || "User");
                }}
                alt={selectedChat.name || "User"}
                className="w-10 h-10 rounded-full object-cover"
                loading="lazy"
                decoding="async"
              />
            )}
            <div>
              <h3 className="text-white z-0 font-medium">
                {selectedChat === "all-channels"
                  ? "All Channels"
                  : selectedChat.name}
              </h3>
              <p className="text-sm text-[#ffffff72]">
                {selectedChat === "all-channels"
                  ? "Telegram & Discord • Unified view"
                  : selectedChat.keywords !== undefined
                  ? `Smart Filter • ${selectedChat.keywords
                      ?.slice(0, 2)
                      .join(", ")}${
                      selectedChat.keywords?.length > 2 ? "..." : ""
                    }`
                  : `${selectedChat.platform} • ${
                      selectedChat.unread || 0
                    } unread`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Message List  */}
      <div
        ref={messagesContainerRef}
        className="flex-1 z-20 overflow-y-auto px-6 flex flex-col gap-4"
        onScroll={handleScroll}
      >
        {/* Loading indicator for loading more messages at top */}
        {loadingMore && (
          <div className="flex items-center justify-center py-4">
            <div className="text-center">
              <div className="w-6 h-6 border-2 border-[#3474ff] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-[#ffffff72] text-sm">
                Loading more messages...
              </p>
            </div>
          </div>
        )}

        {/* No more messages indicator */}
        {!hasMoreMessages && messages.length > 0 && !loading && (
          <div className="flex items-center justify-center py-4">
            <div className="text-center">
              <p className="text-[#ffffff32] text-xs">No more messages</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-[#3474ff] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[#ffffff72]">Loading messages...</p>
            </div>
          </div>
        ) : (
          Object.entries(groupedByDate).map(([date, msgs]) => (
            // Note: If you see "data-lov-id" warnings, it's likely from a browser extension
            <div key={date} className="date-group">
              <div className="flex items-center gap-2 my-4">
                <hr className="flex-1 border-[#23272f]" />
                <span className="text-xs text-[#ffffff32] px-2">{date}</span>
                <hr className="flex-1 border-[#23272f]" />
              </div>
              {msgs.map((msg) => (
                <div
                  key={String(msg.id)}
                  className={`flex items-start gap-3 py-3 px-4 rounded-[10px] shadow-sm mb-2 group hover:bg-[#212121] ${
                    String(msg.id).startsWith("temp-")
                      ? "opacity-70 bg-[#1a1a1a]"
                      : ""
                  }`}
                  onMouseLeave={() => setOpenMenuId(null)}
                >
                  <ChatAvatar
                    name={msg.name}
                    avatar={msg.avatar}
                    backupAvatar={undefined}
                  />

                  <div className="flex-1 relative">
                    <div className="absolute right-0 top-100 flex gap-2 items-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button
                        className="h-6 w-6 rounded-[6px] items-center justify-center duration-100 ease-in  flex hover:bg-[#3c3c3c] bg-[#2d2d2d] border border-[#ffffff03]"
                        title="Reply"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReplyTo(msg);
                        }}
                      >
                        <FaReply className="text-[#ffffff] w-3 h-3" />
                      </button>
                      <button
                        className="h-6 w-6 rounded-[6px] items-center justify-center duration-100 ease-in  flex hover:bg-[#3c3c3c] bg-[#2d2d2d] border border-[#ffffff03]"
                        title="Copy"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(msg.message);
                        }}
                      >
                        <FaCopy className="text-[#ffffff] w-3 h-3" />
                      </button>
                      <button
                        className="h-6 w-6 rounded-[6px] items-center justify-center duration-100 ease-in  flex hover:bg-[#3c3c3c] bg-[#2d2d2d] border border-[#ffffff03]"
                        title="Open in Discord"
                        onClick={(e) => {
                          e.stopPropagation(); /* implement share logic */
                        }}
                      >
                        <FaDiscord className="text-[#ffffff] w-3 h-3" />
                      </button>
                      <button
                        className="h-6 w-6 rounded-[6px] items-center justify-center duration-100 ease-in flex hover:bg-[#3c3c3c] bg-[#2d2d2d] border border-[#ffffff03]"
                        title="Open in Telegram"
                        onClick={(e) => {
                          e.stopPropagation();
                          openInTelegram(msg); // Pass the message to open specific message
                        }}
                      >
                        <FaTelegramPlane className="text-[#ffffff] w-3 h-3" />
                      </button>
    <button
  className="h-6 w-6 rounded-[6px] items-center justify-center duration-100 ease-in  flex hover:bg-[#3c3c3c] bg-[#2d2d2d] border border-[#ffffff03]"
  title="More"
  onClick={(e) => {
    e.stopPropagation();
    const mid = String(msg.id);
    const newOpenMenuId = openMenuId === mid ? null : mid;
    
    if (newOpenMenuId) {
      // Calculate and store position for this specific menu
      const position = getMenuPosition(e.currentTarget);
      setMenuPositions(prev => ({
        ...prev,
        [mid]: position
      }));
    }
    
    setOpenMenuId(newOpenMenuId);
  }}
>
  <IoIosMore className="text-[#ffffff] w-3 h-3" />
  {/* Popup menu */}
  {openMenuId === String(msg.id) && (
    <div className={`absolute right-0 ${menuPositions[String(msg.id)] || 'bottom-[110%]'} mt-2 bg-[#111111] border border-[#ffffff12] rounded-[10px] shadow-lg z-[9999] flex flex-col p-2 min-w-max`}>
      <button className="flex gap-2 items-center justify-start rounded-[10px] px-4 py-2 text-left hover:bg-[#23272f] text-[#ffffff72] hover:text-white whitespace-nowrap">
        <img src={smartIcon} className="w-6 h-6" />
        Add to Smart Channels
      </button>
      <button
        className="flex gap-2 items-center justify-start rounded-[10px] px-4 py-2 text-left hover:bg-[#23272f] text-[#ffffff72] hover:text-white whitespace-nowrap"
        onClick={(e) => {
          e.stopPropagation();
          handleBookmark(msg, "bookmark");
        }}
        disabled={bookmarkLoading[msg.id]}
      >
        <Heart
          className="w-6 h-6"
          stroke="currentColor"
          fill="currentColor"
        />
        {bookmarkLoading[msg.id] ? "Saving..." : "Save to Favorites"}
      </button>
      <button
        className="flex gap-2 items-center justify-start rounded-[10px] px-4 py-2 text-left hover:bg-[#23272f] text-[#ffffff72] hover:text-white whitespace-nowrap"
        onClick={(e) => {
          e.stopPropagation();
          setOpenMenuId(null);
          handlePin(msg);
        }}
        disabled={pinLoading[msg.id]}
      >
        <Pin
          className={`w-6 h-6 ${
            isMessagePinned((msg.originalId || msg.id)?.toString()) 
              ? "text-blue-400" 
              : ""
          }`}
          stroke="currentColor"
          fill={isMessagePinned((msg.originalId || msg.id)?.toString()) ? "currentColor" : "none"}
        />
        {pinLoading[msg.id] ? 
          (isMessagePinned((msg.originalId || msg.id)?.toString()) ? "Unpinning..." : "Pinning...") :
          (isMessagePinned((msg.originalId || msg.id)?.toString()) ? "Unpin Message" : "Pin Message")
        }
      </button>
      <button className="flex gap-2 items-center justify-start rounded-[10px] px-4 py-2 text-left hover:bg-[#23272f] text-[#ffffff72] hover:text-white whitespace-nowrap">
        <Plus
          className="w-6 h-6"
          stroke="currentColor"
          fill="currentColor"
        />
        Add Tags
      </button>
      <button className="flex gap-2 items-center justify-start rounded-[10px] px-4 py-2 text-left hover:bg-[#23272f] text-[#f36363] hover:text-[#f36363] whitespace-nowrap">
        <VolumeX
          className="w-6 h-6"
          stroke="currentColor"
          fill="currentColor"
        />
        Mute Channel
      </button>
    </div>
  )}
</button>
                    </div>
                    <div className="flex items-center justify-start gap-2">
                      <span className="text-[#ffffff72] font-[300]">
                        {msg.name}
                      </span>
                      <div
                        className={`flex justify-center pl-2 items-center rounded-[4px] ${
                          msg.platform === "Telegram"
                            ? "bg-[#3474ff]"
                            : "bg-[#7b5cfa]"
                        }`}
                      >
                        {msg.platform === "Telegram" ? (
                          <FaTelegramPlane className="text-[#ffffff] w-3 h-3" />
                        ) : (
                          <FaDiscord className="text-[#ffffff] w-3 h-3" />
                        )}

                        {msg.server && (
                          <span
                            className={`text-xs text-white${
                              msg.platform === "Discord" ? "" : ""
                            } rounded px-2 py-0.5`}
                          >
                            {msg.server}
                          </span>
                        )}
                      </div>
                
                      <span className="text-xs text-[#fafafa99]">
                        {msg.channel}
                      </span>
           <span className="text-xs text-[#ffffff32]">
  {console.log('Raw msg.date:', msg.date, 'Type:', typeof msg.date)}
  {formatTime(msg.date)}
</span>
                      {String(msg.id).startsWith("temp-") && (
                        <span className="text-xs text-[#84afff] italic">
                          sending...
                        </span>
                      )}
                    </div>
                    {msg.replyTo && (
                      <div className="text-xs text-[#84afff] bg-[#23272f] rounded px-2 py-1 mb-1">
                        Replying to{" "}
                        <span className="font-semibold">
                          {msg.replyTo.name}:
                        </span>{" "}
                        <span className="text-[#ffffffb0]">
                          {msg.replyTo.message.slice(0, 40)}
                          {msg.replyTo.message.length > 40 ? "..." : ""}
                        </span>
                      </div>
                    )}
                    <div className="mt-1 text-sm text-[#e0e0e] break-words break-all whitespace-pre-wrap max-w-full">
                      {msg.message}
                      {msg.hasLink && msg.link && (
                        <a
                          href={msg.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block mt-2 text-blue-500 hover:underline break-words"
                        >
                          {msg.link}
                        </a>
                      )}
                    </div>

                    {/* Reactions */}
                    {
                      <div className="flex gap-3 mt-2">
                        {msg.reactions.map((r: any, i: number) => (
                          <button
                            key={i}
                            onClick={() =>
                              handleReaction(
                                String(msg.originalId || msg.id),
                                r.icon
                              )
                            }
                            className="flex items-center gap-1 text-xs bg-[#ffffff06] rounded-full px-2 py-1 text-[#ffffff] hover:bg-[#ffffff12] transition"
                            title="Toggle reaction"
                          >
                            {r.icon}
                            {typeof r.count === "number" ? r.count : ""}
                          </button>
                        ))}
                        {/* No local reaction chips; Telegram is source of truth */}
                        <div className="relative">
                          <button
                            onClick={() =>
                              toggleReactionPicker(
                                String(msg.originalId || msg.id)
                              )
                            }
                            className="flex items-center gap-1 text-xs bg-[#ffffff06] rounded-full px-2 py-1 text-[#ffffff] hover:bg-[#ffffff12] transition-all duration-200 cursor-pointer hover:scale-105 hover:bg-[#ffffff16]"
                            disabled={
                              reactionLoading[String(msg.originalId || msg.id)]
                            }
                            title="Add reaction"
                          >
                            <SmilePlusIcon className="h-4 w-4" />
                            {reactionLoading[
                              String(msg.originalId || msg.id)
                            ] && (
                              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                            )}
                          </button>

                          {/* Reaction Picker */}
                          {showReactionPicker[
                            String(msg.originalId || msg.id)
                          ] && (
                            <div className="reaction-picker absolute top-1/2 left-full ml-2 bg-[#2d2d2d]/95 backdrop-blur-sm rounded-2xl p-2 shadow-2xl border border-[#555] z-10 transform -translate-y-1/2 min-w-[max-content]">
                              {/* Arrow pointer pointing left */}
                              <div className="absolute top-1/2 left-0 w-0 h-0 border-t-[8px] border-b-[8px] border-r-[8px] border-t-transparent border-b-transparent border-r-[#2d2d2d] transform -translate-y-1/2 -translate-x-1"></div>

                              <div className="grid grid-cols-8 gap-0">
                                {commonReactions.map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() =>
                                      handleReaction(
                                        String(msg.originalId || msg.id),
                                        emoji
                                      )
                                    }
                                    className="w-8 h-8 text-md hover:bg-[#444] rounded-xl transition-all duration-200 flex items-center justify-center hover:scale-110 active:scale-95 shadow-sm hover:shadow-md hover:bg-[#555]"
                                    disabled={
                                      reactionLoading[
                                        String(msg.originalId || msg.id)
                                      ]
                                    }
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    }

                    {/* Tags */}
                    {msg.tags.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {msg.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs bg-[#3474ff12] text-[#84afff] rounded-full px-2 py-0.5"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
        {/* Scroll target for auto-scroll */}
        <div ref={messagesEndRef} />
      </div>
      {showScrollToBottom && (
  <div className="absolute bottom-20 right-6 z-30">
    <button
      onClick={scrollToBottom}
      className="flex items-center justify-center w-12 h-12 bg-[#3474ff] hover:bg-[#5389ff] text-white rounded-full shadow-lg transition-all duration-200 hover:scale-105"
      title="Scroll to bottom"
    >
      <ChevronDown className="w-6 h-6" />
    </button>
  </div>
)}
      <div className="flex-shrink-0 px-6 py-4 bg-gradient-to-t from-[#181A20] via-[#181A20ee] z-20 to-transparent">
        {/* Replying to box */}
        {uploadedFiles.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {uploadedFiles.map((uf, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 bg-[#2d2d2d] px-3 py-2 rounded-[10px] text-white relative"
              >
                {/* Icon / Preview */}
                {uf.type === "image" ? (
                  <img
                    src={uf.preview}
                    alt={uf?.file?.name}
                    className="w-8 h-8 rounded object-cover"
                  />
                ) : uf.type === "video" ? (
                  <span className="w-8 h-8 flex items-center justify-center bg-[#444] rounded">
                    🎥
                  </span>
                ) : (
                  <span className="w-8 h-8 flex items-center justify-center bg-[#444] rounded">
                    📄
                  </span>
                )}

                {/* Name */}
                <span className="text-xs max-w-[150px] truncate">
                  {uf?.file?.name}
                </span>

                {/* Loader */}
                {uf.status === "uploading" && (
                  <div className="w-4 h-4 border-2 border-[#84afff] border-t-transparent rounded-full animate-spin"></div>
                )}

                {/* Remove */}
                <X
                  className="w-4 h-4 text-gray-400 hover:text-red-400 cursor-pointer"
                  onClick={() =>
                    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx))
                  }
                />
              </div>
            ))}
          </div>
        )}

        {replyTo && (
          <div className="flex items-center mb-2 px-4 py-2 rounded-[10px] bg-[#111111] text-xs text-[#84afff]">
            <div className="grow flex flex-col">
              <div className="uppercase flex items-center">
                <span className="font-[200] text-[#ffffff32] mr-2">
                  Replying to
                </span>
                <span className="text-[#ffffff72] font-[400]">
                  {replyTo.name}
                </span>
                <img
                  src={platformIcon(replyTo.platform)}
                  alt={replyTo.platform}
                  className="w-4 h-4 rounded-full ml-2"
                />
                {replyTo.channel && (
                  <span
                    className={`text-xs ${
                      replyTo.platform === "Discord"
                        ? "text-[#7b5cfa]"
                        : "text-[#3474ff]"
                    } rounded px-2 py-0.5`}
                  >
                    {replyTo.channel}
                  </span>
                )}
              </div>
              <span className="truncate flex-1 text-[#ffffff32] mt-1">
                {replyTo.message.slice(0, 130)}
                {replyTo.message.length > 130 ? "..." : ""}
              </span>
            </div>
            <button
              className="ml-2 p-1 rounded-full hover:bg-[#2d2d2d] transition"
              onClick={() => setReplyTo(null)}
              aria-label="Cancel reply"
            >
              <X className="w-4 h-4 text-[#ffffff48]" />
            </button>
          </div>
        )}
        <div className="flex z-50">
          <div className="flex grow items-center bg-[#212121] rounded-[10px] px-4 py-2 shadow-lg">
            <div
              ref={attachRef}
              className="relative"
              title={
                selectedChat === "all-channels"
                  ? "Select a specific chat to attach files"
                  : selectedChat?.keywords !== undefined
                  ? "Cannot attach files to smart filters"
                  : isSending
                  ? "Please wait for current message to send"
                  : "Attach files"
              }
            >
              <Plus
                className={`text-black bg-[#fafafa60] rounded-full mr-2 w-[18px] h-[18px] cursor-pointer ${
                  selectedChat === "all-channels" ||
                  selectedChat?.keywords !== undefined ||
                  isSending
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-[#fafafa80]"
                }`}
                onClick={() => {
                  if (
                    selectedChat === "all-channels" ||
                    selectedChat?.keywords !== undefined ||
                    isSending
                  ) {
                    return;
                  }
                  setShowAttachMenu((prev) => !prev);
                }}
              />

              {/* Popup menu */}
              {showAttachMenu &&
                !(
                  selectedChat === "all-channels" ||
                  selectedChat?.keywords !== undefined ||
                  isSending
                ) && (
                  <div className="absolute bottom-[130%] left-0 mb-2 px-3 py-2 bg-[#2d2d2d] text-white text-sm rounded-lg shadow-lg border border-[#ffffff14] z-100">
                    {/* Actual file input, hidden */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      style={{ display: "none" }}
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []).map(
                          (file) => ({
                            file,
                            type: getFileType(file),
                            preview: file.type.startsWith("image/")
                              ? URL.createObjectURL(file)
                              : null,
                            status: "uploading",
                          })
                        );
                        setUploadedFiles((prev) => [...prev, ...files]);
                        setShowAttachMenu(false);

                        // Simulate upload completion after 2s for demo
                        setTimeout(() => {
                          setUploadedFiles((prev) =>
                            prev.map((f) =>
                              files.includes(f) ? { ...f, status: "done" } : f
                            )
                          );
                        }, 2000);
                      }}
                    />
                    {/* Triggers file picker */}
                    <p
                      className="mb-1 cursor-pointer hover:text-[#84afff] w-max"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Attach File
                    </p>
                    <p
                      className="mb-1 cursor-pointer hover:text-[#84afff] w-max"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Send Image
                    </p>
                    <p
                      className="mb-1 cursor-pointer hover:text-[#84afff] w-max"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Send Video
                    </p>
                  </div>
                )}
            </div>
            <input
              ref={inputRef}
              type="text"
              placeholder={
                replyTo && replyTo.name
                  ? `Replying to ${replyTo.name}...`
                  : selectedChat === "all-channels"
                  ? "Select a channel on the sidebar to send messages..."
                  : selectedChat?.keywords !== undefined
                  ? "Cannot send messages to smart filters..."
                  : "Type your message..."
              }
              disabled={
                selectedChat === "all-channels" ||
                selectedChat?.keywords !== undefined ||
                isSending
              }
              className="flex-1 bg-transparent outline-none text-white placeholder-[#ffffff48] text-sm disabled:opacity-50"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={
              selectedChat === "all-channels" ||
              selectedChat?.keywords !== undefined ||
              isSending
            }
            className="ml-3 p-2 rounded-[10px] bg-[#5389ff] hover:bg-[#5389ff] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <SendHorizonal className="w-5 h-5 text-black fill-black" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnifiedChatPanel;
