
import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge  } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Settings, Search, CheckSquare, Bell, LogOut } from "lucide-react";
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
import AIimg from '@/assets/images/authAI.png';
import { AppHeader } from "@/components/AppHeader";
import ChatPanel from "@/components/ChatPanel";
import UnifiedHeader from "@/components/UnifiedHeader";
import UnifiedChatPanel from "@/components/UnifiedChatPanel";
import SmartSummary from "@/components/SmartSummary";
import NotificationsPanel from "@/components/NotificationsPanel";
import PinnedPanel from "@/components/PinnedPanel";

const Index = ({title}) => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [activeTab, setActiveTab] = useState("ai");
  const [isConnected, setIsConnected] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [coin, setCoin] = useState(coinOptions[0]);
  const [filters, setFilters] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [aiChats, setAiChats] = useState(fakeChatsAI);
  const [alphaChats, setAlphaChats] = useState(fakeChatsAlpha);
  const [isSmartSummary, setIsSmartSummary] = useState(false);
  const [isNotificationPanel, setIsNotificationPanel] = useState(false);
  const [openPanel, setOpenPanel] = useState<null | "smartSummary" | "notification" | "pinned">(null);

  const handleOpenSmartSummary = () => setOpenPanel("smartSummary");
const handleOpenNotificationPanel = () => setOpenPanel("notification");
const handleOpenPinnedPanel = () => setOpenPanel("pinned");
const handleClosePanel = () => setOpenPanel(null);

  const scrollRef = useRef<HTMLDivElement>(null);

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
      const onboardingComplete = localStorage.getItem(`chatpilot_onboarded_${user.id}`);
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

  const handleOnboardingComplete = () => {
    if (user) {
      localStorage.setItem(`chatpilot_onboarded_${user.id}`, "true");
      setIsOnboarded(true);
      setIsConnected(true);
      toast({
        title: "Welcome to ChatPilot!",
        description: "Your dashboard is ready. Start managing your conversations.",
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

  if (loading) {
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

  if (!isOnboarded) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return (
    <Layout>
      <div className="flex-1 flex flex-col min-h-screen">
      <AppHeader title={title}  isNotificationPanel={openPanel === "notification"}
  setIsNotificationPanel={(open) => setOpenPanel(open ? "notification" : null)}
  // onOpenPinnedPanel={() => setOpenPanel("pinned")}
  isPinnedOpen={openPanel === "pinned"}
  setIsPinnedOpen={(open) => {setOpenPanel(open ? "pinned" : null)}}/>      
      <main className="h-[calc(100vh-72px)] flex-1 pb-0 pr-3 overflow-y-auto flex w-full justify-stretch border-t border-l border-[#23272f] rounded-tl-[12px] overflow-hidden">
        <ChatPanel/>
      
      <div className="w-full h-[calc(100vh-72px)] overflow-hidden">
    
      <UnifiedHeader title="Unified Inbox"
  smartText="Summarize"
  isReadAll={true}
  isSmartSummary={openPanel === "smartSummary"}
  setIsSmartSummary={(open) => setOpenPanel(open ? "smartSummary" : null)}/>      
      <UnifiedChatPanel/>
    
    </div>
    {openPanel === "smartSummary" && <SmartSummary />}
    {openPanel === "notification" && <NotificationsPanel />}
    {openPanel === "pinned" && <PinnedPanel />}
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