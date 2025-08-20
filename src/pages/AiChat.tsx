import React, { useRef, useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { AppHeader } from "@/components/AppHeader";
import ChatPanel from "@/components/ChatPanel";
import UnifiedHeader from "@/components/UnifiedHeader";
import NotificationsPanel from "@/components/NotificationsPanel";
import PinnedPanel from "@/components/PinnedPanel";
import AddFriend from "@/components/AddFriend";

import AiChatBox from "@/components/AiChatBox"; // Your AI chat rendering component
import { SearchPanel } from "@/components/SearchPanel";

const AiChat = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [openPanel, setOpenPanel] = useState<
    null | "notification" | "pinned" | "search"
  >(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSource, setSelectedSource] = useState("All sources");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);

  const [chats, setChats] = useState([]); // Chat list
  const [chatsLoading, setChatsLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchChats = async () => {
      if (!user) {
        setChatsLoading(false);
        return;
      }
      setChatsLoading(true);
      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/ui/chats`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch chats");
        }
        const data = await response.json();
        setChats(data.chats || []);
      } catch (error) {
        console.error(error);
        toast({
          title: "Error",
          description: "Failed to load chats.",
          variant: "destructive",
        });
        setChats([]);
      } finally {
        setChatsLoading(false);
      }
    };
    fetchChats();
  }, [user]);

  const handleChatSelect = async (chat) => {
    setSelectedChat(chat);
    if (chat && chat.id) {
      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/chats/${chat.id}/read`,
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
          setChats((prev) =>
            prev.map((c) => (c.id === chat.id ? { ...c, read: true } : c))
          );
        }
      } catch (error) {
        console.error("Failed to mark chat as read:", error);
      }
    }
    navigate("/", { state: { selectedChat: chat } });
  };

  if (loading || chatsLoading) {
    return (
      <div className="min-h-screen bg-[#171717] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading chats...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Redirect to auth handled above
  }

  return (
    <Layout>
      <div className="flex-1 flex flex-col">
        <AppHeader
          isNotificationPanel={openPanel === "notification"}
          setIsNotificationPanel={(open) =>
            setOpenPanel(open ? "notification" : null)
          }
          isPinnedOpen={openPanel === "pinned"}
          setIsPinnedOpen={(open) => setOpenPanel(open ? "pinned" : null)}
          isSearchOpen={openPanel === "search"}
          setIsSearchOpen={(open) => setOpenPanel(open ? "search" : null)}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedOptions={selectedOptions}
          setSelectedOptions={setSelectedOptions}
        />
        <main className="flex-1 pb-0 pr-3 overflow-y-auto flex w-full justify-stretch border-t border-l border-[#23272f] rounded-tl-[12px] ">
          <ChatPanel
            chats={chats}
            onChatSelect={handleChatSelect}
            selectedChat={selectedChat}
          />
          <div className="w-full flex flex-col">
            <UnifiedHeader
              title="AI Chat"
              smartText=""
              isReadAll={false}
              isContact={false}
              isAI={true}
            />
            <AiChatBox/>
          </div>

          {openPanel === "notification" && <NotificationsPanel />}
          {openPanel === "pinned" && <PinnedPanel />}
          {openPanel === "search" && (
            <SearchPanel
              searchQuery={searchTerm}
              selectedSource={selectedSource}
              setSelectedSource={setSelectedSource}
              selectedOptions={selectedOptions}
            />
          )}
        </main>
      </div>
    </Layout>
  );
};

export default AiChat;
