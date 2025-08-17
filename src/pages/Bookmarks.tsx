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
    null | "smartTask" | "notification" | "pinned" | "search"
  >(null);

  // ✅ ADD: Missing chat state variables
  const [chats, setChats] = useState([]); // State to store fetched chats
  const [chatsLoading, setChatsLoading] = useState(true); // Loading state for chats
  const [selectedChat, setSelectedChat] = useState(null); // State for selected chat

  const scrollRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  // ✅ ADD: Missing chat fetching logic
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
        console.log("✅ Bookmarks page fetched chats:", data.chats || []);
      } catch (error) {
        console.error("❌ Failed to fetch chats in bookmarks page:", error);
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

  // ✅ ADD: Missing chat selection handler
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
  };

  // ✅ UPDATE: Include chatsLoading in the loading check
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
          // onOpenPinnedPanel={() => setOpenPanel("pinned")}
          isPinnedOpen={openPanel === "pinned"}
          setIsPinnedOpen={(open) => {
            setOpenPanel(open ? "pinned" : null);
          }}
          isSearchOpen={openPanel === "search"}
          setIsSearchOpen={(open) => {
            setOpenPanel(open ? "search" : null)
          }}
        />
        <main className="flex-1 pb-0 pr-3 overflow-y-auto flex w-full justify-stretch border-t border-l border-[#23272f] rounded-tl-[12px] ">
          {/* ✅ FIX: Add missing props to ChatPanel */}
          <ChatPanel 
            chats={chats}
            onChatSelect={handleChatSelect}
            selectedChat={selectedChat}
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
            <UnifiedChatPanel />
          </div>

          {openPanel === "smartTask" && <SmartBookmark />}
          {openPanel === "notification" && <NotificationsPanel />}
          {openPanel === "pinned" && <PinnedPanel />}
          {openPanel === "search" && <SearchPanel />}
        </main>
      </div>
    </Layout>
  );
};

export default Bookmarks;