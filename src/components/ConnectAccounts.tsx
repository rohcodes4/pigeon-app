
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Users, Check, ExternalLink, Loader2, ArrowRight, Ban, Play } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { PlatformStatusBadges } from "./PlatformStatusBadges";
import telegram from '@/assets/images/telegram.png'
import discord from '@/assets/images/discord.png'
import play from '@/assets/images/play.png'

interface ConnectAccountsProps {
  onAccountsConnected: () => void;
  onContinue?: () => void;
  telegramConnected: boolean;
  setTelegramConnected: React.Dispatch<React.SetStateAction<boolean>>;
  discordConnected: boolean;
  setDiscordConnected: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ConnectAccounts = ({ onAccountsConnected, onContinue,telegramConnected,
  setTelegramConnected,
  discordConnected,
  setDiscordConnected, }: ConnectAccountsProps) => {
  const { user } = useAuth();
  // const [telegramConnected, setTelegramConnected] = useState(false);
  // const [discordConnected, setDiscordConnected] = useState(false);
  const [loading, setLoading] = useState({ telegram: false, discord: false });

  useEffect(() => {
    if (user) {
      const onboardingData = localStorage.getItem(`chatpilot_accounts_${user.id}`);
      if (onboardingData) {
        const data = JSON.parse(onboardingData);
        setTelegramConnected(data.telegram || false);
        setDiscordConnected(data.discord || false);
        
        if (data.telegram || data.discord) {
          onAccountsConnected();
        }
      }
    }
  }, [user, onAccountsConnected]);

  const connectTelegram = async () => {
    if (!user) return;
    
    setLoading(prev => ({ ...prev, telegram: true }));
    
    setTimeout(() => {
      setTelegramConnected(true);
      setLoading(prev => ({ ...prev, telegram: false }));
      
      const existingData = JSON.parse(localStorage.getItem(`chatpilot_accounts_${user.id}`) || '{}');
      localStorage.setItem(`chatpilot_accounts_${user.id}`, JSON.stringify({
        ...existingData,
        telegram: true
      }));
      
      toast({
        title: "Telegram Connected",
        description: "Successfully connected to your Telegram account",
      });
      
      onAccountsConnected();
    }, 2000);
  };

  const connectDiscord = async () => {
    if (!user) return;
    
    setLoading(prev => ({ ...prev, discord: true }));
    
    setTimeout(() => {
      setDiscordConnected(true);
      setLoading(prev => ({ ...prev, discord: false }));
      
      const existingData = JSON.parse(localStorage.getItem(`chatpilot_accounts_${user.id}`) || '{}');
      localStorage.setItem(`chatpilot_accounts_${user.id}`, JSON.stringify({
        ...existingData,
        discord: true
      }));
      
      toast({
        title: "Discord Connected",
        description: "Successfully connected to your Discord account",
      });
      
      onAccountsConnected();
    }, 2000);
  };

  const canContinue = telegramConnected || discordConnected;

  return (
    <div className="space-y-8 ">
      <div className="">
        <h2 className="text-[36px] leading-[44px] tracking-[2px] text-white mb-2">Connect<br/> Your Platforms</h2>
        <p className="text-[#ffffff48]">Connect your Discord and Telegram accounts to start syncing your conversations.</p>
      </div>
      <PlatformStatusBadges discordConnected={discordConnected} telegramConnected={telegramConnected}/>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Discord Box */}
        {/* <Card className="border-2 border-dashed hover:border-purple-300 transition-colors">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto">
                <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Discord</h3>
                <ul className="text-sm text-gray-600 space-y-1 mb-4">
                  <li className="flex"><Check className="w-4 h-4 text-blue-600 flex-shrink-0" /> Access server channels</li>
                  <li className="flex"><Check className="w-4 h-4 text-blue-600 flex-shrink-0" /> View direct messages</li>
                  <li className="flex"><Check className="w-4 h-4 text-blue-600 flex-shrink-0" /> Manage notifications</li>
                  <li className="flex"><Check className="w-4 h-4 text-blue-600 flex-shrink-0" /> Real-time sync</li>
                </ul>
              </div>
              {discordConnected ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                  <Check className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Button
                  onClick={connectDiscord}
                  disabled={loading.discord}
                  className="w-full gap-2"
                  variant="outline"
                >
                  {loading.discord && <Loader2 className="w-4 h-4 animate-spin" />}
                  Connect Discord
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card> */}
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
          Connect your Discord account
        </span>
      </div>

      </div>
      <hr className="w-full h-0.5 my-4 bg-[#ffffff06]"/>

    {/* Info Section */}
    <div className="flex-1 text-[#ffffff72]">
      <p className="text-[#ffffff72] mb-4">What you'll get:</p>
      <ul className="text-xs text-[#ffffff48] space-y-2 mb-3">
        <li className="flex gap-4"><Check className="w-4 h-4 flex-shrink-0" /> Access server channels</li>
        <li className="flex gap-4"><Check className="w-4 h-4 flex-shrink-0" /> View direct messages</li>
        <li className="flex gap-4"><Check className="w-4 h-4 flex-shrink-0" /> Manage notifications</li>
        <li className="flex gap-4"><Check className="w-4 h-4 flex-shrink-0" /> Real-time sync</li>
      </ul>
    <hr className="w-full h-0.5 my-4 bg-[#ffffff06]"/>

      <div className="flex items-center justify-between mt-4">
  {/* Status pill */}
  <span className={`
    text-xs pr-3 py-1 flex gap-2 items-center 
    ${discordConnected ? "text-[#50DF3A]" : ""}
  `}>
<span>
  {discordConnected ? (
    <div className="bg-[#50DF3A] rounded-full p-1 flex items-center justify-center">
      <Check className="w-3 h-3 text-black" />
    </div>
  ) : (
    <Ban className="w-4 h-4" />
  )}
</span>    <span>{discordConnected ? "Connected" : "Not Connected"}</span>
    
  </span>
  {/* Action button */}
  {discordConnected ? (
    <Button
    onClick={connectDiscord}
    disabled={loading.discord}
    className="bg-[#212121] hover:bg-[#4170cc] text-white font-semibold rounded-[12px] px-6 py-2 gap-2 shadow-none"
    >
      Reconnect
    </Button>
  ) : (
    <Button
      onClick={connectDiscord}
      disabled={loading.discord}
      className="bg-[#2d2d2d] hover:bg-[#4170cc] text-white font-semibold rounded-[12px] px-6 py-2 gap-2 shadow-none"
    >
      {loading.discord && <Loader2 className="w-4 h-4 animate-spin" />}
      {discordConnected?"Reconnect":"Connect"}
      
      {/* <ExternalLink className="w-4 h-4" /> */}
    </Button>
  )}
</div>
    </div>

  </CardContent>
</Card>
        {/* Telegram Box */}
        {/* <Card className="border-2 border-dashed hover:border-blue-300 transition-colors">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto">
                <MessageCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Telegram</h3>
                <ul className="text-sm text-gray-600 space-y-1 mb-4 text-left">                
                <li className="flex"><Check className="w-4 h-4 text-blue-600 flex-shrink-0" /> Access group chats</li>
                  <li className="flex"><Check className="w-4 h-4 text-blue-600 flex-shrink-0" /> View private messages</li>
                  <li className="flex"><Check className="w-4 h-4 text-blue-600 flex-shrink-0" /> Bot integration</li>
                  <li className="flex"><Check className="w-4 h-4 text-blue-600 flex-shrink-0" /> Cloud sync</li>
                </ul>                
              </div>
              {telegramConnected ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                  <Check className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Button
                  onClick={connectTelegram}
                  disabled={loading.telegram}
                  className="w-full gap-2"
                >
                  {loading.telegram && <Loader2 className="w-4 h-4 animate-spin" />}
                  Connect Telegram
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
            </div>
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
          Connect your Telegram account
        </span>
      </div>
    </div>
    <hr className="w-full h-0.5 my-4 bg-[#ffffff06]" />

    {/* Info Section */}
    <div className="flex-1 text-[#ffffff72]">
      <p className="text-[#ffffff72] mb-4">What you'll get:</p>
      <ul className="text-xs text-[#ffffff48] space-y-2 mb-3">
        <li className="flex gap-4"><Check className="w-4 h-4 flex-shrink-0" />Access to all your Telegram chats</li>
        <li className="flex gap-4"><Check className="w-4 h-4 flex-shrink-0" />Message history and notifications</li>
        <li className="flex gap-4"><Check className="w-4 h-4 flex-shrink-0" />Smart summaries of channel activity</li>
        <li className="flex gap-4 h-4"></li>
      </ul>
      <hr className="w-full h-0.5 my-4 bg-[#ffffff06]" />

      <div className="flex items-center justify-between mt-4">
        {/* Status pill */}
        <span className={`
          text-xs pr-3 py-1 flex gap-2 items-center 
          ${telegramConnected ? "text-[#50DF3A]" : ""}
        `}>
          <span>
            {telegramConnected ? (
              <div className="bg-[#50DF3A] rounded-full p-1 flex items-center justify-center">
                <Check className="w-3 h-3 text-black" />
              </div>
            ) : (
              <Ban className="w-4 h-4" />
            )}
          </span>
          <span>{telegramConnected ? "Connected" : "Not Connected"}</span>
        </span>
        {/* Action button */}
        {telegramConnected ? (
          <Button
            onClick={connectTelegram}
            disabled={loading.telegram}
            className="bg-[#212121] hover:bg-[#4170cc] text-white font-semibold rounded-[12px] px-6 py-2 gap-2 shadow-none"
          >
            Reconnect
          </Button>
        ) : (
          <Button
            onClick={connectTelegram}
            disabled={loading.telegram}
            className="bg-[#2d2d2d] hover:bg-[#4170cc] text-white font-semibold rounded-[12px] px-6 py-2 gap-2 shadow-none"
          >
            {loading.telegram && <Loader2 className="w-4 h-4 animate-spin" />}
            {telegramConnected ? "Reconnect" : "Connect"}
          </Button>
        )}
      </div>
    </div>
  </CardContent>
</Card>

        {/* Continue Box */}
        {/* <Card className={`border-2 ${canContinue ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'} transition-colors`}>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${canContinue ? 'bg-green-100' : 'bg-gray-100'}`}>
                <ArrowRight className={`w-8 h-8 ${canContinue ? 'text-green-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Ready to Continue</h3>
                <ul className="text-sm text-gray-600 space-y-1 mb-4">
                  <li className="flex"><Check className="w-4 h-4 text-blue-600 flex-shrink-0" />  Select your chats</li>
                  <li className="flex"><Check className="w-4 h-4 text-blue-600 flex-shrink-0" />  Configure sync settings</li>
                  <li className="flex"><Check className="w-4 h-4 text-blue-600 flex-shrink-0" />  Start using ChatPilot</li>
                  <li className="flex"><Check className="w-4 h-4 text-blue-600 flex-shrink-0" />  Unified inbox ready</li>
                </ul>
              </div>
              <div className={`text-sm ${canContinue ? 'text-green-600' : 'text-gray-500'}`}>
                {canContinue ? '✓ Ready to proceed' : 'Connect at least one platform'}
              </div>
            </div>
          </CardContent>
        </Card> */}
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
      <p className="text-[#ffffff72] mb-4">What to anticipate:</p>
      <ul className="text-xs text-[#ffffff48] space-y-2 mb-3">
        <li className="flex gap-4"><Check className="w-4 h-4 flex-shrink-0" />Chats sync in about 30 minutes.</li>
        <li className="flex gap-4"><Check className="w-4 h-4 flex-shrink-0" />Choose your focus areas.</li>
        <li className="flex gap-4"><Check className="w-4 h-4 flex-shrink-0" />Discover the Focus Mode features.</li>
        <li className="flex gap-4 h-4"></li>
      </ul>
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
