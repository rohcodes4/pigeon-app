import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import discord from "@/assets/images/discordColor.png";
import telegram from "@/assets/images/telegramColor.png";
import discordWhite from "@/assets/images/discord.png";
import { FaCopy } from "react-icons/fa";
import { FaReply } from "react-icons/fa";
import telegramWhite from "@/assets/images/telegram.png";
import { IoIosMore } from "react-icons/io";
import aiAll from "@/assets/images/aiAll.png";
import EmojiPicker from "emoji-picker-react";
import { Theme } from "emoji-picker-react";

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
  Trash2Icon,
  Mic,
  Mic2,
  Mic2Icon,
  MicIcon,
  MicOffIcon,
  StopCircle,
} from "lucide-react";
import moreIcon from "@/assets/images/moreIcon.png";
import pinIcon from "@/assets/images/pinIcon.png";
import replyIcon from "@/assets/images/replyIcon.png";
import taskIcon from "@/assets/images/sidebar/Chat.png";
import smartIcon from "@/assets/images/sidebar/Chat.png";
import { FaDiscord, FaTelegramPlane } from "react-icons/fa";
import ChatAvatar from "./ChatAvatar";
import { useAuth } from "@/hooks/useAuth";
import pLimit from "p-limit";
import {
  sendReaction,
  getMessageById,
  sendMessage,
  createBookmark,
} from "@/utils/apiHelpers";
import { toast } from "@/hooks/use-toast";
import { mapDiscordMessageToItem, mapDiscordMessageToTelegram } from "@/lib/utils";
import { useLocation } from "react-router-dom";
import { mapToFullChat } from "@/lib/utils";
import AudioWaveform from "./AudioWaveForm";
import LiveAudioWaveform from "./LiveAudioWaveForm";
import { timeStamp } from "console";
import { useDiscordChatHistory, useDiscordMessages } from "@/hooks/useDiscord";
import { isHistoryFetched, setHistoryFetched } from "@/store/discordHistoreStore";


const LoadingDots: React.FC = () => {
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
  tags: string[];
  reactions: ReactionChip[];
  hasLink: boolean;
  hasMedia: boolean;
  media: any;
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
  const adjustedDate = new Date(dateObj.getTime() + 5.5 * 60 * 60 * 1000);

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

export interface UnifiedChatPanelRef {
  handleSend: (message: string, targetChat?: any | string) => void;
}
const UnifiedChatPanel = forwardRef<UnifiedChatPanelRef, UnifiedChatPanelProps>(
  ({ selectedChat = "all-channels" }, ref) => {
    const location = useLocation();
    const locationStateChat = location.state?.selectedChat;
    const [selectedMessageId, setSelectedMessageId] = useState(location.state?.selectedMessageId ?? null)
    const refreshAbortController = useRef<AbortController | null>(null);

    // let selectedChat = locationStateChat || propChat || "all-channels";
    // Flag to toggle between real data and dummy data for design inspiration
    const USE_DUMMY_DATA = false; // Set to true to use dummy data, false for real data
    const { user } = useAuth();
    const [text, setText] = useState("");
    const [showPicker, setShowPicker] = useState(false);
    const pickerRef = useRef(null); // emoji picker container ref
    const hasFetchedFirstMessages = useRef(false);
    const [enlargedMedia, setEnlargedMedia] = useState(null);
    const { history, loadMore, loading:dcHookLoading } = useDiscordChatHistory(selectedChat?.id);

    useEffect(()=>{
      setLoadingMore(dcHookLoading)
    },[dcHookLoading])

    const openMedia = (media) => {
      setEnlargedMedia(media);
    };
    const closeMedia = () => setEnlargedMedia(null);

    React.useEffect(() => {
      if(container){
        container.scrollTop = container.scrollHeight;
      }
      setShouldAutoScroll(true);
      setLoadedMediaIds(new Set())
    }, [selectedChat]);

    const handleEmojiClick = (emojiData, event) => {
      if (!inputRef.current) return;
      const emoji = emojiData.emoji;
      const input = inputRef.current;
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const newValue = text.slice(0, start) + emoji + text.slice(end);
      setText(newValue);
      setText(newValue);

      // Update input value manually since you use both ref and state
      // input.value = newValue;
      // Move cursor after inserted emoji
      setTimeout(() => {
        input.focus();
        input.selectionStart = input.selectionEnd = start + emoji.length;
      }, 0);
      setShowPicker(false); // Optionally close picker after select
    };

    useImperativeHandle(ref, () => ({
      handleSend: (message, targetChat) => {
        console.log("handleSend called with message:", message);
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
    const scrollRestoreRef = React.useRef<{
      prevHeight: number;
      prevTop: number;
    } | null>(null);
    // Track current chat to prevent race conditions
    const currentChatRef = React.useRef<string | null>(null);
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
    const [attachments, setAttachments] = React.useState([]);
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
      const viewportHeight = window.innerHeight;
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

    const fetchPinnedMessages = React.useCallback(async (chatId = null) => {
      try {
        const pins = await getPinnedMessages(chatId);
        // console.log("Fetched pins:", pins);
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
          container.scrollTo({
            top: container.scrollHeight,
            behavior: "smooth",
          });
        });
      });

      // Hide the scroll button after scrolling
      setShowScrollToBottom(false);
    }, []);
    const [showAttachMenu, setShowAttachMenu] = React.useState(false);
    const attachRef = React.useRef(null);
    const [uploadedFiles, setUploadedFiles] = React.useState([]);
    const fileInputRef = React.useRef(null);
    // console.log("selectedChat", selectedChat);
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

      console.log("🔗 === DEBUG: OPENING URL ===");
      console.log("🔗 Final URL to open:", webUrl);
      console.log("🔍 === DEBUG: openInTelegram END ===");

      window.open(webUrl, "_blank");
    };

    // Only run scrollToBottom when shouldAutoScroll is true
    useEffect(() => {
      if (!shouldAutoScroll && !isNewChat) return; // Don't scroll if user scrolled up

      if (messages.length === 0) return;

      // delay scroll to bottom after render
      const timer = setTimeout(() => {
        // scrollToBottom();
        container.scrollTop = container.scrollHeight;
      }, 100);

      if (isNewChat) setIsNewChat(false);

      return () => clearTimeout(timer);
    }, [messages, shouldAutoScroll, isNewChat]);


    const groupedByDate: { [date: string]: typeof messages } =
      React.useMemo(() => {
        const groups: { [date: string]: typeof messages } = {};
        const uniqueMessages = [...new Map(messages.map(m => [m.id, m])).values()];

        uniqueMessages.forEach((msg) => {
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
        if(selectedChat.platform === "discord") {
              // For Discord, we need to map the message to Telegram format first
              const res = await window.electronAPI.discord.addReaction(selectedChat.id, messageId, emoji);
              console.log("Discord reaction result:", res);
              return
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
            if(selectedChat.platform === "Telegram") {
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
    React.useEffect(() => {
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
    // const fetchMessages = React.useCallback(
    //   async (
    //     chatId: number | string,
    //     beforeTimestamp?: string,
    //     append = false
    //   ) => {
    //     if (!chatId) return;
    //     // console.log("chatId: ", chatId);
    //     // If using dummy data, don't fetch from API
    //     if (USE_DUMMY_DATA) {
    //       setMessages(dummyMessages);
    //       return;
    //     }

    //     if (append) {
    //       setLoadingMore(true);
    //     } else {
    //       setLoading(true);
    //       setHasMoreMessages(true); // Reset pagination state for new chat
    //       setShouldAutoScroll(true);
    //       // CRITICAL: Clear messages immediately when switching chats to prevent mixing
    //       setMessages([]);
    //     }

    //     try {
    //       const token = localStorage.getItem("access_token");

    //       // Determine the endpoint based on the type of chat selection
    //       let endpoint: string;

    //       if (chatId === "all-channels") {
    //         endpoint = `${import.meta.env.VITE_BACKEND_URL}/chats/all/messages`;
    //       } else if (typeof chatId === "object" && chatId && "id" in chatId) {
    //         // This is a smart filter object
    //         endpoint = `${import.meta.env.VITE_BACKEND_URL}/filters/${
    //           (chatId as any).id
    //         }/messages`;
    //       } else {
    //         // This is a regular chat ID
    //         endpoint = `${
    //           import.meta.env.VITE_BACKEND_URL
    //         }/chats/${chatId}/messages`;
    //       }

    //       // Add pagination parameter if loading older messages
    //       const params = new URLSearchParams();
    //       params.append("limit", String(PAGE_SIZE));
    //       if (beforeTimestamp) {
    //         params.append("before", beforeTimestamp);
    //       }
    //       if (params.toString()) {
    //         endpoint += `?${params.toString()}`;
    //       }

    //       const response = await fetch(endpoint, {
    //         headers: {
    //           Authorization: `Bearer ${token}`,
    //           "Content-Type": "application/json",
    //         },
    //       });

    //       if (!response.ok) {
    //         throw new Error(`HTTP error! status: ${response.status}`);
    //       }

    //       const data = await response.json();

    //       // Debug: Log the first message's chat object to see what we're getting
    //       if (data.length > 0) {
    //         // console.log("First message chat object:", data[0].chat);
    //       }

    //       // Transform the messages to match our component's expected format
    //       const transformedMessages = data.map((msg: any, index: number) => {
    //         // Extract chat name and determine channel from the message data
    //         let chatName = "Unknown";
    //         let channelName = null; // Default to null (no channel)

    //         if (chatId === "all-channels" && msg.chat) {
    //           // For "all-channels", extract chat name based on the chat type
    //           // For Telegram, always set channel to null since we don't have topic/channel data
    //           // Discord channels will be handled separately when we add Discord support
    //           if (msg.chat._ === "Channel") {
    //             // For Telegram channels, use title or username as chat name
    //             chatName = msg.chat.title || msg.chat.username || "Unknown";
    //             channelName = null; // No channel display for Telegram
    //           } else if (msg.chat._ === "Chat") {
    //             // For Telegram groups, use title or username as chat name, no channel
    //             chatName = msg.chat.title || msg.chat.username || "Unknown";
    //             channelName = null; // No channel for groups
    //           } else if (msg.chat._ === "User") {
    //             // For users/bots (direct messages), use first_name or username as chat name, no channel
    //             chatName = msg.chat.first_name || msg.chat.username || "Unknown";
    //             channelName = null; // No channel for direct messages
    //           } else {
    //             // Fallback
    //             chatName =
    //               msg.chat.title ||
    //               msg.chat.username ||
    //               msg.chat.first_name ||
    //               "Unknown";
    //             channelName = null;
    //           }
    //         } else {
    //           // For specific chats, use the selected chat name
    //           chatName = selectedChat?.name || "Chat";
    //           channelName = null; // No channel for specific chat view
    //         }

    //         // Parse Telegram reactions from message payload if present
    //         const reactionResults =
    //           (msg?.message?.reactions && msg.message.reactions.results) || [];
    //         const parsedReactions = Array.isArray(reactionResults)
    //           ? (reactionResults
    //               .map((r: any) => {
    //                 const emoticon =
    //                   typeof r?.reaction?.emoticon === "string"
    //                     ? r.reaction.emoticon
    //                     : typeof r?.reaction === "string"
    //                     ? r.reaction
    //                     : null;
    //                 const normalized =
    //                   emoticon === "❤" || emoticon === "♥️" ? "❤️" : emoticon;
    //                 return normalized
    //                   ? { icon: normalized, count: r?.count || 0 }
    //                   : null;
    //               })
    //               .filter(Boolean) as Array<{ icon: string; count: number }>)
    //           : [];

    //         return {
    //           id: msg._id || msg.id || String(index + 1),
    //           originalId: msg._id || msg.id,
    //           telegramMessageId: msg.message?.id, // Store the Telegram message ID for replies
    //           name: msg.sender?.first_name || msg.sender?.username || "Unknown",
    //           avatar: msg.sender?.id
    //             ? `${import.meta.env.VITE_BACKEND_URL}/contact_photo/${
    //                 msg.sender.id
    //               }`
    //             : gravatarUrl(
    //                 msg.sender?.first_name || msg.sender?.username || "Unknown"
    //               ),
    //           platform: "Telegram" as const,
    //           channel: channelName, // Will be null for DMs and groups, channel name for channels
    //           server: chatName, // Always the chat/group/channel name
    //           date: new Date(msg.timestamp),
    //           message: msg.raw_text || "",
    //           tags: [],
    //           reactions: parsedReactions,
    //           hasLink: (msg.raw_text || "").includes("http"),
    //           link: (msg.raw_text || "").match(/https?:\/\/\S+/)?.[0] || null,
    //           replyTo: null as any,
    //           originalChatType: msg.chat?._ || null,
    //           // telegramMessageId already set above; keep a single definition only
    //         };
    //       });

    //       // Sort messages by date (oldest first) so newest appear at bottom
    //       transformedMessages.sort((a, b) => a.date.getTime() - b.date.getTime());

    //       // Check if we got fewer messages than requested (indicating we've reached the end)
    //       if (data.length < PAGE_SIZE) {
    //         setHasMoreMessages(false);
    //       }

    //       if (append) {
    //         // Prepend older messages to the existing list
    //         setShouldAutoScroll(false); // Don't auto-scroll when loading more
    //         setMessages((prevMessages) => [
    //           ...transformedMessages,
    //           ...prevMessages,
    //         ]);
    //       } else {
    //         // Replace messages for new chat
    //         setShouldAutoScroll(true); // Enable auto-scroll for new chat
    //         setMessages(transformedMessages);
    //         setShouldAutoScroll(true);
    //       }

    //     } catch (error) {
    //       console.error("Error fetching messages:", error);
    //       if (!append) {
    //         setMessages([]); // Set empty array on error only if not appending
    //       }
    //     } finally {
    //       setLoading(false);
    //       setLoadingMore(false);
    //     }
    //   },
    //   [selectedChat] // Only depend on the name, not the entire object
    // );

    const getMessageMedia = async (id, hasMedia) => {
    
      if (!hasMedia || selectedChat.platform==="discord") return null;
      const token = localStorage.getItem("access_token");

      const data = await fetch(`${BACKEND_URL}/api/messages/${id}/media`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const blob = await data.blob();
      const url = URL.createObjectURL(blob);
      return {
        url,
        type: blob.type, // e.g. "image/jpeg", "video/mp4", "audio/mpeg"
      };

      
    };

    const fetchMessages = React.useCallback(
      async (
        chatId: number | string,
        beforeTimestamp?: string,        
        append = false,        
        afterTimestamp?: string
      ) => {
        if (!chatId) return;
        if(selectedChat.platform === "discord") return;
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

          if(selectedChat?.platform=='discord'){
            return
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

          const response = await fetch(endpoint, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
         

          if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

          const data = await response.json();
      

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
                platform: selectedChat.platform=='discord'? "Discord" : "Telegram" as const,
                channel: channelName,
                server: chatName,
                date: new Date(msg.timestamp),
                message: msg.raw_text || "",
                tags: [],
                reactions,
                hasLink: (msg.raw_text || "").includes("http"),
                link: (msg.raw_text || "").match(/https?:\/\/\S+/)?.[0] || null,
                hasMedia: msg.message.has_media,
                media: null,
                replyToId: replyId ?? null,
                timestamp:msg.timestamp,
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
    const loadMoreMessages = React.useCallback(() => {
      if (loadingMore || loading || !hasMoreMessages || messages.length === 0)
        return;
      console.log('loading2...')

      if(selectedChat.platform==='discord'){
        console.log('calling dc load more')   
        setLoadingMore(true)     
          loadMore()
          setMessages(prev =>
            [
              ...history.map(mapDiscordMessageToItem),
              ...prev
            ].sort(
              (a, b) =>
                Number(new Date(a.timestamp).getTime()) - Number(new Date(b.timestamp).getTime())
            )
          );
        setLoadingMore(false)     
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
      hasMoreMessages,
      messages,
      selectedChat,
      fetchMessages,
    ]);

    // Scroll event handler for infinite loading
    // const handleScroll = React.useCallback(
    //   (e: React.UIEvent<HTMLDivElement>) => {
    //     const container = e.currentTarget;
    //     const scrollTop = container.scrollTop;
    //     const scrollHeight = container.scrollHeight;
    //     const clientHeight = container.clientHeight;
    //     const threshold = 100; // Load more when within 100px of top

    //     // Check if user has scrolled up from bottom (show scroll button)
    //     const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    //     setShowScrollToBottom(!isNearBottom);
    //     setShouldAutoScroll(isNearBottom);

    //     const isScrollable = scrollHeight > clientHeight + threshold;

    //     if (
    //       scrollTop <= threshold &&
    //       hasMoreMessages &&
    //       !loadingMore &&
    //       !loading &&
    //       isScrollable
    //     ) {
    //       scrollRestoreRef.current = {
    //         prevHeight: container.scrollHeight,
    //         prevTop: container.scrollTop,
    //       };
    //       loadMoreMessages();
    //     }
    //   },
    //   [hasMoreMessages, loadingMore, loading, loadMoreMessages]
    // );
    // const handleScroll = React.useCallback((e) => {
    //   const container = e.currentTarget;
    //   const scrollTop = container.scrollTop;
    //   const scrollHeight = container.scrollHeight;
    //   const clientHeight = container.clientHeight;

    //   const threshold = 100;
    //   const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;

    //   setShouldAutoScroll(isNearBottom); // true only if near bottom

    //   setShowScrollToBottom(!isNearBottom);

    //   if (
    //     scrollTop <= threshold &&
    //     hasMoreMessages &&
    //     !loadingMore &&
    //     !loading &&
    //     scrollHeight > clientHeight + threshold
    //   ) {
    //     // User scrolled to top, load older messages
    //     scrollRestoreRef.current = {
    //       prevHeight: scrollHeight,
    //       prevTop: scrollTop,
    //     };
    //     loadMoreMessages();
    //   }
    // }, [hasMoreMessages, loadingMore, loading, loadMoreMessages]);

    // In the scroll handler:
    const handleScroll = React.useCallback(
      (e) => {
        const container = e.currentTarget;
        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;

        const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;

        setShouldAutoScroll(isNearBottom);
        setShowScrollToBottom(!isNearBottom);

        // If near top, load more messages
        if (scrollTop <= 100 && hasMoreMessages && !loadingMore && !loading) {
          scrollRestoreRef.current = {
            prevHeight: scrollHeight,
            prevTop: scrollTop,
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

    const getPlatformFromChatId = (chatId: string) => {
      // Simple heuristic - you might want to store this info in pins
      // return Math.random() > 0.5 ? 'telegram' : 'discord';
      return "telegram";
    };

    const handleSend = async () => {
      if (
        !inputRef.current ||
        (!inputRef.current.value.trim() && uploadedFiles.length === 0)
      ) {
        return;
      }
      if (uploadedFiles.length > 0) {
        try {
          let index=0
          for (const fileWrapper of uploadedFiles) {
            
            // fileWrapper.file is File object
            if(selectedChat.platform=='discord'){

         
            const result = await window.electronAPI.discord.attachments(selectedChat.id, [{id:"0", filename: fileWrapper.file.name, file_size: fileWrapper.file.size, is_clip: false}]);
            console.log(result,"uploadedattachments");
            if(result.success && result.data){
            setAttachments(result.data);

           const resp= await uploadFileToDiscord(
             result.data.attachments[0].upload_url,
             fileWrapper.file
            );
            console.log("File uploaded to Discord CDN", resp);
            const res = await window.electronAPI.discord.sendMessage(
              selectedChat.id,
              inputRef.current.value.trim(),
              [{id:"0", filename: fileWrapper.file.name, uploaded_filename: result.data.attachments[0].upload_filename}]
            );
            index++;
            console.log(res,[{id:String(index), filename: fileWrapper.file.name, uploaded_filename: result.data.attachments[0].upload_filename}]);
          }
          
            }else{
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

      // Check if this is a smart filter (not a real chat)
      // if (selectedChat.keywords !== undefined) {
      //   toast({
      //     title: "Cannot send to smart filter",
      //     description: "Please select a real chat instead of a smart filter",
      //     variant: "destructive",
      //   });
      //   return;
      // }

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
      const optimisticMessage: MessageItem = {
        id: `temp-${Date.now()}`, // Temporary ID
        originalId: null,
        telegramMessageId: undefined,
        name: user?.username || user?.first_name || "You",
        avatar: user?.photo_url || gravatarUrl(user?.username || "You"),
        platform: selectedChat.platform=='discord'? "Discord" : "Telegram" as const,
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
              chat_id: replyTo.telegramMessageId,
            }
          : null,
      };

      // Add optimistic message to UI
      setMessages((prev) => [...prev, optimisticMessage]);

      // Clear input and reply state immediately for better UX
      const originalValue = inputRef.current.value;
      const originalReplyTo = replyTo;
      inputRef.current.value = "";
      setText("");

      setReplyTo(null);
      setShouldAutoScroll(true);

      try {
        const id = chatId || replyTo.chat_id;
        // Send message to backend/Telegram
        const replyToId = originalReplyTo?.telegramMessageId;

            if (selectedChat.platform=='discord') {
        const result = await window.electronAPI.discord.sendMessage(
          id,
          messageText,
        
        );
        if(!result.success){
          const res = await window.electronAPI.security.getDiscordToken();
          if (res?.success && res?.data) {
           await window.electronAPI.discord.connect(res.data);
          }
        }
      }else{
      await sendMessage(id, messageText, replyToId);
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

        // Show success toast
        // toast({
        //   title: "Message sent",
        //   description: "Your message has been sent successfully",
        // });

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

    console.log(history.map(mapDiscordMessageToItem),"historicdiscordmessages");
    useEffect(()=>{
      console.log(`history fetched for ${selectedChat.id}`,isHistoryFetched(selectedChat.id))
      if(history.length>0 && selectedChat?.platform=='discord' && !isHistoryFetched(selectedChat.id)){
    setMessages(prev =>
      [
        ...history.map(mapDiscordMessageToItem),
        ...prev
      ].sort(
        (a, b) =>
          Number(new Date(a.timestamp).getTime()) - Number(new Date(b.timestamp).getTime())
      )
    );
    if(history.length>0)setHistoryFetched(selectedChat.id);
      
      }
      setLoading(false)
      setLoadingMore(false)
      if(container && !hasScrolled){
        container.scrollTop = container.scrollHeight;
      }
      if(!hasScrolled){
        scrollToBottom()
        setHasScrolled(true)
      }
        
    },[selectedChat, history])

    const { messagesList} = useDiscordMessages(selectedChat?.id);
    console.log(messagesList.map(mapDiscordMessageToItem),"livediscordmessages");
    // console.log(messagesList?.[0]?.chat_id ?? null,"messagesList[0].chat_id");
    // console.log(selectedChat?.id,"selectedChat?.id");
    useEffect(() => {
      if (messagesList && selectedChat?.platform === 'discord') {
        setMessages(prev =>
          [
            ...messagesList.map(mapDiscordMessageToItem),
            ...prev
          ].sort(
            (a, b) =>
              Number(new Date(a.timestamp).getTime()) - Number(new Date(b.timestamp).getTime())
          )
        );
        scrollToBottom();
      }
      setLoading(false);
      setLoadingMore(false);
    }, [messagesList]);
    
    // setMessages((prev) => [...messagesList, ...prev]);
    
    // Silent refresh that avoids toggling loading states and only appends new messages
    const refreshLatest = React.useCallback(async () => {
      if (USE_DUMMY_DATA) return;
      if (refreshAbortController.current) {
        refreshAbortController.current.abort();
      }

      const abortController = new AbortController();
      refreshAbortController.current = abortController;

      try {
        const token = localStorage.getItem("access_token");
        let endpoint: string | null = null;
        let currentChatId: string | null = null; // Track which chat we're fetching for

        if (selectedChat === "all-channels") {
          endpoint = `${
            import.meta.env.VITE_BACKEND_URL
          }/chats/all/messages?limit=${PAGE_SIZE}`;
          currentChatId = "all-channels";
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
            currentChatId = `filter-${(selectedChat as any).id}`;
          } else {
            endpoint = `${import.meta.env.VITE_BACKEND_URL}/chats/${
              (selectedChat as any).id
            }/messages?limit=${PAGE_SIZE}`;
            // if (params.toString()) endpoint += `?${params.toString()}`;
            currentChatId = String((selectedChat as any).id);
          }
        } else {
          console.log(
            "DEBUG: No valid selectedChat, skipping refresh",
            selectedChat
          );
          return;
        }
    let data = [];
      if(selectedChat?.platform=='discord'){
        // const chatID= selectedChat.id || replyTo.chat_id;
        // // const msg = await window.electronAPI.database.getMessages(chatID,50,0);
        // const discordSelectedChat = await window.electronAPI.discord.getChatHistory(selectedChat.id);
        // if(discordSelectedChat.success)
        //   data=discordSelectedChat.data.map(mapDiscordMessageToTelegram);
      
        // else{
        //   const res = await window.electronAPI.security.getDiscordToken();
        //   if (res?.success && res?.data) {
        //    await window.electronAPI.discord.connect(res.data);
        //   }
        // }
      }else{
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
        data = await response.json();
      }

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

        const transformed = await Promise.all(
          (data || []).map(async (msg: any, index: number) => {
            const reactionResults =
              ((msg?.message || {}).reactions || {}).results || [];
            const parsedReactions = Array.isArray(reactionResults)
              ? toChips(reactionResults)
              : [];
            const chatName = msg.chat
              ? msg.chat.title ||
                msg.chat.username ||
                msg.chat.first_name ||
                selectedChat.name ||
                "Unknown"
              : selectedChat && typeof selectedChat === "object"
              ? (selectedChat as any).name || "Chat"
              : "Unknown";

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
              telegramMessageId: msg.message?.id, // Store the Telegram message ID for replies
              mentions: msg?.message?.mentions ?? [],
              name: msg.sender?.first_name || msg.sender?.username || "Unknown",
              chat_id: msg.sender.id,
              avatar: msg.sender?.id
                ? `${import.meta.env.VITE_BACKEND_URL}/contact_photo/${
                    msg.sender.id
                  }`
                : gravatarUrl(
                    msg.sender?.first_name || msg.sender?.username || "Unknown"
                  ),
              platform: selectedChat.platform=='discord'? "Discord" : "Telegram" as const,
              channel: null,
              server: chatName,
              date: new Date(msg.timestamp),
              message: msg.raw_text || "",
              tags: [],
              reactions: parsedReactions,
              hasLink: (msg.raw_text || "").includes("http"),
              link: (msg.raw_text || "").match(/https?:\/\/\S+/)?.[0] || null,
              hasMedia: msg.message.has_media,
              media: null,
              timestamp:msg.timestamp,
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
            } as MessageItem;
          })
        );

        transformed.sort((a, b) => a.date.getTime() - b.date.getTime());

        // console.log("DEBUG: API returned", data.length, "messages");
        // console.log("DEBUG: Transformed", transformed.length, "messages");

        setMessages((prev) => {
          // CRITICAL: Only update messages if we're still on the same chat
          // This prevents race conditions when switching between chats rapidly
          const stillOnSameChat = currentChatId === currentChatRef.current;

          if (!stillOnSameChat) {
            console.log(
              "DEBUG: Chat changed during refresh, ignoring stale data",
              {
                currentChatId,
                currentChat: currentChatRef.current,
                selectedChat,
              }
            );
            return prev; // Don't update if we've switched chats
          }

          const idOf = (x: any) => String(x.originalId || x.id);
          const prevMap = new Map(prev.map((m) => [idOf(m), m]));
          let changed = false;
          for (const m of transformed) {
            const key = idOf(m);
            if (prevMap.has(key)) {
              // Update existing entry (reactions/timestamp/etc.)
              const old = prevMap.get(key)!;
              // Preserve any local fields (e.g., replyTo)
              const merged = {
                ...old,
                ...m,
                media: old.media ?? m.media, // preserve UI-fetched media
              };

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
        if (e.name === "AbortError") {
          // Silently ignore aborts
          return;
        }
        console.error("DEBUG: refreshLatest error:", e);
      }
    }, [USE_DUMMY_DATA, selectedChat]);

    // Fetch messages when selectedChat changes or on initial mount
    React.useEffect(() => {
      // Set flag to indicate this is a new chat (should auto-scroll)
      setIsNewChat(true);
      setMessages([])
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
        if(selectedChat.platform == "discord") return;
        if(selectedChat.platform !="discord"){
        if (selectedChat?.id ) {
          if (selectedChat.name && selectedChat.keywords !== undefined) {
            fetchMessages(selectedChat);
            fetchPinnedMessages();
          } else {
            if(messages.length>0){
              fetchMessages(selectedChat.id,null,null,messages[0]?.timestamp??null);
            } else{
              fetchMessages(selectedChat.id)
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
        setMessages(dummyMessages);
        setPinnedMessages([]);
      }
      setShowAttachMenu(false);
      setReplyTo(null);
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

    // Polling: refresh current view every 1s (no websockets)
    React.useEffect(() => {
      if (USE_DUMMY_DATA) return;
      let timer: any = null;
      const poll = async () => {
        try {
          await refreshLatest();
        } catch (_) {
          // ignore transient polling errors
        } finally {
          timer = setTimeout(poll, 1000);
        }
      };
      timer = setTimeout(poll, 1000);
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
          // console.log(`Chat ${chatId} marked as read`);
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


    async function uploadFileToDiscord(
    uploadUrl: string, file: File
    ) {
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

    const handleFileUpload = async (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      if (!event.target.files || event.target.files.length === 0) return;

      const file = event.target.files[0]; // Get first file

      try {
        const result = await sendMediaToChat({
          chatId: selectedChat.id,
          file,
          caption: "Here is my photo",
          fileName: file.name,
        });

        console.log("Media sent:", result);
        // You might want to refresh messages here to show the new media message
      } catch (error) {
        console.error("Error sending media:", error);
        toast({
          title: "Send media failed",
          description: String(error),
          variant: "destructive",
        });
      }
    };

    const [isHoveringMenu, setIsHoveringMenu] = useState(false);
    // Use a ref to persist between renders
    const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const startCloseTimer = () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = setTimeout(() => {
        setOpenMenuId(null);
        setIsHoveringMenu(false);
        closeTimeoutRef.current = null;
      }, 180); // 150-200ms works well
    };

    useEffect(() => {
      // Cleanup timer on unmount
      return () => {
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      };
    }, []);

    // Add these state and refs at the top together with your menu states:
    const [isTagsSubmenuOpen, setIsTagsSubmenuOpen] = useState(false);
    const tagsSubmenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const startTagsSubmenuCloseTimer = () => {
      if (tagsSubmenuTimeoutRef.current)
        clearTimeout(tagsSubmenuTimeoutRef.current);
      tagsSubmenuTimeoutRef.current = setTimeout(() => {
        setIsTagsSubmenuOpen(false);
      }, 150);
    };

    const cancelTagsSubmenuCloseTimer = () => {
      if (tagsSubmenuTimeoutRef.current) {
        clearTimeout(tagsSubmenuTimeoutRef.current);
        tagsSubmenuTimeoutRef.current = null;
      }
    };

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
    const [hasScrolledToUnread, setHasScrolledToUnread] = useState(false);

    const unreadDividerRef = useRef<HTMLDivElement | null>(null);

    const container = messagesContainerRef.current;
    const unreadDividerEl = unreadDividerRef.current;
    const unreadEl = unreadDividerRef.current;
    const [isInitialScrolled, setIsInitialScrolled] = useState(false);
    const [hasScrolled, setHasScrolled] = React.useState(false);
    const [highlightedMessageId, setHighlightedMessageId] =
      React.useState(null);
    const scrollTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
 const [loadedMedia, setLoadedMediaIds] = useState<Set<string>>(new Set());

    React.useEffect(() => {
      // Reset scroll flag when chat changes
      setHasScrolled(false);
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, [selectedChat?.id]);
    
   const limit = pLimit(5); // only 5 at once

useEffect(() => {
  const nodes = document.querySelectorAll<HTMLDivElement>(
    "[data-hasmedia='true'][data-msgid]"
  );

  nodes.forEach((node) => {
    const msgId = node.getAttribute("data-msgid");
    if (!msgId) return;

    if (loadedMedia.has(msgId)) return;

    setLoadedMediaIds((prev) => new Set(prev).add(msgId));

    limit(async () => {
      const media = await getMessageMedia(msgId, true);
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, media } : m))
      );
    });
  });
}, [messages, loadedMedia]);
    React.useEffect(() => {
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
            await loadMoreMessages();
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
        const response = await fetch(`${BACKEND_URL}/api/messages/${msg.id}/delete`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error("Delete message failed");
    
        // After successful delete, remove message from state
        setMessages((prev) =>
          prev.filter((message) => message.id !== msg.id && message.originalId !== msg.id)
        );
    
        await refreshLatest();  // Optional: refresh latest state from server if desired
      } catch (error) {
        console.error("Failed to delete message", error);
        toast({
          title: "Delete failed",
          description: error.message || "Could not delete message",
          variant: "destructive",
        });
      }
    };

    
    // const deleteMessage = async (msg) => {
    //   console.log("delete message: ", msg);
    //   const response = await fetch(
    //     `${BACKEND_URL}/api/messages/${msg.id}/delete`,
    //     {
    //       method: "POST",
    //       headers: {
    //         Authorization: `Bearer ${token}`,
    //       },
    //     }
    //   );

    //   if (!response.ok) {
    //     throw new Error(`Get pins request failed: ${response.status}`);
    //   }

    //   const res = await response.json();
      
    //   await refreshLatest();
    // };
   
    const [isRecording, setIsRecording] = useState(false);
const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
const [audioChunks, setAudioChunks] = useState<BlobPart[]>([]);
const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // const recorder = new MediaRecorder(stream);
    const recorder = new MediaRecorder(stream);
    setAudioChunks([]);
    setAudioBlob(null);
    setIsRecording(true);
    setMediaRecorder(recorder);

    let chunks=[] as BlobPart[];
    recorder.ondataavailable = (event) => {
      // chunks = event.data;
      chunks.push(event.data);

    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/ogg' });
      setAudioBlob(blob);
      setIsRecording(false);
      setMediaRecorder(null);
      mediaRecorder?.stream.getTracks().forEach(track => track.stop());
    };
    
    setMediaRecorder(recorder);
    recorder.start();
    setIsRecording(true);
  } catch (err) {
    console.error('Error starting audio recording', err);
  }
};

const stopRecording = () => {
  if (mediaRecorder) {
    mediaRecorder.stop();
  }
};

const cancelAudio = () => {
  setAudioBlob(null);
};
const sendAudioMessage = async () => {
  if (!audioBlob) {
    console.error('No audio blob to send.');
    return;
  }
  if (!selectedChat) {
    console.error('No selected chat to send message.');
    return;
  }
  try {
    setIsSending(true)
    const audioFile = new File([audioBlob], "voice-message.ogg", { type: "audio/ogg" });
    if(!audioFile?.size)
    {
      console.error('Audio file is empty or invalid:', audioFile);
      return setIsSending(false);
    }
    console.log('Sending audio file:', audioFile, 'Is File:', audioFile instanceof File);
    await sendMediaToChat({chatId: selectedChat.id, file:audioFile, fileName:"voice-message.ogg"});
  
    await refreshLatest();
    scrollToBottom();
    setAudioBlob(null);
    setIsSending(false);
    setAudioChunks([]);
  } catch (error) {
    console.error('Failed to send voice message', error);
    setIsSending(false)

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


const clearAudio = () =>{
  setAudioBlob(null);
  setIsSending(false);
  setAudioChunks([]);

}

const linkify = (msg) => {
  const text = msg.message;
  if (!text) return null;

  // console.log("🔹 Original text:", text);
  // console.log("🔹 Mentions array:", msg.message.mentions);

  // 1. Replace <@12345> with @username
  const mentionRegex = /<@(\d+)>/g;
  let parsedText = text.replace(mentionRegex, (match, id) => {
    console.log("👉 Found mention:", match, "with id:", id);
    const mention = msg?.mentions?.find((m) => m.id === id);
    console.log("🔎 Matched mention object:", mention);
    return mention ? `@${mention.username}` : match; // fallback if not found
  });

  // console.log("✅ After mention replacement:", parsedText);

  // 2. Regex to find URLs
  const urlRegex = /(\bhttps?:\/\/[^\s]+)/g;

  // 3. Split text by URLs, preserving URLs
  const parts = parsedText.split(urlRegex);
  // console.log("🧩 Split parts:", parts);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      // console.log("🌐 Found URL:", part);
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline break-words"
        >
          {part}
        </a>
      );
    } else {
      // console.log("📄 Text part:", part);
      return part;
    }
  });
};


const jumpToReply=(msg)=>{
  // console.log('jump reply')
  console.log(msg)
  setSelectedMessageId(msg.replyToId)
}


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
              // Note: If you see "data-lov-id" warnings, it's likely from a browser extension
              <div key={date} className="date-group">
                <div className="flex items-center gap-2 my-4">
                  <hr className="flex-1 border-[#23272f]" />
                  <span className="text-xs text-[#ffffff32] px-2">{date}</span>
                  <hr className="flex-1 border-[#23272f]" />
                </div>
                {msgs.map((msg) => {
                  const globalIndex = messages.findIndex(
                    (m) => m.id === msg.id
                  );
                  const showUnreadDivider =
                    unreadStart >= 0 && globalIndex === unreadStart;
                  return (
                    <div
                      key={String(msg.id)}
                      id={`msg-${msg.telegramMessageId}`}
                      data-hasmedia={msg.hasMedia ? "true" : "false"}
                      data-msgid={msg.id}
                      // onMouseLeave={() => setOpenMenuId(null)}
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
                            {getPlatformFromChatId(selectedChat.id) ==
                              "discord" && (
                              <button
                                className="h-6 w-6 rounded-[6px] items-center justify-center duration-100 ease-in  flex hover:bg-[#3c3c3c] bg-[#2d2d2d] border border-[#ffffff03]"
                                title="Open in Discord"
                                onClick={(e) => {
                                  e.stopPropagation(); /* implement share logic */
                                }}
                              >
                                <FaDiscord className="text-[#ffffff] w-3 h-3" />
                              </button>
                            )}
                            {getPlatformFromChatId(selectedChat.id) ==
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
                                  className={`absolute right-0 ${
                                    menuPositions[String(msg.id)] ||
                                    "bottom-[110%]"
                                  } mt-2 bg-[#111111] border border-[#ffffff12] rounded-[10px] shadow-lg z-[9999] flex flex-col p-2 min-w-max`}
                                  // onMouseEnter={() => {
                                  //   setShowFiltersPopup(true);
                                  //   cancelFiltersPopupCloseTimer();
                                  //   if (filtersList.length === 0 && !isFetchingFilters) fetchFilters();
                                  // }}
                                  // onMouseLeave={startFiltersPopupCloseTimer}
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
                                  {/* <button className="flex gap-2 items-center justify-start rounded-[10px] px-4 py-2 text-left hover:bg-[#23272f] text-[#ffffff72] hover:text-white whitespace-nowrap">
                              <Plus
                                className="w-6 h-6"
                                stroke="currentColor"
                                fill="currentColor"
                              />
                              Add Tags
                            </button> */}
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
                              {selectedChat.name}
                            </span>
                            <span className="text-xs text-[#ffffff32]">
                              {/* {console.log('Raw msg.date:', msg.date, 'Type:', typeof msg.date)} */}
                              {formatTime(msg.date)}
                            </span>
                            {String(msg.id).startsWith("temp-") && (
                              <span className="text-xs text-[#84afff] italic">
                                sending...
                              </span>
                            )}
                          </div>
                          {msg.replyTo && (
                            <div className="cursor-pointer text-xs text-[#84afff] bg-[#23272f] rounded px-2 py-1 mb-1 mt-2" onClick={()=>jumpToReply(msg)}>
                              Replying to{" "}
                              <span className="font-semibold">
                                {msg.replyTo.name}:
                              </span>{" "}
                              <span className="text-[#ffffffb0]">
                                {msg.replyTo.message}
                                {/* {msg.replyTo.message.length > 40 ? "..." : ""} */}
                              </span>
                            </div>
                          )}
                          <div className="mt-1 text-sm text-[#e0e0e] break-words break-all whitespace-pre-wrap max-w-full">
                            {msg.media && selectedChat.platform !== "discord" && (
                              <>
                                {msg.media && (
                                  <>
                                    {(msg?.media?.content_type?.startsWith("image") ||msg?.media?.type?.startsWith("image")) && (
                                      <img
                                        src={msg.media.url}
                                        alt="media"
                                        style={{
                                          maxWidth: 320,
                                          cursor: "pointer",
                                        }}
                                        onClick={() => openMedia(msg.media)}
                                      />
                                    )}
                                    {msg.media.type.startsWith("video") && (
                                      <video
                                        src={msg.media.url}
                                        controls
                                        style={{
                                          maxWidth: 320,
                                          cursor: "pointer",
                                        }}
                                        onClick={() => openMedia(msg.media)}
                                      />
                                    )}
                                    {msg.media.type.includes("octet") && (
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
                                     {(msg.media.type.includes("audio") || msg.media.type.includes("ogg")) && (
                                      <AudioWaveform audioUrl={msg?.media?.url ?? null}/>
                                    )}
                                  </>
                                )}

                                {/* Modal Overlay */}
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
                                    {enlargedMedia.type.startsWith("image") && (
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
                                    {enlargedMedia.type.startsWith("video") && (
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
                            {linkify(msg)}
                            {/* {msg.hasLink && msg.link && (
                              <a
                                href={msg.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block mt-2 text-blue-500 hover:underline break-words"
                              >
                                {msg.link}
                              </a>
                            )} */}
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
                                  {r.icon || r.emoji}
                                  {typeof r.count === "number" ? " "+r.count : ""}
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
                    : // : selectedChat?.keywords !== undefined
                    // ? "Cannot attach files to smart filters"
                    isSending
                    ? "Please wait for current message to send"
                    : "Attach files"
                }
              >
                <Plus
                  className={`text-black bg-[#fafafa60] rounded-full mr-2 w-[18px] h-[18px] cursor-pointer ${
                    (selectedChat === "all-channels" && !replyTo) ||
                    // selectedChat?.keywords !== undefined ||
                    isSending
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-[#fafafa80]"
                  }`}
                  onClick={() => {
                    if (
                      (selectedChat === "all-channels" && !replyTo) ||
                      // selectedChat?.keywords !== undefined ||
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
                        onChange={async(e) => {const selectedFiles = Array.from(e.target.files || []);
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
  )
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
//       <div className="audio-preview">
// <audio
//         controls
//         src={audioUrl ?? undefined}
//         onEnded={() => console.log('audio ended')}
//         onError={() => console.error('audio playback error')}
//       />
//               <button onClick={sendAudioMessage}>Send</button>
//         <button onClick={cancelAudio}>Cancel</button>
//       </div>
<div className="flex gap-4 justify-stretch items-center w-full">
<LiveAudioWaveform barMaxHeight={50} cursorHeight={40} />
{audioBlob && !isRecording && <Trash2Icon onClick={clearAudio} className="cursor-pointer"/>}
</div>
    ) : (<>
              <textarea
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  replyTo && replyTo.name
                    ? `Replying to ${replyTo.name}...`
                    : selectedChat === "all-channels"
                    ? "Select a channel on the sidebar to send messages..."
                    : // : selectedChat?.keywords !== undefined
                      // ? "Cannot send messages to smart filters..."
                      "Type your message..."
                }
                disabled={
                  (selectedChat === "all-channels" && !replyTo) ||
                  // selectedChat?.keywords !== undefined ||
                  isSending
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
              </>)}
            </div>
            <button className="mx-2" onClick={() => setShowPicker((val) => !val)}>😊</button>
            {showPicker && (
              <div
                ref={pickerRef}
                style={{ position: "absolute", bottom: "40px", zIndex: 999 }}
              >
                <EmojiPicker theme="dark" onEmojiClick={handleEmojiClick} />
              </div>
            )}
            {!isRecording ? (
  <button onClick={startRecording} title="Start recording voice message"><MicIcon/></button>
) : (
  <button onClick={stopRecording} title="Stop recording and send"><StopCircle/></button>
)}

            <button
              onClick={audioBlob?sendAudioMessage:handleSend}
              disabled={
                (selectedChat === "all-channels" && !replyTo) ||
                // selectedChat?.keywords !== undefined ||
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
