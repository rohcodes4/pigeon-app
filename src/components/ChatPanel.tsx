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
import ChatAvatar from "./ChatAvatar";
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
  const [smartFilters, setSmartFilters] = useState<any[]>([]);
  const [editingFilter, setEditingFilter] = useState<any>(null);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  const [filterError, setFilterError] = useState<string | null>(null);
  const hideScrollbar = "scrollbar-hide";

  useEffect(() => {
    const loadFilters = async () => {
      try {
        setIsLoadingFilters(true);
        setFilterError(null);
        const filters = await getSmartFilters();
        setSmartFilters(filters);
        console.log("Loaded smart filters:", filters);
      } catch (error) {
        console.error("Error loading filters:", error);
        setFilterError(
          error instanceof Error ? error.message : "Failed to load filters"
        );
      } finally {
        setIsLoadingFilters(false);
      }
    };

    loadFilters();
  }, []);

  // Update your handleSave function to actually create the filter:
  const handleSave = async () => {
    const filterNameInput = document.querySelector(
      'input[placeholder="Filter Name"]'
    ) as HTMLInputElement;
    const keywordInput = document.querySelector(
      'input[placeholder="Keyword"]'
    ) as HTMLInputElement;

    if (!filterNameInput?.value.trim()) {
      alert("Please enter a filter name");
      return;
    }

    try {
      const newFilter = await createSmartFilter({
        name: filterNameInput.value,
        channels: selectedChannels.map((ch) => ch.id), // Assuming channels have id property
        keywords: keywordInput?.value ? [keywordInput.value] : [],
      });

      // Add the new filter to the list
      setSmartFilters((prev) => [...prev, newFilter]);

      // Close popup and reset form
      setShowFilterPopup(false);
      setSelectedChannels([]);
      setChannelSearch("");

      console.log("Filter created successfully:", newFilter);
    } catch (error) {
      console.error("Error creating filter:", error);
      alert("Failed to create filter. Please try again.");
    }
  };

  const updateSmartFilter = async (
    filterId: string,
    filterData: {
      name?: string;
      channels?: number[];
      keywords?: string[];
    }
  ) => {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
    const token = localStorage.getItem("access_token");

    const formData = new FormData();
    if (filterData.name) formData.append("name", filterData.name);
    if (filterData.channels)
      formData.append("channels", filterData.channels.join(","));
    if (filterData.keywords)
      formData.append("keywords", filterData.keywords.join("\n"));

    const response = await fetch(`${BACKEND_URL}/filters/${filterId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to update filter: ${response.status}`);
    }

    return response.json();
  };

  const handleEdit = (filter: any) => {
    setEditingFilter(filter);
    setShowEditPopup(true);
  };

  const handleDelete = async (filterId: string) => {
    if (!confirm("Are you sure you want to delete this filter?")) {
      return;
    }

    try {
      await deleteSmartFilter(filterId);
      setSmartFilters((prev) => prev.filter((f) => f.id !== filterId));
      console.log("Filter deleted successfully");
    } catch (error) {
      console.error("Error deleting filter:", error);
      alert("Failed to delete filter. Please try again.");
    }
  };

  const handleEditSave = async () => {
    const filterNameInput = document.querySelector(
      'input[placeholder="Edit Filter Name"]'
    ) as HTMLInputElement;
    const keywordInput = document.querySelector(
      'input[placeholder="Edit Keywords"]'
    ) as HTMLInputElement;

    if (!filterNameInput?.value.trim()) {
      alert("Please enter a filter name");
      return;
    }

    try {
      const updatedFilter = await updateSmartFilter(editingFilter.id, {
        name: filterNameInput.value,
        channels: selectedChannels.map((ch) => ch.id),
        keywords: keywordInput?.value
          ? keywordInput.value.split(",").map((k) => k.trim())
          : editingFilter.keywords,
      });

      // Update the filter in the list
      setSmartFilters((prev) =>
        prev.map((f) => (f.id === editingFilter.id ? updatedFilter : f))
      );

      // Close popup and reset form
      setShowEditPopup(false);
      setEditingFilter(null);
      setSelectedChannels([]);

      console.log("Filter updated successfully:", updatedFilter);
    } catch (error) {
      console.error("Error updating filter:", error);
      alert("Failed to update filter. Please try again.");
    }
  };

  const handleEditCancel = () => {
    setShowEditPopup(false);
    setEditingFilter(null);
    setSelectedChannels([]);
  };

  const deleteSmartFilter = async (filterId: string) => {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
    const token = localStorage.getItem("access_token");

    const response = await fetch(`${BACKEND_URL}/filters/${filterId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete filter: ${response.status}`);
    }

    return response.json();
  };

  const createSmartFilter = async (filterData: {
    name: string;
    channels: number[];
    keywords: string[];
  }) => {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
    const token = localStorage.getItem("access_token");

    const formData = new FormData();
    formData.append("name", filterData.name);
    formData.append("channels", filterData.channels.join(","));
    formData.append("keywords", filterData.keywords.join("\n"));

    const response = await fetch(`${BACKEND_URL}/filters`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to create filter: ${response.status}`);
    }

    return response.json();
  };

  // API function to get all smart filters
  const getSmartFilters = async () => {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
    const token = localStorage.getItem("access_token");

    const response = await fetch(`${BACKEND_URL}/filters`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch filters: ${response.status}`);
    }

    return response.json();
  };

  const handleCancel = () => {
    setShowFilterPopup(false);
    setChannelSearch("");
    setSelectedChannels([]);
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
      <aside className="h-[calc(100vh-73px)] w-[350px] p-3 pl-0 flex flex-col flex-shrink-0 border-r border-[#23272f] bg-[#111111]">
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
            {isLoadingFilters ? (
              <div className="text-[#ffffff80] text-sm p-2">
                Loading filters...
              </div>
            ) : filterError ? (
              <div className="text-red-400 text-sm p-2">
                Error: {filterError}
              </div>
            ) : smartFilters.length === 0 ? (
              <div className="text-[#ffffff80] text-sm p-2">
                No filtered streams yet
              </div>
            ) : (
              smartFilters.map((filter) => (
                <div
                  key={filter.id}
                  className="flex justify-between items-center p-2 hover:bg-[#2d2d2d] rounded cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[#3474ff] text-white text-xs">
                      {filter.name
                        .split(" ")
                        .map((word) => word[0])
                        .join("")
                        .slice(0, 2)}
                    </span>
                    <span className="text-white">{filter.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Edit button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(filter);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#3474ff] rounded text-white"
                      title="Edit filter"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(filter.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-600 rounded text-white"
                      title="Delete filter"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    {/* <MoreHorizontal className="text-white w-4 h-4" /> */}
                  </div>
                </div>
              ))
            )}
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
        {/* Advanced Filters, (rather redundant so leaving out for now unless absolutely necessary) */}
        {/* 
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
            </div> 
          </div>
          */}
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
                      <select
                        className="bg-[#fafafa10] rounded-[8px] px-3 py-2 text-sm text-white w-full appearance-none border-none outline-none"
                        style={{
                          colorScheme: "dark",
                          backgroundColor: "rgba(250, 250, 250, 0.06)",
                          color: "white",
                        }}
                      >
                        <option
                          value="contains"
                          style={{ backgroundColor: "#2d2d2d", color: "white" }}
                        >
                          Contains
                        </option>
                        <option
                          value="not_contains"
                          style={{ backgroundColor: "#2d2d2d", color: "white" }}
                        >
                          Does Not Contain
                        </option>
                        <option
                          value="equals"
                          style={{ backgroundColor: "#2d2d2d", color: "white" }}
                        >
                          Equals
                        </option>
                        <option
                          value="not_equals"
                          style={{ backgroundColor: "#2d2d2d", color: "white" }}
                        >
                          Does Not Equal
                        </option>
                        <option
                          value="starts_with"
                          style={{ backgroundColor: "#2d2d2d", color: "white" }}
                        >
                          Starts With
                        </option>
                        <option
                          value="ends_with"
                          style={{ backgroundColor: "#2d2d2d", color: "white" }}
                        >
                          Ends With
                        </option>
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
              {showEditPopup && editingFilter && (
                <>
                  {/* Backdrop for outside click */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={handleEditCancel}
                    style={{ background: "transparent" }}
                  />
                  {/* Edit Popup */}
                  <div className="absolute left-[20%] top-[20%] mt-2 z-50 w-[400px] bg-[#161717] border border-[#fafafa10] rounded-xl shadow-lg p-5">
                    <div className="text-white text-base font-[200] mb-1">
                      Edit Filter: {editingFilter.name}
                    </div>
                    <div className="text-xs text-[#ffffff80] mb-3">
                      Update your filter settings below.
                    </div>
                    <input
                      className="w-full bg-[#fafafa10] rounded-[8px] px-3 py-2 mb-3 text-sm text-white outline-none"
                      placeholder="Edit Filter Name"
                      defaultValue={editingFilter.name}
                    />
                    <input
                      className="w-full bg-[#fafafa10] rounded-[8px] px-3 py-2 mb-3 text-sm text-white outline-none"
                      placeholder="Edit Keywords"
                      defaultValue={editingFilter.keywords?.join(", ") || ""}
                    />

                    {/* Actions */}
                    <div className="flex justify-between">
                      <button
                        className="text-[#ffffff80] px-4 py-2 rounded hover:bg-[#23262F]"
                        onClick={handleEditCancel}
                      >
                        Cancel
                      </button>
                      <button
                        className="bg-[#2563eb] text-white px-8 py-2 rounded hover:bg-[#1d4ed8]"
                        onClick={handleEditSave}
                      >
                        Update
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          {isFilteredStreamsOpen && (
            <div className="mt-2">
              {isLoadingFilters ? (
                <div className="text-[#ffffff80] text-sm px-4 py-2">
                  Loading filters...
                </div>
              ) : filterError ? (
                <div className="text-red-400 text-sm px-4 py-2">
                  Error: {filterError}
                </div>
              ) : smartFilters.length === 0 ? (
                <div className="text-[#ffffff80] text-sm px-4 py-2">
                  No filtered streams yet
                </div>
              ) : (
                smartFilters.slice(0, 3).map((filter) => (
                  <div key={filter.id} className="relative group">
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 transition relative rounded-[10px] hover:bg-[#212121] focus:bg-[#212121]"
                      onClick={() => {
                        setSelectedId(filter.id);
                        if (onChatSelect) {
                          onChatSelect(filter);
                        }
                      }}
                    >
                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#3474ff] text-white text-xs">
                        {filter.name
                          .split(" ")
                          .map((word: string) => word[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex justify-between items-center">
                          <span className="text-[#ffffff48] font-200">
                            {filter.name}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-[#ffffff32] font-100">
                            {filter.keywords?.slice(0, 2).join(", ")}
                            {filter.keywords?.length > 2 && "..."}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <span className="self-end text-xs text-gray-400">
                          now
                        </span>
                      </div>
                    </button>

                    {/* Edit/Delete buttons - show on hover */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(filter);
                        }}
                        className="p-1 bg-[#3474ff] rounded hover:bg-[#2563eb] text-white"
                        title="Edit filter"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(filter.id);
                        }}
                        className="p-1 bg-red-600 rounded hover:bg-red-700 text-white"
                        title="Delete filter"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
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
                        <ChatAvatar name={chat.name} avatar={chat.photo_url} />
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
