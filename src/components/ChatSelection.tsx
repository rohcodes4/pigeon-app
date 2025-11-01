import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";

import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import telegram from "@/assets/images/telegram.png";
import discord from "@/assets/images/discord.png";
import play from "@/assets/images/play.png";
import { PlatformStatusBadges } from "./PlatformStatusBadges";
import ConnectTelegram from "./ConnectTelegram";
import { useDiscordContext } from "@/context/discordContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

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

export const ChatSelection = ({
  onChatsSelected,
  onContinue,
  telegramConnected,
  setTelegramConnected,
  discordConnected,
  setDiscordConnected,
}: ChatSelectionProps) => {
  const { user, checkAuth } = useAuth();
  const [chatGroups, setChatGroups] = useState<ChatGroup[]>([]);
  const [chatGroupsDiscord, setChatGroupsDiscord] = useState<ChatGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { guilds } = useDiscordContext();

  useEffect(() => {
    if (!user) return;

    const fetchUserChats = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch(`${BACKEND_URL}/api/sync-preferences/chats`, {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        });
        if (!res.ok) throw new Error(`Failed to fetch chats: ${res.status}`);

        const data = await res.json();

        // Map the backend chats into ChatGroup format your UI expects
        const fetchedChats = (data.chats || []).map((chat) => ({
          id: chat.id,
          group_name: chat.title || `Chat ${chat.id}`,
          group_avatar: chat.photo_url ?? null,
          platform:
            chat.type?.toLowerCase() === "discord" ? "discord" : "telegram",
          // member_count: null, // Not provided here, optional
          is_synced: chat.sync_enabled, // default unselected, load saved selections below
          type: chat.type || null,
          username: chat.username || null,
        }));

        setChatGroups(fetchedChats);
      } catch (error) {
        toast({
          title: "Error loading chats",
          description: error.message,
          variant: "destructive",
        });
        setChatGroups([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchDicordChats = async () => {
      // const guilds = await window.electronAPI.discord.getGuilds();
      console.log(guilds, "guildss");
      setChatGroupsDiscord([...guilds]);
    };
    fetchDicordChats();
    fetchUserChats();
  }, [user]);
  // Fetch connected statuses from backend (authoritative source)
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

        const res = await window.electronAPI.security.getDiscordToken();
        if (res?.success && res?.data) {
          await window.electronAPI.discord.connect(res.data);
          setDiscordConnected(!!res.success);
        }
      } catch (e) {
        // ignore errors
      }
    };
    fetchStatuses();
  }, [user, setTelegramConnected, setDiscordConnected]);

  const savePreferences = async () => {
    setSaving(true);

    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("User not authenticated");

      // Construct enabled and disabled chat ID strings
      const enabledChatIds = chatGroups
        .filter((c) => c.is_synced)
        .map((c) => c.id)
        .join(",");

      const disabledChatIds = chatGroups
        .filter((c) => !c.is_synced)
        .map((c) => c.id)
        .join(",");

      const body = new URLSearchParams();
      body.append("enabled_chats", enabledChatIds);
      body.append("disabled_chats", disabledChatIds);
      body.append("sync_groups", "true");
      body.append("sync_channels", "true");

      const response = await fetch(`${BACKEND_URL}/api/sync-preferences`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${token}`,
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error ${response.status}`);
      }

      const data = await response.json();

      toast({
        title: "Preferences Saved",
        description: "Your chat sync preferences have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error Saving Preferences",
        description: error.message || "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleChatSync = async (
    groupId: string,
    currentSyncStatus: boolean
  ) => {
    setChatGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? { ...group, is_synced: !currentSyncStatus }
          : group
      )
    );
    const hasSelectedChats = chatGroups.some((group) =>
      group.id === groupId ? !currentSyncStatus : group.is_synced
    );
    const selectedChats = chatGroups.some((group) =>
      group.id === groupId ? !currentSyncStatus : group.is_synced
    );

    if (hasSelectedChats && onChatsSelected) {
      onChatsSelected(selectedChats);
    }
  };

  const selectAllByPlatform = (platform: string) => {
    // Find all chats for the platform
    const platformChats = chatGroups.filter(
      (group) => group.platform === platform
    );
    // Check if all are already selected
    const allSelected = platformChats.every((group) => group.is_synced);

    // Compute the new chatGroups state
    const newChatGroups = chatGroups.map((group) =>
      group.platform === platform
        ? { ...group, is_synced: !allSelected }
        : group
    );
    setChatGroups(newChatGroups);
  };

  const saveAllChanges = async () => {
    setSaving(true);

    setTimeout(() => {
      setSaving(false);

      const hasSelectedChats = chatGroups.some((group) => group.is_synced);
      const selectedChats = chatGroups.filter((group) => group.is_synced);
      if (hasSelectedChats && onChatsSelected) {
        onChatsSelected(selectedChats);
      }

      toast({
        title: "Settings Saved",
        description: "All chat sync settings have been saved",
      });
    }, 1500);
  };

  const discordChats = chatGroups.filter(
    (group) => group.platform === "discord"
  );
  const telegramChats = chatGroups.filter(
    (group) => group.platform === "telegram"
  );
  const canContinue = telegramConnected || discordConnected;
  const [authMethod, setAuthMethod] = useState<"qr" | "phone">("phone");
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showTelegramQrModal, setShowTelegramQrModal] = useState(false);
  const [telegramQrCode, setTelegramQrCode] = useState<string | null>(null);
  const [loadingPlatform, setLoadingPlatform] = useState({
    telegram: false,
    discord: false,
  });
  const [pollingIntervalId, setPollingIntervalId] =
    useState<NodeJS.Timeout | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [twoFactorPassword, setTwoFactorPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const connectTelegram = async () => {
    if (!user) return;

    if (authMethod === "phone") {
      // For phone auth, we'll show the phone input modal
      setShowPhoneModal(true);
      return;
    }

    // QR code authentication
    setLoadingPlatform((prev) => ({ ...prev, telegram: true }));
    try {
      window.electronAPI.telegram.loginQR();
      window.electronAPI.telegram.onQR(async (data) => {
        console.log("Received Telegram QR code", data);
        setTelegramQrCode(data);
        // setTelegramQrToken(data.token);
        setShowTelegramQrModal(true);
      });
      window.electronAPI.telegram.onPasswordRequired(() => {
        console.log("Password required for 2FA");
        setShowPasswordModal(true);
        toast({
          title: "Two-Factor Authentication Required",
          description:
            "Please enter your Telegram password to complete the connection.",
        });
      });
    } catch (error: any) {
      toast({
        title: "Telegram Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingPlatform((prev) => ({ ...prev, telegram: false }));
    }
  };

  const connectDiscord = async () => {
    const res = await window.electronAPI.security.getDiscordToken();
    if (res?.data) {
      const conncted = await window.electronAPI.discord.connect(res.data);
      // You already got the token from electron, return early
      if (!conncted.success) {
        await window.electronAPI.discord.openLogin();
        const res = await window.electronAPI.security.getDiscordToken();
        console.log("Discord token result2:", res);
        if (res?.data) {
          const conncted = await window.electronAPI.discord.connect(res.data);
          setDiscordConnected(!!conncted.success);
        }
      } else {
        console.log(!!conncted.success, "discord connected");
        setDiscordConnected(!!conncted.success);
      }
    } else {
      const data = await window.electronAPI.discord.openLogin();
      if (data.success && data.data) setDiscordConnected(true);
    }
  };
  const disconnectDiscord = async () => {
    // await window.electronAPI.discord.disconnect();
    await window.electronAPI.discord.disconnect();
    await window.electronAPI.security.clearDiscordToken();
    setDiscordConnected(false);
  };

  const submitTelegramPassword = async () => {
    if (!twoFactorPassword.trim()) {
      toast({
        title: "Password Required",
        description: "Please enter your Telegram password.",
        variant: "destructive",
      });
      return;
    }

    setPasswordLoading(true);
    try {
      await window.electronAPI.telegram.sendPassword(twoFactorPassword);
      window.electronAPI.telegram.onLoginSuccess((user) => {
        console.log("Telegram ipc login success:", user);
        setShowPasswordModal(false);
        setTwoFactorPassword("");
        setTelegramConnected(true);
        setShowTelegramQrModal(false);
        toast({
          title: "Telegram Connected",
          description:
            "Successfully connected to your Telegram account. You can now sync your chats when ready.",
        });
      });

      window.electronAPI.telegram.onLoginError((error) => {
        toast({
          title: "Authentication Failed",
          description: "Failed to verify password",
          variant: "destructive",
        });
      });
      window.electronAPI.telegram.onPasswordInvalid(() => {
        toast({
          title: "Authentication Failed",
          description: "Invalid password. Please try again.",
          variant: "destructive",
        });
      });
    } catch (error: any) {
      toast({
        title: "Authentication Failed",
        description: error.message || "Invalid password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="">
        <h2 className="text-[36px] leading-[44px] tracking-[2px] text-white mb-2">
          Select
          <br /> Your Chats
        </h2>
        <p className="text-[#ffffff48]">
          Select your Discord and Telegram groups and chats to start syncing
          your conversations.
        </p>
      </div>
      <PlatformStatusBadges
        telegramConnected={telegramConnected}
        discordConnected={discordConnected}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Discord Chats */}
        <Card
          className={`${
            discordConnected ? "bg-[#111111]" : "bg-[#ffffff06]"
          } border-0 shadow-none rounded-[18px]`}
        >
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
                <span className="text-lg font-semibold mb-1 text-white">
                  Discord
                </span>
                <span
                  className={`text-xs text-[#ffffff48] rounded-full font-medium`}
                >
                  Select channels:
                </span>
              </div>
            </div>
            <hr className="w-full h-0.5 my-4 bg-[#ffffff06]" />

            {/* Info Section */}
            <div className="flex-1 text-[#ffffff72]">
              <div className="h-[150px] overflow-y-scroll">
                {discordConnected ? (
                  chatGroupsDiscord.map((group) => (
                    <div
                      key={group.id}
                      className="flex items-center justify-between p-2 border-0 rounded-lg"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Checkbox
                          className="min-h-1 min-w-1"
                          checked={group.is_synced}
                          onCheckedChange={() =>
                            toggleChatSync(group.id, group.is_synced)
                          }
                        />
                        <div className="flex justify-between w-full">
                          <p className="font-medium text-sm">{group.name}</p>
                          <p className="text-xs text-black bg-[#3589ff] px-2 py-1 rounded-[6px]">
                            {group.member_count} members
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Connect Discord to see chats
                  </p>
                )}
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
                  <span
                    className="cursor-pointer"
                    onClick={() => selectAllByPlatform("discord")}
                  >
                    {" "}
                    Select all
                  </span>
                </span>
                {/* Action button */}
                {!discordConnected ? (
                  <Button
                    onClick={connectDiscord}
                    disabled={loadingPlatform.discord}
                    className="bg-[#212121] hover:bg-[#4170cc] text-white font-semibold rounded-[12px] px-6 py-2 gap-2 shadow-none"
                  >
                    Connect
                  </Button>
                ) : (
                  <>
                    <Button
                      // disabled={loading.discord}
                      onClick={() => {
                        disconnectDiscord();
                        connectDiscord();
                      }}
                      className="bg-[#171717] hover:bg-[#4170cc] text-white font-semibold rounded-[12px] px-6 py-2 gap-2 shadow-none"
                    >
                      Reconnect
                    </Button>
                    <Button
                      // disabled={loading.discord}
                      className="bg-[#171717] hover:bg-[#4170cc] text-white font-semibold rounded-[12px] px-6 py-2 gap-2 shadow-none"
                      onClick={disconnectDiscord}
                    >
                      Disconnect
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`${
            telegramConnected ? "bg-[#111111]" : "bg-[#ffffff06]"
          } border-0 shadow-none rounded-[18px]`}
        >
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
                <span className="text-lg font-semibold mb-1 text-white">
                  Telegram
                </span>
                <span
                  className={`text-xs text-[#ffffff48] rounded-full font-medium`}
                >
                  Select chats:
                </span>
              </div>
            </div>
            <hr className="w-full h-0.5 my-4 bg-[#ffffff06]" />

            {/* Info Section */}
            <div className="flex-1 text-[#ffffff72]">
              <div className="h-[150px] overflow-y-scroll">
                {telegramConnected ? (
                  loading ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      {" "}
                      Loading...
                    </p>
                  ) : (
                    telegramChats.map((group) => (
                      <div
                        key={group.id}
                        className="flex items-center justify-between p-2 border-0 rounded-lg"
                      >
                        <div className="flex items-center gap-3 w-full">
                          <Checkbox
                            checked={group.is_synced}
                            onCheckedChange={() =>
                              toggleChatSync(group.id, group.is_synced)
                            }
                          />
                          <div className="flex justify-between w-full">
                            <p className="font-medium text-sm">
                              {group.group_name}
                            </p>
                            <p className="text-xs text-black bg-[#3589ff] px-2 py-1 rounded-[6px]">
                              {group.type}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Connect Telegram to see chats
                  </p>
                )}
              </div>
              <hr className="w-full h-0.5 my-4 bg-[#ffffff06]" />

              <div className="flex items-center justify-between mt-4">
                {/* Status pill */}
                <span
                  className={`text-xs pr-3 py-1 flex gap-2 items-center text-[#ffffff84] cursor-pointer`}
                >
                  <span>
                    <Check className="w-4 h-4" />
                  </span>
                  <span onClick={() => selectAllByPlatform("telegram")}>
                    {" "}
                    Select all
                  </span>
                </span>
                {/* Action button */}
                {telegramConnected ? (
                  <Button
                    onClick={connectTelegram}
                    disabled={loadingPlatform.telegram}
                    className="bg-[#212121] hover:bg-[#4170cc] text-white font-semibold rounded-[12px] px-6 py-2 gap-2 shadow-none"
                  >
                    Reconnect
                  </Button>
                ) : (
                  <div className="flex flex-col gap-2">
                    {/* Authentication Method Toggle */}
                    <div className="flex gap-1 bg-[#212121] rounded-lg p-1">
                      <button
                        onClick={() => setAuthMethod("qr")}
                        className={`px-3 py-1 text-xs rounded-md transition ${
                          authMethod === "qr"
                            ? "bg-[#5389ff] text-white"
                            : "text-[#ffffff80] hover:text-white"
                        }`}
                      >
                        QR Code
                      </button>
                      <button
                        onClick={() => setAuthMethod("phone")}
                        className={`px-3 py-1 text-xs rounded-md transition ${
                          authMethod === "phone"
                            ? "bg-[#5389ff] text-white"
                            : "text-[#ffffff80] hover:text-white"
                        }`}
                      >
                        Phone
                      </button>
                    </div>
                    <Button
                      onClick={connectTelegram}
                      disabled={loadingPlatform.telegram}
                      className="bg-[#2d2d2d] hover:bg-[#4170cc] text-white font-semibold rounded-[12px] px-6 py-2 gap-2 shadow-none"
                    >
                      {loadingPlatform.telegram && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )}
                      {telegramConnected ? "Reconnect" : "Connect"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Settings */}
        <Card className="bg-[#111111] border-0 shadow-none rounded-[18px]">
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4 ">
              <div className="w-full">
                <div className="flex flex-col gap-0 mb-1">
                  <span className="text-lg font-semibold mb-1 text-white">
                    Finalize Your Configuration
                  </span>
                  <span
                    className={`text-xs text-[#ffffff48] rounded-full font-medium`}
                  >
                    {canContinue
                      ? "You are connected, you can move forward."
                      : "Connect at least one platform."}
                  </span>
                </div>
                <hr className="w-full h-0.5 my-4 bg-[#ffffff06]" />

                <div className="flex-1 text-[#ffffff72]">
                  <div className="h-[150px]">
                    <p className="text-[#ffffff72] mb-4">What to anticipate:</p>
                    <ul className="text-xs text-[#ffffff48] space-y-2 mb-3">
                      <li className="flex gap-4">
                        <Check className="w-4 h-4 flex-shrink-0" />
                        Chats sync in about 30 minutes.
                      </li>
                      <li className="flex gap-4">
                        <Check className="w-4 h-4 flex-shrink-0" />
                        Choose your focus areas.
                      </li>
                      <li className="flex gap-4">
                        <Check className="w-4 h-4 flex-shrink-0" />
                        Discover the Focus Mode features.
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
                      <span>Can't wait to help you!</span>
                    </span>
                    {/* Action button */}
                    {canContinue && (
                      <Button
                        onClick={savePreferences}
                        disabled={saving}
                        className="bg-[#5389ff] hover:bg-[#4170cc] text-black rounded-[12px] px-3 py-2 gap-2 shadow-none"
                      >
                        <img
                          src={play}
                          className="fill-black rounded-full w-4 h-4 object-contain"
                        />
                        Continue
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {telegramQrCode && (
        <AlertDialog
          open={showTelegramQrModal}
          onOpenChange={setShowTelegramQrModal}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Connect Telegram</AlertDialogTitle>
              <AlertDialogDescription>
                Scan the QR code with your Telegram app to connect your account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex justify-center p-4">
              <img
                src={`${telegramQrCode}`}
                alt="Telegram QR Code"
                className="w-64 h-64"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setShowTelegramQrModal(false);
                  if (pollingIntervalId) {
                    clearInterval(pollingIntervalId);
                    setPollingIntervalId(null);
                  }
                  setTelegramQrCode(null);
                  setLoadingPlatform((prev) => ({ ...prev, telegram: false }));
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction disabled>
                Waiting for Scan...
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* 2FA Password Modal */}
      <AlertDialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Two-Factor Authentication</AlertDialogTitle>
            <AlertDialogDescription>
              Your Telegram account has two-factor authentication enabled.
              Please enter your password to complete the connection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-4 p-4">
            <Input
              type="password"
              placeholder="Enter your Telegram password"
              value={twoFactorPassword}
              onChange={(e) => setTwoFactorPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !passwordLoading) {
                  submitTelegramPassword();
                }
              }}
              disabled={passwordLoading}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowPasswordModal(false);
                setTwoFactorPassword("");
                setLoadingPlatform((prev) => ({ ...prev, telegram: false }));
              }}
              disabled={passwordLoading}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={submitTelegramPassword}
              disabled={passwordLoading || !twoFactorPassword.trim()}
            >
              {passwordLoading && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              Connect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Phone Authentication Modal */}
      <AlertDialog open={showPhoneModal} onOpenChange={setShowPhoneModal}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Connect Telegram via Phone</AlertDialogTitle>
            <AlertDialogDescription>
              Enter your phone number to receive a verification code via
              Telegram.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="p-4">
            <ConnectTelegram
              onConnected={() => {
                setTelegramConnected(true);
                // Status is derived from backend
                toast({
                  title: "Telegram Connected",
                  description: "Successfully connected via phone.",
                });
                setShowPhoneModal(false);
              }}
              checkAuth={checkAuth}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowPhoneModal(false);
                setLoadingPlatform((prev) => ({ ...prev, telegram: false }));
              }}
            >
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
