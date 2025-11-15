import {
  useEffect,
  useMemo,
  useState,
  useRef,
  useImperativeHandle,
  forwardRef,
  useCallback,
  Fragment,
} from "react";
import discord from "@/assets/images/discordColor.png";
import telegram from "@/assets/images/telegramColor.png";
import { FaCopy } from "react-icons/fa";
import { FaReply } from "react-icons/fa";
import { IoIosMore } from "react-icons/io";
import aiAll from "@/assets/images/aiAll.png";
import EmojiPicker from "emoji-picker-react";

import {
  X,
  SendHorizonal,
  SmilePlusIcon,
  Heart,
  ChevronDown,
  Pin,
  Plus,
  VolumeX,
  Trash2Icon,
  MicIcon,
  StopCircle,
  List,
  Sticker,
} from "lucide-react";
import smartIcon from "@/assets/images/sidebar/Chat.png";
import { FaDiscord, FaTelegramPlane } from "react-icons/fa";
import ChatAvatar from "./ChatAvatar";
import { useAuth } from "@/hooks/useAuth";
import pLimit from "p-limit";
import {
  sendReaction,
  getMessageById,
  createBookmark,
} from "@/utils/apiHelpers";
import { toast } from "@/hooks/use-toast";
import { mapDiscordMessageToItem } from "@/lib/utils";
import { useLocation } from "react-router-dom";
import AudioWaveform from "./AudioWaveForm";
import LiveAudioWaveform from "./LiveAudioWaveForm";
import {
  useChatMessagesForSummary,
  useDiscordChatHistory,
  useDiscordConnectionStatus,
  useDiscordMessages,
} from "@/hooks/useDiscord";
import {
  isHistoryFetched,
  setHistoryFetched,
} from "@/store/discordHistoreStore";
import { useSummarizeMessage } from "@/hooks/discord/useSummarizeMessage";
import MessageWithLinkifyAndMentions from "./MessageWithMentions";
import DiscordSticker from "./DiscordSticker";
import StickerMenu from "./StickerMenu";

const LoadingDots = () => {
  return (
    <span
      aria-label="Loading"
      role="status"
      className="inline-flex space-x-1 ml-12 my-4"
    >
      <span className="dot animate-bounce">•</span>
      <span className="dot animate-bounce animation-delay-200">•</span>
      <span className="dot animate-bounce animation-delay-400">•</span>

      <style jsx>{`
        .dot {
          font-size: 22px;
          line-height: 0;
          color: #84afff;
          display: inline-block;
        }

        .animate-bounce {
          animation: bounce 0.6s infinite ease-in-out;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
        }

        .animation-delay-400 {
          animation-delay: 0.4s;
        }

        @keyframes bounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-6px);
          }
        }
      `}</style>
    </span>
  );
};

// Types
type ReactionChip = { icon: string; count: number };
type MessageItem = {
  id: any;
  chat_id?: string;
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
  stickerItems: any;
  referenced_message?: any;
  mentions?: any;
  message_reference?: any;
  sticker_items?: any;
  link: string | null;
  replyTo: any;
  sender?: any;
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

function formatDate(date?: string | Date | null) {
  if (!date) return ""; // handle undefined/null

  // Convert string to Date if necessary
  const d = typeof date === "string" ? new Date(date) : date;

  // Validate that it’s a real date
  if (isNaN(d.getTime())) return "";

  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
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

export interface UnifiedChatPanelRef {
  handleSend: (message: string, targetChat?: any | string) => void;
}
const UnifiedChatPanel = forwardRef<UnifiedChatPanelRef, UnifiedChatPanelProps>(
  ({ selectedChat = "all-channels" }, ref) => {
    const location = useLocation();
    const [selectedMessageId, setSelectedMessageId] = useState(
      location.state?.selectedMessageId ?? null
    );
    const refreshAbortController = useRef<AbortController | null>(null);
    // Flag to toggle between real data and dummy data for design inspiration
    const USE_DUMMY_DATA = false; // Set to true to use dummy data, false for real data
    const { user } = useAuth();
    const [text, setText] = useState("");
    const [showPicker, setShowPicker] = useState(false);
    const pickerRef = useRef(null); // emoji picker container ref
    const hasFetchedFirstMessages = useRef(false);
    const [enlargedMedia, setEnlargedMedia] = useState(null);
    const {
      history,
      loadMore,
      loading: dcHookLoading,
      hasMore,
    } = useDiscordChatHistory(selectedChat);
    const { messages: messageForSummary } = useChatMessagesForSummary(
      selectedChat?.id,
      "24h"
    );
    const { summarizeMessages } = useSummarizeMessage();
    const [stickerPacks, setStickerPacks] = useState([]);

    const [showStickers, setShowStickers] = useState(false);
    const [selectedSticker, setSelectedSticker] = useState([]);

    const handleStickerSelect = (sticker) => {
      console.log("Selected sticker:", sticker);
      setSelectedSticker([sticker.id]);
      handleSend({ sticker: [sticker.id] });
      // Optionally send sticker as message here
      setShowStickers(false);
    };

    useEffect(() => {
      console.log("fetching summary chats", messageForSummary);
    }, [messageForSummary]);

    useEffect(() => {
      async function fetchStickers() {
        try {
          const packs = await window.electronAPI.discord.getStickers("en-US");
          console.log("packs", packs);
          setStickerPacks(packs?.data?.sticker_packs || []);
        } catch (err) {
          console.error("Failed to load stickers:", err);
        }
      }
      fetchStickers();
    }, []);

 function formatTime(dateObj?: string | Date | null) {
  if (!dateObj) return ""; // handle missing date

  // Convert strings to Date safely
  const d = typeof dateObj === "string" ? new Date(dateObj) : dateObj;

  // Bail out if it's not a valid date
  if (isNaN(d.getTime())) return "";

  // Apply +5.5 hour offset (IST)
  const adjustedDate = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);

  if (selectedChat.platform === "discord") {
    let hours = adjustedDate.getUTCHours();
    const minutes = adjustedDate.getUTCMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    const formattedHours = hours.toString().padStart(2, "0");
    const formattedMinutes = minutes.toString().padStart(2, "0");
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  }

  // Default (Telegram, etc.)
  return adjustedDate.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}


    useEffect(() => {
      setLoadingMore(dcHookLoading);
    }, [dcHookLoading]);

    const openMedia = (media) => {
      setEnlargedMedia(media);
      console.log("enlarged media", media);
    };
    const closeMedia = () => setEnlargedMedia(null);

    useEffect(() => {
      setMessages([]);
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    
    }, [selectedChat]);

    const handleEmojiClick = (emojiData) => {
      if (!inputRef.current) return;
      const emoji = emojiData.emoji;
      const input = inputRef.current;
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const newValue = text.slice(0, start) + emoji + text.slice(end);
      setText(newValue);
      setText(newValue);
      // Move cursor after inserted emoji
      setTimeout(() => {
        input.focus();
        input.selectionStart = input.selectionEnd = start + emoji.length;
      }, 0);
      setShowPicker(false); // Optionally close picker after select
    };

    useImperativeHandle(ref, () => ({
      handleSend: (message, targetChat) => {
        console.log("[handleSend] called with message:", message);
        if (targetChat) {
          selectedChat = targetChat;
        }
        if (message && inputRef.current) {
          inputRef.current.value = message;
        }
        handleSend();
      },
    }));
    // Update input as user types:
    useEffect(() => {
      if (inputRef.current && inputRef.current.value !== text) {
        inputRef.current.value = text;
      }
    }, [text]);

    // Close picker on outside click
    useEffect(() => {
      function handleClickOutside(event) {
        if (
          showPicker &&
          pickerRef.current &&
          !pickerRef.current.contains(event.target)
        ) {
          setShowPicker(false);
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, [showPicker]);

    const inputRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    // Preserve scroll position when older messages are prepended
    const scrollRestoreRef = useRef<{
      prevHeight: number;
      prevTop: number;
    } | null>(null);
    // Track current chat to prevent race conditions
    const currentChatRef = useRef<string | null>(null);
    const [replyTo, setReplyTo] = useState<null | MessageItem>(null);
    const [messages, setMessages] = useState<MessageItem[]>(
      USE_DUMMY_DATA ? (dummyMessages as unknown as MessageItem[]) : []
    );
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [isNewChat, setIsNewChat] = useState(false);
    const [menuPositions, setMenuPositions] = useState({});
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
    const [pinLoading, setPinLoading] = useState({});
    const [pinnedMessages, setPinnedMessages] = useState([]);
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [attachments, setAttachments] = useState([]);
    // Page size for fetching messages from backend
    const PAGE_SIZE = 100;
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
    const token = localStorage.getItem("access_token");

    const pinMessage = async (messageId) => {
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
        throw new Error(
          errorData.detail || `Pin request failed: ${response.status}`
        );
      }

      return response.json();
    };

    const getMenuPosition = (buttonElement) => {
      if (!buttonElement) return "bottom-[110%]";

      const rect = buttonElement.getBoundingClientRect();
      const menuHeight = 500; // Approximate height of your menu

      // If there's not enough space above, show below
      if (rect.top < menuHeight) {
        return "top-[110%]";
      }
      // Otherwise show above
      return "bottom-[110%]";
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
        throw new Error(
          errorData.detail || `Unpin request failed: ${response.status}`
        );
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

          const pinToRemove = pinnedMessages.find(
            (pin) => pin.message_id === messageId?.toString()
          );
          console.log("Pin to remove:", pinToRemove);

          if (pinToRemove && pinToRemove.id) {
            console.log("Using pin ID for deletion:", pinToRemove.id);

            await unpinMessage(pinToRemove.id);

            // Remove from local pinned messages state using pin.id
            setPinnedMessages((prev) =>
              prev.filter((pin) => pin.id !== pinToRemove.id)
            );

            toast({
              title: "Message unpinned",
              description: "Message has been unpinned successfully",
            });
          } else {
            // If pin not found in local state, try to fetch latest pins and try again
            console.log(
              "Pin not found in local state, fetching latest pins..."
            );

            try {
              const chatIdForFetch = selectedChat?.id || null;
              console.log("Fetching pins for chat:", chatIdForFetch);

              const latestPins = await getPinnedMessages(chatIdForFetch);
              console.log("Latest pins from server:", latestPins);

              const serverPin = latestPins.find(
                (pin) => pin.message_id === messageId?.toString()
              );
              console.log("Server pin found:", serverPin);

              if (serverPin && serverPin.id) {
                console.log("Using server pin ID for deletion:", serverPin.id);
                await unpinMessage(serverPin.id);

                // Update local state with fresh data minus the removed pin
                setPinnedMessages(
                  latestPins.filter((pin) => pin.id !== serverPin.id)
                );

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
      return pinnedMessages.some((pin) => pin.message_id === messageId);
    };

    const fetchPinnedMessages = useCallback(async (chatId = null) => {
      try {
        const pins = await getPinnedMessages(chatId);
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
    const scrollToBottom = useCallback(() => {
      const container = messagesContainerRef.current;
      if (!container) return;

      // Scroll the container itself to the bottom
      requestAnimationFrame(() => {
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
        requestAnimationFrame(() => {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: "smooth",
          });
        });
      });

      // Hide the scroll button after scrolling
      setShowScrollToBottom(false);
    }, []);
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const attachRef = useRef(null);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const fileInputRef = useRef(null);
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

      console.log(
        "🔍 === DEBUG: GETTING CHAT TYPE FROM PRESERVED API DATA ==="
      );

      if (msg && msg.originalChatType) {
        // Use the preserved chat type from the original API response
        chatType = msg.originalChatType;
        console.log(
          "✅ Got chatType from preserved API data (msg.originalChatType):",
          chatType
        );
      } else {
        // Fallback: Use heuristics from selectedChat if originalChatType is not available
        console.log(
          "⚠️ No preserved chat type found, using fallback heuristics"
        );

        const chatIdStr = String(chatId);
        const chatIdLength = chatIdStr.length;

        if (selectedChat.participants_count !== undefined) {
          chatType = "Chat";
          console.log(
            "✅ Fallback: Determined Chat (found participants_count)"
          );
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

      window.open(webUrl, "_blank");
    };

    // Only run scrollToBottom when shouldAutoScroll is true
    useEffect(() => {
      if (!shouldAutoScroll && !isNewChat) return; // Don't scroll if user scrolled up

      if (messages.length === 0) return;

      // delay scroll to bottom after render
      const timer = setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 100);

      if (isNewChat) setIsNewChat(false);

      return () => clearTimeout(timer);
    }, [messages, shouldAutoScroll, isNewChat]);

    const groupedByDate: { [date: string]: typeof messages } = useMemo(() => {
      const groups: { [date: string]: typeof messages } = {};
      const uniqueMessages = [
        ...new Map(messages.map((m) => [m.id, m])).values(),
      ];

      uniqueMessages.forEach((msg) => {
        const dateKey = formatDate(msg.date);
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(msg);
      });
      return groups;
    }, [messages]);

    // 2. Add these state variables inside your component (around line 150):
    const [bookmarkLoading, setBookmarkLoading] = useState<{
      [key: string]: boolean;
    }>({});

    // Reaction state management
    const [reactionLoading, setReactionLoading] = useState<{
      [key: string]: boolean;
    }>({});
    const [showReactionPicker, setShowReactionPicker] = useState<{
      [key: string]: boolean;
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
        if (selectedChat.platform === "discord") {
          // For Discord, we need to map the message to Telegram format first
          const res = await window.electronAPI.discord.addReaction(
            selectedChat.id,
            messageId,
            emoji
          );
          console.log("Discord reaction result:", res);
          return;
        }
        if (isObjectId) {
          // Create rollback snapshot visible to catch
          let rollbackSnapshot = messages;
          try {
            // Determine if user already reacted with this emoji (toggle behavior)
            const msg = messages.find(
              (m) => String(m.originalId || m.id) === String(messageId)
            );
            const already = !!msg?.reactions?.find(
              (r: any) => r.icon === emoji
            );

            // Optimistic update
            rollbackSnapshot = messages;
            setMessages((prev) =>
              prev.map((m) => {
                if (String(m.originalId || m.id) !== String(messageId))
                  return m;
                const existing = [...(m.reactions || [])];
                const idx = existing.findIndex((r) => r.icon === emoji);
                if (already) {
                  if (idx >= 0) {
                    const next = [...existing];
                    const newCount = Math.max(
                      0,
                      (existing[idx].count || 1) - 1
                    );
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

            let res = null;
            if (selectedChat.platform === "Telegram") {
              res = await sendReaction(messageId, emoji, {
                clear: already,
              });
            }
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
    useEffect(() => {
      setMessages([]);
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Element;
        if (!target.closest(".reaction-picker")) {
          setShowReactionPicker({});
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleBookmark = async (
      msg: any,
      type: "bookmark" | "pin" = "bookmark"
    ) => {
      // For API data, use the original message ID from the database
      let messageId = msg.originalId || msg.id; // Use originalId if available, fallback to current id
      if (msg.platform.toLowerCase() === "discord") {
        messageId = msg.id;
      }
      console.log("Bookmarking message:", msg);

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

        const result = await createBookmark(
          messageId.toString(),
          type,
          msg.platform.toLowerCase()
        );
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

    const fetchMessages = useCallback(
      async (
        chatId: number | string,
        beforeTimestamp?: string,
        append = false,
        afterTimestamp?: string
      ) => {
        if (!chatId) return;
        if (selectedChat.platform === "discord") return;
        if (!append) {
          // Reset flag on fresh load
          hasFetchedFirstMessages.current = false;

          setLoading(true);
          setHasMoreMessages(true);
          setMessages([]);
        } else {
          setLoadingMore(true);
        }

        try {
          const token = localStorage.getItem("access_token");

          if (selectedChat?.platform == "discord") {
            return;
          }
          let endpoint: string;
          if (chatId === "all-channels") {
            endpoint = `${BACKEND_URL}/chats/all/messages`;
          } else if (typeof chatId === "object" && chatId && "id" in chatId) {
            endpoint = `${BACKEND_URL}/filters/${chatId.id}/messages`;
          } else {
            endpoint = `${BACKEND_URL}/chats/${chatId}/messages`;
          }

          // Add pagination params
          const params = new URLSearchParams();
          params.append("limit", String(PAGE_SIZE));
          if (beforeTimestamp) params.append("before", beforeTimestamp);
          if (afterTimestamp) params.append("after", afterTimestamp);
          if (params.toString()) endpoint += `?${params.toString()}`;

          // const response = await fetch(endpoint, {
          //   headers: {
          //     Authorization: `Bearer ${token}`,
          //     "Content-Type": "application/json",
          //   },
          // });

          // if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

          // const data = await response.json();
          const hist = await window.electronAPI.telegram.getChatHistory(
            selectedChat.id
          );
          const data = hist.data;

          const transformed = await Promise.all(
            data.map(async (msg: any, index: number) => {
              let chatName = "Unknown";
              let channelName: string | null = null;

              if (chatId === "all-channels" && msg.chat) {
                if (
                  msg.chat._ === "Channel" ||
                  msg.chat._ === "Chat" ||
                  msg.chat._ === "User"
                ) {
                  chatName =
                    msg.chat.title ||
                    msg.chat.username ||
                    msg.chat.first_name ||
                    "Unknown";
                }
                channelName = null;
              } else {
                chatName =
                  (chatId && typeof chatId === "object"
                    ? chatId.name
                    : typeof chatId === "string"
                    ? chatId
                    : "") || "Chat";
              }

              // Parse reactions
              const reactionsData =
                (msg.message &&
                  msg.message.reactions &&
                  msg.message.reactions.results) ||
                [];
              const reactions = ((reactionsData as any[]) ?? [])
                .map((r) => {
                  const emoticon =
                    typeof r?.reaction === "string"
                      ? r.reaction
                      : r?.reaction?.emoticon;
                  const normalized =
                    emoticon === "❤" || emoticon === "♥️" ? "❤️" : emoticon;
                  return normalized
                    ? { icon: normalized, count: r.count || 0 }
                    : null;
                })
                .filter(Boolean);

              const replyToStr = msg?.message?.reply_to;
              let replyId: number | null = null;
              if (replyToStr && typeof replyToStr === "string") {
                const match = replyToStr.match(/reply_to_msg_id=(\d+)/);
                replyId = match ? parseInt(match[1], 10) : null;
              }

              const replyMessage = replyId
                ? data.find((m) => m.message?.id === replyId) || null
                : null;
              return {
                id: msg._id || msg.id || String(index + 1),
                originalId: msg._id || msg.id,
                telegramMessageId: msg.message?.id,
                mentions: msg?.message?.mentions ?? [],
                name:
                  msg.sender?.first_name || msg.sender?.username || "Unknown",
                avatar: msg.sender?.id
                  ? `${BACKEND_URL}/contact_photo/${msg.sender.id}`
                  : gravatarUrl(
                      msg.sender?.first_name ||
                        msg.sender?.username ||
                        "Unknown"
                    ),
                platform:
                  selectedChat.platform == "discord"
                    ? "Discord"
                    : ("Telegram" as const),
                channel: channelName,
                server: chatName,
                date: new Date(msg.timestamp),
                message: msg.raw_text || "",
                tags: [],
                reactions,
                hasLink: (msg.raw_text || "").includes("http"),
                link: (msg.raw_text || "").match(/https?:\/\/\S+/)?.[0] || null,
                hasMedia: msg.message.has_media,
                media: msg.media ?? null,
                replyToId: replyId ?? null,
                timestamp: msg.timestamp,
                replyTo: replyMessage
                  ? {
                      id: replyMessage.message.id,
                      name:
                        replyMessage.sender?.first_name ||
                        replyMessage.sender?.username ||
                        "Unknown",
                      message: replyMessage.raw_text || "",
                      chat_id: replyMessage.chat?.id || null,
                    }
                  : null,
                originalChatType: msg.chat?._ || null,
              };
            })
          );

          transformed.sort((a, b) => a.date.getTime() - b.date.getTime());

          if (data.length < PAGE_SIZE) {
            setHasMoreMessages(false);
          }

          if (append) {
            setMessages((prev) => [...transformed, ...prev]);
            setLoadingMore(false);
            // Don't auto scroll on loading older messages
          } else {
            setMessages(transformed);
            setLoading(false);
            setShouldAutoScroll(true);
          }

          // Scroll only once after initial load
          if (!hasFetchedFirstMessages.current && !append) {
            hasFetchedFirstMessages.current = true;
            setTimeout(() => {
              if (messagesContainerRef.current) {
                messagesContainerRef.current.scrollTop =
                  messagesContainerRef.current.scrollHeight;
              }
            }, 100); // slight delay for rendering
          }
        } catch (error) {
          console.error("Failed to fetch messages:", error);
          if (!append) {
            setMessages([]);
            setLoading(false);
          }
          setLoadingMore(false);
        }
      },
      [BACKEND_URL, PAGE_SIZE]
    );

    // Function to load more messages when scrolling to top
    const loadMoreMessages = useCallback(() => {
      if (
        loadingMore ||
        loading ||
        (!hasMoreMessages && !hasMore) ||
        messages.length === 0
      )
        return;

      if (selectedChat.platform === "discord") {
        setLoadingMore(true);
        loadMore();
        setMessages((prev) =>
          [...history.map(mapDiscordMessageToItem), ...prev].sort(
            (a, b) =>
              Number(new Date(a.timestamp).getTime()) -
              Number(new Date(b.timestamp).getTime())
          )
        );
        setLoadingMore(false);
        return;
      }
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
      dcHookLoading,
      hasMoreMessages,
      messages,
      selectedChat,
      fetchMessages,
    ]);

    // In the scroll handler:
    const handleScroll = useCallback(
      (e) => {
        const container = e.currentTarget;
        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;

        const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;

        setShouldAutoScroll(isNearBottom);
        setShowScrollToBottom(!isNearBottom);

        // If near top, load more messages
        if (
          scrollTop <= 100 &&
          hasMoreMessages &&
          !loadingMore &&
          !loading &&
          selectedChat.platform.toLowerCase() === "telegram"
        ) {
          scrollRestoreRef.current = {
            prevHeight: scrollHeight,
            prevTop: scrollTop,
          };
          setTimeout(() => {
            loadMoreMessages();
          }, 1000);
        } else if (
          scrollTop <= 100 &&
          hasMore &&
          selectedChat.platform.toLowerCase() === "discord"
        ) {
          scrollRestoreRef.current = {
            prevHeight: scrollHeight,
            prevTop: scrollTop,
          };
          setTimeout(() => {
            loadMoreMessages();
          }, 1000);
        }
      },
      [hasMoreMessages, loadingMore, loading, loadMoreMessages]
    );

    // After messages update, restore scroll position when we just prepended older items
    useEffect(() => {
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

    const handleSend = async ({ sticker = null } = {}) => {
      console.log("[handleSend] calling send with sticker", selectedSticker);
      if (
        !inputRef.current ||
        (!inputRef.current.value.trim() &&
          uploadedFiles.length === 0 &&
          selectedSticker.length <= 0)
      ) {
        return;
      }

      if (uploadedFiles.length > 0) {
        try {
          let index = 0;
          for (const fileWrapper of uploadedFiles) {
            // fileWrapper.file is File object
            if (selectedChat.platform == "discord") {
              const result = await window.electronAPI.discord.attachments(
                selectedChat.id,
                [
                  {
                    id: "0",
                    filename: fileWrapper.file.name,
                    file_size: fileWrapper.file.size,
                    is_clip: false,
                  },
                ]
              );
              console.log(result, "uploadedattachments");
              if (result.success && result.data) {
                setAttachments(result.data);

                const resp = await uploadFileToDiscord(
                  result.data.attachments[0].upload_url,
                  fileWrapper.file
                );
                console.log("File uploaded to Discord CDN", resp);
                console.log("replyTo", replyTo);
                const res = await window.electronAPI.discord.sendMessage(
                  selectedChat.id,
                  inputRef.current.value.trim(),
                  [
                    {
                      id: "0",
                      filename: fileWrapper.file.name,
                      uploaded_filename:
                        result.data.attachments[0].upload_filename,
                    },
                  ],
                  sticker,
                  {
                    channel_id: replyTo.channel,
                    message_id: replyTo.id,
                  }
                );
                index++;
                console.log(res, [
                  {
                    id: String(index),
                    filename: fileWrapper.file.name,
                    uploaded_filename:
                      result.data.attachments[0].upload_filename,
                  },
                ]);
              }
            } else {
              await sendMediaToChat({
                chatId: selectedChat.id,
                file: fileWrapper.file,
                caption: inputRef.current.value.trim(), // Optional: could set to message text or empty
                fileName: fileWrapper.file.name,
              });
            }
          }
          // Clear uploaded files after successful upload
          setUploadedFiles([]);
          inputRef.current.value = "";
          setText("");
          await refreshLatest();
          scrollToBottom();
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.focus();
            }
          }, 0);
          return;
        } catch (error) {
          console.error("Error sending media:", error);
          toast({
            title: "Send media failed",
            description: String(error),
            variant: "destructive",
          });
          return; // Stop further sending on failure
        }
      }

      const messageText = inputRef.current.value.trim();

      // Check if we have a valid chat selected and it's not "all-channels"
      if (!selectedChat) {
        toast({
          title: "No chat selected",
          description: "Please select a specific chat to send messages",
          variant: "destructive",
        });
        return;
      }

      const chatId = selectedChat.id;
      console.log("replyTo");
      console.log(replyTo);
      if (!chatId && !replyTo) {
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
      const optimisticMessage: any = {
        id: `temp-${Date.now()}`, // Temporary ID
        originalId: null,
        telegramMessageId: undefined,
        name: user?.username || user?.first_name || "You",
        avatar: user?.photo_url || gravatarUrl(user?.username || "You"),
        platform:
          selectedChat.platform == "discord"
            ? "Discord"
            : ("Telegram" as const),
        channel: selectedChat.channel || null,
        server: selectedChat.name || "Chat",
        date: new Date(),
        message: messageText,
        tags: [],
        reactions: [],
        stickerItems: null,
        hasLink: messageText.includes("http"),
        link: messageText.match(/https?:\/\/\S+/)?.[0] || null,
        replyTo: replyTo
          ? {
              id: replyTo.id,
              name: replyTo.name,
              message: replyTo.message,
              chat_id: replyTo.telegramMessageId,
            }
          : null,
      };

      // Add optimistic message to UI
      setMessages((prev) => [...prev, optimisticMessage]);

      // Clear input and reply state immediately for better UX
      const originalValue = inputRef.current.value;
      const originalReplyTo = replyTo;

      setShouldAutoScroll(true);

      try {
        const id = chatId || replyTo.chat_id;

        if (selectedChat.platform == "discord") {
          console.log("replyTo originalReplyTo", originalReplyTo);

          const result = await window.electronAPI.discord.sendMessage(
            id,
            messageText,
            [],
            sticker,
            originalReplyTo && {
              channel_id: originalReplyTo?.channel,
              message_id: originalReplyTo?.id,
            }
          );
          if (!result.success) {
            const res = await window.electronAPI.security.getDiscordToken();
            if (res?.success && res?.data) {
              await window.electronAPI.discord.connect(res.data);
            }
          }
        } else {
          await window.electronAPI.telegram.sendMessage(id, messageText);
        }
        if (inputRef.current) {
          inputRef.current.value = "";
        }
        setText("");

        await refreshLatest();
        scrollToBottom();
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 0);

        // Remove optimistic message since the real one will come from the database
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== optimisticMessage.id)
        );
      } catch (error) {
        console.error("Failed to send message:", error);
        scrollToBottom();

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
        inputRef.current.value = "";
        setIsSending(false);
        setText("");
        setReplyTo(null);
      }
    };

    useEffect(() => {
      const handleClick = () => setOpenMenuId(null);
      if (openMenuId !== null) {
        window.addEventListener("click", handleClick);
        return () => window.removeEventListener("click", handleClick);
      }
    }, [openMenuId]);

    const { messagesList } = useDiscordMessages(selectedChat?.id);
    console.log(
      messagesList.map(mapDiscordMessageToItem),
      "livediscordmessages"
    );
    useEffect(() => {
      console.log(
        `history fetched for ${selectedChat.id}`,
        isHistoryFetched(selectedChat.id)
      );
      if (
        history.length > 0 &&
        selectedChat?.platform == "discord" &&
        !isHistoryFetched(selectedChat.id)
      ) {
        console.log(
          "hist before set message",
          history.map(mapDiscordMessageToItem)
        );
        setMessages((prev) =>
          [...history.map(mapDiscordMessageToItem), ...prev].sort(
            (a, b) =>
              Number(new Date(a.timestamp).getTime()) -
              Number(new Date(b.timestamp).getTime())
          )
        );
        if (history.length > 0) setHistoryFetched(selectedChat.id);
      }
      setLoading(false);
      setLoadingMore(false);
      if (!hasScrolled) {
        scrollToBottom();
        setHasScrolled(true);
      }
    }, [history]);

    useEffect(() => {
      if (messagesList && selectedChat?.platform === "discord") {
        setMessages((prev) =>
          [...messagesList.map(mapDiscordMessageToItem), ...prev].sort(
            (a, b) =>
              Number(new Date(a.timestamp).getTime()) -
              Number(new Date(b.timestamp).getTime())
          )
        );
      }
      setLoading(false);
      setLoadingMore(false);
      if (!hasScrolled) {
        scrollToBottom();
        setHasScrolled(true);
      }
    }, [messagesList]);

    // Silent refresh that avoids toggling loading states and only appends new messages
//     const refreshLatest = useCallback(async () => {
//       if (USE_DUMMY_DATA) return;
//       if (refreshAbortController.current) {
//         refreshAbortController.current.abort();
//       }

//       const abortController = new AbortController();
//       refreshAbortController.current = abortController;

//       try {
//         let endpoint: string | null = null;
//         let currentChatId: string | null = null; // Track which chat we're fetching for

//         if (selectedChat === "all-channels") {
//           endpoint = `${
//             import.meta.env.VITE_BACKEND_URL
//           }/chats/all/messages?limit=${PAGE_SIZE}`;
//           currentChatId = "all-channels";
//         } else if (
//           selectedChat &&
//           typeof selectedChat === "object" &&
//           (selectedChat as any).id
//         ) {
//           if (
//             (selectedChat as any).name &&
//             (selectedChat as any).keywords !== undefined
//           ) {
//             endpoint = `${import.meta.env.VITE_BACKEND_URL}/filters/${
//               (selectedChat as any).id
//             }/messages?limit=${PAGE_SIZE}`;
//             currentChatId = `filter-${(selectedChat as any).id}`;
//           } else {
//             endpoint = `${import.meta.env.VITE_BACKEND_URL}/chats/${
//               (selectedChat as any).id
//             }/messages?limit=${PAGE_SIZE}`;
//             currentChatId = String((selectedChat as any).id);
//           }
//         } else {
//           console.log(
//             "DEBUG: No valid selectedChat, skipping refresh",
//             selectedChat
//           );
//           return;
//         }
//         let data = [];
//         if (selectedChat?.platform == "discord") {
//         } else {
//           const hist = await window.electronAPI.telegram.getChatHistory(
//             selectedChat.id
//           );
//           data = hist.data;
//           console.log("fetched tg history", hist);
//         }

//         const toChips = (results: any[]) =>
//           results
//             .map((r: any) => {
//               const emoticon =
//                 typeof r?.reaction?.emoticon === "string"
//                   ? r.reaction.emoticon
//                   : typeof r?.reaction === "string"
//                   ? r.reaction
//                   : null;
//               const normalized =
//                 emoticon === "❤" || emoticon === "♥️" ? "❤️" : emoticon;
//               return normalized
//                 ? { icon: normalized, count: r?.count || 0 }
//                 : null;
//             })
//             .filter(Boolean) as Array<{ icon: string; count: number }>;

//         const transformed = await Promise.all(
//           (data || []).map(async (msg: any, index: number) => {
//             const reactionResults =
//               ((msg?.message || {}).reactions || {}).results || [];
//             const parsedReactions = Array.isArray(reactionResults)
//               ? toChips(reactionResults)
//               : [];
//             const chatName = msg.chat
//               ? msg.chat.title ||
//                 msg.chat.username ||
//                 msg.chat.first_name ||
//                 selectedChat.name ||
//                 "Unknown"
//               : selectedChat && typeof selectedChat === "object"
//               ? (selectedChat as any).name || "Chat"
//               : "Unknown";

//             const replyToStr = msg?.message?.reply_to;
//             let replyId: number | null = null;
//             if (replyToStr && typeof replyToStr === "string") {
//               const match = replyToStr.match(/reply_to_msg_id=(\d+)/);
//               replyId = match ? parseInt(match[1], 10) : null;
//             }

//             const replyMessage = replyId
//               ? data.find((m) => m.message?.id === replyId) || null
//               : null;

//             return {
//               id: msg._id || msg.id || String(index + 1),
//               originalId: msg._id || msg.id,
//               telegramMessageId: msg.message?.id, // Store the Telegram message ID for replies
//               mentions: msg?.message?.mentions ?? [],
//               name: msg.sender?.first_name || msg.sender?.username || "Unknown",
//               chat_id: msg.sender.id,
//               avatar: msg.sender?.id
//                 ? `${import.meta.env.VITE_BACKEND_URL}/contact_photo/${
//                     msg.sender.id
//                   }`
//                 : gravatarUrl(
//                     msg.sender?.first_name || msg.sender?.username || "Unknown"
//                   ),
//               platform:
//                 selectedChat.platform == "discord"
//                   ? "Discord"
//                   : ("Telegram" as const),
//               channel: null,
//               server: chatName,
//               date: new Date(msg.timestamp),
//               message: msg.raw_text || "",
//               tags: [],
//               reactions: parsedReactions,
//               hasLink: (msg.raw_text || "").includes("http"),
//               link: (msg.raw_text || "").match(/https?:\/\/\S+/)?.[0] || null,
//               hasMedia: msg.message.has_media,
//               media: msg.message?.media ?? null,
//               stickerItems: msg.stickerItems ?? null,
//               timestamp: msg.timestamp,
//               replyTo: replyMessage
//                 ? {
//                     id: replyMessage.message.id,
//                     name:
//                       replyMessage.sender?.first_name ||
//                       replyMessage.sender?.username ||
//                       "Unknown",
//                     message: replyMessage.raw_text || "",
//                     chat_id: replyMessage.chat?.id || null,
//                   }
//                 : null,
//               originalChatType: msg.chat?._ || null,
//             } as MessageItem;
//           })
//         );

//         transformed.sort((a, b) => a.date.getTime() - b.date.getTime());

//         setMessages((prev) => {
//           // CRITICAL: Only update messages if we're still on the same chat
//           // This prevents race conditions when switching between chats rapidly
//           const stillOnSameChat = currentChatId === currentChatRef.current;

//           if (!stillOnSameChat) {
//             console.log(
//               "DEBUG: Chat changed during refresh, ignoring stale data",
//               {
//                 currentChatId,
//                 currentChat: currentChatRef.current,
//                 selectedChat,
//               }
//             );
//             return prev; // Don't update if we've switched chats
//           }

//           const idOf = (x: any) => String(x.originalId || x.id);
//           const prevMap = new Map(prev.map((m) => [idOf(m), m]));
//           let changed = false;
//           for (const m of transformed) {
//             const key = idOf(m);
//             if (prevMap.has(key)) {
//               // Update existing entry (reactions/timestamp/etc.)
//               const old = prevMap.get(key)!;
//               // Preserve any local fields (e.g., replyTo)
//               const merged = {
//                 ...old,
//                 ...m,
//                 media: old.media ?? m.media, // preserve UI-fetched media
//               };

//               prevMap.set(key, merged);
//               changed = true;
//             } else {
//               prevMap.set(key, m);
//               changed = true;
//             }
//           }
//           if (!changed) return prev;
//           // Return in chronological order
//           return Array.from(prevMap.values()).sort((a, b) => {
//   const dateA = a.date instanceof Date ? a.date : new Date(a.date);
//   const dateB = b.date instanceof Date ? b.date : new Date(b.date);
//   return dateA.getTime() - dateB.getTime();
// });

//           // return Array.from(prevMap.values()).sort(
//           //   (a, b) => a.date.getTime() - b.date.getTime()
//           // );
//         });

//         // Don't set shouldAutoScroll to true - this prevents auto-scroll during polling
//         // Only scroll when it's a new chat or user explicitly sends a message
//       } catch (e) {
//         if (e.name === "AbortError") {
//           // Silently ignore aborts
//           return;
//         }
//         console.error("DEBUG: refreshLatest error:", e);
//       }
//     }, [selectedChat]);
const refreshLatest = useCallback(async () => {
  if (!selectedChat || USE_DUMMY_DATA) return;

  // Cancel previous fetch if ongoing
  if (refreshAbortController.current) {
    refreshAbortController.current.abort();
  }

  const abortController = new AbortController();
  refreshAbortController.current = abortController;

  const chatKey =
    selectedChat === "all-channels"
      ? "all-channels"
      : selectedChat.platform === "discord"
      ? `${selectedChat.id}`
      : `${selectedChat.id}`;

  try {
    // Fetch Telegram history
    let rawMessages = [];
    if (selectedChat.platform !== "discord") {
      const hist = await window.electronAPI.telegram.getChatHistory(
        selectedChat.id
      );
      rawMessages = hist?.data || [];
      console.log("refreshLatest fetched tg history", rawMessages);
    }

    // Transform each message into UI format
    const transformed = rawMessages.map((msg, index) => {
      const reactions =
        msg?.message?.reactions?.results?.map((r) => {
          const icon =
            typeof r?.reaction === "string"
              ? r.reaction
              : r?.reaction?.emoticon;

          return icon ? { icon, count: r.count || 0 } : null;
        }).filter(Boolean) ?? [];

      const replyId = msg?.message?.reply_to?.match(/reply_to_msg_id=(\d+)/);
      const replyMessage = replyId
        ? rawMessages.find((m) => m.message?.id === Number(replyId[1]))
        : null;

      return {
        id: msg._id || msg.id || String(index + 1),
        telegramMessageId: msg.message?.id,
        name: msg.sender?.first_name || msg.sender?.username || "Unknown",
        avatar: msg.sender?.id
          ? `${import.meta.env.VITE_BACKEND_URL}/contact_photo/${msg.sender.id}`
          : gravatarUrl(msg.sender?.username || "Unknown"),
        platform: selectedChat.platform === "discord" ? "Discord" : "Telegram",
        server:
          msg.chat?.title ||
          msg.chat?.username ||
          msg.chat?.first_name ||
          "Unknown",
        date: new Date(msg.timestamp),
        message: msg.raw_text || "",
        reactions,
        hasLink: (msg.raw_text || "").includes("http"),
        link: (msg.raw_text || "").match(/https?:\/\/\S+/)?.[0] || null,
        hasMedia: msg.message.has_media,
        media: msg.message?.media || null,
        timestamp: msg.timestamp,
        replyTo: replyMessage
          ? {
              id: replyMessage.message.id,
              name:
                replyMessage.sender?.first_name ||
                replyMessage.sender?.username ||
                "Unknown",
              message: replyMessage.raw_text || "",
            }
          : null,
      };
    });

    // Sort chronologically
    transformed.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Safe update — ignore stale fetches
    if (chatKey === currentChatRef.current) {
      setMessages(transformed);
    }
  } catch (err) {
    if (err.name !== "AbortError") console.error("refreshLatest error:", err);
  }
}, [selectedChat]);

    // Fetch messages when selectedChat changes or on initial mount
    useEffect(() => {
      // Set flag to indicate this is a new chat (should auto-scroll)
      setIsNewChat(true);
      setMessages([]);
      // Update current chat ref to help prevent race conditions
      let chatId = null;
      if (selectedChat === "all-channels") {
        chatId = "all-channels";
      } else if (selectedChat?.id) {
        if (selectedChat.name && selectedChat.keywords !== undefined) {
          chatId = `filter-${selectedChat.id}`;
        } else {
          chatId = String(selectedChat.id);
        }
      }
      currentChatRef.current = chatId;

      if (!USE_DUMMY_DATA) {
        if (selectedChat.platform == "discord") return;
        if (selectedChat.platform != "discord") {
          if (selectedChat?.id) {
            if (selectedChat.name && selectedChat.keywords !== undefined) {
              fetchMessages(selectedChat);
              fetchPinnedMessages();
            } else {
              if (messages.length > 0) {
                fetchMessages(
                  selectedChat.id,
                  null,
                  null,
                  messages[0]?.timestamp ?? null
                );
              } else {
                fetchMessages(selectedChat.id);
              }

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
        }
      } else {
        // setMessages(dummyMessages);
        setPinnedMessages([]);
      }
      setShowAttachMenu(false);
      if (inputRef.current) {
        inputRef.current.value = "";
        setText("");
      }
      setUploadedFiles([]);
    }, [
      selectedChat?.id,
      selectedChat,
      fetchMessages,
      fetchPinnedMessages,
      USE_DUMMY_DATA,
    ]);

    useEffect(() => {
      const refresh = async () => {
        try {
          await refreshLatest();
        } catch (_) {}
      };
      refresh();
    }, [selectedChat]);

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
        }
      } catch (error) {
        console.error("Failed to mark chat as read:", error);
      }
    };

    async function sendMediaToChat({
      chatId,
      file, // File object (from file input)
      caption = "", // Optional string
      fileName = "file", // Optional, default 'file'
    }) {
      const url = `${BACKEND_URL}/api/chats/${chatId}/send_media`;
      const formData = new FormData();
      formData.append("file", file, fileName);
      formData.append("caption", caption);
      formData.append("file_name", fileName);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Do NOT set Content-Type header, fetch will set it automatically for FormData!
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed: ${response.status}`);
      }

      return response.json();
    }

    async function uploadFileToDiscord(uploadUrl: string, file: File) {
      const url = `${BACKEND_URL}/api/discord/proxy-upload`;
      const formData = new FormData();
      formData.append("upload_url", uploadUrl);
      formData.append("file", file);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Do NOT set Content-Type header, fetch will set it automatically for FormData!
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed: ${response.status}`);
      }

      return response.json();
    }

    // Use a ref to persist between renders
    const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const startCloseTimer = () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = setTimeout(() => {
        setOpenMenuId(null);
        closeTimeoutRef.current = null;
      }, 180); // 150-200ms works well
    };
useEffect(() => {
  setMessages([]);
}, [selectedChat]);

useEffect(() => {
  if (!selectedChat) return;
  console.log("Setting up new message listener for chat", selectedChat.id);
  // Subscribe to new messages, get unsubscribe
  const unsubscribe = window.electronAPI.telegram.onNewMessage((msg) => {

    if (msg?.chat?.id?.toString() === selectedChat?.id?.toString()) {
      const data=[msg]; // Wrap single message in array for uniform processing
           console.log("New message for selected chat:", msg);
        const transformed=    data.map( (msg: any, index: number) => {
              let chatName = "Unknown";
              let channelName: string | null = null;

              if (selectedChat === "all-channels" && msg.chat) {
                if (
                  msg.chat._ === "Channel" ||
                  msg.chat._ === "Chat" ||
                  msg.chat._ === "User"
                ) {
                  chatName =
                    msg.chat.title ||
                    msg.chat.username ||
                    msg.chat.first_name ||
                    "Unknown";
                }
                channelName = null;
              } else {
                chatName =
                  (selectedChat && typeof selectedChat === "object"
                    ? selectedChat.name
                    : typeof selectedChat === "string"
                    ? selectedChat
                    : "") || "Chat";
              }

              // Parse reactions
              const reactionsData =
                (msg.message &&
                  msg.message.reactions &&
                  msg.message.reactions.results) ||
                [];
              const reactions = ((reactionsData as any[]) ?? [])
                .map((r) => {
                  const emoticon =
                    typeof r?.reaction === "string"
                      ? r.reaction
                      : r?.reaction?.emoticon;
                  const normalized =
                    emoticon === "❤" || emoticon === "♥️" ? "❤️" : emoticon;
                  return normalized
                    ? { icon: normalized, count: r.count || 0 }
                    : null;
                })
                .filter(Boolean);

              const replyToStr = msg?.message?.reply_to;
              let replyId: number | null = null;
              if (replyToStr && typeof replyToStr === "string") {
                const match = replyToStr.match(/reply_to_msg_id=(\d+)/);
                replyId = match ? parseInt(match[1], 10) : null;
              }

              const replyMessage = replyId
                ? data.find((m) => m.message?.id === replyId) || null
                : null;
              return {
                id: msg._id || msg.id || String(index + 1),
                originalId: msg._id || msg.id,
                telegramMessageId: msg.message?.id,
                mentions: msg?.message?.mentions ?? [],
                name:
                  msg.sender?.first_name || msg.sender?.username || "Unknown",
                avatar: msg.sender?.id
                  ? `${BACKEND_URL}/contact_photo/${msg.sender.id}`
                  : gravatarUrl(
                      msg.sender?.first_name ||
                        msg.sender?.username ||
                        "Unknown"
                    ),
                platform:
                  selectedChat.platform == "discord"
                    ? "Discord"
                    : ("Telegram" as const),
                channel: channelName,
                server: chatName,
                date: new Date(msg.timestamp),
                message: msg.raw_text || "",
                tags: [],
                reactions,
                hasLink: (msg.raw_text || "").includes("http"),
                link: (msg.raw_text || "").match(/https?:\/\/\S+/)?.[0] || null,
                hasMedia: msg.message.has_media,
                media: msg.message.media ?? null,
                replyToId: replyId ?? null,
                timestamp: msg.timestamp,
                replyTo: replyMessage
                  ? {
                      id: replyMessage.message.id,
                      name:
                        replyMessage.sender?.first_name ||
                        replyMessage.sender?.username ||
                        "Unknown",
                      message: replyMessage.raw_text || "",
                      chat_id: replyMessage.chat?.id || null,
                    }
                  : null,
                originalChatType: msg.chat?._ || null,
              };
            })
        

         

      setMessages((prev) => [...prev, ...transformed]);
    }
  });

  // Cleanup when selectedChat changes or component unmounts
  return () => unsubscribe?.();
}, [selectedChat]);



    // useEffect(() => {
    //   console.log("selectedChat changed", selectedChat);
    // }, [selectedChat]);

    const [showFiltersPopup, setShowFiltersPopup] = useState(false); // Controls inner popup
    const [filtersList, setFiltersList] = useState([]);
    const [isFetchingFilters, setIsFetchingFilters] = useState(false);

    const filtersPopupTimeoutRef = useRef(null);

    const startFiltersPopupCloseTimer = () => {
      if (filtersPopupTimeoutRef.current)
        clearTimeout(filtersPopupTimeoutRef.current);
      filtersPopupTimeoutRef.current = setTimeout(() => {
        setShowFiltersPopup(false);
      }, 140);
    };
    const cancelFiltersPopupCloseTimer = () => {
      if (filtersPopupTimeoutRef.current) {
        clearTimeout(filtersPopupTimeoutRef.current);
        filtersPopupTimeoutRef.current = null;
      }
    };

    // Fetch filters when opening the popup
    const fetchFilters = async () => {
      setIsFetchingFilters(true);
      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/filters`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) throw new Error("Failed to load filters");
        const data = await response.json();
        setFiltersList(data);
      } catch (e) {
        setFiltersList([]);
      } finally {
        setIsFetchingFilters(false);
      }
    };

    const generateTaskFromMessage = async (msg) => {
      if (!msg) return;

      summarizeMessages(
        [{ ...msg, text: msg.message }],
        true,
        selectedChat.platform.toLowerCase()
      );
    };

    const handleAddToSmartChannel = async (msg: any, filter: any) => {
      if (!filter || !filter.id) {
        console.error("Invalid filter provided:", filter);
        return;
      }

      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
      const token = localStorage.getItem("access_token");

      try {
        const currentChannels = filter.channels || [];
        const chatIdToToggle = msg.chat_id;

        let updatedChannels: any[];
        if (currentChannels.includes(chatIdToToggle)) {
          // Remove chat_id from channels if present
          updatedChannels = currentChannels.filter(
            (id) => id !== chatIdToToggle
          );
        } else {
          // Add chat_id to channels if not present
          updatedChannels = [...currentChannels, chatIdToToggle].filter(
            Boolean
          );
        }

        // Prepare URL encoded form data
        const params = new URLSearchParams();
        params.append("name", filter.name);
        params.append("channels", updatedChannels.join(","));
        if (filter.keywords) {
          params.append("keywords", (filter.keywords || []).join("\n"));
        }

        const response = await fetch(`${BACKEND_URL}/filters/${filter.id}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        });

        if (!response.ok) {
          throw new Error(`Failed to update filter: ${response.status}`);
        }

        const updatedFilter = await response.json();
        console.log("Filter updated successfully:", updatedFilter);

        // Update local filters list state if applicable
        setFiltersList((prev) =>
          prev.map((f) => (f.id === updatedFilter.id ? updatedFilter : f))
        );

        toast({
          title: "Filter updated",
          description: updatedChannels.includes(chatIdToToggle)
            ? "Added chat to smart channel successfully"
            : "Removed chat from smart channel successfully",
        });

        // Optionally reload filters from backend to ensure UI is fully in sync
        fetchFilters();
      } catch (error) {
        console.error("Error updating filter:", error);
        toast({
          title: "Failed to update filter",
          description: error.message || "Please try again",
          variant: "destructive",
        });
      }
    };

    const unreadCount = selectedChat?.unread || 0;
    const flatMessages = messages.slice(); // Oldest first already
    const unreadStart =
      unreadCount > 0 ? flatMessages.length - unreadCount : -1;

    const unreadDividerRef = useRef<HTMLDivElement | null>(null);

    const container = messagesContainerRef.current;
    const [hasScrolled, setHasScrolled] = useState(false);
    const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  
    useEffect(() => {
      if (!selectedMessageId || loading) return;

      const tryScrollToMessage = () => {
        const element = document.getElementById(`msg-${selectedMessageId}`);
        const container = messagesContainerRef.current;

        if (element && container) {
          requestAnimationFrame(() => {
            container.scrollTo({
              top:
                element.offsetTop -
                container.offsetTop -
                container.clientHeight / 2,
              behavior: "smooth",
            });
          });

          // Debounce scroll end detection
          let scrollTimeout: any = null;
          const onScroll = () => {
            if (scrollTimeout) clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
              setHighlightedMessageId(selectedMessageId);
              setTimeout(() => setHighlightedMessageId(null), 500);
              container.removeEventListener("scroll", onScroll);
            }, 150);
          };

          container.addEventListener("scroll", onScroll);

          // Fallback highlight in case no scroll event fires
          scrollTimeout = setTimeout(() => {
            setHighlightedMessageId(selectedMessageId);
            setTimeout(() => setHighlightedMessageId(null), 500);
            container.removeEventListener("scroll", onScroll);
          }, 500);

          return true; // found & scrolled
        }

        return false; // not found yet
      };

      if (!tryScrollToMessage()) {
        // element not found -> keep loading until it appears OR no more messages
        const loadInterval = setInterval(async () => {
          if (!loadingMore && hasMoreMessages) {
            setTimeout(async () => {
              loadMoreMessages();
            }, 1000);
          }

          // Stop if:
          // 1. message is found, OR
          // 2. no more messages available
          if (tryScrollToMessage() || !hasMoreMessages) {
            clearInterval(loadInterval);

            if (!hasMoreMessages) {
              console.warn(
                `[Message Navigation] Could not find message ${selectedMessageId}, all messages loaded`
              );
            }
          }
        }, 500); // retry every 0.5s

        return () => clearInterval(loadInterval);
      }
    }, [selectedMessageId, loading, hasMoreMessages, loadingMore]);

    const deleteMessage = async (msg) => {
      try {
        const response = await fetch(
          `${BACKEND_URL}/api/messages/${msg.id}/delete`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) throw new Error("Delete message failed");

        // After successful delete, remove message from state
        setMessages((prev) =>
          prev.filter(
            (message) => message.id !== msg.id && message.originalId !== msg.id
          )
        );

        await refreshLatest(); // Optional: refresh latest state from server if desired
      } catch (error) {
        console.error("Failed to delete message", error);
        toast({
          title: "Delete failed",
          description: error.message || "Could not delete message",
          variant: "destructive",
        });
      }
    };

    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
      null
    );
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

    const startRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const recorder = new MediaRecorder(stream);
        setAudioBlob(null);
        setIsRecording(true);
        setMediaRecorder(recorder);

        let chunks = [] as BlobPart[];
        recorder.ondataavailable = (event) => {
          chunks.push(event.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: "audio/ogg" });
          setAudioBlob(blob);
          setIsRecording(false);
          setMediaRecorder(null);
          mediaRecorder?.stream.getTracks().forEach((track) => track.stop());
        };

        setMediaRecorder(recorder);
        recorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Error starting audio recording", err);
      }
    };

    const stopRecording = () => {
      if (mediaRecorder) {
        mediaRecorder.stop();
      }
    };

    const sendAudioMessage = async () => {
      if (!audioBlob) {
        console.error("No audio blob to send.");
        return;
      }
      if (!selectedChat) {
        console.error("No selected chat to send message.");
        return;
      }
      try {
        setIsSending(true);
        const audioFile = new File([audioBlob], "voice-message.ogg", {
          type: "audio/ogg",
        });
        if (!audioFile?.size) {
          console.error("Audio file is empty or invalid:", audioFile);
          return setIsSending(false);
        }
        console.log(
          "Sending audio file:",
          audioFile,
          "Is File:",
          audioFile instanceof File
        );
        await sendMediaToChat({
          chatId: selectedChat.id,
          file: audioFile,
          fileName: "voice-message.ogg",
        });

        await refreshLatest();
        scrollToBottom();
        setAudioBlob(null);
        setIsSending(false);
      } catch (error) {
        console.error("Failed to send voice message", error);
        setIsSending(false);
      }
    };

    const audioUrl = useMemo(() => {
      return audioBlob ? URL.createObjectURL(audioBlob) : null;
    }, [audioBlob]);

    useEffect(() => {
      // Clean up URL on unmount or blob change
      return () => {
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
      };
    }, [audioUrl]);

    const clearAudio = () => {
      setAudioBlob(null);
      setIsSending(false);
    };

    const jumpToReply = (msg) => {
      console.log(msg);
      setSelectedMessageId(msg.replyToId);
    };

    console.log("messages by date", groupedByDate);
    const { userId } = useDiscordConnectionStatus();
    const [telegramUserId, setTelegramUserId] = useState(null);
    const fetchStatus = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const tgRes = await fetch(`${BACKEND_URL}/auth/telegram/status`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (tgRes.ok) {
          const tg = await tgRes.json();
          console.log("tg status res", tg);
          setTelegramUserId(String(tg.telegram_id));
        }
      } catch (e) {
        console.log(e);
      }
    };
    useEffect(() => {
      fetchStatus();
    }, []);

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
          {(loadingMore || dcHookLoading) && (
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
              <div key={date} className="date-group">
                <div className="flex items-center gap-2 my-4">
                  <hr className="flex-1 border-[#23272f]" />
                  <span className="text-xs text-[#ffffff32] px-2">{date}</span>
                  <hr className="flex-1 border-[#23272f]" />
                </div>
                {msgs.map((msg, index) => {
                  const globalIndex = messages.findIndex(
                    (m) => m.id === msg.id
                  );
                  const showUnreadDivider =
                    unreadStart >= 0 && globalIndex === unreadStart;
                  const prevMsg = index > 0 ? msgs[index - 1] : null;

                  const isSameSenderAsPrev =
                    prevMsg && prevMsg.name === msg.name;

                  const isDiscord =
                    selectedChat?.platform?.toLowerCase() === "discord";
                  const isTelegram =
                    selectedChat?.platform?.toLowerCase() === "telegram";

                  const isOwnMessage =
                    (isDiscord && msg.sender?.id === userId) ||
                    (isTelegram && msg?.chat_id === telegramUserId);

                  return (
                    <div
                      key={String(msg.id)}
                      id={`msg-${msg.telegramMessageId}`}
                      data-hasmedia={msg.hasMedia ? "true" : "false"}
                      data-msgid={msg.id}
                      onMouseLeave={startCloseTimer}
                      className={`rounded-[10px] message-item ${
                        highlightedMessageId === msg.telegramMessageId
                          ? "highlight"
                          : ""
                      }`}
                    >
                      {showUnreadDivider && (
                        <div
                          className="flex items-center gap-2 my-2"
                          ref={unreadDividerRef}
                        >
                          <hr className="flex-1 border-[#ffffff32]" />
                          <span className="text-xs text-[#ffffff32] font-semibold rounded-full px-3 py-1 shadow">
                            Unread Messages
                          </span>
                          <hr className="flex-1 border-[#ffffff32]" />
                        </div>
                      )}
                      <div
                        className={`flex items-start gap-3 py-3 px-4 rounded-[10px] shadow-sm mb-2 group hover:bg-[#212121] ${
                          String(msg.id).startsWith("temp-")
                            ? "opacity-70 bg-[#1a1a1a]"
                            : ""
                        }`}
                      >
                        {isOwnMessage ? (
                          <></>
                        ) : isSameSenderAsPrev ? (
                          <div className="w-10 h-10"></div>
                        ) : (
                          <ChatAvatar
                            name={msg.name}
                            avatar={msg.avatar}
                            backupAvatar={`https://cdn.discordapp.com/avatars/${msg?.id}/${msg?.avatar}.png`}
                          />
                        )}

                        <div className="flex-1 relative max-w-[100%]">
                          <div
                            className={`absolute ${
                              isOwnMessage ? "left-0" : "right-0"
                            } top-100 flex gap-2 items-center opacity-0 group-hover:opacity-100 transition-opacity z-10`}
                          >
                            <div className="relative">
                              <button
                                onClick={() =>
                                  toggleReactionPicker(
                                    String(msg.originalId || msg.id)
                                  )
                                }
                                className="flex items-center gap-1 text-xs bg-[#ffffff06] rounded-full px-2 py-1 text-[#ffffff] hover:bg-[#ffffff12] transition-all duration-200 cursor-pointer hover:scale-105 hover:bg-[#ffffff16]"
                                disabled={
                                  reactionLoading[
                                    String(msg.originalId || msg.id)
                                  ]
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
                                <div
                                  className={`reaction-picker absolute top-1/2 ${
                                    isOwnMessage
                                      ? "left-[120%]"
                                      : "right-[120%]"
                                  } ml-2 bg-[#2d2d2d]/95 backdrop-blur-sm rounded-2xl p-2 shadow-2xl border border-[#555] z-10 transform -translate-y-1/2 min-w-[max-content]`}
                                >
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
                            <button
                              className="h-6 w-6 rounded-[6px] items-center justify-center duration-100 ease-in  flex hover:bg-[#3c3c3c] bg-[#2d2d2d] border border-[#ffffff03]"
                              title="Reply"
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log("replyto", msg);
                                setReplyTo(msg);
                                setTimeout(() => {
                                  if (inputRef.current) {
                                    inputRef.current.focus();
                                  }
                                }, 0);
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

                            {selectedChat?.platform?.toLowerCase() ==
                              "telegram" && (
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
                            )}
                            <button
                              className="h-6 w-6 rounded-[6px] items-center justify-center duration-100 ease-in  flex hover:bg-[#3c3c3c] bg-[#2d2d2d] border border-[#ffffff03]"
                              title="More"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (closeTimeoutRef.current) {
                                  clearTimeout(closeTimeoutRef.current);
                                  closeTimeoutRef.current = null;
                                }
                                const mid = String(msg.id);
                                const newOpenMenuId =
                                  openMenuId === mid ? null : mid;
                                if (newOpenMenuId) {
                                  const position = getMenuPosition(
                                    e.currentTarget
                                  );
                                  setMenuPositions((prev) => ({
                                    ...prev,
                                    [mid]: position,
                                  }));
                                }
                                setOpenMenuId(newOpenMenuId);
                              }}
                            >
                              <IoIosMore className="text-[#ffffff] w-3 h-3" />
                              {/* Popup menu */}
                              {openMenuId === String(msg.id) && (
                                <div
                                  className={`absolute ${
                                    isOwnMessage ? "left-0" : "right-0"
                                  } ${
                                    menuPositions[String(msg.id)] ||
                                    "bottom-[110%]"
                                  } mt-2 bg-[#111111] border border-[#ffffff12] rounded-[10px] shadow-lg z-[9999] flex flex-col p-2 min-w-max`}
                                >
                                  {showFiltersPopup && (
                                    <div
                                      className="absolute flex-col items-center justify-center -left-2 top-2 w-full pt-4 ml-2 bg-[#17171c] border border-[#222] rounded-[10px] p-3 mt-[-8px] min-w-[220px] shadow-xl z-10"
                                      onMouseEnter={() => {
                                        setShowFiltersPopup(true);
                                        cancelFiltersPopupCloseTimer();
                                      }}
                                      onMouseLeave={startFiltersPopupCloseTimer}
                                    >
                                      {isFetchingFilters ? (
                                        <div className="text-white/70 px-4 py-2">
                                          Loading...
                                        </div>
                                      ) : filtersList.length === 0 ? (
                                        <div className="text-white/70 px-4 py-2">
                                          No smart streams found.
                                        </div>
                                      ) : (
                                        filtersList.map((filter) => {
                                          // Check if filter.channels contains msg.chat_id
                                          const isAdded =
                                            filter.channels &&
                                            msg.chat_id &&
                                            filter.channels.includes(
                                              msg.chat_id
                                            );

                                          return (
                                            <div
                                              key={filter.id}
                                              className={`block text-left px-3 py-2 rounded-[10px] mb-2 text-sm cursor-pointer ${
                                                isAdded
                                                  ? "bg-transparent text-[#ffffff]"
                                                  : "bg-[#ffffff10] text-white"
                                              } hover:bg-[#ffffff10] hover:text-white`}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleAddToSmartChannel(
                                                  msg,
                                                  filter
                                                );
                                              }}
                                            >
                                              {filter.title || filter.name}
                                              <p
                                                className={`text-xs text-[#ffffff72] `}
                                              >
                                                {filter.keywords.join(", ")}
                                              </p>
                                            </div>
                                          );
                                        })
                                      )}
                                      <X
                                        height={16}
                                        width={16}
                                        onClick={() =>
                                          setShowFiltersPopup(false)
                                        }
                                        className="w-max mx-auto block"
                                      />
                                    </div>
                                  )}
                                  <button
                                    className="flex gap-2 items-center justify-start rounded-[10px] px-4 py-2 text-left hover:bg-[#23272f] text-[#ffffff72] hover:text-white whitespace-nowrap"
                                    onClick={(e) => {
                                      generateTaskFromMessage(msg);
                                    }}
                                    style={{ position: "relative", zIndex: 2 }}
                                  >
                                    <List />
                                    Generate Task
                                  </button>
                                  <button
                                    className="flex gap-2 items-center justify-start rounded-[10px] px-4 py-2 text-left hover:bg-[#23272f] text-[#ffffff72] hover:text-white whitespace-nowrap"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowFiltersPopup((v) => !v);
                                      if (
                                        filtersList.length === 0 &&
                                        !isFetchingFilters
                                      )
                                        fetchFilters();
                                    }}
                                    style={{ position: "relative", zIndex: 2 }}
                                  >
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
                                    {bookmarkLoading[msg.id]
                                      ? "Saving..."
                                      : "Save to Favorites"}
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
                                        isMessagePinned(
                                          (msg.originalId || msg.id)?.toString()
                                        )
                                          ? "text-blue-400"
                                          : ""
                                      }`}
                                      stroke="currentColor"
                                      fill={
                                        isMessagePinned(
                                          (msg.originalId || msg.id)?.toString()
                                        )
                                          ? "currentColor"
                                          : "none"
                                      }
                                    />
                                    {pinLoading[msg.id]
                                      ? isMessagePinned(
                                          (msg.originalId || msg.id)?.toString()
                                        )
                                        ? "Unpinning..."
                                        : "Pinning..."
                                      : isMessagePinned(
                                          (msg.originalId || msg.id)?.toString()
                                        )
                                      ? "Unpin Message"
                                      : "Pin Message"}
                                  </button>

                                  <button className="flex gap-2 items-center justify-start rounded-[10px] px-4 py-2 text-left hover:bg-[#23272f] text-[#f36363] hover:text-[#f36363] whitespace-nowrap">
                                    <VolumeX
                                      className="w-6 h-6"
                                      stroke="currentColor"
                                      fill="currentColor"
                                    />
                                    Mute Channel
                                  </button>
                                  <button
                                    className="flex gap-2 items-center justify-start rounded-[10px] px-4 py-2 text-left hover:bg-[#23272f] text-[#f36363] hover:text-[#f36363] whitespace-nowrap"
                                    onClick={() => deleteMessage(msg)}
                                  >
                                    <Trash2Icon
                                      className="w-6 h-6"
                                      stroke="currentColor"
                                      fill="currentColor"
                                    />
                                    Delete Message
                                  </button>
                                </div>
                              )}
                            </button>
                          </div>
                          <div
                            className={`flex items-center ${
                              isOwnMessage ? "justify-end" : "justify-start"
                            } gap-2`}
                          >
                            {isSameSenderAsPrev || isOwnMessage ? (
                              <></>
                            ) : (
                              <>
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
                                  {selectedChat.name}
                                </span>
                              </>
                            )}
                            <span className="text-xs text-[#ffffff32]">
                              {formatTime(msg.date)}
                            </span>
                            {String(msg.id).startsWith("temp-") && (
                              <span className="text-xs text-[#84afff] italic">
                                sending...
                              </span>
                            )}
                          </div>
                          {selectedChat.platform === "Telegram" &&
                            msg.replyTo && (
                              <div
                                className="cursor-pointer text-xs text-[#84afff] bg-[#23272f] rounded px-2 py-1 mb-1 mt-2 max-w-[100%] break-all"
                                onClick={() => jumpToReply(msg)}
                              >
                                Replying to{" "}
                                <span className="font-semibold">
                                  {msg.replyTo.name}:
                                </span>{" "}
                                <span className="text-[#ffffffb0]">
                                  {msg.replyTo.message}
                                </span>
                              </div>
                            )}
                          {selectedChat.platform === "discord" &&
                            msg?.referenced_message?.id && (
                              <div
                                className={`${
                                  isOwnMessage ? "text-right" : ""
                                } cursor-pointer text-xs text-[#84afff] bg-[#23272f] rounded px-2 py-1 mb-1 mt-2 max-w-[100%] break-all`}
                                onClick={() => jumpToReply(msg)}
                              >
                                Replying to{" "}
                                <span className="font-semibold">
                                  {msg?.referenced_message?.author
                                    ?.global_name ||
                                    msg?.referenced_message?.author?.username}
                                  :
                                </span>{" "}
                                <span className="text-[#ffffffb0]">
                                  {msg?.referenced_message?.content}
                                </span>
                              </div>
                            )}
                          <div
                            className={`mt-1 text-sm text-[#e0e0e] break-words break-all whitespace-pre-wrap max-w-full ${
                              isOwnMessage ? "text-right ml-auto w-max" : ""
                            }`}
                          >
                            {Array.isArray(msg.media) &&
                              msg.media.length > 0 && (
                                <>
                                  {msg.media.map((mediaItem, idx) => (
                                    console.log("mediaItem", mediaItem),
                                    <Fragment key={mediaItem.data || idx}>
                                      {(mediaItem?.content_type?.startsWith(
                                        "image"
                                      ) ||
                                        mediaItem?.type?.startsWith(
                                          "image"
                                        ) ||
                                        mediaItem?.type?.startsWith(
                                          "photo"
                                        )) && (
                                        <img
                                          src={mediaItem.data || mediaItem.url}
                                          alt="media"
                                          style={{
                                            maxWidth: 320,
                                            cursor: "pointer",
                                          }}
                                          onClick={() => openMedia(mediaItem)}
                                        />
                                      )}
                                      {mediaItem?.type?.startsWith("video") && (
                                        <video
                                          src={mediaItem.data || mediaItem.url}
                                          controls
                                          style={{
                                            maxWidth: 320,
                                            cursor: "pointer",
                                          }}
                                          onClick={() => openMedia(mediaItem)}
                                        />
                                      )}
                                      {mediaItem?.type?.includes("octet") &&
                                        selectedChat.platform == "discord" && (
                                          <video
                                            src={mediaItem.url}
                                            autoPlay
                                            loop
                                            style={{
                                              maxWidth: 320,
                                              cursor: "pointer",
                                            }}
                                            onClick={() => openMedia(mediaItem)}
                                          />
                                        )}
                                      {(mediaItem?.type?.includes("audio") ||
                                        mediaItem?.type?.includes("ogg") ||
                                        mediaItem?.type?.includes("octet")) && (
                                        <AudioWaveform
                                          audioUrl={mediaItem.url ?? null}
                                        />
                                      )}
                                    </Fragment>
                                  ))}

                                  {enlargedMedia && (
                                    <div
                                      onClick={closeMedia}
                                      style={{
                                        position: "fixed",
                                        top: 0,
                                        left: 0,
                                        width: "100vw",
                                        height: "100vh",
                                        backgroundColor: "rgba(0,0,0,0.8)",
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        zIndex: 9999,
                                      }}
                                    >
                                      {(enlargedMedia?.type?.startsWith(
                                        "image"
                                      ) ||
                                        enlargedMedia?.content_type?.startsWith(
                                          "image"
                                        )) && (
                                        <img
                                          src={enlargedMedia?.url}
                                          alt="enlarged media"
                                          style={{
                                            maxHeight: "90vh",
                                            maxWidth: "90vw",
                                          }}
                                          onClick={(e) => e.stopPropagation()} // Prevent modal close on click inside image
                                        />
                                      )}
                                      {(enlargedMedia?.type?.startsWith(
                                        "video"
                                      ) ||
                                        enlargedMedia?.content_type?.startsWith(
                                          "video"
                                        )) && (
                                        <video
                                          src={enlargedMedia?.url}
                                          controls
                                          autoPlay
                                          style={{
                                            maxHeight: "90vh",
                                            maxWidth: "90vw",
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      )}
                                    </div>
                                  )}
                                </>
                              )}
                            {Array.isArray(msg.sticker_items) &&
                              msg.sticker_items.length > 0 && (
                                <>
                                  {msg.sticker_items.map((mediaItem, idx) => (
                                    <DiscordSticker stickerId={mediaItem.id} />
                                  ))}
                                </>
                              )}

                            {msg.media && (
                               console.log("mediaItem", msg.media),
                              <>
                                {msg.media && (
                                  <>
                                    {(msg?.media?.content_type?.startsWith(
                                      "image"
                                    ) ||
                                      msg?.media?.type?.startsWith(
                                        "image"
                                      )
                                    ||
                                        msg?.media?.type?.startsWith(
                                          "photo"
                                        )) && (
                                      <img
                                        src={`data:image/jpeg;base64,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ACAAAAABSWCpRCoAAogBSFIogAAAAAAAAAACiLAAAoiiKIsBSALAoSiKIolACAUJQAAAASgCKAAJQAAAACAAoICgiUoBKJYKAAAACFJQSiKCUCAEohaACAEqpQAAAAAAAAAAACAoAAAAAICgAAAAAgKAACAAAAAoAAAACAoAAAAAAgAAAAAAAKACAAAAAAAAAAAAAAUEsKCVZagAgAUiwLKFiLAoiiLEAAAAAAACgFCVAABLCkKAAAlAgAFBAAAAAAoIKWBFRSiFIoiiKIUiiKIoigCUIoiiKAIolAoiiFIUiiKIoiiLBLSKIoiiKIoiiKIoiiKIUgEssJRLCpQBLC0lAKIoiiKIAUgCiKIoiiUAIUAAAAASgAAAAAFBAAAAAAAAAUEABQQAAAAAAFBAAIAAKxCLAsFgAZCUChQEEqURSWUAAIKgpBYLAWUAAAAEKgAWCoFgqCoKQqCoKlCCoKgqCoKgqCoFgrEZSCoMmIyYjJiMmIyYjJiMmIykFQVBUlgAAAAGSJagqCoKgqQyYqyYkyYjJiMpBkxGTEZMRkxFQVBbiLcRUFQVABUCwVABYAFQVBYCwLBUAACoChBUCwAABCxVSwhVQCkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAsAAAAAAAACwLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABYCkKRRFEUQpFEURRFEoRRFCUSgABFEURRFAEURQIVKEApFEURRFEURRKCURRFEUARRKICgkUsKRQIUEKIAAAAAAABQikoAAACFiksoAAAAAAAAAAAAAAAAAACARSgAAAAAAgAKCAoAEUAAAAAACCwAAAAAAAAAALKAAAAAAAAAAAAAAAAAAAAAAAJRCgIiqAAAAACAoAIAAACgAgAKAAABFEAAAAAAAAABUFIUAAAAAAAAAAAAAAAAhQAAAAAACJQoCUSgAACAAoIAAAACggAKCASyrKiWWKqAAAAAAAAACggUAAAAAAAAAAAAABKAAAAAAAAAAAAAAAAAgAKCAAoICggi0AhQkCgVBYCyogoAAAAAAACykWCygCUAAAAgAi0AAACWFAAShKAAAAEoAIUAAAAAICggAAKCAAAAsq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2wwwxw0w0wwwwgy0wwwx13/v5yg08w94zwgww/8A+jyyxzz/APCCfLbrDDPPHvbDDDDDnPzvPvPPHPPLPLPLjrjDjOeyOOOOOCCSyyl884wgCSSyy2c999dNNdN99tl9MM8MsM8c8MMcssM88k4MMs88+sKcM4888888UAAA8888888Us8888Y0088888888888888888888s88888888ss888888888MIAA88s48wsQ8Mc8Mo8088UoI888888888888888sM88888888c88888888s88s8cMQ88cA888c0888c8888888c88c8888s044www4wwwwgwwQgAAwwwwAwwEIM4wwwwwwgQwwwAwhAJw4wEA4c8888888wYgAAAEYoAAAAAAAAAAAAAAAAAABBwAAAAAABBABAAAwAAAAAAEs8888888888oAAAAAAAAAAAAAAAAAAAAAAAQ4BYAAAAABAABBBBAABBAAAAAw8888888888MEAAAAAAAAAAAAAAAAEAAAAAAAFAAQgAABBABBBBBABBABBolUk888888888gcAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAABBABBABABEAEB88Mcpc888888w8o0oAQAAABBEAAAAUAAIIAAAAIAEAAAAABABBBABBBBAl8s88sU88888888s88oIgAAABBAAAAAQAAFUoIAAAsA4AAAAABBAABBBBAws888888888888888888844IABBAABAABBAFcoBogEUk0kABBABAAIBAABBAAc8888888888k8848888884IgQgAAAAAABANx88JcE8Y08BAQABBAwtIAAAA8888888884cMY888s8888scJBAAEIAAAABd8U8s08s8ww4BBAEAAAABBsEMMc88884wQcsAE8c48c88888s9JAs0YAAABBZw0RU888ssc8wAkM8AAAcs85sc888888IEUocoQgw808k888s8s8cgAIBABNV0EM4s4Qc8sd/8QAIxEAAwABAwUBAQEBAAAAAAAAAAERECExYSAwQEFQUWCQcP/aAAgBAwEBPxDvuaPWHsN6YpS5pT3fnPTjp/c3MXXPqLcLDwW3R7y8v5jJIs4UtxSlLl74pfmouxbl70+bPuQRYtezfpTQiNNv7eakGvt0Yqf8WGU3YqFF9ts93/2+Ceqlp9z2pj1fi340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`}
                                        alt="media"
                                        style={{
                                          maxWidth: 320,
                                          cursor: "pointer",
                                        }}
                                        onClick={() => openMedia(msg?.media)}
                                      />
                                    )}
                                    {msg?.media?.type?.startsWith("video") && (
                                      <video
                                        src={msg?.media?.data || msg?.media?.url}
                                        controls
                                        style={{
                                          maxWidth: 320,
                                          cursor: "pointer",
                                        }}
                                        onClick={() => openMedia(msg?.media)}
                                      />
                                    )}
                                    {msg?.media?.type?.includes("octet") &&
                                      selectedChat.platform == "discord" && (
                                        <>
                                          <video
                                            src={msg.media.url}
                                            autoPlay
                                            loop
                                            style={{
                                              maxWidth: 320,
                                              cursor: "pointer",
                                            }}
                                            onClick={() => openMedia(msg.media)}
                                          />
                                        </>
                                      )}
                                    {(msg?.media?.type?.includes("audio") ||
                                      msg?.media?.type?.includes("ogg") ||
                                      msg?.media?.type?.includes("octet")) && (
                                      <AudioWaveform
                                        audioUrl={msg?.media?.url ?? null}
                                      />
                                    )}
                                  </>
                                )}

                                {enlargedMedia && (
                                  <div
                                    onClick={closeMedia}
                                    style={{
                                      position: "fixed",
                                      top: 0,
                                      left: 0,
                                      width: "100vw",
                                      height: "100vh",
                                      backgroundColor: "rgba(0,0,0,0.8)",
                                      display: "flex",
                                      justifyContent: "center",
                                      alignItems: "center",
                                      zIndex: 9999,
                                    }}
                                  >
                                    {enlargedMedia?.type?.startsWith(
                                      "image"
                                    ) && (
                                      <img
                                        src={enlargedMedia.url}
                                        alt="enlarged media"
                                        style={{
                                          maxHeight: "90vh",
                                          maxWidth: "90vw",
                                        }}
                                        onClick={(e) => e.stopPropagation()} // Prevent modal close on click inside image
                                      />
                                    )}
                                    {enlargedMedia?.type?.startsWith(
                                      "video"
                                    ) && (
                                      <video
                                        src={enlargedMedia.url}
                                        controls
                                        autoPlay
                                        style={{
                                          maxHeight: "90vh",
                                          maxWidth: "90vw",
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                            {/* {linkify(msg)} */}
                            <MessageWithLinkifyAndMentions
                              text={msg.message}
                              mentionsData={msg.mentions}
                              message={msg}
                            />
                          </div>

                          {/* Reactions */}
                          {
                            <div className="flex gap-3 mt-2">
                              {msg?.reactions?.map((r: any, i: number) => (
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
                                  {r.icon || r.emoji}
                                  {typeof r.count === "number"
                                    ? " " + r.count
                                    : ""}
                                </button>
                              ))}
                              {/* No local reaction chips; Telegram is source of truth */}
                            </div>
                          }

                          {/* Tags */}
                          {msg?.tags?.length > 0 && (
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
                    </div>
                  );
                })}
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
        {selectedChat.is_typing && <LoadingDots />}

        <div
          className={`flex-shrink-0 px-6 py-4 bg-gradient-to-t from-[#181A20] via-[#181A20ee] ${
            enlargedMedia ? "z-10" : "z-20"
          } to-transparent`}
        >
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
                      setUploadedFiles((prev) =>
                        prev.filter((_, i) => i !== idx)
                      )
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
                  selectedChat === "all-channels" && !replyTo
                    ? "Select a specific chat to attach files"
                    : isSending
                    ? "Please wait for current message to send"
                    : "Attach files"
                }
              >
                <Plus
                  className={`text-black bg-[#fafafa60] rounded-full mr-2 w-[18px] h-[18px] cursor-pointer ${
                    (selectedChat === "all-channels" && !replyTo) || isSending
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-[#fafafa80]"
                  }`}
                  onClick={() => {
                    if (
                      (selectedChat === "all-channels" && !replyTo) ||
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
                    (selectedChat === "all-channels" && !replyTo) ||
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
                        onChange={async (e) => {
                          const selectedFiles = Array.from(
                            e.target.files || []
                          );
                          const files = await Promise.all(
                            selectedFiles.map(async (file) => {
                              const arrayBuffer = await file.arrayBuffer(); // raw binary
                              return {
                                file,
                                type: getFileType(file),
                                preview: file.type.startsWith("image/")
                                  ? URL.createObjectURL(file)
                                  : null,
                                status: "uploading",
                                content: arrayBuffer, // this is what you'll PUT to Discord
                              };
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

              {audioBlob || isRecording ? (
                <div className="flex gap-4 justify-stretch items-center w-full">
                  <LiveAudioWaveform barMaxHeight={50} cursorHeight={40} />
                  {audioBlob && !isRecording && (
                    <Trash2Icon
                      onClick={clearAudio}
                      className="cursor-pointer"
                    />
                  )}
                </div>
              ) : (
                <>
                  <textarea
                    ref={inputRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={
                      replyTo && replyTo.name
                        ? `Replying to ${replyTo.name}...`
                        : selectedChat === "all-channels"
                        ? "Select a channel on the sidebar to send messages..."
                        : "Type your message..."
                    }
                    disabled={
                      (selectedChat === "all-channels" && !replyTo) || isSending
                    }
                    rows={1}
                    className="border-none focus:outline-none focus:ring-0 flex-1 bg-transparent outline-none text-white placeholder-[#ffffff48] text-sm disabled:opacity-50"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                </>
              )}
            </div>
            {selectedChat.platform === "discord" && (
              <button
                onClick={() => setShowStickers((s) => !s)}
                className="mr-0.5 ml-2 text-gray-400 hover:text-white"
              >
                <Sticker width={18} height={18} />
              </button>
            )}
            {showStickers && (
              <StickerMenu
                onStickerSelect={handleStickerSelect}
                stickerPacks={stickerPacks}
              />
            )}
            <button
              className="mx-2"
              onClick={() => setShowPicker((val) => !val)}
            >
              😊
            </button>
            {showPicker && (
              <div
                ref={pickerRef}
                style={{ position: "absolute", bottom: "40px", zIndex: 999 }}
              >
                <EmojiPicker theme="dark" onEmojiClick={handleEmojiClick} />
              </div>
            )}
            {!isRecording ? (
              <button
                onClick={startRecording}
                title="Start recording voice message"
              >
                <MicIcon />
              </button>
            ) : (
              <button onClick={stopRecording} title="Stop recording and send">
                <StopCircle />
              </button>
            )}

            <button
              onClick={audioBlob ? sendAudioMessage : handleSend}
              disabled={
                (selectedChat === "all-channels" && !replyTo) || isSending
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
        <style>{`
      .message-item.highlight {
  background-color: #ffffff10;
  transition: background-color 0.3s ease;
}
    `}</style>
      </div>
    );
  }
);

export default UnifiedChatPanel;
