import React, { useRef } from "react";
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
import { sendReaction, getMessageById } from "@/utils/apiHelpers";

// Types
type ReactionChip = { icon: string; count: number };
type MessageItem = {
  id: any;
  originalId: any;
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

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
  const [replyTo, setReplyTo] = React.useState<
    null | (typeof dummyMessages)[0]
  >(null);
  const [messages, setMessages] = React.useState<MessageItem[]>(
    USE_DUMMY_DATA ? (dummyMessages as unknown as MessageItem[]) : []
  );
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [hasMoreMessages, setHasMoreMessages] = React.useState(true);
  const [shouldAutoScroll, setShouldAutoScroll] = React.useState(true);
  // Page size for fetching messages from backend
  const PAGE_SIZE = 100;

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    // Scroll the container itself to the bottom. Run twice via rAF to account for late layout (e.g., images loading)
    requestAnimationFrame(() => {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
      requestAnimationFrame(() => {
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
      });
    });
  };

  const [showAttachMenu, setShowAttachMenu] = React.useState(false);
  const attachRef = React.useRef(null);
  const [uploadedFiles, setUploadedFiles] = React.useState([]);
  const fileInputRef = React.useRef(null);
console.log("selectedChat", selectedChat)
  const getFileType = (file) => {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";
    return "doc";
  };

const openInTelegram = (msg = null) => {
  console.log('🔍 === DEBUG: openInTelegram START ===');
  console.log('🔍 openInTelegram called with msg:', msg);
  
  if (!selectedChat) {
    console.log('❌ No selectedChat available');
    return;
  }
  
  console.log('✅ selectedChat exists:', selectedChat);

  // Get chatId from selectedChat
  const chatId = selectedChat.id || selectedChat._id;
  console.log('🔍 Using chatId from selectedChat:', chatId);

  // Use the preserved original chat type from the API response
  let chatType;
  
  console.log('🔍 === DEBUG: GETTING CHAT TYPE FROM PRESERVED API DATA ===');
  
  if (msg && msg.originalChatType) {
    // Use the preserved chat type from the original API response
    chatType = msg.originalChatType;
    console.log('✅ Got chatType from preserved API data (msg.originalChatType):', chatType);
  } else {
    // Fallback: Use heuristics from selectedChat if originalChatType is not available
    console.log('⚠️ No preserved chat type found, using fallback heuristics');
    
    const chatIdStr = String(chatId);
    const chatIdLength = chatIdStr.length;
    
    if (selectedChat.participants_count !== undefined) {
      chatType = "Chat";
      console.log('✅ Fallback: Determined Chat (found participants_count)');
    } else if (selectedChat.username || (selectedChat.name && selectedChat.name.startsWith('@'))) {
      chatType = "Channel";
      console.log('✅ Fallback: Determined Channel (found username/@)');
    } else if (chatIdLength <= 10 && !selectedChat.title) {
      chatType = "User";
      console.log('✅ Fallback: Determined User (short ID + no title)');
    } else if (chatIdLength > 10) {
      chatType = "Channel";
      console.log('✅ Fallback: Determined Channel (long ID)');
    } else {
      chatType = "Chat";
      console.log('✅ Fallback: Defaulted to Chat');
    }
  }
  
  console.log('🔍 Final chatType determined:', chatType);
  
  let webUrl;
  
  console.log('🔍 === DEBUG: URL GENERATION ===');
  
  if (chatType === "User") {
    // Direct Message - no prefix
    webUrl = `https://web.telegram.org/a/#${chatId}`;
    console.log('📱 Generated URL for Direct Message:', webUrl);
    
  } else if (chatType === "Channel") {
    // Supergroup/Channel - needs -100 prefix
    webUrl = `https://web.telegram.org/a/#-100${chatId}`;
    console.log('📱 Generated URL for Channel/Supergroup:', webUrl);
    
  } else if (chatType === "Chat") {
    // Regular Group - needs - prefix
    webUrl = `https://web.telegram.org/a/#-${chatId}`;
    console.log('📱 Generated URL for Regular Group:', webUrl);
    
  } else {
    // Fallback - assume regular group
    console.log('⚠️ Unknown chat type, assuming regular group');
    webUrl = `https://web.telegram.org/a/#-${chatId}`;
    console.log('📱 Generated URL (fallback):', webUrl);
  }
  
  console.log('🔗 === DEBUG: OPENING URL ===');
  console.log('🔗 Final URL to open:', webUrl);
  console.log('🔍 === DEBUG: openInTelegram END ===');
  
  window.open(webUrl, '_blank');
};



  React.useEffect(() => {
    if (shouldAutoScroll) {
      scrollToBottom();
    }
  }, [messages, shouldAutoScroll]);

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

  const createBookmark = async (
    messageId: string,
    type: "bookmark" | "pin" = "bookmark"
  ) => {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
    const token = localStorage.getItem("access_token");

    const formData = new FormData();
    formData.append("message_id", messageId);
    formData.append("type", type);

    const response = await fetch(`${BACKEND_URL}/bookmarks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to ${type} message: ${response.status}`);
    }

    return response.json();
  };

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
  const commonReactions = [
    "👍",
    "❤️",
    "🔥",
    "😮",
    "😢",
    "😡",
    "🎉",
    "🚀",
    "💯",
    "👏",
  ];

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      setReactionLoading((prev) => ({ ...prev, [messageId]: true }));

      const isObjectId = /^[a-f\d]{24}$/i.test(messageId);
      if (isObjectId) {
        try {
          const res = await sendReaction(messageId, emoji);
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
            "Backend reaction failed, logging locally:",
            backendError
          );
          console.log(
            `Reaction ${emoji} logged locally for message ${messageId}`
          );
        }
      } else {
        // Dummy/local message
        console.log(
          `Reaction ${emoji} logged locally for dummy message ${messageId}`
        );
      }

      // No local UI/storage update – rely on Telegram as source of truth

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

    if (!messageId) {
      alert("Cannot bookmark this message - no message ID available");
      return;
    }

    try {
      setBookmarkLoading((prev) => ({ ...prev, [msg.id]: true }));

      await createBookmark(messageId.toString(), type);

      const actionText = type === "pin" ? "pinned" : "bookmarked";
      console.log(`Message ${actionText} successfully`);

      // Optional: Show success feedback
      // You could add a toast notification here
    } catch (error) {
      console.error(`Error ${type}ing message:`, error);
      alert(`Failed to ${type} message. Please try again.`);
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

        console.log("ENDPOINTTTTTTTT ~ UnifiedChatPanel ~ endpoint:", endpoint);

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
            id: msg.id || msg._id || String(index + 1),
            originalId: msg.id || msg._id,
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
             telegramMessageId: msg.message?.id || null, // This will be 3207, 3206, etc.
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
      const threshold = 100; // Load more when within 100px of top

      const isScrollable =
        container.scrollHeight > container.clientHeight + threshold;

      if (
        scrollTop <= threshold &&
        hasMoreMessages &&
        !loadingMore &&
        !loading &&
        isScrollable
      ) {
        // Capture current dimensions to restore scroll offset after older messages are prepended
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

  const handleSend = () => {
    if (inputRef.current && inputRef.current.value.trim()) {
      const now = new Date();
      const newMsg = {
        id: messages.length + 1,
        originalId: undefined, // New messages don't have originalId
        name: user.username, // or your user logic
        avatar: gravatarUrl("You" + (replyTo ? replyTo.platform : "Discord")), // match platform for avatar
        platform: replyTo ? replyTo.platform : "Discord", // use replyTo's platform if replying
        channel: replyTo ? replyTo.channel : "#general", // use replyTo's channel if replying
        server: replyTo ? replyTo.channel : "Server",
        date: now,
        message: inputRef.current.value,
        tags: [],
        reactions: [],
        hasLink: inputRef.current.value.includes("http"),
        link: inputRef.current.value.match(/https?:\/\/\S+/)?.[0] || null,
        // Add replyTo reference if replying
        replyTo: replyTo
          ? {
              id: replyTo.id,
              name: replyTo.name,
              message: replyTo.message,
            }
          : null,
      };
      setMessages([...messages, newMsg]);
      inputRef.current.value = "";
      setReplyTo(null); // Clear reply after sending
      setShouldAutoScroll(true); // Enable auto-scroll when sending new message
    }
  };

  React.useEffect(() => {
    const handleClick = () => setOpenMenuId(null);
    if (openMenuId !== null) {
      window.addEventListener("click", handleClick);
      return () => window.removeEventListener("click", handleClick);
    }
  }, [openMenuId]);

  // Fetch messages when selectedChat changes or on initial mount
  React.useEffect(() => {
    if (!USE_DUMMY_DATA) {
      if (selectedChat?.id) {
        // Check if this is a smart filter (has name, keywords properties) or a regular chat
        if (selectedChat.name && selectedChat.keywords !== undefined) {
          // This is a smart filter
          fetchMessages(selectedChat);
        } else {
          // This is a regular chat
          fetchMessages(selectedChat.id);
          // Mark chat as read when messages are loaded
          markChatAsRead(selectedChat.id);
        }
      } else if (selectedChat === "all-channels") {
        // Handle "All Channels" selection
        fetchMessages("all-channels");
      } else {
        setMessages([]); // Show empty when no chat is selected
      }
    } else {
      // Use dummy data when flag is enabled
      setMessages(dummyMessages);
    }
  }, [selectedChat?.id, selectedChat, fetchMessages, USE_DUMMY_DATA]);

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
        <div className="px-6 py-4 border-b border-[#23272f] flex-shrink-0">
          <div className="flex items-center gap-3">
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
              <h3 className="text-white font-medium">
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
        className="flex-1 overflow-y-auto px-6 flex flex-col gap-4"
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
                  className="flex items-start gap-3 py-3 px-4 rounded-[10px] shadow-sm mb-2 group hover:bg-[#212121]"
                  onMouseLeave={() => setOpenMenuId(null)}
                >
                  <ChatAvatar name={msg.name} avatar={msg.avatar} />

                  <div className="flex-1 relative">
                    <div className="absolute right-0 top-0 flex gap-2 items-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button
                              className="h-6 w-6 rounded-[6px] items-center justify-center duration-100 ease-in  flex hover:bg-[#3c3c3c] bg-[#2d2d2d] border border-[#ffffff03]"
                        title="Reply"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReplyTo(msg);
                        }}
                      >
                  <FaReply  className="text-[#ffffff] w-3 h-3" />
                      </button>
                      <button
                           className="h-6 w-6 rounded-[6px] items-center justify-center duration-100 ease-in  flex hover:bg-[#3c3c3c] bg-[#2d2d2d] border border-[#ffffff03]"
                        title="Copy"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(msg.message);
                        }}
                      >
                           <FaCopy  className="text-[#ffffff] w-3 h-3" />
                      </button>
                      <button
                                 className="h-6 w-6 rounded-[6px] items-center justify-center duration-100 ease-in  flex hover:bg-[#3c3c3c] bg-[#2d2d2d] border border-[#ffffff03]"
                        title="Open in Discord"
                        onClick={(e) => {
                          e.stopPropagation(); /* implement share logic */
                        }}
                      >
           <FaDiscord  className="text-[#ffffff] w-3 h-3" />
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
                          setOpenMenuId(openMenuId === mid ? null : mid);
                        }}
                      >
                <IoIosMore  className="text-[#ffffff] w-3 h-3" />
                        {/* Popup menu */}
                        {openMenuId === String(msg.id) && (
                          <div className="absolute right-0 bottom-[110%] mt-2 bg-[#111111] border border-[#ffffff12] rounded-[10px] shadow-lg z-50 flex flex-col p-2 min-w-max">
                            <button className="flex gap-2 items-center justify-start rounded-[10px] px-4 py-2 text-left hover:bg-[#23272f] text-[#ffffff72] hover:text-white whitespace-nowrap">
                              <img src={smartIcon} className="w-6 h-6" />
                              Add to Smart Channels
                            </button>
                            <button className="flex gap-2 items-center justify-start rounded-[10px] px-4 py-2 text-left hover:bg-[#23272f] text-[#ffffff72] hover:text-white whitespace-nowrap">
                              <Heart
                                className="w-6 h-6"
                                stroke="currentColor"
                                fill="currentColor"
                              />
                              Save to Favorites
                            </button>
                            <button className="flex gap-2 items-center justify-start rounded-[10px] px-4 py-2 text-left hover:bg-[#23272f] text-[#ffffff72] hover:text-white whitespace-nowrap">
                              <Pin
                                className="w-6 h-6"
                                stroke="currentColor"
                                fill="currentColor"
                              />
                              Pin Message
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
                        {formatTime(msg.date)}
                      </span>
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
                          <span
                            key={i}
                            className="flex items-center gap-1 text-xs bg-[#ffffff06] rounded-full px-2 py-1 text-[#ffffff]"
                          >
                            {r.icon}
                            {typeof r.count === "number" ? r.count : ""}
                          </span>
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

                              <div className="grid grid-cols-10 gap-0">
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
      <div className="flex-shrink-0 px-6 py-4 bg-gradient-to-t from-[#181A20] via-[#181A20ee] to-transparent">
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
        <div className="flex">
          <div className="flex grow items-center bg-[#212121] rounded-[10px] px-4 py-2 shadow-lg">
            <div ref={attachRef} className="relative">
              <Plus
                className="text-black bg-[#fafafa60] rounded-full mr-2 w-[18px] h-[18px] cursor-pointer"
                onClick={() => setShowAttachMenu((prev) => !prev)}
              />

              {/* Popup menu */}
              {showAttachMenu && (
                <div className="absolute bottom-[130%] left-0 mb-2 px-3 py-2 bg-[#2d2d2d] text-white text-sm rounded-lg shadow-lg border border-[#ffffff14] z-50">
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
                  {/* More menu options as needed */}
                </div>
              )}
            </div>
            <input
              ref={inputRef}
              type="text"
              placeholder={
                replyTo && replyTo.name
                  ? `Replying to ${replyTo.name}...`
                  : "Type your message..."
              }
              className="flex-1 bg-transparent outline-none text-white placeholder-[#ffffff48] text-sm"
            />
          </div>
          <button
            onClick={handleSend}
            className="ml-3 p-2 rounded-[10px] bg-[#5389ff] hover:bg-[#5389ff] transition"
          >
            <SendHorizonal className="w-5 h-5 text-black fill-black" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnifiedChatPanel;
