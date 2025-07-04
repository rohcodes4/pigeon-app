
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { MessageCircle, Users, Check,  Save, ExternalLink, Loader2, ArrowRight, Ban, Play, RotateCcw } from "lucide-react";

import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import telegram from '@/assets/images/telegram.png'
import discord from '@/assets/images/discord.png'
import play from '@/assets/images/play.png'
import { PlatformStatusBadges } from "./PlatformStatusBadges";
import { ChatGroup } from "./ChatSelection";

interface ChatSyncingProps {
    onComplete: () => void;
    restartOnboarding: () => void;    
    chatsSelected: boolean;
    approvedChats: ChatGroup[];
    telegramConnected: boolean;
  setTelegramConnected: React.Dispatch<React.SetStateAction<boolean>>;
  discordConnected: boolean;
  setDiscordConnected: React.Dispatch<React.SetStateAction<boolean>>;
  }
  

export const ChatSyncing = ({ onComplete, restartOnboarding, chatsSelected, approvedChats,telegramConnected,
    setTelegramConnected,
    discordConnected,
    setDiscordConnected,}: ChatSyncingProps) => {
  const { user } = useAuth(); 

  const discordChats = approvedChats.filter((chat) => chat.platform === "discord");
  const telegramChats = approvedChats.filter((chat) => chat.platform === "telegram");

  const [syncProgress, setSyncProgress] = useState({ discord: 0, telegram: 0 });
  const [syncComplete, setSyncComplete] = useState(false);

//   const [telegramConnected, setTelegramConnected] = useState(false);
//   const [discordConnected, setDiscordConnected] = useState(false);

useEffect(() => {
    if (user) {
      // Check connected accounts
      const accountsData = localStorage.getItem(`chatpilot_accounts_${user.id}`);
      if (accountsData) {
        const accounts = JSON.parse(accountsData);
        setTelegramConnected(accounts.telegram || false);
        setDiscordConnected(accounts.discord || false);
      }

    }
  }, [user]);

  useEffect(() => {
    // Discord Sync
    let discordInterval: NodeJS.Timeout | null = null;
    if (discordChats.length > 0) {
      let discordProgress = 0;
      const discordStep = 100 / discordChats.length;
      discordInterval = setInterval(() => {
        discordProgress += discordStep;
        setSyncProgress((prev) => ({
          ...prev,
          discord: Math.min(discordProgress, 100),
        }));
        if (discordProgress >= 100) {
          if (discordInterval) clearInterval(discordInterval);
        }
      }, 300); // 300ms per chat
    } else {
      setSyncProgress((prev) => ({ ...prev, discord: 0 }));
    }

    // Telegram Sync
    let telegramInterval: NodeJS.Timeout | null = null;
    if (telegramChats.length > 0) {
        let telegramProgress = 0;
        const telegramStep = 100 / telegramChats.length;
        telegramInterval = setInterval(() => {
          telegramProgress += telegramStep;
          setSyncProgress((prev) => ({
            ...prev,
            telegram: Math.min(telegramProgress, 100),
          }));
        //   if (telegramProgress >= 100) {
        //     if (telegramInterval) clearInterval(telegramInterval);
        //     // Complete syncing after both are done
        //     setTimeout(() => {
        //       setSyncComplete(true);
        //     }, 500);
        //   }
        if (telegramProgress >= 100) {
            if (telegramInterval) clearInterval(telegramInterval);
          }
        }, 300); // 300ms per chat
      } else {
        setSyncProgress((prev) => ({ ...prev, telegram: 0 }));
      }

    // Cleanup
    return () => {
      if (discordInterval) clearInterval(discordInterval);
      if (telegramInterval) clearInterval(telegramInterval);
    };
  }, [approvedChats]);

  useEffect(() => {
    if (
      (discordChats.length === 0 || syncProgress.discord >= 100) &&
      (telegramChats.length === 0 || syncProgress.telegram >= 100)
    ) {
      setTimeout(() => setSyncComplete(true), 500); // Optional: add a small delay for smoothness
    }
  }, [syncProgress, discordChats.length, telegramChats.length]);

//   useEffect(() => {
//     if (syncComplete) {
//       const timeout = setTimeout(() => {
//         onComplete();
//       }, 1200); // Show the card for 1.2 seconds
//       return () => clearTimeout(timeout);
//     }
//   }, [syncComplete, onComplete]);
  return (
    <div className="space-y-6">
      <div className="">
        <h2 className={`text-[36px] leading-[44px] tracking-[2px] text-white mb-2 ${syncComplete?"max-w-[150px]":"max-w-[500px]"}`}>{syncComplete?"Syncing is done!":"All platforms connected successfully!"}</h2>
        <p className="text-[#ffffff48]">{syncComplete?"Let's start playing around":"Your accounts have been connected and your chats are now syncing."} </p>
      </div>

      <PlatformStatusBadges telegramConnected={telegramConnected} discordConnected={discordConnected}/>

      <div className={`flex gap-6`}>
        {/* Discord Chats */}
        <Card className={`bg-[#111111] border-0 shadow-none rounded-[18px] grow`}>
  <CardContent className="p-6 gap-5">
    <div className="flex gap-2 items-center">
<div className="flex flex-col gap-0 mb-1">
        <span className="text-lg font-semibold mb-1 text-[#ffffff90]">{syncComplete?"Sync done.":"Sync in progress..."}</span>
        <span className={`text-xs text-[#ffffff48] rounded-full font-medium`}>
        {syncComplete?"All your chat were processed. ":"All your chat are being processed."}
        </span>
      </div>

      </div>
      <hr className="w-full h-0.5 my-4 bg-[#ffffff06]"/>

    {/* Info Section */}
    <div className="flex-1 text-[#ffffff72]">
      <div className="">
   
      <div className="discordProgress">
              <p>Discord Servers ({discordChats.length})</p>
              <div className="w-full rounded-full bg-[#171717] px-3 py-3 mt-2">
                <div
                  className={`h-1 rounded-full discordProgressBar transition-all duration-300 ${
                    discordChats.length === 0 ? "bg-gray-700" : "bg-green-900"
                  }`}
                  style={{
                    width: discordChats.length === 0 ? "100%" : `${syncProgress.discord}%`,
                    opacity: discordChats.length === 0 ? 0.5 : 1,
                  }}
                ></div>
              </div>
            </div>
  
            <div className="telegramProgress">
              <p>Telegram Servers ({telegramChats.length})</p>
              <div className="w-full rounded-full bg-[#171717] px-3 py-3 mt-2">
                <div
                  className={`h-1 rounded-full telegramProgressBar transition-all duration-300 ${
                    telegramChats.length === 0 ? "bg-gray-700" : "bg-green-900"
                  }`}
                  style={{
                    width: telegramChats.length === 0 ? "100%" : `${syncProgress.telegram}%`,
                    opacity: telegramChats.length === 0 ? 0.5 : 1,
                  }}
                ></div>
              </div>
            </div>
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
          {/* <span className="cursor-pointer" onClick={() => selectAllByPlatform('discord')}> Select all</span> */}
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

      
        {/* Save Settings */}
        <Card className={`bg-[#111111] border-0 shadow-none rounded-[18px] ${syncComplete?'block':'hidden'}`}>
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
        <span className="text-lg font-semibold mb-1 text-white flex items-center gap-2">
  <span className="bg-[#35c220] text-black rounded-full flex items-center justify-center p-1">
    <Check className="h-3 w-3" />
  </span>
  Synchronization successful!
</span>
        <span className={`text-xs text-[#ffffff48] rounded-full font-medium`}>
        {/* {canContinue?"You are connected, you can move forward.":"Connect at least one platform."} */}
        </span>
      </div>
      <hr className="w-full h-0.5 my-4 bg-[#ffffff06]" />

      <div className="flex-1 text-[#ffffff72]">
        <div className="h-[150px]">
      <p className="text-[#ffffff72] mb-4">Here's what you can explore next:</p>
      <ul className="text-xs text-[#ffffff48] space-y-2 mb-3">
        <li className="flex gap-4"><Check className="w-4 h-4 flex-shrink-0" />Quicly summarize your decisions.</li>
        <li className="flex gap-4"><Check className="w-4 h-4 flex-shrink-0" />Engage Focus Mode.</li>
        <li className="flex gap-4"><Check className="w-4 h-4 flex-shrink-0" />Discover new tasks.</li>
        <li className="flex gap-4 h-4"></li>
      </ul>
      </div>
      <hr className="w-full h-0.5 my-4 bg-[#ffffff06]" />

      <div className="flex items-center justify-between mt-4 h-10">
        {/* Status pill */}
        <span className={`text-xs pr-3 py-1 flex gap-2 items-center text-[#84afff]`}>          
          <Button
          onClick={restartOnboarding} 
           className="bg-transparent text-[#ffffff96] hover:bg-transparent hover:text-white">Restart <RotateCcw/> </Button>
        </span>
        {/* Action button */}
            <Button         
            onClick={onComplete}
            className="bg-[#5389ff] hover:bg-[#4170cc] text-black rounded-[12px] px-3 py-2 gap-2 shadow-none"
          >
            <img src={play} className="fill-black rounded-full w-4 h-4 object-contain"/>Continue to inbox
          </Button>
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
