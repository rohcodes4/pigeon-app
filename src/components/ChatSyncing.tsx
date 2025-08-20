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

  const [syncProgress, setSyncProgress] = useState({ discord: 0, telegram: 0 });
  const [syncComplete, setSyncComplete] = useState(false);

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

    for (let i = 0; i < 200; i++) {
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
              setSyncingInProgress(false);
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

    // If we reach here, sync has been running for a while
    console.log(
      `Sync polling completed after ${200} iterations with ${
        telegramChats.length
      } chats`
    );
    setSyncingInProgress(false);
    setTelegramLoading(false);
    setSyncComplete(true); // Mark as complete even if we hit the limit
  };

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
      // Show incremental progress while syncing based on actual chat count and time
      let baseProgress;
      if (telegramChats.length === 0) {
        // If no chats yet, show some progress to indicate work is happening
        baseProgress = hasStartedFindingChats ? 15 : 8;
      } else {
        // Scale progress based on chat count, but be more conservative
        // Assume a reasonable maximum of chats (e.g., 200) for progress calculation
        const estimatedMaxChats = Math.max(200, telegramChats.length * 1.5);
        const chatProgress = Math.min(
          (telegramChats.length / estimatedMaxChats) * 60,
          60
        );
        baseProgress = Math.min(15 + chatProgress, 75); // Max 75% while still syncing
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
          const estimatedMaxChats = Math.max(200, telegramChats.length * 1.5);
          const chatProgress = Math.min(
            (telegramChats.length / estimatedMaxChats) * 60,
            60
          );
          currentProgress = Math.min(15 + chatProgress, 75);
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
    } else if (telegramChats.length > 0 && !syncingInProgress) {
      // Complete progress when done loading and not syncing
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
      // Only mark as complete if we have a reasonable number of chats and sync has been stable
      if (telegramChats.length >= 20) {
        // Increased minimum requirement
        // Add additional delay to ensure sync is really complete
        setTimeout(() => {
          console.log(
            `Marking sync as complete with ${telegramChats.length} chats`
          );
          setSyncComplete(true);
        }, 1000);
      }
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
            : "Ready to sync your chats!"}
        </h2>
        <p className="text-[#ffffff48]">
          {syncComplete
            ? "Let's start playing around"
            : syncingInProgress || telegramLoading
            ? "Please wait while we sync your conversations from Telegram."
            : "Your accounts have been connected. Click 'Sync Chats' to start syncing your Telegram conversations."}{" "}
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
                    ? `Sync in progress... (${telegramChats.length} chats found)`
                    : telegramChats.length > 0
                    ? `${telegramChats.length} chats found (click "Sync Chats" to sync more)`
                    : "No chats synced yet (click 'Sync Chats' to start)"}
                </span>
                <span
                  className={`text-xs text-[#ffffff48] rounded-full font-medium`}
                >
                  {syncComplete
                    ? "All your chats were processed. "
                    : syncingInProgress || telegramLoading
                    ? `Syncing... ${telegramChats.length} chats found so far. Please wait for complete sync.`
                    : telegramChats.length > 0
                    ? `${telegramChats.length} chats are available. Click "Sync Chats" to discover more.`
                    : "Click the button below to start syncing your Telegram chats."}
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
                        <span className="text-xs text-[#ffffff48]">
                          (Found {telegramChats.length} chats so far)
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
                <div className="flex gap-2">
                  <Button
                    onClick={async () => {
                      // Start the initial sync
                      setSyncingInProgress(true);
                      setTelegramLoading(true);
                      setInitialSyncTriggered(true);
                      setHasStartedFindingChats(false);
                      setSyncComplete(false);

                      try {
                        // Start syncing
                        await fetch(`${BACKEND_URL}/api/sync-dialogs`, {
                          method: "POST",
                          headers: { Authorization: `Bearer ${token}` },
                        });

                        // Start polling for progress
                        startSyncPolling();
                      } catch (e) {
                        console.error("Failed to start sync:", e);
                        setSyncingInProgress(false);
                        setTelegramLoading(false);
                      }
                    }}
                    disabled={syncingInProgress || telegramLoading}
                    className="bg-[#5389ff] hover:bg-[#4170cc] text-white font-semibold rounded-[12px] px-4 py-2 gap-2 shadow-none"
                  >
                    {syncingInProgress || telegramLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RotateCcw className="w-4 h-4" />
                    )}
                    {syncingInProgress || telegramLoading
                      ? "Syncing..."
                      : "Sync Chats"}
                  </Button>
                  <Button
                    onClick={restartOnboarding}
                    className="bg-[#171717] hover:bg-[#4170cc] text-white font-semibold rounded-[12px] px-4 py-2 gap-2 shadow-none"
                  >
                    Reconnect
                  </Button>
                </div>
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
                    Synchronization successful! ({telegramChats.length} chats)
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
