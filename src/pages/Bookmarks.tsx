import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageCircle,
  Settings,
  Search,
  CheckSquare,
  Bell,
  LogOut,
} from "lucide-react";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { UnifiedInbox } from "@/components/UnifiedInbox";
import { DashboardSettings } from "@/components/DashboardSettings";
import { SearchPanel } from "@/components/SearchPanel";
import { ActionCenter } from "@/components/ActionCenter";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { SearchBarWithFilter } from "@/components/SearchBarWithFIlter";
import { AISummaryPanel } from "@/components/AISummaryPanel";
import { UnifiedTabs } from "@/components/UnifiedTabs";
import { AppChatList } from "@/components/AppChatList";
import { ChatHeader } from "@/components/ChatHeader";
import { ChatWindow } from "@/components/ChatWindow";
import { ChatInput } from "@/components/ChatInput";
import AIimg from "@/assets/images/authAI.png";
import { AppHeader } from "@/components/AppHeader";
import ChatPanel from "@/components/ChatPanel";
import UnifiedHeader from "@/components/UnifiedHeader";
import UnifiedChatPanel from "@/components/UnifiedChatPanel";
import TasksPanel from "@/components/TasksPanel";
import SmartTask from "@/components/SmartTasks";
import NotificationsPanel from "@/components/NotificationsPanel";
import PinnedPanel from "@/components/PinnedPanel";
import SmartBookmark from "@/components/SmartBookmark";
import FavoritesPanel from "@/components/FavoritesPanel";

const Bookmarks = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [activeTab, setActiveTab] = useState("ai");
  const [isConnected, setIsConnected] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [isSmartTask, setIsSmartTask] = useState(false);
  const [openPanel, setOpenPanel] = useState<
    null | "smartTask" | "notification" | "pinned" | "search" | "favorites"
  >(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [favoriteChats, setFavoriteChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [chats, setChats] = useState([]); // State to store fetched chats
  const [chatsLoading, setChatsLoading] = useState(true); // Loading state for chats
  const [selectedChat, setSelectedChat] = useState(null); // State for selected chat
  const [selectedSource, setSelectedSource] = useState("All sources");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      // Check if user has completed onboarding
      const onboardingComplete = localStorage.getItem(
        `chatpilot_onboarded_${user.id}`
      );
      if (onboardingComplete) {
        setIsOnboarded(true);
        setIsConnected(true);
      }
    }
  }, [user]);

  // Fetch chats that contain favorited messages
  useEffect(() => {
    const fetchFavoriteChats = async () => {
      if (!user) return;

      try {
        setLoadingChats(true);
        const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
        const token = localStorage.getItem("access_token");

        // Use the existing /ui/chats endpoint to get all chats
        const chatsResponse = await fetch(`${BACKEND_URL}/ui/chats`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!chatsResponse.ok) {
          throw new Error(`Failed to fetch chats: ${chatsResponse.status}`);
        }

        const allChats = await chatsResponse.json();

        // Get bookmarks to filter chats
        const bookmarksResponse = await fetch(
          `${BACKEND_URL}/bookmarks?type=bookmark`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!bookmarksResponse.ok) {
          throw new Error(
            `Failed to fetch bookmarks: ${bookmarksResponse.status}`
          );
        }

        const bookmarks = await bookmarksResponse.json();

        if (bookmarks.length === 0) {
          setFavoriteChats([]);
          setLoadingChats(false);
          return;
        }

        // Get unique chat IDs from bookmarks
        const chatIdsWithBookmarks = [
          ...new Set(bookmarks.map((b) => b.chat_id)),
        ];

        // Check the structure of allChats - it might be different than expected
        const chatsArray = allChats.chats || allChats;

        // Filter chats to only show those with bookmarks
        const chatsWithBookmarks = chatsArray.filter((chat) =>
          chatIdsWithBookmarks.includes(chat.id)
        );

        // Add bookmark count and enhance chat data
        const enhancedChats = chatsWithBookmarks.map((chat) => {
          const bookmarkCount = bookmarks.filter(
            (b) => b.chat_id === chat.id
          ).length;
          return {
            ...chat,
            bookmarkCount,
            // Ensure we have the required fields for ChatPanel
            platform: chat.platform || "Telegram",
            tags: chat.tags || [],
            read: chat.read || false,
            unread: chat.unread || 0,
            isPinned: chat.isPinned || false,
            pinned: chat.isPinned || false,
          };
        });

        setFavoriteChats(enhancedChats);
      } catch (error) {
        console.error("Error fetching favorite chats:", error);
        toast({
          title: "Error",
          description: "Failed to load favorite chats",
          variant: "destructive",
        });
      } finally {
        setLoadingChats(false);
      }
    };

    if (user) {
      fetchFavoriteChats();
    }
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  // Fetch chats from backend
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
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // Assuming data.chats is the array of chat objects
        setChats(data.chats || []);
      } catch (error) {
        console.error("Failed to fetch chats:", error);
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

    // Mark the chat as read when selected
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
          // Update the chat's read status in the local state
          setChats((prevChats) =>
            prevChats.map((c) => (c.id === chat.id ? { ...c, read: true } : c))
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
          <div className="w-24 h-24 bg-gradient-to-r rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <img src={AIimg} className="w-20 h-20 text-white" />
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth page
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
          setIsPinnedOpen={(open) => {
            setOpenPanel(open ? "pinned" : null);
          }}
          isSearchOpen={openPanel === "search"}
          setIsSearchOpen={(open) => {
            setOpenPanel(open ? "search" : null);
          }}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedOptions={selectedOptions}
          setSelectedOptions={setSelectedOptions}
        />
        <main className="flex-1 pb-0 pr-3 overflow-y-auto flex w-full justify-stretch border-t border-l border-[#23272f] rounded-tl-[12px] ">
          <ChatPanel
            chats={favoriteChats}
            onChatSelect={(chat) => {
              if (chat && chat.id) {
                setSelectedId(chat.id);
              }
            }}
            selectedChat={selectedId}

            // chats={chats} // RC/FixesNew
            // onChatSelect={handleChatSelect} // RC/FixesNew
            // selectedChat={selectedChat} // RC/FixesNew
          />
          <div className="w-full">
            <UnifiedHeader
              title="Bookmarks"
              smartText="Smart Tasks"
              isReadAll={false}
              isSmartSummary={openPanel === "smartTask"}
              setIsSmartSummary={(open) =>
                setOpenPanel(open ? "smartTask" : null)
              }
            />
            {/* Show FavoritesPanel by default */}
            <FavoritesPanel />
          </div>

          {openPanel === "smartTask" && <SmartBookmark />}
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

export default Bookmarks;
