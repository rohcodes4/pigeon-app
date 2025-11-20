import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Bell,
  Check,
  Filter,
  Pin,
  Search,
  X,
  Plus,
  Trash,
  CheckCheck,
  PinOff,
  SmilePlusIcon,
} from "lucide-react";
// import aiIMG from "@/assets/images/aiBlue.png";
import aiIMG from "@/assets/images/aiWhite.png";
import { useAuth } from "@/hooks/useAuth";

type UnifiedHeaderProps = {
  title: string;
  smartText: string;
  isSmartSummary?: boolean;
  isReadAll?: boolean;
  setIsSmartSummary?: (value: boolean) => void;
  isPinnable?: boolean;
  isContact?: boolean;
  isAI?: boolean;
  selectedChat: any;
  setIsNotificationPanel?: (value: boolean) => void;
  isNotificationPanel?: boolean;
  isPinnedOpen: boolean;
  isSearchOpen: boolean;
  onOpenPinnedPanel?: (value: boolean) => void;
  setIsPinnedOpen?: (value: boolean) => void;
  setIsSearchOpen?: (value: boolean) => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedOptions: string[];
  setSelectedOptions: (value: string[]) => void;
};

const UnifiedHeader: React.FC<UnifiedHeaderProps> = ({
  title,
  smartText,
  isReadAll,
  isSmartSummary,
  setIsSmartSummary,
  isPinnable,
  isContact = false,
  isAI = false,
  selectedChat,
  setIsNotificationPanel,
  isNotificationPanel,
  onOpenPinnedPanel,
  setIsPinnedOpen,
  isPinnedOpen,
  isSearchOpen,
  setIsSearchOpen,
  searchTerm,
  setSearchTerm,
  selectedOptions,
  setSelectedOptions,
}) => {
  console.log("scc", selectedChat);
  const location = useLocation();
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const authToken = localStorage.getItem("access_token");

  const options = [
    { value: "from_user", filters: ["user"], label: "From: a user" },
    { value: "from_group", filters: ["group"], label: "From: a group" },
    { value: "from_channel", filters: ["channel"], label: "From: a channel" },
    {
      value: "mentions_user_channel",
      filters: ["user", "channel"],
      label: "Mentions",
    },
    // {
    //   value: "filter_channel_or_user",
    //   filters: ["user", "channel"],
    //   label: "Filter: a channel or user",
    // },
    // {
    //   value: "todo_task",
    //   filters: ["todo_task"],
    //   label: "To-do: a task or reminder",
    // },
    // {
    //   value: "favourite_message_or_task",
    //   filters: ["favourite_message_or_task"],
    //   label: "Favourite: a message or task",
    // },
  ];

  const [pinnedChats, setPinnedChats] = useState<any[]>([]);
  const [isPinnedChat, setIsPinnedChat] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const handleToggleOption = (value: string) => {
    if (selectedOptions.includes(value)) {
      setSelectedOptions(selectedOptions.filter((o) => o !== value));
    } else {
      setSelectedOptions([...selectedOptions, value]);
    }
  };

  const handleAddToSearch = (historyItem: string) => {
    setSearchTerm(historyItem);
    setDropdown(false);
  };

  const handleClearHistory = () => {
    setSearchHistory([]);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getPinnedChats = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/pinned_chats`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPinnedChats(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const pinChannel = async (chat_id: string | number) => {
    try {
      const response = await fetch(`${BACKEND_URL}/chats/${chat_id}/pin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (
          response.status === 400 &&
          errorData.detail === "Chat is already pinned"
        ) {
          // → Unpin if already pinned
          const unpinResponse = await fetch(
            `${BACKEND_URL}/chats/${chat_id}/pin`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
              },
            }
          );
          if (!unpinResponse.ok) throw new Error("Failed to unpin channel");
        } else {
          throw new Error("Failed to pin channel");
        }
      }
      // refresh pinned list
      getPinnedChats();
    } catch (error) {
      console.error(error);
    }
  };

  // Fetch pinned chats once
  useEffect(() => {
    getPinnedChats();
  }, []);

  // Update isPinnedChat whenever pinnedChats or selectedChat changes
  useEffect(() => {
    if (
      selectedChat &&
      typeof selectedChat === "object" &&
      "id" in selectedChat
    ) {
      const isPinned = pinnedChats.some(
        (chat) => chat.chat_id === selectedChat.id
      );
      setIsPinnedChat(isPinned);
    } else {
      setIsPinnedChat(false); // reset when "all-channels"
    }
  }, [pinnedChats, selectedChat]);

  const { user: authUser, signOut } = useAuth(); // Destructure signOut from useAuth
  const [discordConnected, setDiscordConnected] = useState(false);
  const [isDiscordChat, setIsDiscordChat] = useState(false);
  const [isTelegram, setIsTelegram] = useState(false);
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [dropdown, setDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authUser) return;
    const fetchStatuses = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const [tgRes, dcRes] = await Promise.all([
          fetch(`${BACKEND_URL}/auth/telegram/status`, { headers }),
          fetch(`${BACKEND_URL}/auth/discord/status`, { headers }),
        ]);
        if (tgRes.ok) {
          const tg = await tgRes.json();
          setTelegramConnected(!!tg.connected);
        }
        const res = await window.electronAPI.security.getDiscordToken();
        if (res?.success && res?.data) {
          setDiscordConnected(!!res.success);
        }
        // if (dcRes.ok) {
        //   const dc = await dcRes.json();
        //   setDiscordConnected(!!dc.connected);
        // }
      } catch (e) {
        // ignore transient errors
      }
    };

    const fetchPlatforms = async () => {
      setIsTelegram(false);
      setIsDiscordChat(false);
      console.log("scc before tg", isTelegram);
      console.log("scc before dc", isDiscordChat);
      if (selectedChat === "all-channels") {
        setIsTelegram(true);
        setIsDiscordChat(true);
      } else if (selectedChat?.platform.toLowerCase() === "telegram") {
        setIsTelegram(true);
        setIsDiscordChat(false);
      } else if (selectedChat?.platform.toLowerCase() === "discord") {
        setIsTelegram(false);
        setIsDiscordChat(true);
      } else {
        // Optionally handle other cases
        setIsTelegram(false);
        setIsDiscordChat(false);
      }
      console.log("scc after tg", isTelegram);
      console.log("scc after dc", isDiscordChat);
    };

    fetchPlatforms();
    fetchStatuses();
  }, [authUser, selectedChat]);
  // Only show smart button on home
  const showSmartButton =
    location.pathname === "/" || (location.pathname === "/ai" && !isAI);

  return (
    <header className="bg-[#1A1A1E] flex flex-shrink-0 gap-2 items-center justify-between px-6 py-1 border-b border-[#23272f] rounded-tl-[12px] py-2">
      <div className="flex flex-1 justify-between">
        {/* Left: Title and subtitle */}
        <div className="flex gap-2 items-center">
          {selectedChat === "all-channels" && (
            <h1 className="text-[15px] text-[#ffffff72]">{title}</h1>
          )}

          {telegramConnected && isTelegram && (
            <span className="p-1.5 rounded-[6px] text-[11px] text-[#bfd6ff] bg-[#3474ff]">
              Telegram
            </span>
          )}
          {discordConnected && isDiscordChat && (
            <span className="p-1.5 rounded-[6px] text-[11px] text-[#d7d5ff] bg-[#7b5cfa]">
              Discord
            </span>
          )}

          {/* Show pin button only if selectedChat is an object with ID */}
          {isPinnable &&
            typeof selectedChat === "object" &&
            !("channels" in selectedChat) && (
              <div
                onClick={() => pinChannel(selectedChat.id)}
                className="cursor-pointer p-2 flex items-center justify-center bg-[#fafafa10] rounded-[6px]"
              >
                <PinOff
                  className={`w-4 h-4 ${
                    isPinnedChat
                      ? "text-[#fafafa] fill-[#fafafa]"
                      : "text-[#fafafa60] fill-[#fafafa60]"
                  }`}
                  aria-label={isPinnedChat ? "Unpin" : "Pin"}
                />
              </div>
            )}
        </div>

        {/* Right: Actions */}
        {isContact ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                setIsSmartSummary && setIsSmartSummary(!isSmartSummary)
              }
              className="p-1.5 my-1 flex gap-2 text-[11px] items-center rounded-[6px] bg-[#fafafa10] border border-[#ffffff03] text-[#ffffff] hover:text-[#ffffff] hover:bg-[#ffffff32] transition"
            >
              <SmilePlusIcon className="w-4 h-4" /> <span>Add a friend</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {isReadAll && (
              <button className="p-1 font-[600] px-3 flex gap-2 text-[11px] items-center rounded-[6px] cursor-pointer bg-[#ffffff06] border border-[#ffffff03] text-[#ffffff32] hover:text-[#ffffff64] hover:bg-[#ffffff32] transition">
                <CheckCheck className="w-5 h-5" /> <p>Read All</p>
              </button>
            )}
            {showSmartButton && selectedChat != "all-channels" && (
              <button
                onClick={() =>
                  setIsSmartSummary && setIsSmartSummary(!isSmartSummary)
                }
                className="p-1 font-[600] py-[7px] px-3 flex gap-2 text-[11px] items-center rounded-[6px] cursor-pointer text-[#fafafa] bg-[#fafafa10] hover:text-[#ffffff] hover:bg-[#3474ff] transition"
              >
                <img src={aiIMG} className="w-3 h-3" />
                <span>{smartText}</span>
              </button>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 relative">
        <div className="absolute h-[150%] w-[1px] bg-[#fafafa10] -top-2 left-0"></div>
      <div className="p-2 ml-2 rounded-[10px] inline-flex items-center justify-center cursor-pointer">
          <Pin
            className="h-4 w-4 fill-[#fafafa] text-[#fafafa]"
            onClick={() => setIsPinnedOpen(!isPinnedOpen)}
          />
        </div>
        <div className="p-2 rounded-[10px] inline-flex items-center justify-center cursor-pointer">
          <Bell
            className="h-4 w-4 fill-[#fafafa] text-[#fafafa]"
            onClick={() => setIsNotificationPanel(!isNotificationPanel)}
          />
        </div>
        <div className="relative flex-1 flex items-center border border-[#FAFAFA10] py-2 px-4 rounded-[8px] h-8">
          <Search className="w-5 h-5 text-[#ffffff48] absolute left-2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setDropdown(e.target.value !== "");
              setIsSearchOpen(e.target.value !== "");
            }}
            placeholder="Search"
            className="bg-transparent outline-none text-white flex-1 placeholder:text-[#ffffff48] pl-4 pr-8"
          />
          {searchTerm && (
            <button
              className="absolute right-2 text-[#ffffff48] hover:text-white"
              onClick={() => {
                setSearchTerm("");
                setIsSearchOpen(false);
              }}
              tabIndex={-1}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {dropdown && (
          <div
            ref={searchRef}
            className="absolute top-full mt-2 bg-[#212121] rounded-lg shadow-lg w-64 p-4 z-40"
          >
            <div className="">
              <span className="text-[#ffffff80] text-sm">Search Options</span>
              {options.map(({ value, label }) => {
                const isSelected = selectedOptions.includes(value);
                return (
                  <div
                    key={value}
                    className={`mb-1 flex items-center justify-between p-2 rounded cursor-pointer ${
                      isSelected ? "bg-[#5389ff]" : "hover:bg-[#2d2d2d]"
                    }`}
                    onClick={() => handleToggleOption(value)}
                  >
                    <span className="text-white">{label}</span>
                    {isSelected ? (
                      <X
                        className="text-white w-4 h-4 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOptions(
                            selectedOptions.filter((o) => o !== value)
                          );
                        }}
                      />
                    ) : (
                      <Plus className="text-white w-4 h-4" />
                    )}
                  </div>
                );
              })}
            </div>
            {searchHistory.length > 0 && (
              <div className="mt-4">
                <span className="text-[#ffffff80] text-sm">History</span>
                {searchHistory.slice(0, 5).map((historyItem) => (
                  <div
                    key={historyItem}
                    className="flex items-center justify-between p-2 hover:bg-[#2d2d2d] rounded cursor-pointer"
                    onClick={() => handleAddToSearch(historyItem)}
                  >
                    <span className="text-white">{historyItem}</span>
                  </div>
                ))}
                <div
                  className="flex items-center justify-between p-2 hover:bg-[#2d2d2d] rounded cursor-pointer"
                  onClick={handleClearHistory}
                >
                  <span className="text-white">Clear History</span>
                  <Trash className="text-white w-4 h-4" />
                </div>
              </div>
            )}
          </div>
        )}

      
      </div>
    </header>
  );
};

export default UnifiedHeader;
