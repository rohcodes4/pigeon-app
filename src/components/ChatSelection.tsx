
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { MessageCircle, Users, Check,  Save, ExternalLink, Loader2, ArrowRight, Ban, Play } from "lucide-react";

import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import telegram from '@/assets/images/telegram.png'
import discord from '@/assets/images/discord.png'
import play from '@/assets/images/play.png'
import { PlatformStatusBadges } from "./PlatformStatusBadges";

export interface ChatGroup {
  id: string;
  group_id: string;
  group_name: string;
  group_avatar: string | null;
  platform: string;
  member_count: number | null;
  is_synced: boolean;
  type: string | null;
}

interface ChatSelectionProps {
  onChatsSelected?: (chats) => void;
  onContinue?: () => void; 
  telegramConnected: boolean;
  setTelegramConnected: React.Dispatch<React.SetStateAction<boolean>>;
  discordConnected: boolean;
  setDiscordConnected: React.Dispatch<React.SetStateAction<boolean>>;
}

const fakeChatGroups: ChatGroup[] = [
  // Discord groups
  {
    id: "discord_1",
    group_id: "discord_general",
    group_name: "General Chat",
    group_avatar: null,
    platform: "discord",
    member_count: 156,
    is_synced: false,
    type: "Server",
  },
  {
    id: "discord_2",
    group_id: "discord_dev",
    group_name: "Development Team",
    group_avatar: null,
    platform: "discord",
    member_count: 23,
    is_synced: false,
    type: "Server",
  },
  {
    id: "discord_3",
    group_id: "discord_random",
    group_name: "Random",
    group_avatar: null,
    platform: "discord",
    member_count: 89,
    is_synced: false,
    type: "Server",
  },
  {
    id: "discord_4",
    group_id: "discord_announcements",
    group_name: "Announcements",
    group_avatar: null,
    platform: "discord",
    member_count: 200,
    is_synced: false,
    type: "Server",
  },
  {
    id: "discord_5",
    group_id: "discord_support",
    group_name: "Support",
    group_avatar: null,
    platform: "discord",
    member_count: 45,
    is_synced: false,
    type: "Server",
  },
  {
    id: "discord_6",
    group_id: "discord_gaming",
    group_name: "Gaming",
    group_avatar: null,
    platform: "discord",
    member_count: 120,
    is_synced: false,
    type: "Server",
  },
  {
    id: "discord_7",
    group_id: "discord_music",
    group_name: "Music",
    group_avatar: null,
    platform: "discord",
    member_count: 60,
    is_synced: false,
    type: "Server",
  },
  {
    id: "discord_8",
    group_id: "discord_memes",
    group_name: "Memes",
    group_avatar: null,
    platform: "discord",
    member_count: 80,
    is_synced: false,
    type: "Server",
  },
  {
    id: "discord_9",
    group_id: "discord_art",
    group_name: "Art",
    group_avatar: null,
    platform: "discord",
    member_count: 34,
    is_synced: false,
    type: "Server",
  },
  {
    id: "discord_10",
    group_id: "discord_books",
    group_name: "Book Club",
    group_avatar: null,
    platform: "discord",
    member_count: 27,
    is_synced: false,
    type: "Server",
  },
  {
    id: "discord_11",
    group_id: "discord_movies",
    group_name: "Movies",
    group_avatar: null,
    platform: "discord",
    member_count: 51,
    is_synced: false,
    type: "Server",
  },
  {
    id: "discord_12",
    group_id: "discord_coding",
    group_name: "Coding",
    group_avatar: null,
    platform: "discord",
    member_count: 99,
    is_synced: false,
    type: "Server",
  },
  {
    id: "discord_13",
    group_id: "discord_ai",
    group_name: "AI Enthusiasts",
    group_avatar: null,
    platform: "discord",
    member_count: 77,
    is_synced: false,
    type: "Server",
  },
  {
    id: "discord_14",
    group_id: "discord_fitness",
    group_name: "Fitness",
    group_avatar: null,
    platform: "discord",
    member_count: 40,
    is_synced: false,
    type: "Server",
  },
  {
    id: "discord_15",
    group_id: "discord_travel",
    group_name: "Travel",
    group_avatar: null,
    platform: "discord",
    member_count: 32,
    is_synced: false,
    type: "Server",
  },
  {
    id: "discord_16",
    group_id: "discord_food",
    group_name: "Foodies",
    group_avatar: null,
    platform: "discord",
    member_count: 58,
    is_synced: false,
    type: "Server",
  },
  {
    id: "discord_17",
    group_id: "discord_photography",
    group_name: "Photography",
    group_avatar: null,
    platform: "discord",
    member_count: 29,
    is_synced: false,
    type: "Server",
  },
  {
    id: "discord_18",
    group_id: "discord_science",
    group_name: "Science",
    group_avatar: null,
    platform: "discord",
    member_count: 66,
    is_synced: false,
    type: "Server",
  },
  {
    id: "discord_19",
    group_id: "discord_history",
    group_name: "History Buffs",
    group_avatar: null,
    platform: "discord",
    member_count: 21,
    is_synced: false,
    type: "Server",
  },
  {
    id: "discord_20",
    group_id: "discord_language",
    group_name: "Language Exchange",
    group_avatar: null,
    platform: "discord",
    member_count: 38,
    is_synced: false,
    type: "Server",
  },

  // Telegram groups (randomized type, capitalized)
  {
    id: "telegram_1",
    group_id: "tg_tech_talk",
    group_name: "Tech Talk",
    group_avatar: null,
    platform: "telegram",
    member_count: 342,
    is_synced: false,
    type: "Group",
  },
  {
    id: "telegram_2",
    group_id: "tg_friends",
    group_name: "Friends Group",
    group_avatar: null,
    platform: "telegram",
    member_count: 12,
    is_synced: false,
    type: "Bot",
  },
  {
    id: "telegram_3",
    group_id: "tg_work",
    group_name: "Work Updates",
    group_avatar: null,
    platform: "telegram",
    member_count: 45,
    is_synced: false,
    type: "App",
  },
  {
    id: "telegram_4",
    group_id: "tg_news",
    group_name: "Daily News",
    group_avatar: null,
    platform: "telegram",
    member_count: 210,
    is_synced: false,
    type: "Group",
  },
  {
    id: "telegram_5",
    group_id: "tg_sports",
    group_name: "Sports Fans",
    group_avatar: null,
    platform: "telegram",
    member_count: 98,
    is_synced: false,
    type: "Bot",
  },
  {
    id: "telegram_6",
    group_id: "tg_movies",
    group_name: "Movie Club",
    group_avatar: null,
    platform: "telegram",
    member_count: 56,
    is_synced: false,
    type: "App",
  },
  {
    id: "telegram_7",
    group_id: "tg_music",
    group_name: "Music Lovers",
    group_avatar: null,
    platform: "telegram",
    member_count: 67,
    is_synced: false,
    type: "Group",
  },
  {
    id: "telegram_8",
    group_id: "tg_gaming",
    group_name: "Gaming",
    group_avatar: null,
    platform: "telegram",
    member_count: 120,
    is_synced: false,
    type: "Bot",
  },
  {
    id: "telegram_9",
    group_id: "tg_art",
    group_name: "Art & Design",
    group_avatar: null,
    platform: "telegram",
    member_count: 34,
    is_synced: false,
    type: "App",
  },
  {
    id: "telegram_10",
    group_id: "tg_books",
    group_name: "Book Lovers",
    group_avatar: null,
    platform: "telegram",
    member_count: 27,
    is_synced: false,
    type: "Group",
  },
  {
    id: "telegram_11",
    group_id: "tg_photography",
    group_name: "Photography",
    group_avatar: null,
    platform: "telegram",
    member_count: 29,
    is_synced: false,
    type: "Bot",
  },
  {
    id: "telegram_12",
    group_id: "tg_fitness",
    group_name: "Fitness",
    group_avatar: null,
    platform: "telegram",
    member_count: 40,
    is_synced: false,
    type: "App",
  },
  {
    id: "telegram_13",
    group_id: "tg_travel",
    group_name: "Travel",
    group_avatar: null,
    platform: "telegram",
    member_count: 32,
    is_synced: false,
    type: "Group",
  },
  {
    id: "telegram_14",
    group_id: "tg_food",
    group_name: "Foodies",
    group_avatar: null,
    platform: "telegram",
    member_count: 58,
    is_synced: false,
    type: "Bot",
  },
  {
    id: "telegram_15",
    group_id: "tg_science",
    group_name: "Science",
    group_avatar: null,
    platform: "telegram",
    member_count: 66,
    is_synced: false,
    type: "App",
  },
  {
    id: "telegram_16",
    group_id: "tg_history",
    group_name: "History Buffs",
    group_avatar: null,
    platform: "telegram",
    member_count: 21,
    is_synced: false,
    type: "Group",
  },
  {
    id: "telegram_17",
    group_id: "tg_language",
    group_name: "Language Exchange",
    group_avatar: null,
    platform: "telegram",
    member_count: 38,
    is_synced: false,
    type: "Bot",
  },
  {
    id: "telegram_18",
    group_id: "tg_memes",
    group_name: "Memes",
    group_avatar: null,
    platform: "telegram",
    member_count: 80,
    is_synced: false,
    type: "App",
  },
  {
    id: "telegram_19",
    group_id: "tg_coding",
    group_name: "Coding",
    group_avatar: null,
    platform: "telegram",
    member_count: 99,
    is_synced: false,
    type: "Group",
  },
  {
    id: "telegram_20",
    group_id: "tg_ai",
    group_name: "AI Enthusiasts",
    group_avatar: null,
    platform: "telegram",
    member_count: 77,
    is_synced: false,
    type: "Bot",
  },
];

export const ChatSelection = ({ onChatsSelected, onContinue,telegramConnected,
  setTelegramConnected,
  discordConnected,
  setDiscordConnected, }: ChatSelectionProps) => {
  const { user } = useAuth();
  const [chatGroups, setChatGroups] = useState<ChatGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // const [telegramConnected, setTelegramConnected] = useState(false);
  // const [discordConnected, setDiscordConnected] = useState(false);

  useEffect(() => {
    if (user) {
      // Check connected accounts
      const accountsData = localStorage.getItem(`chatpilot_accounts_${user.id}`);
      if (accountsData) {
        const accounts = JSON.parse(accountsData);
        setTelegramConnected(accounts.telegram || false);
        setDiscordConnected(accounts.discord || false);
      }

      setTimeout(() => {
        const savedSelections = localStorage.getItem(`chatpilot_chats_${user.id}`);
        let updatedGroups = [...fakeChatGroups];
        
        if (savedSelections) {
          const selections = JSON.parse(savedSelections);
          updatedGroups = updatedGroups.map(group => ({
            ...group,
            is_synced: selections[group.id] || false
          }));
        }
        
        setChatGroups(updatedGroups);
        setLoading(false);
        
        const hasSelectedChats = updatedGroups.some(group => group.is_synced);
        const selectedChats = updatedGroups.filter(group => group.is_synced);
        if (hasSelectedChats && onChatsSelected) {
          onChatsSelected(selectedChats);
        }
      }, 1000);
    }
  }, [user, onChatsSelected]);

  const toggleChatSync = async (groupId: string, currentSyncStatus: boolean) => {
    setChatGroups(prev => 
      prev.map(group => 
        group.id === groupId 
          ? { ...group, is_synced: !currentSyncStatus }
          : group
      )
    );

    const updatedSelections = { ...JSON.parse(localStorage.getItem(`chatpilot_chats_${user?.id}`) || '{}') };
    updatedSelections[groupId] = !currentSyncStatus;
    localStorage.setItem(`chatpilot_chats_${user?.id}`, JSON.stringify(updatedSelections));

    const hasSelectedChats = chatGroups.some(group => 
      group.id === groupId ? !currentSyncStatus : group.is_synced
    );
    const selectedChats = chatGroups.some(group => 
      group.id === groupId ? !currentSyncStatus : group.is_synced
    );

    
    if (hasSelectedChats && onChatsSelected) {
      onChatsSelected(selectedChats);
    }

    toast({
      title: !currentSyncStatus ? "Chat Added" : "Chat Removed",
      description: !currentSyncStatus 
        ? "Chat will now appear in your unified inbox" 
        : "Chat removed from unified inbox",
    });
  };

  const selectAllByPlatform = (platform: string) => {
    // Find all chats for the platform
    const platformChats = chatGroups.filter(group => group.platform === platform);
    // Check if all are already selected
    const allSelected = platformChats.every(group => group.is_synced);
  
    // Compute the new chatGroups state
    const newChatGroups = chatGroups.map(group =>
      group.platform === platform
        ? { ...group, is_synced: !allSelected }
        : group
    );
    setChatGroups(newChatGroups);
  
    // Update localStorage as well
    const updatedSelections = { ...JSON.parse(localStorage.getItem(`chatpilot_chats_${user?.id}`) || '{}') };
    newChatGroups.forEach(group => {
      updatedSelections[group.id] = group.is_synced;
    });
    localStorage.setItem(`chatpilot_chats_${user?.id}`, JSON.stringify(updatedSelections));
  };

  const saveAllChanges = async () => {
    setSaving(true);
    
    setTimeout(() => {
      setSaving(false);
      
      const hasSelectedChats = chatGroups.some(group => group.is_synced);
      const selectedChats = chatGroups.filter(group => group.is_synced);
      if (hasSelectedChats && onChatsSelected) {
        onChatsSelected(selectedChats);
      }

      toast({
        title: "Settings Saved",
        description: "All chat sync settings have been saved",
      });
    }, 1500);
  };

  const discordChats = chatGroups.filter(group => group.platform === 'discord');
  const telegramChats = chatGroups.filter(group => group.platform === 'telegram');
  const canContinue = telegramConnected || discordConnected;

  // if (loading) {
  //   return (
  //     <div className="space-y-6">
  //       <div className="text-center mb-8">
  //         <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Chats to Sync</h2>
  //         <p className="text-gray-600">Choose which chats you want to include in your unified inbox</p>
  //       </div>
  //       <Card>
  //         <CardContent className="p-6">
  //           <div className="text-center">Loading your chats...</div>
  //         </CardContent>
  //       </Card>
  //     </div>
  //   );
  // }

  return (
    <div className="space-y-6">
      <div className="">
        <h2 className="text-[36px] leading-[44px] tracking-[2px] text-white mb-2">Select<br/> Your Chats</h2>
        <p className="text-[#ffffff48]">Select your Discord and Telegram groups and chats to start syncing your conversations.</p>
      </div>

      {/* Connection Status */}
      {/* <div className="flex gap-4 justify-center mb-6">
        <Badge variant={discordConnected ? "default" : "secondary"} className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          Discord {discordConnected ? "Connected" : "Not Connected"}
        </Badge>
        <Badge variant={telegramConnected ? "default" : "secondary"} className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          Telegram {telegramConnected ? "Connected" : "Not Connected"}
        </Badge>
      </div> */}
      <PlatformStatusBadges telegramConnected={telegramConnected} discordConnected={discordConnected}/>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Discord Chats */}
        <Card className={`${discordConnected?"bg-[#111111]":"bg-[#ffffff06]"} border-0 shadow-none rounded-[18px]`}>
  <CardContent className="p-6 gap-5">
    <div className="flex gap-2 items-center">
    {/* Discord Logo in Circle */}
    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#5389ff] flex items-center justify-center relative">
  <img src={discord} alt="Discord" className="w-6 h-6" />
  {/* Status badge */}
  <span
    className={`
      absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#23272f]
      ${discordConnected ? "bg-[#50DF3A]" : "bg-[#FDCB35]"}
    `}
  />
</div>
<div className="flex flex-col gap-0 mb-1">
        <span className="text-lg font-semibold mb-1 text-white">Discord</span>
        <span className={`text-xs text-[#ffffff48] rounded-full font-medium`}>
Select channels:
        </span>
      </div>

      </div>
      <hr className="w-full h-0.5 my-4 bg-[#ffffff06]"/>

    {/* Info Section */}
    <div className="flex-1 text-[#ffffff72]">
      <div className="h-[150px] overflow-y-scroll">
    {discordConnected ? (
              discordChats.map((group) => (
                <div key={group.id} className="flex items-center justify-between p-2 border-0 rounded-lg">
                  <div className="flex items-center gap-3 w-full">
                    <Checkbox
                    className="min-h-1 min-w-1"
                      checked={group.is_synced}
                      onCheckedChange={() => toggleChatSync(group.id, group.is_synced)}
                    />
                    <div className="flex justify-between w-full">
                      <p className="font-medium text-sm">{group.group_name}</p>
                      <p className="text-xs text-black bg-[#3589ff] px-2 py-1 rounded-[6px]">{group.member_count} channels</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">Connect Telegram to see chats</p>
            )}
            </div>
    <hr className="w-full h-0.5 my-4 bg-[#ffffff06]"/>

      <div className="flex items-center justify-between mt-4">
  {/* Status pill */}
  <span className={`
          text-xs pr-3 py-1 flex gap-2 items-center text-[#ffffff84] cursor-pointer
        `}>
          <span>
          <Check className="w-4 h-4" />
          </span>
          <span className="cursor-pointer" onClick={() => selectAllByPlatform('discord')}> Select all</span>
        </span>
  {/* Action button */}
    <Button
    // disabled={loading.discord}
    className="bg-[#171717] hover:bg-[#4170cc] text-white font-semibold rounded-[12px] px-6 py-2 gap-2 shadow-none"
    >
      Reconnect
    </Button>
</div>
    </div>

  </CardContent>
</Card>

        {/* Telegram Chats */}
        {/* <Card className={`${telegramConnected ? '' : 'opacity-50'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              Telegram Chats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {telegramConnected ? (
              telegramChats.map((group) => (
                <div key={group.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={group.is_synced}
                      onCheckedChange={() => toggleChatSync(group.id, group.is_synced)}
                    />
                    <div>
                      <p className="font-medium text-sm">{group.group_name}</p>
                      <p className="text-xs text-gray-500">{group.member_count} members</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">Connect Telegram to see chats</p>
            )}
          </CardContent>
        </Card> */}
        <Card className={`${telegramConnected?"bg-[#111111]":"bg-[#ffffff06]"} border-0 shadow-none rounded-[18px]`}>
  <CardContent className="p-6 gap-5">
    <div className="flex gap-2 items-center">
      {/* Telegram Logo in Circle */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#5389ff] flex items-center justify-center relative">
        <img src={telegram} alt="Telegram" className="w-6 h-6" />
        {/* Status badge */}
        <span
          className={`
            absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#23272f]
            ${telegramConnected ? "bg-[#50DF3A]" : "bg-[#FDCB35]"}
          `}
        />
      </div>
      <div className="flex flex-col gap-0 mb-1">
        <span className="text-lg font-semibold mb-1 text-white">Telegram</span>
        <span className={`text-xs text-[#ffffff48] rounded-full font-medium`}>
          Select chats:
        </span>
      </div>
    </div>
    <hr className="w-full h-0.5 my-4 bg-[#ffffff06]" />

    {/* Info Section */}
    <div className="flex-1 text-[#ffffff72]">
      <div className="h-[150px] overflow-y-scroll">
    {telegramConnected ? (
              telegramChats.map((group) => (
                <div key={group.id} className="flex items-center justify-between p-2 border-0 rounded-lg">
                  <div className="flex items-center gap-3 w-full">
                    <Checkbox
                      checked={group.is_synced}
                      onCheckedChange={() => toggleChatSync(group.id, group.is_synced)}
                    />
                     <div className="flex justify-between w-full">
                      <p className="font-medium text-sm">{group.group_name}</p>
                      <p className="text-xs text-black bg-[#3589ff] px-2 py-1 rounded-[6px]">{group.type}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">Connect Telegram to see chats</p>
            )}
            </div>
      <hr className="w-full h-0.5 my-4 bg-[#ffffff06]" />

      <div className="flex items-center justify-between mt-4">
        {/* Status pill */}
        <span className={`text-xs pr-3 py-1 flex gap-2 items-center text-[#ffffff84] cursor-pointer`}>
          <span>
          <Check className="w-4 h-4" />
          </span>
          <span onClick={() => selectAllByPlatform('telegram')}> Select all</span>
        </span>
        {/* Action button */}
        {telegramConnected ? (
          <Button
            className="bg-[#212121] hover:bg-[#4170cc] text-white font-semibold rounded-[12px] px-6 py-2 gap-2 shadow-none"
          >
            Reconnect
          </Button>
        ) : (
          <Button
            className="bg-[#2d2d2d] hover:bg-[#4170cc] text-white font-semibold rounded-[12px] px-6 py-2 gap-2 shadow-none"
          >
            {telegramConnected ? "Reconnect" : "Connect"}
          </Button>
        )}
      </div>
    </div>
  </CardContent>
</Card>

        {/* Save Settings */}
        <Card className="bg-[#111111] border-0 shadow-none rounded-[18px]">
  <CardContent className="p-6">
    <div className="flex flex-col items-center space-y-4 ">
      {/* Arrow icon in blue circle with status badge */}
      {/* <div className="relative w-14 h-14 flex items-center justify-center">
        <div className="w-14 h-14 rounded-full bg-[#5389ff] flex items-center justify-center">
          <ArrowRight className="w-8 h-8 text-white" />
        </div>
        <span
          className={`
            absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-[#111111]
            ${canContinue ? "bg-[#50DF3A]" : "bg-[#FDCB35]"}
          `}
        />
      </div> */}
      <div className="w-full">
        <div className="flex flex-col gap-0 mb-1">
        <span className="text-lg font-semibold mb-1 text-white">Finalize Your Configuration</span>
        <span className={`text-xs text-[#ffffff48] rounded-full font-medium`}>
        {canContinue?"You are connected, you can move forward.":"Connect at least one platform."}
        </span>
      </div>
      <hr className="w-full h-0.5 my-4 bg-[#ffffff06]" />

      <div className="flex-1 text-[#ffffff72]">
        <div className="h-[150px]">
      <p className="text-[#ffffff72] mb-4">What to anticipate:</p>
      <ul className="text-xs text-[#ffffff48] space-y-2 mb-3">
        <li className="flex gap-4"><Check className="w-4 h-4 flex-shrink-0" />Chats sync in about 30 minutes.</li>
        <li className="flex gap-4"><Check className="w-4 h-4 flex-shrink-0" />Choose your focus areas.</li>
        <li className="flex gap-4"><Check className="w-4 h-4 flex-shrink-0" />Discover the Focus Mode features.</li>
        <li className="flex gap-4 h-4"></li>
      </ul>
      </div>
      <hr className="w-full h-0.5 my-4 bg-[#ffffff06]" />

      <div className="flex items-center justify-between mt-4 h-10">
        {/* Status pill */}
        <span className={`text-xs pr-3 py-1 flex gap-2 items-center text-[#84afff]`}>          
          <span>Can't wait to help you!</span>
        </span>
        {/* Action button */}
          {canContinue && <Button         
              onClick={onContinue}   
            className="bg-[#5389ff] hover:bg-[#4170cc] text-black rounded-[12px] px-3 py-2 gap-2 shadow-none"
          >
            <img src={play} className="fill-black rounded-full w-4 h-4 object-contain"/>Continue
          </Button>}
      </div>
    </div>
      </div>
      {/* <div className={`text-sm font-semibold ${canContinue ? 'text-[#50DF3A]' : 'text-[#FDCB35]'}`}>
        {canContinue ? '✓ Ready to proceed' : 'Connect at least one platform'}
      </div> */}
    </div>
  </CardContent>
</Card>
      </div>
    </div>
  );
};
