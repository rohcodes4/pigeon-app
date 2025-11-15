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
import { useDiscordContext } from "@/context/discordContext";
import { syncDiscordChatHistoryLast48H } from "@/hooks/useDiscord";

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
  const { dms, channels, guilds: discordGuilds, refresh } = useDiscordContext();
  const [isDiscordSyced, setDiscordSyced] = useState(false);




  const scrollRef = useRef<HTMLDivElement>(null);

  // Function to start sync polling
  const startSyncPolling = async () => {
    // Start with a small delay to let sync begin
 

 





 
        setTelegramChats(telegramChats);
       

      }





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


  // Handle chat selection
  const handleChatSelect = async (chat) => {
    setSelectedChat(chat);

    // Mark the chat as read when selected

  };

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);
  useEffect(() => {
  console.log("Context updated in index ts:", { dms, discordGuilds });
  
  },[dms,discordGuilds])
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
    console.log("calling on dms change");
    const fetchChats = async () => {
      if (!user) {
        setChatsLoading(false);
        return;
      }
      setChatsLoading(true);
      try {
     
        // setChats(data.chats || []);
        // const res = await window.electronAPI.security.getDiscordToken();
        // if (res?.success && res?.data) {
        //   await window.electronAPI.discord.connect(res.data);
        // }
        // const dms = await window.electronAPI.discord.getDMs(); // remove listener if supported
        // if (dms.success) {
        const discordChats = dms?.map(mapDiscordToTelegramSchema);
        console.log(dms);
        // Merge both
        const allChats = [...telegramChats, ...discordChats];
        allChats.sort((a, b) => {
          if (!a.timestamp && !b.timestamp) return 0; // both null → equal
          if (!a.timestamp) return 1; // a is null → after b
          if (!b.timestamp) return -1; // b is null → after a

          return (
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        });

        // Store initial chats - this only runs once on load
        setChats(allChats || []);
        console.log("Loaded chats fetchchats:", allChats);
        if(allChats.length>0){
          (async () => {
        // Sync DMs first
        if (isDiscordSyced === false) {
          setDiscordSyced(true);
          for (const chatId of allChats.filter(chat=> chat.platform=='discord').map((dm) => dm.id)) {
            try {
              
              await syncDiscordChatHistoryLast48H(chatId);
            } catch (err) {
              console.error(`Error syncing DM ${chatId}:`, err);
            }
          }
        }
      })();
    }
        // }
        // else{
        //   setChats(data.chats || []);
        // }
      } catch (error) {
        console.error("Failed to fetch chats:", error);
        // toast({
        //   title: "Error",
        //   description: "Failed to load chats.",
        //   variant: "destructive",
        // });
        setChats([]);
      } finally {
        setChatsLoading(false);
      }
    };
    fetchChats();
  }, [user, dms, discordGuilds, telegramChats]);

  useEffect(() => {
    setOpenPanel(null);
  }, [selectedChat]);
  useEffect(() => {
  window.electronAPI.telegram.connectExisting().then((res) => {
    console.log("Connected existing telegram session:", res);
     window.electronAPI.telegram.getDialogs().then((dialogsRes) => {
      console.log("Fetched telegram dialogs:", dialogsRes);
      if (dialogsRes.success && dialogsRes.data) {
        setTelegramChats(dialogsRes.data);
      }
    })
  });
 
  }, []);

  

  // Lightweight polling: refresh sidebar chats every 30s with smart merging
  useEffect(() => {
    if (!user) return;
    let timer: any = null;
    const poll = async () => {
      try {
     
       
        
          let allChats = telegramChats;
          // Fetch Discord DMs
          // remove listener if supported
          // console.log("Polled guilds:", guilds.data);
          console.log(dms, "dms", discordGuilds, "guilds");
          if (dms) {
            const discordChats = dms?.map(mapDiscordToTelegramSchema);
            // Merge both
            allChats = [...telegramChats, ...discordChats];
            allChats.sort((a, b) => {
              if (!a.timestamp && !b.timestamp) return 0; // both null → equal
              if (!a.timestamp) return 1; // a is null → after b
              if (!b.timestamp) return -1; // b is null → after a

              return (
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime()
              );
            });
            // console.log("Loaded chats useEffects:", allChats);
          }
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

  const [selectedDiscordServer, setSelectedDiscordServer] = useState<
    string | null
  >(null);

  const handleSelectDiscordServer = (serverId: string | null) => {
    setSelectedDiscordServer(serverId);
  };

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
    <Layout
      selectedDiscordServer={selectedDiscordServer}
      onSelectDiscordServer={handleSelectDiscordServer}
      guilds={discordGuilds}
    >
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
        <main className="h-[calc(100vh-72px)] flex flex-row pb-0  space-x-0 max-w-screen justify-stretch border border-[FFFFFF17] rounded-tl-[12px] overflow-hidden">
          {/* Left Side - Chat Panel (Fixed) */}
          <ChatPanel
            chats={chats}
            onChatSelect={handleChatSelect}
            selectedChat={selectedChat}
            selectedDiscordServer={selectedDiscordServer}
            onBack={() => setSelectedDiscordServer(null)}
          />

          {/* Middle - Main Content Area (Flexible) */}
          <div
            className={`h-[calc(100vh-72px)] min-w-0 flex flex-col transition-all duration-300 ${
              openPanel !== null
                ? "flex-1" // Takes remaining space when panel is open
                : "flex-grow" // Takes all available space when no panel
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

          {/* Right Side - Panels Container */}
          {openPanel === "smartSummary" && (
            <SmartSummary
              selectedChat={selectedChat}
              chatId={selectedChat.id}
              closePanel={() => setOpenPanel(null)}
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
