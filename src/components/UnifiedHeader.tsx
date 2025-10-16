import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { CheckCheck, PinOff, SmilePlusIcon } from "lucide-react";
import aiIMG from "@/assets/images/aiBlue.png";
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
  selectedChat
}) => {
  console.log('scc',selectedChat)
  const location = useLocation();
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const authToken = localStorage.getItem("access_token");

  const [pinnedChats, setPinnedChats] = useState<any[]>([]);
  const [isPinnedChat, setIsPinnedChat] = useState(false);

  const getPinnedChats = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/pinned_chats`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        }
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
          Authorization: `Bearer ${authToken}`
        }
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
                Authorization: `Bearer ${authToken}`
              }
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
          await window.electronAPI.discord.connect(res.data);
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
      console.log('scc before tg', isTelegram)
      console.log('scc before dc', isDiscordChat)
      if (selectedChat === "all-channels") {
        setIsTelegram(true);
        setIsDiscordChat(true);
      } else if (selectedChat.platform.toLowerCase() === "telegram") {
        setIsTelegram(true);
        setIsDiscordChat(false);
      } else if (selectedChat.platform.toLowerCase() === "discord") {
        setIsTelegram(false);
        setIsDiscordChat(true);
      } else {
        // Optionally handle other cases
        setIsTelegram(false);
        setIsDiscordChat(false);
      }
      console.log('scc after tg', isTelegram)
      console.log('scc after dc', isDiscordChat)
    };
    

    fetchPlatforms()
    fetchStatuses();
  }, [authUser, selectedChat]);
  // Only show smart button on home
  const showSmartButton =
    location.pathname === "/" || (location.pathname === "/ai" && !isAI);

    
  return (
    <header className="flex flex-shrink-0 items-center justify-between px-6 py-1 border-b border-[#23272f] rounded-tl-[12px] py-2">
      {/* Left: Title and subtitle */}
      <div className="flex gap-2 items-center">
        {selectedChat==="all-channels" && <h1 className="text-[15px] text-[#ffffff72]">{title}</h1>}

        {telegramConnected && isTelegram && <span className="p-1.5 rounded-[6px] text-[11px] text-[#bfd6ff] bg-[#3474ff]">
          Telegram
        </span>}
        {discordConnected && isDiscordChat && <span className="p-1.5 rounded-[6px] text-[11px] text-[#d7d5ff] bg-[#7b5cfa]">
          Discord
        </span>}

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
          {showSmartButton && (
            <button
              onClick={() =>
                setIsSmartSummary && setIsSmartSummary(!isSmartSummary)
              }
              className="p-1 font-[600]  px-3 flex gap-2 text-[11px] items-center rounded-[6px] cursor-pointer text-[#84afff] bg-[#3474ff12] hover:text-[#ffffff] hover:bg-[#3474ff] transition"
            >
              <img src={aiIMG} className="w-5 h-5" />
              <span>{smartText}</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};

export default UnifiedHeader;
