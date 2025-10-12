import React, { useEffect, useRef, useState, useMemo } from "react";
import { Button } from "./ui/button";
import {
  Check,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Image,
  LucideFileImage,
  MoreVertical,
  Plus,
  Search,
  VolumeX,
  X,
} from "lucide-react";
import { Pin, PinOff } from "lucide-react";
import aiAll from "@/assets/images/aiAll.png";
import { mapDiscordToTelegramSchema } from "@/lib/utils";
import discord from "@/assets/images/discord.png";
import telegram from "@/assets/images/telegram.png";
import { FaDiscord, FaTelegramPlane } from "react-icons/fa";
import ChatAvatar from "./ChatAvatar";
import FiltersPanel from "./FiltersPanel";
import FilterEditor from "./FilterEditor";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import aiIMG from "@/assets/images/aiAll.png";
// import { Dialog, DialogContent, DialogTitle } from "@radix-ui/react-dialog";
// import { DialogHeader } from "./ui/dialog";
import SmartSummary from "./SmartSummary";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
// const chatTypes = ["Group", "DM", "Server"] as const;
// const platforms = ["discord", "Telegram"] as const;
// const sampleMessages = [
//   "Hey, how are you? Hey, how are you? Hey, how are you? Hey, how are you? Hey, how are you?",
//   "Let's catch up later.",
//   "Don't forget the meeting.",
//   "Check out this link!",
//   "See you soon.",
//   "Can you review this?",
//   "Happy birthday!",
//   "Congrats on the launch!",
//   "Are you coming tonight?",
//   "Thanks for your help!",
// ];

const TOP_ITEMS = ["All", "Unread", "Filtered Streams", "Telegram", "Discord"];
const INITIAL_BOTTOM_ITEMS = ["Alpha", "Airdrop", "Launch", "Sponsored"];

// function randomFrom<T>(arr: readonly T[]) {
//   return arr[Math.floor(Math.random() * arr.length)];
// }

// function randomTags() {
//   // Each chat can have 0 to all tags
//   return INITIAL_BOTTOM_ITEMS.filter(() => Math.random() < 0.5);
// }

// function randomTime() {
//   const now = new Date();
//   const minutesAgo = Math.floor(Math.random() * 1440); // up to 24 hours ago
//   const date = new Date(now.getTime() - minutesAgo * 60000);
//   return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
// }

// const chats = Array.from({ length: 30 }, (_, i) => {
//   const type = randomFrom(chatTypes);
//   const platform = randomFrom(platforms);
//   const pinned = Math.random() < 0.1; // 10% pinned
//   const read = Math.random() < 0.7; // 30% pinned
//   const name = `${type === "DM" ? "User" : type} ${i + 1}`;
//   return {
//     id: i + 1,
//     name,
//     avatar: gravatarUrl(name + platform),
//     type,
//     platform,
//     pinned,
//     read,
//     lastMessage: randomFrom(sampleMessages),
//     time: randomTime(),
//     tags: randomTags(),
//   };
// });

function parseTimeString(timeString: string) {
  // Handles "HH:MM AM/PM"
  const [time, modifier] = timeString.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (modifier && modifier.toLowerCase() === "pm" && hours !== 12) hours += 12;
  if (modifier && modifier.toLowerCase() === "am" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

// // Sort all chats by time descending (latest first)
// const chatsSortedByTime = [...chats].sort((a, b) => {
//   return parseTimeString(b.time) - parseTimeString(a.time);
// });
// const sortedChats = [
//   ...chatsSortedByTime.filter((chat) => chat.pinned),
//   ...chatsSortedByTime.filter((chat) => !chat.pinned),
// ];

// function formatChatTime(dateString: string) {
//   const now = new Date();
//   const chatDate = new Date(dateString); // Parse directly as a Date object

//   // Handle invalid dates
//   if (isNaN(chatDate.getTime())) {
//     console.log("Invalid date string:", dateString);
//     return "now";
//   }

//   const diffMs = now.getTime() - chatDate.getTime();
//   const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
//   const diffWeeks = Math.floor(diffDays / 7);
//   const diffMonths = Math.floor(diffDays / 30);

//   if (diffDays === 0) {
//     // Same day, show time
//     return chatDate.toLocaleTimeString([], {
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   } else if (diffDays === 1) {
//     return "1d";
//   } else if (diffDays < 7) {
//     return `${diffDays}d`;
//   } else if (diffWeeks < 4) {
//     return `${diffWeeks}wk`;
//   } else {
//     return `${diffMonths}mo`;
//   }
// }

function formatChatTime(dateString: string) {
  const now = new Date();

  // Parse as UTC by adding 'Z', then it will be properly converted
  const chatDate = new Date(dateString + "Z");

  // Handle invalid dates
  if (isNaN(chatDate.getTime())) {
    // console.log("Invalid date string:", dateString);
    return "now";
  }

  const diffMs = now.getTime() - chatDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffDays === 0) {
    // Same day, show time in IST
    return chatDate.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
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
  selectedDiscordServer: string | null;
  onBack: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  chats = [],
  onChatSelect,
  selectedChat,
  selectedDiscordServer,
  onBack
}) => {
  // Use ONLY real chats; never fall back to dummy/sample data
  const displayChats = chats;
  const [isFocus, setIsFocus] = useState(false);
  const [filters, setFilters] = useState([]);
  const SCROLL_AMOUNT = 100; // px
  const topRowRef = useRef<HTMLDivElement>(null);
  const bottomRowRef = useRef<HTMLDivElement>(null);
  const topArrows = useScrollArrows(topRowRef);
  const bottomArrows = useScrollArrows(bottomRowRef);
  const [activeTopItem, setActiveTopItem] = useState(TOP_ITEMS[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState<string | number>(
    selectedChat?.id || "all-channels"
  );
  const [channelSearch, setChannelSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedChannels, setSelectedChannels] = useState([]);
  const [isFilteredStreamsOpen, setIsFilteredStreamsOpen] = useState(true);
  const [isChannelsOpen, setIsChannelsOpen] = useState(true);
  const [searchMore, setSearchMore] = useState(false);
  const [filterFull, setFilterFull] = useState(false);
  const [streamsLimit, setStreamsLimit] = useState(5);
  const [channelsLimit, setChannelsLimit] = useState(20);
  const [smartFilters, setSmartFilters] = useState<any[]>([]);
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  const [filterError, setFilterError] = useState<string | null>(null);
  const [topItems, setTopItems] = useState<string[]>(() => {
    const savedTopItems = localStorage.getItem("topItemsOrder");
    return savedTopItems ? JSON.parse(savedTopItems) : TOP_ITEMS;
  }); // State for TOP_ITEMS, initialized from localStorage
  // Inline editor state for editing a Smart Filter from ChatPanel
  const [showFilterEditor, setShowFilterEditor] = useState(false);
  const [editingFilter, setEditingFilter] = useState<any>(null);
  const [allChannels, setAllChannels] = useState<any[]>([]);
  const [focusChannels, setFocusChannels] = useState<any[]>([]);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const [contextMenu, setContextMenu] = useState(null);
  const [dcChannels, setDcChannels] = useState({});
  const menuRef = useRef(null);




  useEffect(()=>{
  const cachedGuilds = localStorage.getItem("discordGuilds");
  // console.log("[localguild][localStorage] raw:", cachedGuilds);

  if (cachedGuilds) {
    try {
      const parsed = JSON.parse(cachedGuilds);
      // console.log("[localguild][localStorage] parsed:", parsed);
const tempDCchannel={}
      if (Array.isArray(parsed) && parsed.length>0) {
        parsed.forEach(guild => {
          if (guild.channels && Array.isArray(guild.channels)) {
            tempDCchannel[guild.id] = guild.channels;
          }
        });

        setDcChannels(tempDCchannel)
        
        // console.log("[localguild][localStorage] parse channels:", parsed);
        // console.log('[localguild]dcChannels', dcChannels)
        // console.log('[localguild]dcChannels', dummyChannels)
      }
    } catch (err) {
      console.error("[localguild][localStorage] parse error:", err);
      // fail silently, will refetch
    }
  }
},[])
  // Close on mouse leave from menu
  const handleMenuMouseLeave = () => {
    closeContextMenu();
  };

  const handleRightClick = (event, channel) => {
    event.preventDefault();

    const menuHeight = 120; // set according to actual menu height
    const padding = 10;
    const viewportHeight = window.innerHeight;

    let y = event.pageY;
    if (y + menuHeight + padding > viewportHeight)
      y = viewportHeight - menuHeight - padding;
    else if (y < padding) y = padding;

    setContextMenu({
      x: event.pageX,
      y,
      channel,
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const handleReadAll = async () => {
    if (contextMenu) {
      console.log("Read All clicked for channel", contextMenu.channel);
      // Add your Read All logic here
      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/chats/${
            contextMenu.channel.id
          }/read`,
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
    }
    closeContextMenu();
  };

  const handleMuteChat = () => {
    if (contextMenu) {
      console.log("Mute Chat clicked for channel", contextMenu.channel);
      // Add your Mute Chat logic here
    }
    closeContextMenu();
  };

  useEffect(() => {
    console.log(chats,"chats")
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        closeContextMenu();
      }
    };

    const handleScroll = () => {
      closeContextMenu();
    };

    document.addEventListener("click", handleClickOutside);
    document.addEventListener("scroll", handleScroll, true); // true to capture scroll in all elements

    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, []);

  // Inside your ChatPanel or the top-level channel context/provider
useEffect(() => {
  // Try to restore channels from localStorage first for instant render
  const cachedChannels = localStorage.getItem('channels');
  if (cachedChannels) {
    setAllChannels(JSON.parse(cachedChannels));
  }
}, []);

useEffect(() => {
  if (allChannels) {
    // Save channels to localStorage whenever new data is fetched/updated
    localStorage.setItem('channels', JSON.stringify(allChannels));
  }
}, [allChannels]);



  useEffect(() => {
    // Save topItems to localStorage whenever it changes
    localStorage.setItem("topItemsOrder", JSON.stringify(topItems));
  }, [topItems]);
  const loadChannels = async () => {
    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
      const token = localStorage.getItem("access_token");

      const resp = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/ui/chats?include_all=true`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (resp.ok) {
        const chats = await resp.json();
        const chans = chats.chats;
              const dms = await window.electronAPI.discord.getDMs(); // remove listener if supported
                  const discordChats = dms.data?.map(mapDiscordToTelegramSchema);
                  discordChats.sort((a, b) => Number(b.id) - Number(a.id));
                  // Merge both
                  const allChats = [...chans, ...discordChats];
        // const chans = (chats.chats || []).map((c: any) => ({
        //   id: c?.id ?? c?._id,
        //   name: c?.title || c?.username || String(c?.id ?? c?._id),
        //   platform: c?.platform,
        // }));
        // console.log(chans)
        setAllChannels(allChats.filter((c: any) => c.id != null));
      }
    } catch (_) {
      // ignore
    }
  };
  // Load channel list for FilterEditor (id/name mapping)
  useEffect(() => {
    // Call loadChannels initially
    loadChannels();

    // Set interval timer to call loadChannels every 5000 ms (5 seconds)
    const intervalId = setInterval(() => {
      loadChannels();
    }, 5000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const refreshSmartFilters = async () => {
    try {
      setIsLoadingFilters(true);
      setFilterError(null);
      const filters = await getSmartFilters();
      setSmartFilters(filters);
      // console.log("Loaded smart filters:", filters);
    } catch (error) {
      console.error("Error loading filters:", error);
      setFilterError(
        error instanceof Error ? error.message : "Failed to load filters"
      );
    } finally {
      setIsLoadingFilters(false);
    }
  };

  useEffect(() => {
    refreshSmartFilters();
  }, []);

  // Open editor for a filter
  const handleEdit = (filter: any) => {
    setEditingFilter(filter);
    setShowFilterEditor(true);
  };

  // Delete a filter
  const handleDelete = async (filterId: string) => {
    if (!confirm("Are you sure you want to delete this filter?")) return;
    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
      const token = localStorage.getItem("access_token");
      const resp = await fetch(`${BACKEND_URL}/filters/${filterId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!resp.ok) throw new Error(`Failed to delete filter: ${resp.status}`);
      setSmartFilters((prev) => prev.filter((f) => f.id !== filterId));
      await refreshSmartFilters();
    } catch (e) {
      alert("Failed to delete filter. Please try again.");
    }
  };

  // Save from FilterEditor (create/update)
  const handleEditorSave = async (
    data: { name: string; channels: number[]; keywords: string[] },
    filterId?: string
  ) => {
    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
      const token = localStorage.getItem("access_token");
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("channels", data.channels.join(","));
      formData.append("keywords", data.keywords.join("\n"));

      const url = filterId
        ? `${BACKEND_URL}/filters/${filterId}`
        : `${BACKEND_URL}/filters`;
      const resp = await fetch(url, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!resp.ok) throw new Error(`Failed to save filter: ${resp.status}`);
      const saved = await resp.json();
      if (filterId) {
        setSmartFilters((prev) =>
          prev.map((f) => (f.id === filterId ? saved : f))
        );
      } else {
        setSmartFilters((prev) => [...prev, saved]);
      }
      await refreshSmartFilters();
    } catch (e) {
      alert("Failed to save filter. Please try again.");
    } finally {
      setShowFilterEditor(false);
      setEditingFilter(null);
    }
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

  useEffect(() => {
    if (channelSearch.trim() === "") {
      // setSearchResults([]);
      return;
    }
    // Add null checks to prevent errors
    if (!displayChats || !Array.isArray(displayChats)) {
      // setSearchResults([]);
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
    setChannelsLimit(20);
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
      setChannelsLimit(20);
      setTimeout(bottomArrows.checkScroll, 300);
    }
  };

  // Trust backend sorting - only separate pinned from unpinned
  // Backend already sorts chats consistently by messages first, then by name
  const sortedDisplayChats = [
    ...(allChannels || displayChats || [])
      .filter(chat => chat?.isPinned || chat?.pinned)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    ...(allChannels || displayChats || [])
      .filter(chat => !chat?.isPinned && !chat?.pinned)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
  ];

  const getFilteredChannels = () => {
    // Use displayChats directly to maintain backend sorting
    let baseArray = isFocus ? focusChannels : sortedDisplayChats;
    let filtered = baseArray;

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
      filtered = filtered.filter((chat) => chat.platform === "discord");
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

  const channels = useMemo(
    () => getFilteredChannels(),
    [
      sortedDisplayChats,
      searchTerm,
      activeTopItem,
      filters,
      isFocus,
      allChannels,
    ]
  );
  // UI behavior: when "Filtered Streams" is selected in TOP_ITEMS,
  // show only the Filtered Streams section (expanded) and hide Channels
  const showChannelsSection = activeTopItem !== "Filtered Streams";
  const streamsOpen =
    activeTopItem === "Filtered Streams" ? true : isFilteredStreamsOpen;

  // Show more channels when searching or when filters are applied
  const displayChannels =
    searchTerm.trim() || filters.length > 0
      ? channels
      : channels.slice(0, channelsLimit); // Use dynamic limit

  const handleFocusMode = () => {
    setIsFocus((prevIsFocus) => {
      const newIsFocus = !prevIsFocus;
      if (newIsFocus) {
        setFocusChannels(
          displayChannels.filter((chat) => chat.pinned || chat.isPinned)
        );
      } else {
        setFocusChannels(displayChannels);
      }
      return newIsFocus;
    });
  };

  const [fetchedUsers, setFetchedUsers] = useState<any[]>([]);

  async function fetchSearchUsers(query = "rohcodes", limit = 10) {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL; // or your backend URL string
    const token = localStorage.getItem("access_token");

    const url = `${BACKEND_URL}/api/search/users?query=${encodeURIComponent(
      query
    )}&limit=${limit}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error fetching users: ${response.status}`);
      }

      const data = await response.json();
      setSearchResults(data.results);
      console.log("Search results:", searchResults);
      return data;
    } catch (error) {
      setSearchResults([]);
      console.error("Fetch search users failed:", error);
      return null;
    }
  }

  useEffect(() => {
    if (searchTerm.trim() !== "") {
      fetchSearchUsers(searchTerm);
    } else {
      setFetchedUsers([]);
      setSearchResults([]);
    }
  }, [searchTerm]);

  // const channelsToShow =
  //   searchResults?.length > 1
  //     ? searchResults
  //     : isFocus
  //     ? focusChannels
  //     : displayChannels;

  //     console.log(channelsToShow)

  const channelsToShow = useMemo(() => {
    if (searchResults && searchResults.length > 0) {
      return searchResults;
    }
    return isFocus ? focusChannels : displayChannels;
  }, [
    searchResults,
    searchTerm,
    isFocus,
    focusChannels,
    displayChannels,
    allChannels,
  ]);
  const markAllRead = async () => {
    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${BACKEND_URL}/api/chats/mark-all-read`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ read: true }), // if your backend expects a body, adjust accordingly, else omit body
      });

      if (!response.ok) {
        throw new Error(`Failed to mark all as read: ${response.status}`);
      }
      setSearchMore(false);
      // Optionally, refresh chat list or update local read state
      // alert("All chats marked as read");

      // For example, refresh chats if you have a method
      // loadChats();
    } catch (error) {
      // alert(`Error marking all as read: ${(error as Error).message}`);
    }
  };

  // function formatUnreadCount(unread) {
  //   if (typeof unread !== 'number') return '';
  //   return unread > 9 ? '9+' : unread.toString();
  // }

  // if (filterFull) {
  //   return (
  //     <FiltersPanel
  //       onClose={() => setFilterFull(false)}
  //       loadFilters={getSmartFilters}
  //       createFilter={async (filterData) => {
  //         const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  //         const token = localStorage.getItem("access_token");

  //         const formData = new FormData();
  //         formData.append("name", filterData.name);
  //         formData.append("channels", filterData.channels.join(","));
  //         formData.append("keywords", filterData.keywords.join("\n"));

  //         const response = await fetch(`${BACKEND_URL}/filters`, {
  //           method: "POST",
  //           headers: {
  //             Authorization: `Bearer ${token}`,
  //           },
  //           body: formData,
  //         });

  //         if (!response.ok) {
  //           throw new Error(`Failed to create filter: ${response.status}`);
  //         }

  //         const newFilter = await response.json();
  //         setSmartFilters((prev) => [...prev, newFilter]);
  //         alert("Filter created successfully!");
  //         refreshSmartFilters();
  //         return newFilter;
  //       }}
  //       updateFilter={async (filterId, filterData) => {
  //         const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  //         const token = localStorage.getItem("access_token");

  //         const formData = new FormData();
  //         if (filterData.name) formData.append("name", filterData.name);
  //         if (filterData.channels)
  //           formData.append("channels", filterData.channels.join(","));
  //         if (filterData.keywords)
  //           formData.append("keywords", filterData.keywords.join("\n"));

  //         const response = await fetch(`${BACKEND_URL}/filters/${filterId}`, {
  //           method: "POST",
  //           headers: {
  //             Authorization: `Bearer ${token}`,
  //           },
  //           body: formData,
  //         });

  //         if (!response.ok) {
  //           throw new Error(`Failed to update filter: ${response.status}`);
  //         }

  //         const updatedFilter = await response.json();
  //         setSmartFilters((prev) =>
  //           prev.map((f) => (f.id === filterId ? updatedFilter : f))
  //         );
  //         alert("Filter updated successfully!");
  //         refreshSmartFilters();
  //         return updatedFilter;
  //       }}
  //       deleteFilter={async (filterId) => {
  //         if (!confirm("Are you sure you want to delete this filter?")) {
  //           return;
  //         }
  //         const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  //         const token = localStorage.getItem("access_token");

  //         const response = await fetch(`${BACKEND_URL}/filters/${filterId}`, {
  //           method: "DELETE",
  //           headers: {
  //             Authorization: `Bearer ${token}`,
  //           },
  //         });

  //         if (!response.ok) {
  //           throw new Error(`Failed to delete filter: ${response.status}`);
  //         }

  //         setSmartFilters((prev) => prev.filter((f) => f.id !== filterId));
  //         alert("Filter deleted successfully!");
  //         refreshSmartFilters();
  //       }}
  //       topItems={topItems}
  //       onTopItemsReorder={setTopItems}
  //       onFiltersUpdated={refreshSmartFilters}
  //     />
  //   );
  // }

  const [openSummary, setOpenSummary] = React.useState(false);

  const handleGenerateSummary = () => {
    setOpenSummary(true); // open modal
  };
  
  const prevLastMessages = useRef({});
  const [firstLoad, setFirstLoad] = useState(true)
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  
  useEffect(() => {
    if (firstLoad) {
      // Just initialize prevLastMessages on first load. No notification or sound.
      allChannels.forEach((channel) => {
        prevLastMessages.current[channel.id] = channel.last_message;
      });
      setFirstLoad(false);
      return;
    }

    
    allChannels.forEach((channel) => {
      const prevMessage = prevLastMessages.current[channel.id];
      if (prevMessage && channel.last_message && prevMessage !== channel.last_message) {
        // last_message changed for this channel, trigger notification
        if (channel.last_message && channel.unread && !(channel.last_message.toLowerCase().includes("typing"))) {
          playBeepSound();  
          new Notification("New message", {
            body: `New message in ${channel.name}: ${channel.last_message}`,
          });
        }
        // Update stored message
        prevLastMessages.current[channel.id] = channel.last_message;
      }
    });
  }, [allChannels]);
  const playBeepSound = () => {
   try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
  
    oscillator.type = "sawTooth"; // type of wave: sine, square, sawtooth, triangle
    oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // 440 Hz is standard A note
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
  
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.4);
    oscillator.stop(audioCtx.currentTime + 0.4);
   } catch (error) {
    console.log('beep error: ',error)
   }
  };
  function groupChannelsFlat(channels) {
    const channelMap = new Map();
    const roots = [];
    const orphans = [];
  
    // Initialize map entries
    channels.forEach(channel => {
      channel.children = [];
      channelMap.set(channel.id, channel);
    });
  
    channels.forEach(channel => {
      if (channel.parent_id && channelMap.has(channel.parent_id)) {
        // Add to parent's children if parent exists
        channelMap.get(channel.parent_id).children.push(channel);
      } else if (!channel.parent_id) {
        // No parent, so top-level root
        roots.push(channel);
      } else {
        // parent_id exists but parent channel missing, consider orphan
        // orphans.push(channel);
      }
    });
  
    // Return roots followed by orphan channels at the end
    return [...roots, ...orphans];
  }

  const RenderChannels = ({ channels }) => {
    return (
      <ul>
        {channels.map(channel => {
          return(
          <li key={channel.id} className={`${channel.type===4?"mt-4":""}`} >
            <div onClick={()=>{
              if(channel.type===4) return;
            onChatSelect({id:channel.id,platform:'discord',name:channel.name,photo_url:channel.avatar_url});
            setSelectedId(channel.id)  
          }}
          className="hover:bg-[#212121] cursor-pointer px-4 py-2 rounded-[12px]">              
              {channel.type === 4 && <strong className="flex gap-2">{channel.name}<ChevronRight/></strong>}
              {channel.type === 0 && <># {channel.name}</>}
              {channel.type === 2 && <>🔊 {channel.name}</>}
              {channel.type === 15 && <>📝 {channel.name}</>}
              {!([0, 2, 4, 15].includes(channel.type)) && channel.name}
            </div>
            {channel.children && channel.children.length > 0 && (
              <RenderChannels channels={channel.children} />
            )}
          </li>
        )}
        )}
      </ul>
    );
  };
  
  const discordChannels = dcChannels[selectedDiscordServer] || [];
  // const grouped = groupChannels(discordChannels);
  // const headingIds = grouped.filter(c => c.type === 4).map(c => c.id);
  // const [open, setOpen] = useState(headingIds.reduce((acc, id) => ({ ...acc, [id]: true }), {}));
  // const toggle = (id) => setOpen((prev) => ({ ...prev, [id]: !prev[id] }));
  // const sortedChannels = [...discordChannels].sort((a, b) => a.position - b.position);
  const sortedChannels = groupChannelsFlat(discordChannels);
  const headingIds = sortedChannels.filter(c => c.type === 4).map(c => c.id);
  const [open, setOpen] = useState(headingIds.reduce((acc, id) => ({ ...acc, [id]: true }), {}));

// console.log('discordChannels',discordChannels)
  if (selectedDiscordServer && sortedChannels.length>0) {
    return (
      <div className="h-[calc(100vh-73px)] min-w-[350px] p-3 flex flex-col border-r border-[#23272f] bg-[#111111]">
      <button
        onClick={()=>{onBack();onChatSelect("all-channels");setSelectedId("all-channels")}}
        className="mb-4 bg-gray-800 hover:bg-gray-700 text-white py-1 px-3 rounded"
      >
        &larr; Back to Chats
      </button>
      <h3 className="mb-3 text-lg font-bold">Channels</h3>
      <div className="overflow-y-scroll h-full">
     <RenderChannels channels={sortedChannels}/>
     </div>
      {/* <ul>
        {discordChannels.map((channel) => (
          <li key={channel.id} className="py-2 pl-2 cursor-pointer rounded-[12px] hover:bg-[#212121]">
            # {channel.name}
          </li>
        ))}
      </ul> */}
    </div>
    );
  }
console.log('channelsToShow: ',channelsToShow)
  return (
    <>
      {filterFull ? (
        <FiltersPanel
          onClose={() => setFilterFull(false)}
          loadFilters={getSmartFilters}
          createFilter={async (filterData) => {
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

            const newFilter = await response.json();
            setSmartFilters((prev) => [...prev, newFilter]);
            alert("Filter created successfully!");
            refreshSmartFilters();
            return newFilter;
          }}
          updateFilter={async (filterId, filterData) => {
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

            const updatedFilter = await response.json();
            setSmartFilters((prev) =>
              prev.map((f) => (f.id === filterId ? updatedFilter : f))
            );
            alert("Filter updated successfully!");
            refreshSmartFilters();
            return updatedFilter;
          }}
          deleteFilter={async (filterId) => {
            if (!confirm("Are you sure you want to delete this filter?")) {
              return;
            }
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

            setSmartFilters((prev) => prev.filter((f) => f.id !== filterId));
            alert("Filter deleted successfully!");
            refreshSmartFilters();
          }}
          topItems={topItems}
          onTopItemsReorder={setTopItems}
          onFiltersUpdated={refreshSmartFilters}
        />
      ) : (
        <aside className="h-[calc(100vh-73px)] w-[350px] p-3 pl-0 flex flex-col border-r border-[#23272f] bg-[#111111]">
          <Button
            variant="ghost"
            onClick={handleFocusMode}
            className={`ml-3 bg-[#171717] rounded-[8px] ${
              isFocus ? "text-[#5389ff]" : "text-[#FFFFFF32]"
            } p-0 `}
          >
            <Eye /> Focus Mode
          </Button>
          <Button
            onClick={handleGenerateSummary}
            className={`ml-3 mt-2 bg-[#171717] rounded-[8px] text-[#ffffff] bg-[#3474ff] hover:text-[#ffffff] hover:bg-[#3474ff] p-0 `}
          >
            <img src={aiIMG} className="w-10 h-10" />
            {"Summarize All Channels"}
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
            {/* Advanced Filters */}
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
                        onClick={() => {
                          markAllRead();
                        }}
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
              {topItems.map((item) => (
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
                onClick={() =>
                  scroll(topRowRef, "right", topArrows.checkScroll)
                }
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
          {/* <div className="pl-3 mt-4">
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
      </div> */}

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
              <img
                src={aiAll}
                className="w-10 h-10 rounded-full object-cover"
                loading="lazy"
                decoding="async"
              />
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
                <div className="flex items-center gap-2"></div>
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
                    onClick={(e) => {
                      e.stopPropagation(); // Stop event propagation
                      setFilterFull(true);
                    }}
                  />
                  {isFilteredStreamsOpen ? (
                    <ChevronDown className="hover:text-white text-[#fafafa60] w-5 h-5" />
                  ) : (
                    <ChevronRight className="hover:text-white text-[#fafafa60] w-5 h-5" />
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

            {/* Channels Section */}
            {showChannelsSection && (
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
                  <div className="mt-2" onClick={closeContextMenu}>
                    {channelsToShow.length === 0 && searchTerm.trim() ? (
                      <div className="text-[#ffffff48] text-sm px-4 py-3">
                        No channels found for "{searchTerm}"
                      </div>
                    ) : (
                      channelsToShow.map((chat) => (
                        <div key={chat.id}>
                          {contextMenu && (
                            <ul
                              ref={menuRef}
                              onMouseLeave={handleMenuMouseLeave}
                              style={{
                                position: "fixed",
                                top: contextMenu.y,
                                left: contextMenu.x,
                                backgroundColor: "#111111",
                                borderRadius: "10px",
                                listStyle: "none",
                                padding: "8px",
                                zIndex: 1000,
                                minWidth: "120px",
                              }}
                              className="shadow-lg border border-[#ffffff12]"
                            >
                              <li
                                onClick={handleReadAll}
                                className="cursor-pointer flex gap-2 items-center justify-start rounded-[10px] px-4 py-2 text-left hover:bg-[#23272f] text-[#ffffff72] hover:text-white whitespace-nowrap"
                              >
                                <CheckCheck className="text-[#ffffff] hover:text-[#5389ff] w-4 h-4" />
                                Read All
                              </li>
                              <li
                                onClick={handleMuteChat}
                                className="cursor-pointer flex gap-2 items-center justify-start rounded-[10px] px-4 py-2 text-left hover:bg-[#23272f] text-[#f36363] hover:text-[#f36363] whitespace-nowrap"
                              >
                                <VolumeX
                                  className="w-6 h-6"
                                  stroke="currentColor"
                                  fill="currentColor"
                                />
                                Mute Chat
                              </li>
                            </ul>
                          )}
                          <button
                            key={chat.id}
                            onContextMenu={(e) => handleRightClick(e, chat)}
                            style={{ cursor: "pointer" }}
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
                              <ChatAvatar
                                name={chat.name || chat.first_name}
                                avatar={
                                  chat.photo_url ||
                                  `${BACKEND_URL}/chat_photo/${chat.chat_id}`
                                }
                                backupAvatar={`${BACKEND_URL}/contact_photo/${chat.chat_id}`}
                              />
                              <img
                                src={
                                  chat.platform === "discord"
                                    ? discord
                                    : telegram
                                }
                                className={`
                            absolute -bottom-2 -right-1
                            ${
                              chat.platform === "discord"
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
                                  {chat.platform === "discord" ? (
                                    <FaDiscord className="text-[#7b5cfa]" />
                                  ) : (
                                    <FaTelegramPlane className="text-[#3474ff]" />
                                  )}
                                  {chat.name || chat.username}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-[#ffffff32] font-100">
                                  {chat.is_typing
                                    ? "Typing..."
                                    : chat.lastMessage?.length > 23 // Use optional chaining for lastMessage
                                    ? chat.lastMessage.slice(0, 23) + "..."
                                    : chat.lastMessage}
                                    {chat.lastMessage==""?(<>
                                    <LucideFileImage fill="#000" stroke="#fff" strokeWidth={"1px"} height={20}/>
                                    </>):''}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                              <span className="self-end text-xs text-gray-400">
                                {/* {console.log('Raw chat.timestamp:', chat.timestamp, 'Type:', typeof chat.timestamp)} */}
                                {formatChatTime(chat.timestamp)}
                              </span>
                              <div className="flex items-center gap-1">
                                {chat.pinned && (
                                  <Pin className="w-5 h-5 text-transparent fill-[#fafafa60] ml-1" />
                                )}
                                {!chat.read &&
                                  chat.unread &&
                                  chat.unread > 0 && (
                                    <div
                                      className={`rounded-full min-w-6 w-max px-1 h-6 text-xs flex items-center justify-center text-center ${
                                        chat.platform === "Telegram"
                                          ? "bg-[#3474ff]"
                                          : "bg-[#7b5cfa]"
                                      }`}
                                    >
                                      {/* <span>{formatUnreadCount(chat.unread)}</span> */}
                                      <span>{chat.unread}</span>
                                    </div>
                                  )}
                              </div>
                            </div>
                          </button>
                        </div>
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
                          Show more channels...
                          {/* Show {Math.min(20, channels.length - channelsLimit)} more channels... */}
                        </button>
                      )}

                    {/* Show Less button when channels are expanded */}
                    {!searchTerm.trim() &&
                      filters.length === 0 &&
                      channelsLimit > 20 && (
                        <button
                          className="w-full text-center py-2 text-[#84afff] hover:text-white text-sm"
                          onClick={() => setChannelsLimit(20)}
                        >
                          Show Less
                        </button>
                      )}
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Inline FilterEditor modal for editing from ChatPanel */}
          <FilterEditor
            show={showFilterEditor}
            onClose={() => {
              setShowFilterEditor(false);
              setEditingFilter(null);
            }}
            editingFilter={editingFilter}
            onSave={handleEditorSave}
            allChannels={allChannels}
          />
        </aside>
      )}
      <Dialog open={openSummary} onOpenChange={setOpenSummary} className="min-w-[700px] max-w-[900px]">
        <DialogContent className="p-0 rounded-[10px] border-0 min-w-[700px] max-w-[900px]">
          {/* Trigger fetchSummary as soon as modal opens */}
          {openSummary && <SmartSummary autoFetch={true} />}
        </DialogContent>
      </Dialog>
    </>
  );
};
export default ChatPanel;
