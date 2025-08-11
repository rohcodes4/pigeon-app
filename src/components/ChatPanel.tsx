import React, { useEffect, useRef, useState, useMemo } from "react";
import { Button } from "./ui/button";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  GripVertical,
  MoreHorizontal,
  MoreVertical,
  Plus,
  Search,
  VolumeX,
  X,
} from "lucide-react";
import { Pin, PinOff } from "lucide-react";
import aiAll from "@/assets/images/aiAll.png";
import discord from "@/assets/images/discord.png";
import telegram from "@/assets/images/telegram.png";
import { FaBars, FaDiscord, FaTelegram, FaTelegramPlane } from "react-icons/fa";
// Helper to generate a random gravatar
const gravatarUrl = (seed: string) => {
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
};

// Helper to generate random chat data
const chatTypes = ["Group", "DM", "Server"] as const;
const platforms = ["Discord", "Telegram"] as const;
const sampleMessages = [
  "Hey, how are you? Hey, how are you? Hey, how are you? Hey, how are you? Hey, how are you?",
  "Let's catch up later.",
  "Don't forget the meeting.",
  "Check out this link!",
  "See you soon.",
  "Can you review this?",
  "Happy birthday!",
  "Congrats on the launch!",
  "Are you coming tonight?",
  "Thanks for your help!",
];

const ALL_CHANNELS = [
  { name: "All Channels", platform: ["telegram", "discord"] },
  { name: "sahil", platform: ["telegram"] },
  { name: "Portalcoin | $Portal", platform: ["discord"] },
  { name: "Alpha Guild", platform: ["discord"] },
  { name: "Crypto News", platform: ["telegram"] },
  // ...add more as needed
];

const TOP_ITEMS = ["All", "Unread", "Filtered Streams", "Telegram", "Discord"];
const INITIAL_BOTTOM_ITEMS = ["Alpha", "Airdrop", "Launch", "Sponsored"];

function randomFrom<T>(arr: readonly T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomTags() {
  // Each chat can have 0 to all tags
  return INITIAL_BOTTOM_ITEMS.filter(() => Math.random() < 0.5);
}

function randomTime() {
  const now = new Date();
  const minutesAgo = Math.floor(Math.random() * 1440); // up to 24 hours ago
  const date = new Date(now.getTime() - minutesAgo * 60000);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const chats = Array.from({ length: 30 }, (_, i) => {
  const type = randomFrom(chatTypes);
  const platform = randomFrom(platforms);
  const pinned = Math.random() < 0.1; // 10% pinned
  const read = Math.random() < 0.7; // 30% pinned
  const name = `${type === "DM" ? "User" : type} ${i + 1}`;
  return {
    id: i + 1,
    name,
    avatar: gravatarUrl(name + platform),
    type,
    platform,
    pinned,
    read,
    lastMessage: randomFrom(sampleMessages),
    time: randomTime(),
    tags: randomTags(),
  };
});

function parseTimeString(timeString: string) {
  // Handles "HH:MM AM/PM"
  const [time, modifier] = timeString.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (modifier && modifier.toLowerCase() === "pm" && hours !== 12) hours += 12;
  if (modifier && modifier.toLowerCase() === "am" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

// Sort all chats by time descending (latest first)
const chatsSortedByTime = [...chats].sort((a, b) => {
  return parseTimeString(b.time) - parseTimeString(a.time);
});
const sortedChats = [
  ...chatsSortedByTime.filter((chat) => chat.pinned),
  ...chatsSortedByTime.filter((chat) => !chat.pinned),
];

function formatChatTime(dateString: string) {
  const now = new Date();
  const chatDate = new Date(dateString); // Parse directly as a Date object

  // Handle invalid dates
  if (isNaN(chatDate.getTime())) {
    console.log("Invalid date string:", dateString);
    return "now";
  }

  const diffMs = now.getTime() - chatDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffDays === 0) {
    // Same day, show time
    return chatDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else if (diffDays === 1) {
    return "1d";
  } else if (diffDays < 7) {
    return `${diffDays}d`;
  } else if (diffWeeks < 4) {
    return `${diffWeeks}wk`;
  } else {
    return `${diffMonths}mo`;
  }
}

function useScrollArrows(ref: React.RefObject<HTMLDivElement>) {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = ref.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    checkScroll();
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
    // eslint-disable-next-line
  }, [ref.current]);

  // Also check on mount and when content changes
  useEffect(() => {
    checkScroll();
    // eslint-disable-next-line
  });

  return { canScrollLeft, canScrollRight, checkScroll };
}

interface ChatPanelProps {
  chats?: any[]; // Define the chats prop
  onChatSelect?: (chat: any) => void; // Chat selection handler
  selectedChat?: any; // Currently selected chat
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  chats = [],
  onChatSelect,
  selectedChat,
}) => {
  // Use fallback dummy data if no chats are provided for testing
  const displayChats = chats.length > 0 ? chats : sortedChats;
  const [isFocus, setIsFocus] = useState(false);
  const [filters, setFilters] = useState([]);
  const SCROLL_AMOUNT = 100; // px
  const topRowRef = useRef<HTMLDivElement>(null);
  const bottomRowRef = useRef<HTMLDivElement>(null);
  const topArrows = useScrollArrows(topRowRef);
  const bottomArrows = useScrollArrows(bottomRowRef);
  const [activeTopItem, setActiveTopItem] = useState(TOP_ITEMS[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState<string | number>("all-channels");
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [channelSearch, setChannelSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedChannels, setSelectedChannels] = useState([]);
  const [isFilteredStreamsOpen, setIsFilteredStreamsOpen] = useState(true);
  const [isChannelsOpen, setIsChannelsOpen] = useState(true);
  const [searchMore, setSearchMore] = useState(false);
  const [filterFull, setFilterFull] = useState(false);
  const [streamsExpanded, setStreamsExpanded] = useState(false);
  const [channelsExpanded, setChannelsExpanded] = useState(false);
  const [streamsLimit, setStreamsLimit] = useState(5);
  const [channelsLimit, setChannelsLimit] = useState(10);
  const hideScrollbar = "scrollbar-hide";

  const handleCancel = () => {
    setShowFilterPopup(false);
    setChannelSearch("");
    setSelectedChannels([]);
  };

  const handleSave = () => {
    // Do something with selectedChannels
    setShowFilterPopup(false);
  };

  useEffect(() => {
    if (channelSearch.trim() === "") {
      setSearchResults([]);
      return;
    }
    // Add null checks to prevent errors
    if (!displayChats || !Array.isArray(displayChats)) {
      setSearchResults([]);
      return;
    }
    setSearchResults(
      displayChats.filter(
        (ch) =>
          ch &&
          ch.name &&
          ch.name.toLowerCase().includes(channelSearch.toLowerCase())
      )
    );
  }, [channelSearch, displayChats]); // Add displayChats to dependency array

  // Reset limits when search term or filters change
  useEffect(() => {
    setStreamsLimit(5);
    setChannelsLimit(10);
  }, [searchTerm, filters]);

  const scroll = (
    ref: React.RefObject<HTMLDivElement>,
    dir: "left" | "right",
    checkScroll: () => void
  ) => {
    if (ref.current) {
      ref.current.scrollBy({
        left: dir === "left" ? -SCROLL_AMOUNT : SCROLL_AMOUNT,
        behavior: "smooth",
      });
      // Wait for scroll to finish, then check
      setTimeout(checkScroll, 300);
    }
  };

  const removeItem = (item: string) => {
    setFilters((prev) => prev.filter((i) => i !== item));
    setTimeout(bottomArrows.checkScroll, 300);
  };

  const addFilter = (item: string) => {
    if (!filters.includes(item)) {
      setFilters((prev) => [...prev, item]);
      // Reset limits when filters change
      setStreamsLimit(5);
      setChannelsLimit(10);
      setTimeout(bottomArrows.checkScroll, 300);
    }
  };

  // Sort all chats by time descending (latest first)
  const chatsSortedByTime = [...(displayChats || [])].sort((a, b) => {
    // For real chats (from API), prioritize chats with messages first
    if (chats.length > 0) {
      const aHasMessages =
        a?.unread > 0 || (a?.lastMessage && a.lastMessage.trim() !== "");
      const bHasMessages =
        b?.unread > 0 || (b?.lastMessage && b.lastMessage.trim() !== "");

      // If one has messages and the other doesn't, prioritize the one with messages
      if (aHasMessages && !bHasMessages) return -1;
      if (!aHasMessages && bHasMessages) return 1;

      // If both have same message status, sort by timestamp
      const aTime = a?.timestamp ? new Date(a.timestamp).getTime() : 0;
      const bTime = b?.timestamp ? new Date(b.timestamp).getTime() : 0;
      return bTime - aTime;
    } else {
      // For dummy data, use original sorting
      const aTime = a?.timestamp ? new Date(a.timestamp).getTime() : 0;
      const bTime = b?.timestamp ? new Date(b.timestamp).getTime() : 0;
      return bTime - aTime;
    }
  });

  const sortedDisplayChats = [
    ...chatsSortedByTime.filter((chat) => chat?.isPinned || chat?.pinned),
    ...chatsSortedByTime.filter((chat) => !chat?.isPinned && !chat?.pinned),
  ];

  const getFilteredChats = () => {
    let filtered = sortedDisplayChats;

    // Apply search term filter first
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (chat) =>
          chat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          chat.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (activeTopItem === "All") {
      // Changed from "Inbox" to "All" to match TOP_ITEMS
      filtered = filtered;
    }
    if (activeTopItem === "Telegram") {
      filtered = filtered.filter((chat) => chat.platform === "Telegram");
    }
    if (activeTopItem === "Discord") {
      filtered = filtered.filter((chat) => chat.platform === "Discord");
    }
    if (activeTopItem === "Unread") {
      filtered = filtered.filter((chat) => !chat.read);
    }

    if (filters.length > 0) {
      filtered = filtered.filter((chat) =>
        filters.every((tag) => chat.tags?.includes(tag))
      );
    }
    // Add more filters if needed
    return filtered;
  };

  // Separate filtering for filtered streams vs channels
  const getFilteredStreams = () => {
    let filtered = sortedDisplayChats;

    // Apply search term filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (chat) =>
          chat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          chat.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply top item filters
    if (activeTopItem === "Telegram") {
      filtered = filtered.filter((chat) => chat.platform === "Telegram");
    }
    if (activeTopItem === "Discord") {
      filtered = filtered.filter((chat) => chat.platform === "Discord");
    }
    if (activeTopItem === "Unread") {
      filtered = filtered.filter((chat) => !chat.read);
    }

    // Apply tag filters
    if (filters.length > 0) {
      filtered = filtered.filter((chat) =>
        filters.every((tag) => chat.tags?.includes(tag))
      );
    }

    return filtered;
  };

  const getFilteredChannels = () => {
    let filtered = sortedDisplayChats;

    // Apply search term filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (chat) =>
          chat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          chat.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply top item filters
    if (activeTopItem === "Telegram") {
      filtered = filtered.filter((chat) => chat.platform === "Telegram");
    }
    if (activeTopItem === "Discord") {
      filtered = filtered.filter((chat) => chat.platform === "Discord");
    }
    if (activeTopItem === "Unread") {
      filtered = filtered.filter((chat) => !chat.read);
    }

    // Apply tag filters
    if (filters.length > 0) {
      filtered = filtered.filter((chat) =>
        filters.every((tag) => chat.tags?.includes(tag))
      );
    }

    return filtered;
  };

  // Memoize filtered results to avoid unnecessary recalculations
  const allFilteredChats = useMemo(
    () => getFilteredChats(),
    [sortedDisplayChats, searchTerm, activeTopItem, filters]
  );

  const filteredStreams = useMemo(
    () => getFilteredStreams(),
    [sortedDisplayChats, searchTerm, activeTopItem, filters]
  );

  const channels = useMemo(
    () => getFilteredChannels(),
    [sortedDisplayChats, searchTerm, activeTopItem, filters]
  );

  // Show more streams when searching or when filters are applied
  const displayStreams =
    searchTerm.trim() || filters.length > 0
      ? filteredStreams
      : filteredStreams.slice(0, streamsLimit); // Use dynamic limit

  // Show more channels when searching or when filters are applied
  const displayChannels =
    searchTerm.trim() || filters.length > 0
      ? channels
      : channels.slice(0, channelsLimit); // Use dynamic limit

  if (filterFull) {
    return (
      <aside className="h-[calc(100vh-73px)] w-[350px] p-3 pl-0 flex flex-col border-r border-[#23272f] bg-[#111111]">
        {/* Header */}
        <div className="flex justify-between items-center mb-2 pb-3 border-b">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setFilterFull(false)}
          >
            <ChevronLeft className="text-white w-4 h-4" />
            <span className="text-white">Filters</span>
          </div>
          <Plus className="text-white w-4 h-4" />
        </div>

        {/* Built-in Filters */}
        <div className="px-2 mb-4">
          <span className="text-[#ffffff80] text-sm">Built-in Filters</span>
          <div className="mt-2">
            {TOP_ITEMS.map((filter) => (
              <div
                key={filter}
                className="flex justify-between items-center p-2 hover:bg-[#2d2d2d] rounded-[10px] cursor-pointer"
              >
                <span className="text-white">{filter}</span>
                <GripVertical className="text-white w-4 h-4" />
              </div>
            ))}
          </div>
        </div>

        {/* Filtered Streams */}
        <div className="px-2 mb-4">
          <span className="text-[#ffffff80] text-sm">Filtered Streams</span>
          <div className="mt-2">
            {[
              // This is dummy data, should be fetched if needed
              "Shitcoin Alpha",
              "NFT Updates",
              "General Banter",
              "Custom Filter",
              "Custom Filter",
            ].map((stream, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-2 hover:bg-[#2d2d2d] rounded cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[#3474ff] text-white text-xs">
                    {stream
                      .split(" ")
                      .map((word) => word[0])
                      .join("")}
                  </span>
                  <span className="text-white">{stream}</span>
                </div>
                <MoreHorizontal className="text-white w-4 h-4" />
              </div>
            ))}
          </div>
        </div>

        {/* Smart Labels */}
        <div className="px-2 mb-4">
          <span className="text-[#ffffff80] text-sm">Smart Labels</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              // This is dummy data, should be fetched if needed
              "zkSync",
              "Jameson",
              "Shitcoin 1",
              "Contract",
              "Filters 1",
              "Filters 1",
            ].map((label, index) => (
              <div
                key={index}
                className="flex items-center gap-1 text-white text-xs px-2 py-1 rounded-full cursor-pointer"
              >
                {label} <span className="text-[#ffffff80] text-lg">×</span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="h-[calc(100vh-73px)] w-[350px] p-3 pl-0 flex flex-col border-r border-[#23272f] bg-[#111111]">
      <Button
        variant="ghost"
        onClick={() => setIsFocus(!isFocus)}
        className={`ml-3 bg-[#171717] rounded-[8px] ${
          isFocus ? "text-[#5389ff]" : "text-[#FFFFFF32]"
        } p-0 `}
      >
        <Eye /> Focus Mode
      </Button>
      {/* Search Bar */}
      <div className="flex items-center gap-2 pl-3 ">
        <div className="relative flex grow items-center bg-[#212121] py-2 px-4 rounded-[12px] mt-4">
          <Search className="w-5 h-5 text-[#ffffff48] absolute left-2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search"
            className="bg-transparent outline-none text-white flex-1 placeholder:text-[#ffffff48] pl-8 pr-8"
          />
          {searchTerm && (
            <button
              className="absolute right-2 text-[#ffffff48] hover:text-white"
              onClick={() => setSearchTerm("")}
              tabIndex={-1}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="mt-4 flex-1">
          <div className="relative">
            <button
              onClick={() => setSearchMore((open) => !open)}
              className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[#23262F]"
            >
              <MoreVertical className="h-full w-4 text-[#5389ff]" />
            </button>
            {searchMore && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setSearchMore(false)}
                  style={{ background: "transparent" }}
                />

                <div className="bg-[#171717] rounded-lg p-4 shadow-lg w-72 absolute right-[40px] -top-[15px] z-50 rounded-[10px]">
                  <div
                    className="flex items-center gap-2 p-2 hover:bg-[#fafafa10] rounded-[10px] cursor-pointer"
                    onClick={() => {
                      setSearchMore(false);
                      setFilterFull(true);
                    }}
                  >
                    <Filter className="text-[#ffffff] hover:text-[#5389ff] w-4 h-4" />
                    <span className="text-white">Filters</span>
                  </div>
                  <div
                    className="flex items-center gap-2 p-2 hover:bg-[#fafafa10] rounded-[10px] cursor-pointer"
                    onClick={() => setSearchMore(false)}
                  >
                    <Check className="text-[#ffffff] hover:text-[#5389ff] w-4 h-4" />
                    <span className="text-white">Read All</span>
                  </div>
                  <div
                    className="flex items-center gap-2 p-2 hover:bg-[#fafafa10] rounded-[10px] cursor-pointer"
                    onClick={() => setSearchMore(false)}
                  >
                    <VolumeX className="text-[#ffffff] hover:text-[#5389ff] w-4 h-4" />
                    <span className="text-white">Mute all Channels</span>
                  </div>
                </div>
              </>
            )}
          </div>{" "}
        </div>
      </div>
      {/* Top Row  */}
      <div className=" pl-3  relative flex items-center mt-6">
        {topArrows.canScrollLeft && (
          <button
            className="absolute left-0 z-10  p-1 rounded-full shadow"
            onClick={() => scroll(topRowRef, "left", topArrows.checkScroll)}
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
        )}
        <div
          ref={topRowRef}
          className={`flex gap-2 overflow-x-auto no-scrollbar mx-0`}
          style={{ scrollBehavior: "smooth" }}
        >
          {TOP_ITEMS.map((item) => (
            <div
              key={item}
              onClick={() => setActiveTopItem(item)}
              className={`px-4 py-2 rounded-full whitespace-nowrap cursor-pointer hover:text-white text-[13px] transition ${
                activeTopItem === item
                  ? "text-white bg-[#3474ff60]"
                  : "text-[#FFFFFF48]"
              }`}
            >
              {item}
            </div>
          ))}
        </div>
        {topArrows.canScrollRight && (
          <button
            className="absolute right-0 z-10  p-1 rounded-full shadow"
            onClick={() => scroll(topRowRef, "right", topArrows.checkScroll)}
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        )}
      </div>
      {/* Bottom row */}
      <div className="pl-3 relative flex items-center mt-4">
        {bottomArrows.canScrollLeft && (
          <button
            className="absolute left-0 z-10  p-1 rounded-full shadow"
            onClick={() =>
              scroll(bottomRowRef, "left", bottomArrows.checkScroll)
            }
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
        )}
        <div
          ref={bottomRowRef}
          className={`flex gap-2 overflow-x-auto no-scrollbar`}
          style={{ scrollBehavior: "smooth" }}
        >
          {filters.map((item) => (
            <div
              key={item}
              className="flex items-center px-2 py-1 text-[#84afff] text-[13px] border-2 border-[#3474ff24] bg-[#212121] rounded-full whitespace-nowrap"
            >
              <span>{item}</span>
              <button
                className="ml-2"
                onClick={() => removeItem(item)}
                aria-label={`Remove ${item}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        {bottomArrows.canScrollRight && (
          <button
            className="absolute right-0 z-10 p-1 shadow bg-[#00000020]"
            onClick={() =>
              scroll(bottomRowRef, "right", bottomArrows.checkScroll)
            }
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        )}
      </div>
      {/* Hide scrollbar utility (Tailwind plugin or custom CSS) */}
      <style>
        {`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
      //       .selected-chat::before {
      //   content: "";
      //   position: absolute;
      //   left: -12px;
      //   top: 12px;
      //   bottom: 12px;
      //   width: 4px;
      //   border-top-right-radius: 4px;
      //   border-bottom-right-radius: 4px;
      //   background: #3474ff;
      //   display: block;
      // }
      //       .unread-chat::before {
      //   content: "";
      //   position: absolute;
      //   left: -16px;
      //   top: 50%;
      //   transform: translateY(-50%);
      //   bottom: 12px;
      //   width: 8px;
      //   height:8px;
      //   border-radius: 100%;
      //   background: #3474ff;
      //   display: block;
      // }
        `}
      </style>

      {/* Available Filter Tags */}
      <div className="pl-3 mt-4">
        <div className="flex flex-wrap gap-2">
          {INITIAL_BOTTOM_ITEMS.map((tag) => (
            <button
              key={tag}
              onClick={() => addFilter(tag)}
              className={`px-3 py-1 text-xs rounded-full cursor-pointer transition ${
                filters.includes(tag)
                  ? "bg-[#3474ff] text-white"
                  : "bg-[#212121] text-[#ffffff80] hover:bg-[#2d2d2d] hover:text-white"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Chat List */}
      <div className="pl-3 h-min flex-1 overflow-y-scroll overflow-x-visible mt-2 no-scrollbar">
        <button
          className={`w-full flex items-center gap-3 px-4 py-3 transition relative rounded-[10px] ${
            selectedId === "all-channels"
              ? "bg-[#212121] selected-chat"
              : "hover:bg-[#212121] focus:bg-[#212121]"
          }`}
          onClick={() => {
            setSelectedId("all-channels");
            if (onChatSelect) {
              onChatSelect("all-channels");
            }
          }}
        >
          {/* Avatar */}
          <img
            src={aiAll}
            className="w-10 h-10 rounded-full object-cover"
            loading="lazy"
            decoding="async"
          />
          {/* Chat Info */}
          <div className="flex-1 text-left">
            <div className="flex justify-between items-center">
              <span className="text-[#fafafa] font-200 flex justify-between items-center w-full">
                <div className="flex items-center gap-1 font-[200]">
                  <FaDiscord className="text-[#7B5CFA]" />
                  <FaTelegramPlane className="text-[#3474FF]" />
                  All Channels
                </div>
                <div className="text-[#fafafa60] text-xs">
                  {displayChats.length > 0 && displayChats[0]?.timestamp
                    ? formatChatTime(displayChats[0].timestamp)
                    : "now"}
                </div>
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* You can add more badges here if needed */}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#fafafa] font-[200] truncate max-w-[170px]">
                {displayChats.length > 0 && displayChats[0]?.lastMessage
                  ? displayChats[0].lastMessage.length > 50
                    ? displayChats[0].lastMessage.slice(0, 50) + "..."
                    : displayChats[0].lastMessage
                  : "No messages yet"}
              </span>
            </div>
          </div>
        </button>
        {/* {getFilteredChats().map((chat) => (
    <button
      key={chat.id}
      className={
        `w-full flex items-center gap-3 px-4 py-3 transition relative rounded-[10px] ` +
        (selectedId === chat.id
          ? "bg-[#212121] selected-chat "
          : "hover:bg-[#212121] focus:bg-[#212121] ") +
        (selectedId !== chat.id && !chat.read ? "unread-chat " : "")
      }
      onClick={() => setSelectedId(chat.id)}
    >
      <div className="relative">
  <img
    src={chat.avatar}
    alt={chat.name}
    className="w-10 h-10 rounded-full object-cover"
  />
  <img
    src={chat.platform === "Discord" ? discord : telegram}
    className={`
      absolute -bottom-2 -right-1
      ${chat.platform === "Discord" ? "bg-[#7b5cfa]" : "bg-[#3474ff]"}
      rounded-[4px] w-5 h-5 p-1 border-2 border-[#111111]
    `}n    alt={chat.platform}
  />
</div>
      <div className="flex-1 text-left">
        <div className="flex justify-between items-center">
          <span className="text-[#ffffff48] font-200 flex items-center gap-1">
{chat.platform === "Discord" ? <FaDiscord className="text-[#7b5cfa]"/> : <FaTelegramPlane className="text-[#3474ff]"/>}
            {chat.name}
          </span>
          
        </div>
        <div className="flex items-center gap-2">
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-[#ffffff32] font-100">
            {chat.lastMessage.length > 50
              ? chat.lastMessage.slice(0, 50) + "..."
              : chat.lastMessage}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-center gap-1">
            {chat.pinned && (
              <Pin className="w-3 h-3 text-[#84afff] fill-[#84afff] ml-1" />
            )}
            <span className="text-xs text-gray-400">
              {formatChatTime(chat.time)}
            </span>
          </div>
    </button>
  ))} */}

        {/* Filtered Streams Section */}
        <div className="pl-3 mt-4">
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setIsFilteredStreamsOpen(!isFilteredStreamsOpen)}
          >
            <span className="text-white font-medium">Filtered Streams</span>
            <div className="flex">
              <Plus
                className="hover:text-white text-[#fafafa60] w-5 h-5"
                onClick={() => setShowFilterPopup(!showFilterPopup)}
              />
              {isFilteredStreamsOpen ? (
                <ChevronDown className="hover:text-white text-[#fafafa60] w-5 h-5" />
              ) : (
                <ChevronRight className="hover:text-white text-[#fafafa60] w-5 h-5" />
              )}
              {showFilterPopup && (
                <>
                  {/* Backdrop for outside click */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowFilterPopup(false)}
                    style={{ background: "transparent" }}
                  />
                  {/* Popup */}
                  <div className="absolute left-[20%] top-[20%] mt-2 z-50 w-[400px] bg-[#161717] border border-[#fafafa10] rounded-xl shadow-lg p-5">
                    {/* --- Popup content below --- */}
                    <div className="text-white text-base font-[200] mb-1">
                      Create Filtered Streams
                    </div>
                    <div className="text-xs text-[#ffffff80] mb-3">
                      Give your stream a descriptive name so you can find it
                      later.
                    </div>
                    <input
                      className="w-full bg-[#fafafa10] rounded-[8px] px-3 py-2 mb-3 text-sm text-white outline-none"
                      placeholder="Filter Name"
                    />
                    <div className="text-xs text-[#ffffff80] mb-1">
                      Select Channels
                    </div>
                    <div className="flex items-center rounded-[8px]  px-3 py-2 mb-2">
                      <Search className="w-4 h-4 text-[#ffffff80] mr-2" />
                      <input
                        className="flex-1 bg-transparent outline-none text-white text-sm"
                        placeholder="Channel Name"
                        value={channelSearch}
                        onChange={(e) => setChannelSearch(e.target.value)}
                      />
                      {channelSearch && (
                        <button
                          className="ml-2 text-[#ffffff80]"
                          onClick={() => setChannelSearch("")}
                          aria-label="Clear search"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    {
                      <div className="max-h-32 overflow-y-auto mb-2">
                        {searchResults.length === 0 ? (
                          <div className="text-xs text-[#ffffff80] px-3 py-2">
                            No results found.
                          </div>
                        ) : (
                          searchResults.map((ch, idx) => (
                            <div
                              key={ch.name + idx}
                              className="flex items-center gap-2 hover:bg-[#ffffff10] rounded-[10px] px-3 py-2 mb-1 cursor-pointer"
                              onClick={() => {
                                if (
                                  !selectedChannels.some(
                                    (sel) => sel.name === ch.name
                                  )
                                ) {
                                  setSelectedChannels([
                                    ...selectedChannels,
                                    ch,
                                  ]);
                                }
                              }}
                            >
                              {/* Platform icons */}
                              <span className="flex gap-1">
                                {ch.platform === "Telegram" && (
                                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[#3474ff]">
                                    <img
                                      src={telegram}
                                      className="w-4 h-4"
                                      alt="Telegram"
                                    />
                                  </span>
                                )}
                                {ch.platform === "Discord" && (
                                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[#7B5CFA]">
                                    <img
                                      src={discord}
                                      className="w-4 h-4"
                                      alt="Discord"
                                    />
                                  </span>
                                )}
                              </span>
                              <span className="text-white text-sm">
                                {ch.name}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    }

                    {selectedChannels.length > 0 && (
                      <div className="mb-2 max-h-32 overflow-y-auto">
                        {selectedChannels.map((ch, idx) => (
                          <div
                            key={ch.name + idx}
                            className="flex items-center gap-2 hover:bg-[#ffffff10] rounded px-3 py-2 mb-1"
                          >
                            <span className="flex gap-1">
                              {ch.platform === "Telegram" && (
                                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[#3474ff]">
                                  <img
                                    src={telegram}
                                    className="w-4 h-4"
                                    alt="Telegram"
                                  />
                                </span>
                              )}
                              {ch.platform === "Discord" && (
                                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[#7B5CFA]">
                                  <img
                                    src={discord}
                                    className="w-4 h-4"
                                    alt="Discord"
                                  />
                                </span>
                              )}
                            </span>
                            <span className="text-white text-sm">
                              {ch.name}
                            </span>
                            <button
                              className="ml-auto text-[#ffffff80]"
                              onClick={() =>
                                setSelectedChannels(
                                  selectedChannels.filter(
                                    (sel) => sel.name !== ch.name
                                  )
                                )
                              }
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Filter row */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <select className="bg-[#fafafa10] rounded-[8px] px-3 py-2 text-sm text-white w-full">
                        <option value="contains">Contains</option>
                        <option value="not_contains">Does Not Contain</option>
                        <option value="equals">Equals</option>
                        <option value="not_equals">Does Not Equal</option>
                        <option value="starts_with">Starts With</option>
                        <option value="ends_with">Ends With</option>
                      </select>
                      <div className="flex bg-[#fafafa10] rounded-[8px] overflow-hidden w-full">
                        <input
                          className="flex-1 bg-[#fafafa10] px-3 py-2 text-white outline-none"
                          placeholder="Keyword"
                        />
                        <button className="flex-shrink-0 text-white px-3 py-2">
                          +
                        </button>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex justify-between">
                      <button
                        className="text-[#ffffff80] px-4 py-2 rounded hover:bg-[#23262F]"
                        onClick={handleCancel}
                      >
                        Cancel
                      </button>
                      <button
                        className="bg-[#2563eb] text-white px-8 py-2 rounded hover:bg-[#1d4ed8]"
                        onClick={handleSave}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          {isFilteredStreamsOpen && (
            <div className="mt-2">
              {displayStreams.length === 0 && searchTerm.trim() ? (
                <div className="text-[#ffffff48] text-sm px-4 py-3">
                  No channels found for "{searchTerm}"
                </div>
              ) : (
                displayStreams.map((chat) => (
                  <button
                    key={chat.id}
                    className={
                      `w-full flex items-center gap-3 px-4 py-3 transition relative rounded-[10px] ` +
                      (selectedId === chat.id
                        ? "bg-[#212121] selected-chat "
                        : "hover:bg-[#212121] focus:bg-[#212121] ") +
                      (selectedId !== chat.id && !chat.read
                        ? "unread-chat "
                        : "")
                    }
                    onClick={() => {
                      setSelectedId(chat.id);
                      if (onChatSelect) {
                        onChatSelect(chat);
                      }
                    }}
                  >
                    {/* Avatar */}
                    <div className="relative">
                      <img
                        src={gravatarUrl(chat.name || "User")}
                        alt={chat.name}
                        className="w-10 h-10 rounded-full object-cover"
                        loading="lazy"
                        decoding="async"
                        onLoad={(e) => {
                          // Only try to load real photo after gravatar loads and after a delay
                          if (chat.photo_url) {
                            setTimeout(() => {
                              const img = new Image();
                              img.onload = () => {
                                const target = e.target as HTMLImageElement;
                                if (target) {
                                  target.src = chat.photo_url;
                                }
                              };
                              img.onerror = () => {
                                // Keep gravatar if photo fails
                                console.log(
                                  `Photo failed to load for ${chat.name}:`,
                                  chat.photo_url
                                );
                              };
                              img.src = chat.photo_url;
                            }, 100); // 100ms delay to prevent blocking
                          }
                        }}
                      />
                      <img
                        src={chat.platform === "Discord" ? discord : telegram}
                        className={`
                           absolute -bottom-2 -right-1
                           ${
                             chat.platform === "Discord"
                               ? "bg-[#7b5cfa]"
                               : "bg-[#3474ff]"
                           }
                           rounded-[4px] w-5 h-5 p-1 border-2 border-[#111111]
                         `}
                        alt={chat.platform}
                      />
                    </div>
                    {/* Chat Info */}
                    <div className="flex-1 text-left">
                      <div className="flex justify-between items-center">
                        <span className="text-[#ffffff48] font-200 flex items-center gap-1">
                          {chat.platform === "Discord" ? (
                            <FaDiscord className="text-[#7b5cfa]" />
                          ) : (
                            <FaTelegramPlane className="text-[#3474ff]" />
                          )}
                          {chat.name}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#ffffff32] font-100">
                          {chat.lastMessage?.length > 23 // Use optional chaining for lastMessage
                            ? chat.lastMessage.slice(0, 23) + "..."
                            : chat.lastMessage}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="self-end text-xs text-gray-400">
                        {formatChatTime(chat.time)}
                      </span>
                      <div className="flex items-center gap-1">
                        {chat.pinned && (
                          <Pin className="w-5 h-5 text-transparent fill-[#fafafa60] ml-1" />
                        )}
                        {!chat.read && (
                          <div
                            className={`rounded-full w-5 h-5 text-xs flex items-center justify-center text-center bg-[#fafafa60] text-black`}
                          >
                            7
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}

              {/* Show More button when there are more streams */}
              {!searchTerm.trim() &&
                filters.length === 0 &&
                streamsLimit < filteredStreams.length && (
                  <button
                    className="w-full text-center py-2 text-[#84afff] hover:text-white text-sm"
                    onClick={() =>
                      setStreamsLimit((prev) =>
                        Math.min(prev + 20, filteredStreams.length)
                      )
                    }
                  >
                    Show {Math.min(20, filteredStreams.length - streamsLimit)}{" "}
                    more...
                  </button>
                )}

              {/* Show Less button when streams are expanded */}
              {!searchTerm.trim() &&
                filters.length === 0 &&
                streamsLimit > 5 && (
                  <button
                    className="w-full text-center py-2 text-[#84afff] hover:text-white text-sm"
                    onClick={() => setStreamsLimit(5)}
                  >
                    Show Less
                  </button>
                )}
            </div>
          )}
        </div>

        {/* Channels Section - Only show when no filters/search */}
        {!searchTerm.trim() && filters.length === 0 && (
          <div className="pl-3 mt-4">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => setIsChannelsOpen(!isChannelsOpen)}
            >
              <span className="text-white font-medium">Channels</span>
              {isChannelsOpen ? (
                <ChevronDown className="hover:text-white text-[#fafafa60] w-5 h-5 " />
              ) : (
                <ChevronRight className="hover:text-white text-[#fafafa60] w-5 h-5" />
              )}
            </div>
            {isChannelsOpen && (
              <div className="mt-2">
                {displayChannels.length === 0 && searchTerm.trim() ? (
                  <div className="text-[#ffffff48] text-sm px-4 py-3">
                    No channels found for "{searchTerm}"
                  </div>
                ) : (
                  displayChannels.map((chat) => (
                    <button
                      key={chat.id}
                      className={
                        `w-full flex items-center gap-3 px-4 py-3 transition relative rounded-[10px] ` +
                        (selectedId === chat.id
                          ? "bg-[#212121] selected-chat "
                          : "hover:bg-[#212121] focus:bg-[#212121] ") +
                        (selectedId !== chat.id && !chat.read
                          ? "unread-chat "
                          : "")
                      }
                      onClick={() => {
                        setSelectedId(chat.id);
                        if (onChatSelect) {
                          onChatSelect(chat);
                        }
                      }}
                    >
                      {/* Avatar */}
                      <div className="relative">
                        <img
                          src={gravatarUrl(chat.name || "User")}
                          alt={chat.name || "User"}
                          className="w-10 h-10 rounded-full object-cover"
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            console.log(
                              `Gravatar failed to load for ${chat.name}`
                            );
                          }}
                          onLoad={(e) => {
                            // Only try to load real photo after gravatar loads and after a delay
                            if (chat.photo_url) {
                              setTimeout(() => {
                                const img = new Image();
                                img.onload = () => {
                                  const target = e.target as HTMLImageElement;
                                  if (target) {
                                    target.src = chat.photo_url;
                                  }
                                };
                                img.onerror = () => {
                                  // Keep gravatar if photo fails
                                  console.log(
                                    `Photo failed to load for ${chat.name}:`,
                                    chat.photo_url
                                  );
                                };
                                img.src = chat.photo_url;
                              }, 100); // 100ms delay to prevent blocking
                            }
                          }}
                        />
                        <img
                          src={chat.platform === "Discord" ? discord : telegram}
                          className={`
                absolute -bottom-2 -right-1
                ${chat.platform === "Discord" ? "bg-[#7b5cfa]" : "bg-[#3474ff]"}
                rounded-[4px] w-5 h-5 p-1 border-2 border-[#111111]
              `}
                          alt={chat.platform}
                        />
                      </div>
                      {/* Chat Info */}
                      <div className="flex-1 text-left">
                        <div className="flex justify-between items-center">
                          <span className="text-[#ffffff48] font-200 flex items-center gap-1">
                            {chat.platform === "Discord" ? (
                              <FaDiscord className="text-[#7b5cfa]" />
                            ) : (
                              <FaTelegramPlane className="text-[#3474ff]" />
                            )}
                            {chat.name}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-[#ffffff32] font-100">
                            {chat.lastMessage?.length > 23 // Use optional chaining for lastMessage
                              ? chat.lastMessage.slice(0, 23) + "..."
                              : chat.lastMessage}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <span className="self-end text-xs text-gray-400">
                          {formatChatTime(chat.timestamp)}
                        </span>
                        <div className="flex items-center gap-1">
                          {chat.pinned && (
                            <Pin className="w-5 h-5 text-transparent fill-[#fafafa60] ml-1" />
                          )}
                          {!chat.read && chat.unread && chat.unread > 0 && (
                            <div
                              className={`rounded-full w-5 h-5 text-xs flex items-center justify-center text-center ${
                                chat.platform === "Telegram"
                                  ? "bg-[#3474ff]"
                                  : "bg-[#7b5cfa]"
                              }`}
                            >
                              {chat.unread}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}

                {/* Show More button for channels */}
                {!searchTerm.trim() &&
                  filters.length === 0 &&
                  channelsLimit < channels.length && (
                    <button
                      className="w-full text-center py-2 text-[#84afff] hover:text-white text-sm"
                      onClick={() =>
                        setChannelsLimit((prev) =>
                          Math.min(prev + 20, channels.length)
                        )
                      }
                    >
                      Show {Math.min(20, channels.length - channelsLimit)} more
                      channels...
                    </button>
                  )}

                {/* Show Less button when channels are expanded */}
                {!searchTerm.trim() &&
                  filters.length === 0 &&
                  channelsLimit > 10 && (
                    <button
                      className="w-full text-center py-2 text-[#84afff] hover:text-white text-sm"
                      onClick={() => setChannelsLimit(10)}
                    >
                      Show Less
                    </button>
                  )}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

export default ChatPanel;
