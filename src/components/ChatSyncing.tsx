import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  MessageCircle,
  Users,
  Check,
  Save,
  ExternalLink,
  Loader2,
  ArrowRight,
  Ban,
  Play,
  RotateCcw,
} from "lucide-react";

import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import telegram from "@/assets/images/telegram.png";
import discord from "@/assets/images/discord.png";
import play from "@/assets/images/play.png";
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

export const ChatSyncing = ({
  onComplete,
  restartOnboarding,
  chatsSelected,
  approvedChats,
  telegramConnected,
  setTelegramConnected,
  discordConnected,
  setDiscordConnected,
}: ChatSyncingProps) => {
  const { user } = useAuth();

  const discordChats = approvedChats.filter(
    (chat) => chat.platform === "discord"
  );
  // We'll fetch Telegram chats from the backend as before
  const [telegramChats, setTelegramChats] = useState<any[]>([]);
  const [telegramLoading, setTelegramLoading] = useState(true);
  const [syncingInProgress, setSyncingInProgress] = useState(false);
  const [initialSyncTriggered, setInitialSyncTriggered] = useState(false);
  const [hasStartedFindingChats, setHasStartedFindingChats] = useState(false);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    if (!user) return;
    setTelegramLoading(true);
    const loadOrSync = async () => {
      try {
        // Prefer UI chats endpoint that computes last message and counts
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
            return;
          }
        }

        // If no chats yet, trigger server-side sync and show progress
        setSyncingInProgress(true);
        setInitialSyncTriggered(true);

        // Start syncing
        await fetch(`${BACKEND_URL}/api/sync-dialogs`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });

        // Start with a small delay to let sync begin
        await new Promise((r) => setTimeout(r, 1000));

        // Poll more frequently with progress updates
        let consecutiveEmptyPolls = 0;
        const maxConsecutiveEmpty = 5;

        for (let i = 0; i < 45; i++) {
          // Increased attempts and longer polling
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

            // Update chats immediately to show progress
            setTelegramChats(chats2);

            // If we got chats, reset the empty poll counter
            if (chats2.length > 0) {
              if (!hasStartedFindingChats) {
                setHasStartedFindingChats(true);
              }
              consecutiveEmptyPolls = 0;

              // If we have a good number of chats, continue for a bit longer to catch more
              if (chats2.length >= 20 && i >= 15) {
                // Continue for a few more iterations to catch additional chats
                if (i >= 25) {
                  setSyncingInProgress(false);
                  setTelegramLoading(false);
                  return;
                }
              }
            } else {
              consecutiveEmptyPolls++;

              // If we've had too many empty polls in a row, stop
              if (consecutiveEmptyPolls >= maxConsecutiveEmpty && i >= 10) {
                break;
              }
            }
          }

          // Wait before next poll - longer wait as time goes on
          const waitTime = Math.min(1000 + i * 100, 3000); // 1s to 3s
          await new Promise((r) => setTimeout(r, waitTime));
        }

        setSyncingInProgress(false);
        setTelegramLoading(false);
      } catch (e) {
        setSyncingInProgress(false);
        setTelegramLoading(false);
        setTelegramChats([]);
      }
    };
    loadOrSync();
  }, [user]);

  const [syncProgress, setSyncProgress] = useState({ discord: 0, telegram: 0 });
  const [syncComplete, setSyncComplete] = useState(false);

  //   const [telegramConnected, setTelegramConnected] = useState(false);
  //   const [discordConnected, setDiscordConnected] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchStatuses = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const tgRes = await fetch(`${BACKEND_URL}/auth/telegram/status`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (tgRes.ok) {
          const tg = await tgRes.json();
          setTelegramConnected(!!tg.connected);
        }
        const dcRes = await fetch(`${BACKEND_URL}/auth/discord/status`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (dcRes.ok) {
          const dc = await dcRes.json();
          setDiscordConnected(!!dc.connected);
        }
      } catch (e) {
        // ignore
      }
    };
    fetchStatuses();
  }, [user, setTelegramConnected, setDiscordConnected]);

  useEffect(() => {
    // Discord Sync - only simulate if we have Discord chats
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

    // Telegram Sync - base progress on actual chat count and loading state
    let telegramInterval: NodeJS.Timeout | null = null;

    if (syncingInProgress) {
      // Show incremental progress while syncing based on actual chat count
      let baseProgress;
      if (telegramChats.length === 0) {
        // If no chats yet, show some progress to indicate work is happening
        baseProgress = hasStartedFindingChats ? 15 : 8;
      } else {
        // Scale progress based on chat count, max 85% while still syncing
        baseProgress = Math.min(15 + (telegramChats.length / 100) * 70, 85);
      }

      setSyncProgress((prev) => ({
        ...prev,
        telegram: Math.max(baseProgress, prev.telegram), // Only increase, never decrease
      }));

      // Update progress periodically while syncing to show it's active
      telegramInterval = setInterval(() => {
        let currentProgress;
        if (telegramChats.length === 0) {
          currentProgress = hasStartedFindingChats ? 15 : 8;
        } else {
          currentProgress = Math.min(
            15 + (telegramChats.length / 100) * 70,
            85
          );
        }

        setSyncProgress((prev) => ({
          ...prev,
          telegram: Math.max(currentProgress, prev.telegram),
        }));
      }, 1500);
    } else if (telegramLoading) {
      // Show initial loading state
      setSyncProgress((prev) => ({
        ...prev,
        telegram: 3, // Small progress to show it's starting
      }));
    } else if (telegramChats.length > 0) {
      // Complete progress when done loading
      setSyncProgress((prev) => ({
        ...prev,
        telegram: 100,
      }));
    } else {
      setSyncProgress((prev) => ({ ...prev, telegram: 0 }));
    }

    // Cleanup
    return () => {
      if (discordInterval) clearInterval(discordInterval);
      if (telegramInterval) clearInterval(telegramInterval);
    };
  }, [
    telegramChats.length,
    syncingInProgress,
    telegramLoading,
    discordChats.length,
    hasStartedFindingChats,
  ]);

  useEffect(() => {
    if (
      (discordChats.length === 0 || syncProgress.discord >= 100) &&
      (telegramChats.length === 0 || syncProgress.telegram >= 100) &&
      !syncingInProgress &&
      !telegramLoading
    ) {
      setTimeout(() => setSyncComplete(true), 500); // Optional: add a small delay for smoothness
    }
  }, [
    syncProgress,
    discordChats.length,
    telegramChats.length,
    syncingInProgress,
    telegramLoading,
  ]);

  //   useEffect(() => {
  //     if (syncComplete) {
  //       const timeout = setTimeout(() => {
  //         onComplete();
  //       }, 1200); // Show the card for 1.2 seconds
  //       return () => clearTimeout(timeout);
  //     }
  //   }, [syncComplete, onComplete]);

  // Telegram sync bar logic: show actual progress
  const telegramSyncValue = syncProgress.telegram;
  const telegramSyncBarClass = syncingInProgress
    ? "bg-blue-600" // Blue while actively syncing
    : telegramLoading
    ? "bg-blue-400" // Lighter blue while loading
    : telegramChats.length > 0
    ? "bg-green-900" // Green when complete with chats
    : "bg-gray-700"; // Gray when no chats

  return (
    <div className="space-y-6">
      <div className="">
        <h2
          className={`text-[36px] leading-[44px] tracking-[2px] text-white mb-2 ${
            syncComplete ? "max-w-[150px]" : "max-w-[500px]"
          }`}
        >
          {syncComplete
            ? "Syncing is done!"
            : syncingInProgress || telegramLoading
            ? "Syncing your chats..."
            : "All platforms connected successfully!"}
        </h2>
        <p className="text-[#ffffff48]">
          {syncComplete
            ? "Let's start playing around"
            : syncingInProgress || telegramLoading
            ? "Please wait while we sync your conversations from Telegram."
            : "Your accounts have been connected and your chats are now syncing."}{" "}
        </p>
      </div>

      <PlatformStatusBadges
        telegramConnected={telegramConnected}
        discordConnected={discordConnected}
      />

      <div className={`flex gap-6`}>
        {/* Discord Chats */}
        <Card
          className={`bg-[#111111] border-0 shadow-none rounded-[18px] grow`}
        >
          <CardContent className="p-6 gap-5">
            <div className="flex gap-2 items-center">
              <div className="flex flex-col gap-0 mb-1">
                <span className="text-lg font-semibold mb-1 text-[#ffffff90]">
                  {syncComplete
                    ? "Sync done."
                    : syncingInProgress || telegramLoading
                    ? "Sync in progress..."
                    : "Sync in progress..."}
                </span>
                <span
                  className={`text-xs text-[#ffffff48] rounded-full font-medium`}
                >
                  {syncComplete
                    ? "All your chats were processed. "
                    : syncingInProgress || telegramLoading
                    ? `Syncing... ${telegramChats.length} chats found so far.`
                    : "All your chats are being processed."}
                </span>
              </div>
            </div>
            <hr className="w-full h-0.5 my-4 bg-[#ffffff06]" />

            {/* Info Section */}
            <div className="flex-1 text-[#ffffff72]">
              <div className="">
                <div className="discordProgress">
                  <p>Discord Servers ({discordChats.length})</p>
                  <div className="w-full rounded-full bg-[#171717] px-3 py-3 mt-2">
                    <div
                      className={`h-1 rounded-full discordProgressBar transition-all duration-300 ${
                        discordChats.length === 0
                          ? "bg-gray-700"
                          : "bg-green-900"
                      }`}
                      style={{
                        width:
                          discordChats.length === 0
                            ? "100%"
                            : `${syncProgress.discord}%`,
                        opacity: discordChats.length === 0 ? 0.5 : 1,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="telegramProgress">
                  <p className="flex items-center gap-2">
                    Telegram Chats ({telegramChats.length})
                    {(syncingInProgress || telegramLoading) && (
                      <>
                        <span className="flex items-center gap-1 text-xs text-blue-400">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                          {syncingInProgress ? "Syncing..." : "Loading..."}
                        </span>
                      </>
                    )}
                  </p>
                  <div className="w-full rounded-full bg-[#171717] px-3 py-3 mt-2">
                    <div
                      className={`h-1 rounded-full telegramProgressBar transition-all duration-300 ${telegramSyncBarClass} ${
                        syncingInProgress ? "animate-pulse" : ""
                      }`}
                      style={{
                        width: `${telegramSyncValue}%`,
                        opacity:
                          telegramChats.length === 0 &&
                          !syncingInProgress &&
                          !telegramLoading
                            ? 0.5
                            : 1,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              <hr className="w-full h-0.5 my-4 bg-[#ffffff06]" />

              <div className="flex items-center justify-between mt-4">
                {/* Status pill */}
                <span
                  className={`
          text-xs pr-3 py-1 flex gap-2 items-center text-[#ffffff84] cursor-pointer
        `}
                >
                  <span>
                    <Check className="w-4 h-4" />
                  </span>
                  {/* <span className="cursor-pointer" onClick={() => selectAllByPlatform('discord')}> Select all</span> */}
                </span>
                {/* Action button */}
                <Button
                  // disabled={loading.discord}
                  onClick={restartOnboarding}
                  className="bg-[#171717] hover:bg-[#4170cc] text-white font-semibold rounded-[12px] px-6 py-2 gap-2 shadow-none"
                >
                  Reconnect
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Settings */}
        <Card
          className={`bg-[#111111] border-0 shadow-none rounded-[18px] ${
            syncComplete ? "block" : "hidden"
          }`}
        >
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
                  <span
                    className={`text-xs text-[#ffffff48] rounded-full font-medium`}
                  >
                    {/* {canContinue?"You are connected, you can move forward.":"Connect at least one platform."} */}
                  </span>
                </div>
                <hr className="w-full h-0.5 my-4 bg-[#ffffff06]" />

                <div className="flex-1 text-[#ffffff72]">
                  <div className="h-[150px]">
                    <p className="text-[#ffffff72] mb-4">
                      Here's what you can explore next:
                    </p>
                    <ul className="text-xs text-[#ffffff48] space-y-2 mb-3">
                      <li className="flex gap-4">
                        <Check className="w-4 h-4 flex-shrink-0" />
                        Quicly summarize your decisions.
                      </li>
                      <li className="flex gap-4">
                        <Check className="w-4 h-4 flex-shrink-0" />
                        Engage Focus Mode.
                      </li>
                      <li className="flex gap-4">
                        <Check className="w-4 h-4 flex-shrink-0" />
                        Discover new tasks.
                      </li>
                      <li className="flex gap-4 h-4"></li>
                    </ul>
                  </div>
                  <hr className="w-full h-0.5 my-4 bg-[#ffffff06]" />

                  <div className="flex items-center justify-between mt-4 h-10">
                    {/* Status pill */}
                    <span
                      className={`text-xs pr-3 py-1 flex gap-2 items-center text-[#84afff]`}
                    >
                      <Button
                        onClick={restartOnboarding}
                        className="bg-transparent text-[#ffffff96] hover:bg-transparent hover:text-white"
                      >
                        Restart <RotateCcw />{" "}
                      </Button>
                    </span>
                    {/* Action button */}
                    <Button
                      onClick={onComplete}
                      className="bg-[#5389ff] hover:bg-[#4170cc] text-black rounded-[12px] px-3 py-2 gap-2 shadow-none"
                    >
                      <img
                        src={play}
                        className="fill-black rounded-full w-4 h-4 object-contain"
                      />
                      Continue to inbox
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
