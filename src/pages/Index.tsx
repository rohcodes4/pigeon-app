import React, { useRef, useState, useEffect } from "react";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { SearchPanel } from "@/components/SearchPanel";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { AppHeader } from "@/components/AppHeader";
import ChatPanel from "@/components/ChatPanel";
import UnifiedHeader from "@/components/UnifiedHeader";
import UnifiedChatPanel from "@/components/UnifiedChatPanel";
import SmartSummary from "@/components/SmartSummary";
import NotificationsPanel from "@/components/NotificationsPanel";
import PinnedPanel from "@/components/PinnedPanel";
import { useLocation } from "react-router-dom";
import { mapDiscordToTelegramSchema } from "@/lib/utils";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const stateChat = location.state?.selectedChat;
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [activeTab, setActiveTab] = useState("ai");
  const [isConnected, setIsConnected] = useState(false);
  const [coin, setCoin] = useState(coinOptions[0]);
  const [filters, setFilters] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [aiChats, setAiChats] = useState(fakeChatsAI);
  const [alphaChats, setAlphaChats] = useState(fakeChatsAlpha);
  const [isSmartSummary, setIsSmartSummary] = useState(false);
  const [isNotificationPanel, setIsNotificationPanel] = useState(false);
  const [openPanel, setOpenPanel] = useState<
    null | "smartSummary" | "notification" | "pinned" | "search"
  >(null);
  const [chats, setChats] = useState([]); // State to store fetched chats
  const [chatsLoading, setChatsLoading] = useState(true); // Loading state for chats
  const [selectedChat, setSelectedChat] = useState(stateChat || "all-channels");
  // ADD these state hooks near the top
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSource, setSelectedSource] = useState("All sources");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const [telegramChats, setTelegramChats] = useState([]);
  const [syncProgress, setSyncProgress] = useState({ discord: 0, telegram: 0 });
  const [syncingInProgress, setSyncingInProgress] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(true);
  const [syncComplete, setSyncComplete] = useState(true);
  const [hasStartedFindingChats, setHasStartedFindingChats] = useState(false);
  const [initialSyncTriggered, setInitialSyncTriggered] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const handleOpenSmartSummary = () => setOpenPanel("smartSummary");
  const handleOpenNotificationPanel = () => setOpenPanel("notification");
  const handleOpenPinnedPanel = () => setOpenPanel("pinned");
  const handleClosePanel = () => setOpenPanel(null);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem("access_token");

  const scrollRef = useRef<HTMLDivElement>(null);

  // Function to start sync polling
  const startSyncPolling = async () => {
    // Start with a small delay to let sync begin
    await new Promise((r) => setTimeout(r, 1000));

    // Track if we've seen significant progress recently
    let lastSignificantProgress = Date.now();
    let consecutiveStablePolls = 0;
    const maxStablePolls = 11; // Stop after 11 consecutive stable polls

    // Continue polling until sync is complete
    let consecutiveEmptyPolls = 0;
    const maxConsecutiveEmpty = 8; // Increased tolerance
    let lastChatCount = telegramChats.length;
    let stableCountPolls = 0;
    const requiredStablePolls = 10; // Increased from 5 to 10 for more stability
    let lastProgressTime = Date.now();

    let isTimedOut = false;
    const timeout = setTimeout(() => {
      isTimedOut = true;
      setSyncingInProgress(true); // Stop showing sync progress on UI
      setTelegramLoading(true);
      setSyncComplete(true); // Mark UI as "Sync complete"
      console.log("Sync timeout reached (3s), UI transitions to complete.");
      // Optionally, keep polling in background for real sync completion
    }, 3000); // 10 seconds

    for (let i = 0; i < 200; i++) {
      // if (isTimedOut) break;
      // Increased max attempts for much longer sync
      const r2 = await fetch(`${BACKEND_URL}/ui/chats?include_all=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (r2.ok) {
        const data2 = await r2.json();
        const chats2 = Array.isArray(data2)
          ? data2
          : Array.isArray(data2.chats)
          ? data2.chats
          : [];
        // const chats2=[]

        // Update chats immediately to show progress
        setTelegramChats(chats2);
        console.log(`Poll ${i}: Found ${chats2.length} chats`);

        // If we got chats, reset the empty poll counter
        if (chats2.length > 0) {
          if (!hasStartedFindingChats) {
            setHasStartedFindingChats(true);
          }
          consecutiveEmptyPolls = 0;

          // Check if chat count is stable (indicating sync might be complete)
          if (chats2.length === lastChatCount) {
            stableCountPolls++;
            consecutiveStablePolls++;

            // Check if we've been stable for too long (indicating sync is likely complete)
            if (
              consecutiveStablePolls >= maxStablePolls &&
              chats2.length >= 50
            ) {
              console.log(
                `Sync appears complete: ${chats2.length} chats found, stable for ${consecutiveStablePolls} consecutive polls`
              );
              // setSyncingInProgress(false);
              setTelegramLoading(false);
              setSyncComplete(true);
              return;
            }

            // Only consider sync complete if we've been stable for a long time AND have a good number of chats
            if (
              stableCountPolls >= requiredStablePolls &&
              chats2.length >= 50 && // Increased minimum chat requirement
              i >= 100 // Must have polled for at least 100 iterations
            ) {
              // Chat count has been stable for many polls, likely sync is complete
              console.log(
                `Sync appears complete: ${chats2.length} chats found, stable for ${stableCountPolls} polls after ${i} iterations`
              );
              setSyncingInProgress(false);
              setTelegramLoading(false);
              setSyncComplete(true); // Mark as complete
              return;
            }
          } else {
            // Chat count changed, reset stability counter and update last count
            stableCountPolls = 0;
            consecutiveStablePolls = 0; // Reset consecutive stable counter
            lastChatCount = chats2.length;
            lastProgressTime = Date.now(); // Reset progress timer
            lastSignificantProgress = Date.now(); // Reset significant progress timer
          }

          // Continue syncing for a much longer time
          if (i >= 120) {
            // At least 120 polls (about 4-5 minutes)
            // Only stop if we have a very good number of chats and they've been stable for a while
            if (chats2.length >= 100 && stableCountPolls >= 8) {
              console.log(
                `Stopping sync after ${i} polls with ${chats2.length} chats and ${stableCountPolls} stable polls`
              );
              setSyncingInProgress(false);
              setTelegramLoading(false);
              setSyncComplete(true); // Mark as complete
              return;
            }
          }

          // Additional check: if no progress for a very long time, consider stopping
          const timeSinceProgress = Date.now() - lastProgressTime;
          if (timeSinceProgress > 300000 && i >= 80) {
            // 5 minutes without progress
            console.log(
              `No progress for 5 minutes, stopping sync. Found ${chats2.length} chats`
            );
            setSyncingInProgress(false);
            setTelegramLoading(false);
            setSyncComplete(true); // Mark as complete
            return;
          }

          // Additional check: if we've been stable for a reasonable time, consider sync complete
          const timeSinceSignificantProgress =
            Date.now() - lastSignificantProgress;
          if (
            timeSinceSignificantProgress > 120000 &&
            consecutiveStablePolls >= 10 &&
            chats2.length >= 50
          ) {
            // 2 minutes without significant progress and stable for 10+ polls
            console.log(
              `Sync appears complete: ${chats2.length} chats found, stable for ${consecutiveStablePolls} polls, no significant progress for 2 minutes`
            );
            setSyncingInProgress(false);
            setTelegramLoading(false);
            setSyncComplete(true);
            return;
          }
        } else {
          consecutiveEmptyPolls++;

          // If we've had too many empty polls in a row, stop
          if (consecutiveEmptyPolls >= maxConsecutiveEmpty && i >= 30) {
            break;
          }
        }
      }

      // Wait before next poll - shorter intervals for more responsive updates
      const waitTime = Math.min(600 + i * 30, 1500); // 600ms to 1.5s for faster updates
      await new Promise((r) => setTimeout(r, waitTime));

      // Every 20 polls, check if we should stop (backend might be done)
      if (i % 20 === 0 && i > 0) {
        try {
          // Check if there are any active sync operations by looking at recent activity
          const syncCheck = await fetch(
            `${BACKEND_URL}/ui/chats?include_all=true`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (syncCheck.ok) {
            const syncData = await syncCheck.json();
            const currentChats = Array.isArray(syncData)
              ? syncData
              : Array.isArray(syncData.chats)
              ? syncData.chats
              : [];

            // If chat count hasn't changed in the last few checks, consider sync complete
            if (
              currentChats.length === lastChatCount &&
              consecutiveStablePolls >= 8
            ) {
              console.log(
                `Sync appears complete: ${currentChats.length} chats found, stable across multiple checks`
              );
              setSyncingInProgress(false);
              setTelegramLoading(false);
              setSyncComplete(true);
              return;
            }
          }
        } catch (e) {
          // Continue polling if check fails
          console.log("Sync check failed, continuing:", e);
        }
      }
    }
    clearTimeout(timeout);

    // If we reach here, sync has been running for a while
    console.log(
      `Sync polling completed after ${200} iterations with ${
        telegramChats.length
      } chats`
    );
    setSyncingInProgress(true);
    setTelegramLoading(true);
    setSyncComplete(true); // Mark as complete even if we hit the limit
  };

  useEffect(() => {
    if (!user) return;

    // Just load existing chats without starting sync
    const loadExistingChats = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/ui/chats?include_all=true`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const chats = Array.isArray(data)
            ? data
            : Array.isArray(data.chats)
            ? data.chats
            : [];
          if (chats.length > 0) {
            setTelegramChats(chats);
            setTelegramLoading(false);
          } else {
            setTelegramLoading(false);
          }
        } else {
          setTelegramLoading(false);
        }
      } catch (e) {
        console.error("Error loading existing chats:", e);
        setTelegramLoading(false);
        setTelegramChats([]);
      }
    };

    loadExistingChats();
  }, [user]);

  //     async function startLoadingChats () {
  //       console.log('loading loading loading')
  //       // Start the initial sync
  //       setSyncingInProgress(true);
  //       setTelegramLoading(true);
  //       setInitialSyncTriggered(true);
  //       setHasStartedFindingChats(false);
  //       setSyncComplete(false);

  //       try {
  //         // Start syncing
  //         await fetch(`${BACKEND_URL}/api/sync-dialogs`, {
  //           method: "POST",
  //           headers: { Authorization: `Bearer ${token}` },
  //         });

  //         // Start polling for progress
  //         startSyncPolling();
  //       setSyncComplete(true);
  //       } catch (e) {
  //         console.error("Failed to start sync:", e);
  //         // setSyncingInProgress(false);
  //         // setTelegramLoading(false);
  //       }
  // }

  // useEffect(() => {
  //   if(currentStep===1)
  //   startLoadingChats()
  // }, [currentStep]);

  useEffect(() => {
    if (stateChat) {
      setSelectedChat(stateChat);
    }
  }, [stateChat]);

  const handleAISummary = (id, tab) => {
    const updateChats = (chats) =>
      chats.map((chat) =>
        chat.id === id
          ? { ...chat, lastUpdated: new Date().toISOString() }
          : chat
      );
    if (tab === "ai") setAiChats((prev) => updateChats(prev));
    else setAlphaChats((prev) => updateChats(prev));
  };

  // Handler: Pin chat
  const handlePin = (id, tab) => {
    const updateChats = (chats) =>
      chats.map((chat) =>
        chat.id === id ? { ...chat, isPinned: !chat.isPinned } : chat
      );
    if (tab === "ai") setAiChats((prev) => updateChats(prev));
    else setAlphaChats((prev) => updateChats(prev));
  };

  // Handler: Mute chat
  const handleMute = (id, tab) => {
    const updateChats = (chats) =>
      chats.map((chat) =>
        chat.id === id ? { ...chat, isMuted: !chat.isMuted } : chat
      );
    if (tab === "ai") setAiChats((prev) => updateChats(prev));
    else setAlphaChats((prev) => updateChats(prev));
  };

  // Handler: Open platform
  const handleOpenPlatform = (chat) => {
    if (chat.platform === "Discord") {
      window.open("https://discord.com/app", "_blank");
    } else if (chat.platform === "Telegram") {
      window.open("https://web.telegram.org/", "_blank");
    }
  };

  const handleSelect = (id) => setSelectedId(id);

  // Handle chat selection
  const handleChatSelect = async (chat) => {
    setSelectedChat(chat);
    // console.log("Selected chat:", chat.id);

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

  const getSortedChats = (chats) => [
    ...chats.filter((c) => c.isPinned),
    ...chats.filter((c) => !c.isPinned),
  ];

  const handleAction = (id, tab) => {
    // Implement your custom action logic here
    // For example, show a toast or open a modal
    toast({
      title: "Action triggered",
      description: `Action button clicked for chat ID: ${id} (tab: ${tab})`,
    });
  };

  const handleFilterClick = () => {
    // Open filter modal or apply filters
  };

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
          `${import.meta.env.VITE_BACKEND_URL}/ui/chats?include_all=true`,
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
        setChats(data.chats || []);
        const res = await window.electronAPI.security.getDiscordToken();
        if (res?.success && res?.data) {
          await window.electronAPI.discord.connect(res.data);
        }
        const dms = await window.electronAPI.discord.getDMs(); // remove listener if supported
        const discordChats = dms.data?.map(mapDiscordToTelegramSchema);
        discordChats.sort((a, b) => Number(b.id) - Number(a.id));
        // Merge both
        const allChats = [...data.chats, ...discordChats];

        // Store initial chats - this only runs once on load
        setChats(allChats || []);
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


  // Lightweight polling: refresh sidebar chats every 30s with smart merging
  useEffect(() => {
    if (!user) return;
    let timer: any = null;
    const poll = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/ui/chats?include_all=true`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          const newChats = data.chats || [];
          // Fetch Discord DMs
          const dms = await window.electronAPI.discord.getDMs(); // remove listener if supported
          const discordChats = dms.data?.map(mapDiscordToTelegramSchema);
          discordChats.sort((a, b) => Number(b.id) - Number(a.id));
          // Merge both
          const allChats = [...newChats, ...discordChats];

          // Smart merge: only update if there are actual changes
          setChats((prevChats) => {
            // Create maps for efficient comparison
            const prevMap = new Map(prevChats.map((chat) => [chat.id, chat]));

            // Check if there are meaningful changes
            let hasChanges = prevChats.length !== allChats.length;

            if (!hasChanges) {
              // Check for updates in existing chats
              for (const newChat of allChats) {
                const prevChat = prevMap.get(newChat.id);
                if (
                  !prevChat ||
                  prevChat.unread !== newChat.unread ||
                  prevChat.lastMessage !== newChat.lastMessage ||
                  prevChat.timestamp !== newChat.timestamp ||
                  prevChat.is_typing !== newChat.is_typing
                ) {
                  hasChanges = true;
                  break;
                }
              }
            }

            // Only update if there are actual changes
            return hasChanges ? allChats : prevChats;
          });
        }
      } catch (_) {
        // ignore transient polling errors
      } finally {
        timer = setTimeout(poll, 30000); // Increased to 30s to reduce server load
      }
    };
    timer = setTimeout(poll, 30000);
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [user]);

  const handleOnboardingComplete = () => {
    if (user) {
      localStorage.setItem(`chatpilot_onboarded_${user.id}`, "true");
      setIsOnboarded(true);
      setIsConnected(true);
      toast({
        title: "Welcome to ChatPilot!",
        description:
          "Your dashboard is ready. Start managing your conversations.",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out",
    });
  };

  // if (loading || chatsLoading) {
  //   return (
  //     <div className="min-h-screen bg-[#171717] flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="w-24 h-24 bg-gradient-to-r rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
  //           <img src={AIimg} className="w-20 h-20 text-white" />
  //         </div>
  //         <p className="text-gray-600">Loading...</p>
  //       </div>
  //     </div>
  //   );
  // }

  if (!user) {
    return null; // Will redirect to auth page
  }

  if (!isOnboarded) {
    return (
      <OnboardingFlow
        onComplete={handleOnboardingComplete}
        telegramChats={telegramChats}
        setTelegramChats={setTelegramChats}
        syncProgress={syncProgress}
        setSyncProgress={setSyncProgress}
        syncingInProgress={syncingInProgress}
        setSyncingInProgress={setSyncingInProgress}
        startSyncPolling={startSyncPolling}
        telegramLoading={telegramLoading}
        setTelegramLoading={setTelegramLoading}
        syncComplete={syncComplete}
        setSyncComplete={setSyncComplete}
        hasStartedFindingChats={hasStartedFindingChats}
        setHasStartedFindingChats={setHasStartedFindingChats}
        initialSyncTriggered={initialSyncTriggered}
        setInitialSyncTriggered={setInitialSyncTriggered}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
      />
    );
  }

  return (
    <Layout>
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
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
            setOpenPanel(open ? "search" : null);
          }}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedOptions={selectedOptions}
          setSelectedOptions={setSelectedOptions}
        />
        <main className="h-[calc(100vh-72px)] flex pb-0 pr-3 space-x-0 flex max-w-screen justify-stretch border-t border-l border-[#23272f] rounded-tl-[12px] overflow-hidden">
          <ChatPanel
            chats={chats}
            onChatSelect={handleChatSelect}
            selectedChat={selectedChat}
          />
          <div
            className={`h-[calc(100vh-72px)] min-w-0 flex flex-col flex-grow ${
              openPanel !== null ? "max-w-[calc(100vw_-_914px)]" : "max-w-full"
            }`}
          >
            <UnifiedHeader
              title="Unified Inbox"
              smartText="Summarize"
              isReadAll={true}
              isSmartSummary={openPanel === "smartSummary"}
              setIsSmartSummary={(open) =>
                setOpenPanel(open ? "smartSummary" : null)
              }
              isPinnable={true}
              selectedChat={selectedChat}
            />
            <UnifiedChatPanel selectedChat={selectedChat} />
          </div>
          {openPanel === "smartSummary" && (
            <SmartSummary
              selectedChat={selectedChat}
              chatId={selectedChat.id}
            />
          )}
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

export default Index;

export const fakeChats = [
  {
    id: "1",
    name: "General",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    lastMessage: "Hey, how's it going?",
    unread: 2,
    platform: "Discord",
  },
  {
    id: "2",
    name: "Product Team",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    lastMessage: "The new release is live! 🚀",
    unread: 0,
    platform: "Telegram",
  },
  {
    id: "3",
    name: "AI Research",
    avatar: "https://randomuser.me/api/portraits/men/65.jpg",
    lastMessage: "Check out this new paper.",
    unread: 5,
    platform: "Discord",
  },
  {
    id: "4",
    name: "Family",
    avatar: "https://randomuser.me/api/portraits/women/12.jpg",
    lastMessage: "Dinner at 7?",
    unread: 0,
    platform: "Telegram",
  },
  {
    id: "5",
    name: "Book Club",
    avatar: "https://randomuser.me/api/portraits/men/23.jpg",
    lastMessage: "Next meeting: Friday!",
    unread: 1,
    platform: "Discord",
  },
];

function randomDateWithinLast24Hours() {
  const now = Date.now();
  const msIn24Hours = 24 * 60 * 60 * 1000;
  const randomPast = now - Math.floor(Math.random() * msIn24Hours);
  return new Date(randomPast).toISOString();
}
export const fakeChatsAI = [
  {
    id: "1",
    name: "General",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    lastMessage: "Hey, how's it going?",
    unread: 2,
    platform: "Discord",
    aiSummary: "AI: Discussed project deadlines.",
    lastUpdated: randomDateWithinLast24Hours(),
    isPinned: false,
    isMuted: false,
  },
  {
    id: "2",
    name: "Product Team",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    lastMessage: "The new release is live! 🚀",
    unread: 0,
    platform: "Telegram",
    aiSummary: "",
    lastUpdated: randomDateWithinLast24Hours(),
    isPinned: true,
    isMuted: false,
  },
  {
    id: "3",
    name: "AI Research",
    avatar: "https://randomuser.me/api/portraits/men/65.jpg",
    lastMessage: "Check out this new paper.",
    unread: 5,
    platform: "Discord",
    lastUpdated: randomDateWithinLast24Hours(),
    isPinned: false,
    isMuted: true,
  },
  {
    id: "4",
    name: "Family",
    avatar: "https://randomuser.me/api/portraits/women/12.jpg",
    lastMessage: "Dinner at 7?",
    unread: 0,
    platform: "Telegram",
    aiSummary: "AI: Family dinner plans.",
    lastUpdated: randomDateWithinLast24Hours(),
    isPinned: false,
    isMuted: false,
  },
  {
    id: "5",
    name: "Book Club",
    avatar: "https://randomuser.me/api/portraits/men/23.jpg",
    lastMessage: "Next meeting: Friday!",
    unread: 1,
    platform: "Discord",
    aiSummary: "AI: Book club meeting scheduled.",
    lastUpdated: randomDateWithinLast24Hours(),
    isPinned: false,
    isMuted: false,
  },
  {
    id: "6",
    name: "Crypto Chat",
    avatar: "https://randomuser.me/api/portraits/men/24.jpg",
    lastMessage: "BTC is pumping!",
    unread: 3,
    platform: "Discord",
    aiSummary: "AI: Crypto market updates.",
    lastUpdated: randomDateWithinLast24Hours(),
    isPinned: false,
    isMuted: false,
  },
  {
    id: "7",
    name: "Design Team",
    avatar: "https://randomuser.me/api/portraits/women/25.jpg",
    lastMessage: "New Figma file shared.",
    unread: 0,
    platform: "Telegram",
    aiSummary: "AI: Design assets updated.",
    lastUpdated: randomDateWithinLast24Hours(),
    isPinned: false,
    isMuted: false,
  },
  {
    id: "8",
    name: "Marketing",
    avatar: "https://randomuser.me/api/portraits/men/26.jpg",
    lastMessage: "Campaign launch tomorrow.",
    unread: 2,
    platform: "Discord",
    aiSummary: "AI: Marketing campaign scheduled.",
    lastUpdated: randomDateWithinLast24Hours(),
    isPinned: false,
    isMuted: true,
  },
  {
    id: "9",
    name: "Support",
    avatar: "https://randomuser.me/api/portraits/women/27.jpg",
    lastMessage: "Ticket #123 resolved.",
    unread: 0,
    platform: "Telegram",
    aiSummary: "AI: Support ticket closed.",
    lastUpdated: randomDateWithinLast24Hours(),
    isPinned: false,
    isMuted: false,
  },
  {
    id: "10",
    name: "Gaming Buddies",
    avatar: "https://randomuser.me/api/portraits/men/28.jpg",
    lastMessage: "Game night at 8!",
    unread: 4,
    platform: "Discord",
    aiSummary: "AI: Scheduled game night.",
    lastUpdated: randomDateWithinLast24Hours(),
    isPinned: false,
    isMuted: false,
  },
  {
    id: "11",
    name: "Fitness Group",
    avatar: "https://randomuser.me/api/portraits/women/29.jpg",
    lastMessage: "5k run this weekend.",
    unread: 0,
    platform: "Telegram",
    aiSummary: "AI: Fitness event planned.",
    lastUpdated: randomDateWithinLast24Hours(),
    isPinned: false,
    isMuted: false,
  },
  {
    id: "12",
    name: "Travel Buddies",
    avatar: "https://randomuser.me/api/portraits/men/30.jpg",
    lastMessage: "Tickets booked!",
    unread: 1,
    platform: "Discord",
    aiSummary: "AI: Travel tickets confirmed.",
    lastUpdated: randomDateWithinLast24Hours(),
    isPinned: false,
    isMuted: false,
  },
  {
    id: "13",
    name: "Photography",
    avatar: "https://randomuser.me/api/portraits/women/31.jpg",
    lastMessage: "New photo challenge posted.",
    unread: 0,
    platform: "Telegram",
    aiSummary: "AI: Photo challenge announced.",
    lastUpdated: randomDateWithinLast24Hours(),
    isPinned: false,
    isMuted: false,
  },
  {
    id: "14",
    name: "Science Club",
    avatar: "https://randomuser.me/api/portraits/men/33.jpg",
    lastMessage: "Experiment results shared.",
    unread: 2,
    platform: "Discord",
    aiSummary: "AI: Science experiment update.",
    lastUpdated: randomDateWithinLast24Hours(),
    isPinned: false,
    isMuted: false,
  },
  {
    id: "15",
    name: "History Buffs",
    avatar: "https://randomuser.me/api/portraits/women/34.jpg",
    lastMessage: "Next topic: WWII.",
    unread: 0,
    platform: "Telegram",
    aiSummary: "AI: History topic set.",
    lastUpdated: randomDateWithinLast24Hours(),
    isPinned: false,
    isMuted: false,
  },
  {
    id: "16",
    name: "Language Exchange",
    avatar: "https://randomuser.me/api/portraits/men/35.jpg",
    lastMessage: "Spanish session at 6pm.",
    unread: 1,
    platform: "Discord",
    aiSummary: "AI: Language session scheduled.",
    lastUpdated: randomDateWithinLast24Hours(),
    isPinned: false,
    isMuted: false,
  },
  {
    id: "17",
    name: "Memes",
    avatar: "https://randomuser.me/api/portraits/women/36.jpg",
    lastMessage: "Check this meme!",
    unread: 0,
    platform: "Telegram",
    aiSummary: "AI: New meme shared.",
    lastUpdated: randomDateWithinLast24Hours(),
    isPinned: false,
    isMuted: false,
  },
  {
    id: "18",
    name: "Coding",
    avatar: "https://randomuser.me/api/portraits/men/37.jpg",
    lastMessage: "PR merged.",
    unread: 3,
    platform: "Discord",
    aiSummary: "AI: Code merged to main.",
    lastUpdated: randomDateWithinLast24Hours(),
    isPinned: false,
    isMuted: false,
  },
  {
    id: "19",
    name: "AI Enthusiasts",
    avatar: "https://randomuser.me/api/portraits/women/38.jpg",
    lastMessage: "New AI model released.",
    unread: 0,
    platform: "Telegram",
    aiSummary: "AI: Model release update.",
    lastUpdated: randomDateWithinLast24Hours(),
    isPinned: false,
    isMuted: false,
  },
  {
    id: "20",
    name: "Music Lovers",
    avatar: "https://randomuser.me/api/portraits/men/39.jpg",
    lastMessage: "Playlist updated.",
    unread: 2,
    platform: "Discord",
    aiSummary: "AI: Playlist changes.",
    lastUpdated: randomDateWithinLast24Hours(),
    isPinned: false,
    isMuted: false,
  },
];

export const fakeChatsAlpha = [
  {
    id: "a1",
    name: "Alpha Team",
    avatar: "https://randomuser.me/api/portraits/men/45.jpg",
    lastMessage: "Alpha launch is tomorrow!",
    unread: 1,
    platform: "Discord",
    aiSummary: "AI: Alpha launch scheduled.",
    lastUpdated: randomDateWithinLast24Hours(),
    isPinned: true,
    isMuted: false,
  },
  {
    id: "a2",
    name: "Beta Testers",
    avatar: "https://randomuser.me/api/portraits/women/33.jpg",
    lastMessage: "Feedback received.",
    unread: 0,
    platform: "Telegram",
    aiSummary: "AI: Beta feedback collected.",
    lastUpdated: randomDateWithinLast24Hours(),
    isPinned: false,
    isMuted: false,
  },
  {
    id: "a3",
    name: "QA Squad",
    avatar: "https://randomuser.me/api/portraits/men/46.jpg",
    lastMessage: "Bug #42 fixed.",
    unread: 2,
    platform: "Discord",
    aiSummary: "AI: Bug fix update.",
    lastUpdated: randomDateWithinLast24Hours(),
    isPinned: false,
    isMuted: true,
  },
  {
    id: "a4",
    name: "UI/UX",
    avatar: "https://randomuser.me/api/portraits/women/47.jpg",
    lastMessage: "New design uploaded.",
    unread: 0,
    platform: "Telegram",
    aiSummary: "AI: UI design shared.",
    lastUpdated: randomDateWithinLast24Hours(),
    isPinned: false,
    isMuted: false,
  },
  {
    id: "a5",
    name: "DevOps",
    avatar: "https://randomuser.me/api/portraits/men/48.jpg",
    lastMessage: "Deployment successful.",
    unread: 1,
    platform: "Discord",
    aiSummary: "AI: Deployment completed.",
    lastUpdated: randomDateWithinLast24Hours(),
    isPinned: false,
    isMuted: false,
  },
  {
    id: "a6",
    name: "Growth Hackers",
    avatar: "https://randomuser.me/api/portraits/women/49.jpg",
    lastMessage: "Growth up 10% this week.",
    unread: 0,
    platform: "Telegram",
    aiSummary: "AI: Growth metrics updated.",
    lastUpdated: randomDateWithinLast24Hours(),
    isPinned: false,
    isMuted: false,
  },
  {
    id: "a7",
    name: "Investors",
    avatar: "https://randomuser.me/api/portraits/men/50.jpg",
    lastMessage: "Quarterly report shared.",
    unread: 3,
    platform: "Discord",
    aiSummary: "AI: Report sent to investors.",
    lastUpdated: randomDateWithinLast24Hours(),
    isPinned: false,
    isMuted: false,
  },
  {
    id: "a8",
    name: "Legal",
    avatar: "https://randomuser.me/api/portraits/women/51.jpg",
    lastMessage: "Contract signed.",
    unread: 0,
    platform: "Telegram",
    aiSummary: "AI: Contract finalized.",
    lastUpdated: randomDateWithinLast24Hours(),
    isPinned: false,
    isMuted: false,
  },
  {
    id: "a9",
    name: "Partners",
    avatar: "https://randomuser.me/api/portraits/men/52.jpg",
    lastMessage: "Partnership confirmed.",
    unread: 1,
    platform: "Discord",
    aiSummary: "AI: Partnership update.",
    lastUpdated: randomDateWithinLast24Hours(),
    isPinned: false,
    isMuted: false,
  },
  {
    id: "a10",
    name: "Community",
    avatar: "https://randomuser.me/api/portraits/women/53.jpg",
    lastMessage: "AMA at 5pm.",
    unread: 0,
    platform: "Telegram",
    aiSummary: "AI: AMA scheduled.",
    lastUpdated: randomDateWithinLast24Hours(),
    isPinned: false,
    isMuted: false,
  },
  {
    id: "a11",
    name: "Support",
    avatar: "https://randomuser.me/api/portraits/men/54.jpg",
    lastMessage: "Support ticket closed.",
    unread: 2,
    platform: "Discord",
    aiSummary: "AI: Support ticket update.",
    lastUpdated: randomDateWithinLast24Hours(),
    isPinned: false,
    isMuted: false,
  },
  {
    id: "a12",
    name: "Announcements",
    avatar: "https://randomuser.me/api/portraits/women/55.jpg",
    lastMessage: "New update released.",
    unread: 0,
    platform: "Telegram",
    aiSummary: "AI: Update announcement.",
    lastUpdated: randomDateWithinLast24Hours(),
    isPinned: false,
    isMuted: false,
  },
  {
    id: "a13",
    name: "Random",
    avatar: "https://randomuser.me/api/portraits/men/56.jpg",
    lastMessage: "Random chat fun.",
    unread: 1,
    platform: "Discord",
    aiSummary: "AI: Random chat activity.",
    lastUpdated: randomDateWithinLast24Hours(),
    isPinned: false,
    isMuted: false,
  },
  {
    id: "a14",
    name: "Feedback",
    avatar: "https://randomuser.me/api/portraits/women/57.jpg",
    lastMessage: "Feedback form updated.",
    unread: 0,
    platform: "Telegram",
    aiSummary: "AI: Feedback collected.",
    lastUpdated: randomDateWithinLast24Hours(),
    isPinned: false,
    isMuted: false,
  },
  {
    id: "a15",
    name: "Developers",
    avatar: "https://randomuser.me/api/portraits/men/58.jpg",
    lastMessage: "API docs updated.",
    unread: 2,
    platform: "Discord",
    aiSummary: "AI: API documentation update.",
    lastUpdated: randomDateWithinLast24Hours(),
    isPinned: false,
    isMuted: false,
  },
  {
    id: "a16",
    name: "Designers",
    avatar: "https://randomuser.me/api/portraits/women/59.jpg",
    lastMessage: "Design review at 3pm.",
    unread: 0,
    platform: "Telegram",
    aiSummary: "AI: Design review scheduled.",
    lastUpdated: randomDateWithinLast24Hours(),
    isPinned: false,
    isMuted: false,
  },
  {
    id: "a17",
    name: "Writers",
    avatar: "https://randomuser.me/api/portraits/men/60.jpg",
    lastMessage: "Blog post published.",
    unread: 1,
    platform: "Discord",
    aiSummary: "AI: Blog post update.",
    lastUpdated: randomDateWithinLast24Hours(),
    isPinned: false,
    isMuted: false,
  },
  {
    id: "a18",
    name: "Translators",
    avatar: "https://randomuser.me/api/portraits/women/61.jpg",
    lastMessage: "Translation completed.",
    unread: 0,
    platform: "Telegram",
    aiSummary: "AI: Translation finished.",
    lastUpdated: randomDateWithinLast24Hours(),
    isPinned: false,
    isMuted: false,
  },
  {
    id: "a19",
    name: "Moderators",
    avatar: "https://randomuser.me/api/portraits/men/62.jpg",
    lastMessage: "User banned.",
    unread: 2,
    platform: "Discord",
    aiSummary: "AI: Moderation action taken.",
    lastUpdated: randomDateWithinLast24Hours(),
    isPinned: false,
    isMuted: false,
  },
  {
    id: "a20",
    name: "Events",
    avatar: "https://randomuser.me/api/portraits/women/63.jpg",
    lastMessage: "Event starts at 7pm.",
    unread: 0,
    platform: "Telegram",
    aiSummary: "AI: Event reminder.",
    lastUpdated: randomDateWithinLast24Hours(),
    isPinned: false,
    isMuted: false,
  },
];

const coinOptions = [
  {
    image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    name: "Bitcoin",
    symbol: "BTC",
  },
  {
    image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
    name: "Ethereum",
    symbol: "ETH",
  },
  {
    image: "https://assets.coingecko.com/coins/images/4128/large/solana.png",
    name: "Solana",
    symbol: "SOL",
  },
];
