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

// const fakeChatGroups: ChatGroup[] = [
//   // Discord groups
//   {
//     id: "discord_1",
//     group_id: "discord_general",
//     group_name: "General Chat",
//     group_avatar: null,
//     platform: "discord",
//     member_count: 156,
//     is_synced: false,
//     type: "Server",
//   },
//   {
//     id: "discord_2",
//     group_id: "discord_dev",
//     group_name: "Development Team",
//     group_avatar: null,
//     platform: "discord",
//     member_count: 23,
//     is_synced: false,
//     type: "Server",
//   },
//   {
//     id: "discord_3",
//     group_id: "discord_random",
//     group_name: "Random",
//     group_avatar: null,
//     platform: "discord",
//     member_count: 89,
//     is_synced: false,
//     type: "Server",
//   },
//   {
//     id: "discord_4",
//     group_id: "discord_announcements",
//     group_name: "Announcements",
//     group_avatar: null,
//     platform: "discord",
//     member_count: 200,
//     is_synced: false,
//     type: "Server",
//   },
//   {
//     id: "discord_5",
//     group_id: "discord_support",
//     group_name: "Support",
//     group_avatar: null,
//     platform: "discord",
//     member_count: 45,
//     is_synced: false,
//     type: "Server",
//   },
//   {
//     id: "discord_6",
//     group_id: "discord_gaming",
//     group_name: "Gaming",
//     group_avatar: null,
//     platform: "discord",
//     member_count: 120,
//     is_synced: false,
//     type: "Server",
//   },
//   {
//     id: "discord_7",
//     group_id: "discord_music",
//     group_name: "Music",
//     group_avatar: null,
//     platform: "discord",
//     member_count: 60,
//     is_synced: false,
//     type: "Server",
//   },
//   {
//     id: "discord_8",
//     group_id: "discord_memes",
//     group_name: "Memes",
//     group_avatar: null,
//     platform: "discord",
//     member_count: 80,
//     is_synced: false,
//     type: "Server",
//   },
//   {
//     id: "discord_9",
//     group_id: "discord_art",
//     group_name: "Art",
//     group_avatar: null,
//     platform: "discord",
//     member_count: 34,
//     is_synced: false,
//     type: "Server",
//   },
//   {
//     id: "discord_10",
//     group_id: "discord_books",
//     group_name: "Book Club",
//     group_avatar: null,
//     platform: "discord",
//     member_count: 27,
//     is_synced: false,
//     type: "Server",
//   },
//   {
//     id: "discord_11",
//     group_id: "discord_movies",
//     group_name: "Movies",
//     group_avatar: null,
//     platform: "discord",
//     member_count: 51,
//     is_synced: false,
//     type: "Server",
//   },
//   {
//     id: "discord_12",
//     group_id: "discord_coding",
//     group_name: "Coding",
//     group_avatar: null,
//     platform: "discord",
//     member_count: 99,
//     is_synced: false,
//     type: "Server",
//   },
//   {
//     id: "discord_13",
//     group_id: "discord_ai",
//     group_name: "AI Enthusiasts",
//     group_avatar: null,
//     platform: "discord",
//     member_count: 77,
//     is_synced: false,
//     type: "Server",
//   },
//   {
//     id: "discord_14",
//     group_id: "discord_fitness",
//     group_name: "Fitness",
//     group_avatar: null,
//     platform: "discord",
//     member_count: 40,
//     is_synced: false,
//     type: "Server",
//   },
//   {
//     id: "discord_15",
//     group_id: "discord_travel",
//     group_name: "Travel",
//     group_avatar: null,
//     platform: "discord",
//     member_count: 32,
//     is_synced: false,
//     type: "Server",
//   },
//   {
//     id: "discord_16",
//     group_id: "discord_food",
//     group_name: "Foodies",
//     group_avatar: null,
//     platform: "discord",
//     member_count: 58,
//     is_synced: false,
//     type: "Server",
//   },
//   {
//     id: "discord_17",
//     group_id: "discord_photography",
//     group_name: "Photography",
//     group_avatar: null,
//     platform: "discord",
//     member_count: 29,
//     is_synced: false,
//     type: "Server",
//   },
//   {
//     id: "discord_18",
//     group_id: "discord_science",
//     group_name: "Science",
//     group_avatar: null,
//     platform: "discord",
//     member_count: 66,
//     is_synced: false,
//     type: "Server",
//   },
//   {
//     id: "discord_19",
//     group_id: "discord_history",
//     group_name: "History Buffs",
//     group_avatar: null,
//     platform: "discord",
//     member_count: 21,
//     is_synced: false,
//     type: "Server",
//   },
//   {
//     id: "discord_20",
//     group_id: "discord_language",
//     group_name: "Language Exchange",
//     group_avatar: null,
//     platform: "discord",
//     member_count: 38,
//     is_synced: false,
//     type: "Server",
//   },

//   // Telegram groups (randomized type, capitalized)
//   {
//     id: "telegram_1",
//     group_id: "tg_tech_talk",
//     group_name: "Tech Talk",
//     group_avatar: null,
//     platform: "telegram",
//     member_count: 342,
//     is_synced: false,
//     type: "Group",
//   },
//   {
//     id: "telegram_2",
//     group_id: "tg_friends",
//     group_name: "Friends Group",
//     group_avatar: null,
//     platform: "telegram",
//     member_count: 12,
//     is_synced: false,
//     type: "Bot",
//   },
//   {
//     id: "telegram_3",
//     group_id: "tg_work",
//     group_name: "Work Updates",
//     group_avatar: null,
//     platform: "telegram",
//     member_count: 45,
//     is_synced: false,
//     type: "App",
//   },
//   {
//     id: "telegram_4",
//     group_id: "tg_news",
//     group_name: "Daily News",
//     group_avatar: null,
//     platform: "telegram",
//     member_count: 210,
//     is_synced: false,
//     type: "Group",
//   },
//   {
//     id: "telegram_5",
//     group_id: "tg_sports",
//     group_name: "Sports Fans",
//     group_avatar: null,
//     platform: "telegram",
//     member_count: 98,
//     is_synced: false,
//     type: "Bot",
//   },
//   {
//     id: "telegram_6",
//     group_id: "tg_movies",
//     group_name: "Movie Club",
//     group_avatar: null,
//     platform: "telegram",
//     member_count: 56,
//     is_synced: false,
//     type: "App",
//   },
//   {
//     id: "telegram_7",
//     group_id: "tg_music",
//     group_name: "Music Lovers",
//     group_avatar: null,
//     platform: "telegram",
//     member_count: 67,
//     is_synced: false,
//     type: "Group",
//   },
//   {
//     id: "telegram_8",
//     group_id: "tg_gaming",
//     group_name: "Gaming",
//     group_avatar: null,
//     platform: "telegram",
//     member_count: 120,
//     is_synced: false,
//     type: "Bot",
//   },
//   {
//     id: "telegram_9",
//     group_id: "tg_art",
//     group_name: "Art & Design",
//     group_avatar: null,
//     platform: "telegram",
//     member_count: 34,
//     is_synced: false,
//     type: "App",
//   },
//   {
//     id: "telegram_10",
//     group_id: "tg_books",
//     group_name: "Book Lovers",
//     group_avatar: null,
//     platform: "telegram",
//     member_count: 27,
//     is_synced: false,
//     type: "Group",
//   },
//   {
//     id: "telegram_11",
//     group_id: "tg_photography",
//     group_name: "Photography",
//     group_avatar: null,
//     platform: "telegram",
//     member_count: 29,
//     is_synced: false,
//     type: "Bot",
//   },
//   {
//     id: "telegram_12",
//     group_id: "tg_fitness",
//     group_name: "Fitness",
//     group_avatar: null,
//     platform: "telegram",
//     member_count: 40,
//     is_synced: false,
//     type: "App",
//   },
//   {
//     id: "telegram_13",
//     group_id: "tg_travel",
//     group_name: "Travel",
//     group_avatar: null,
//     platform: "telegram",
//     member_count: 32,
//     is_synced: false,
//     type: "Group",
//   },
//   {
//     id: "telegram_14",
//     group_id: "tg_food",
//     group_name: "Foodies",
//     group_avatar: null,
//     platform: "telegram",
//     member_count: 58,
//     is_synced: false,
//     type: "Bot",
//   },
//   {
//     id: "telegram_15",
//     group_id: "tg_science",
//     group_name: "Science",
//     group_avatar: null,
//     platform: "telegram",
//     member_count: 66,
//     is_synced: false,
//     type: "App",
//   },
//   {
//     id: "telegram_16",
//     group_id: "tg_history",
//     group_name: "History Buffs",
//     group_avatar: null,
//     platform: "telegram",
//     member_count: 21,
//     is_synced: false,
//     type: "Group",
//   },
//   {
//     id: "telegram_17",
//     group_id: "tg_language",
//     group_name: "Language Exchange",
//     group_avatar: null,
//     platform: "telegram",
//     member_count: 38,
//     is_synced: false,
//     type: "Bot",
//   },
//   {
//     id: "telegram_18",
//     group_id: "tg_memes",
//     group_name: "Memes",
//     group_avatar: null,
//     platform: "telegram",
//     member_count: 80,
//     is_synced: false,
//     type: "App",
//   },
//   {
//     id: "telegram_19",
//     group_id: "tg_coding",
//     group_name: "Coding",
//     group_avatar: null,
//     platform: "telegram",
//     member_count: 99,
//     is_synced: false,
//     type: "Group",
//   },
//   {
//     id: "telegram_20",
//     group_id: "tg_ai",
//     group_name: "AI Enthusiasts",
//     group_avatar: null,
//     platform: "telegram",
//     member_count: 77,
//     is_synced: false,
//     type: "Bot",
//   },
// ];

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // const [telegramConnected, setTelegramConnected] = useState(false);
  // const [discordConnected, setDiscordConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchUserChats = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch(`${BACKEND_URL}/api/sync-preferences/chats`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error(`Failed to fetch chats: ${res.status}`);

        const data = await res.json();

        // Map the backend chats into ChatGroup format your UI expects
        const fetchedChats = (data.chats || []).map((chat) => ({
          id: String(chat.id),
          group_id: String(chat.id),
          group_name: chat.title || `Chat ${chat.id}`,
          group_avatar: null, // Not provided, can add later if available
          platform: chat.type?.toLowerCase() === "discord" ? "discord" : "telegram",
          member_count: null, // Not provided here, optional
          is_synced: false, // default unselected, load saved selections below
          type: chat.type || null,
          username: chat.username || null,
        }));

        // Load saved selections from localStorage
        const savedSelections = localStorage.getItem(
          `chatpilot_chats_${user.id}`
        );
        if (savedSelections) {
          const selections = JSON.parse(savedSelections);
          fetchedChats.forEach((chat) => {
            chat.is_synced = selections[chat.id] || false;
          });
        }

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
        const dcRes = await fetch(`${BACKEND_URL}/auth/discord/status`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (dcRes.ok) {
          const dc = await dcRes.json();
          setDiscordConnected(!!dc.connected);
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
        .filter(c => c.is_synced)
        .map(c => c.id)
        .join(",");

      const disabledChatIds = chatGroups
        .filter(c => !c.is_synced)
        .map(c => c.id)
        .join(",");

      const formData = new FormData();
      formData.append("enabled_chats", enabledChatIds);
      formData.append("disabled_chats", disabledChatIds);
      // Assuming defaults for sync_groups and sync_channels - you can add checkboxes/UI for these
      formData.append("sync_groups", "true");
      formData.append("sync_channels", "true");

      const response = await fetch(`${BACKEND_URL}/api/sync-preferences`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
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

      if (onPreferencesSaved) {
        onPreferencesSaved(data.preferences);
      }
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
  // Load saved chat selections (local, non-authoritative)
  // useEffect(() => {
  //   if (!user) return;
  //   setTimeout(() => {
  //     const savedSelections = localStorage.getItem(
  //       `chatpilot_chats_${user.id}`
  //     );
  //     let updatedGroups = [...fakeChatGroups];

  //     if (savedSelections) {
  //       const selections = JSON.parse(savedSelections);
  //       updatedGroups = updatedGroups.map((group) => ({
  //         ...group,
  //         is_synced: selections[group.id] || false,
  //       }));
  //     }

  //     setChatGroups(updatedGroups);
  //     setLoading(false);

  //     const hasSelectedChats = updatedGroups.some((group) => group.is_synced);
  //     const selectedChats = updatedGroups.filter((group) => group.is_synced);
  //     if (hasSelectedChats && onChatsSelected) {
  //       onChatsSelected(selectedChats);
  //     }
  //   }, 1000);
  // }, [user, onChatsSelected]);

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

    const updatedSelections = {
      ...JSON.parse(
        localStorage.getItem(`chatpilot_chats_${user?.id}`) || "{}"
      ),
    };
    updatedSelections[groupId] = !currentSyncStatus;
 

    const hasSelectedChats = chatGroups.some((group) =>
      group.id === groupId ? !currentSyncStatus : group.is_synced
    );
    const selectedChats = chatGroups.some((group) =>
      group.id === groupId ? !currentSyncStatus : group.is_synced
    );

    if (hasSelectedChats && onChatsSelected) {
      onChatsSelected(selectedChats);
    }
    localStorage.setItem(
      `chatpilot_chats_${user?.id}`,
      JSON.stringify(updatedSelections)
    );
    toast({
      title: !currentSyncStatus ? "Chat Added" : "Chat Removed",
      description: !currentSyncStatus
        ? "Chat will now appear in your unified inbox"
        : "Chat removed from unified inbox",
    });
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

    // Update localStorage as well
    const updatedSelections = {
      ...JSON.parse(
        localStorage.getItem(`chatpilot_chats_${user?.id}`) || "{}"
      ),
    };
    newChatGroups.forEach((group) => {
      updatedSelections[group.id] = group.is_synced;
    });
    localStorage.setItem(
      `chatpilot_chats_${user?.id}`,
      JSON.stringify(updatedSelections)
    );
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
  const [authMethod, setAuthMethod] = useState<"qr" | "phone">("qr");
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showTelegramQrModal, setShowTelegramQrModal] = useState(false);
  const [telegramQrCode, setTelegramQrCode] = useState<string | null>(null);
  const [telegramQrToken, setTelegramQrToken] = useState<string | null>(null);
  const [loadingPlatform, setLoadingPlatform] = useState({ telegram: false, discord: false });
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
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${BACKEND_URL}/auth/qr`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || "Failed to initiate Telegram QR login"
        );
      }
      const data = await response.json();
      setTelegramQrCode(data.qr);
      setTelegramQrToken(data.token);
      setShowTelegramQrModal(true);
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

  useEffect(() => {
    if (telegramQrToken && showTelegramQrModal) {
      const interval = setInterval(async () => {
        try {
          const token = localStorage.getItem("access_token");
          const response = await fetch(
            `${BACKEND_URL}/auth/qr/${telegramQrToken}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          let data = null;
          let isError = false;

          if (response.ok) {
            data = await response.json();
          } else {
            try {
              data = await response.json();
            } catch {
              data = { detail: "Unknown error" };
            }
            isError = true;
          }

          if (data && data.status === "success") {
            clearInterval(interval);
            setPollingIntervalId(null);
            setShowTelegramQrModal(false);
            setTelegramConnected(true); // Update local state
            toast({
              title: "Telegram Connected",
              description:
                "Successfully connected to your Telegram account. You can now sync your chats when ready.",
            });
          } else if (data && data.status === "password_required") {
            // 2FA password is required
            clearInterval(interval);
            setPollingIntervalId(null);
            setShowTelegramQrModal(false);
            setShowPasswordModal(true);
            toast({
              title: "Two-Factor Authentication Required",
              description:
                "Please enter your Telegram password to complete the connection.",
            });
          } else if (
            data &&
            (data.status === "error" || data.status === "invalid_token")
          ) {
            clearInterval(interval);
            setPollingIntervalId(null);
            setShowTelegramQrModal(false);
            setTelegramQrCode(null);
            setTelegramQrToken(null);
            toast({
              title: "Telegram Connection Failed",
              description: data.detail || "Please try again.",
              variant: "destructive",
            });
          } else if (isError || (data && data.detail)) {
            clearInterval(interval);
            setPollingIntervalId(null);
            setShowTelegramQrModal(false);
            setTelegramQrCode(null);
            setTelegramQrToken(null);
            toast({
              title: "Telegram Connection Error",
              description: data?.detail || "Unexpected response from server.",
              variant: "destructive",
            });
          }
          // else: still waiting, do nothing
        } catch (error) {
          clearInterval(interval);
          setPollingIntervalId(null);
          setShowTelegramQrModal(false);
          setTelegramQrCode(null);
          setTelegramQrToken(null);
          toast({
            title: "Telegram Connection Error",
            description: "Failed to check Telegram status. Please try again.",
            variant: "destructive",
          });
        }
      }, 3000); // Poll every 3 seconds
      setPollingIntervalId(interval);

      return () => {
        if (pollingIntervalId) {
          clearInterval(pollingIntervalId);
          setPollingIntervalId(null);
        }
      };
    }
  }, [
    telegramQrToken,
    showTelegramQrModal,
    setTelegramConnected,
  ]);

  const submitTelegramPassword = async () => {
    if (!telegramQrToken || !twoFactorPassword.trim()) {
      toast({
        title: "Password Required",
        description: "Please enter your Telegram password.",
        variant: "destructive",
      });
      return;
    }

    setPasswordLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const formData = new FormData();
      formData.append("password", twoFactorPassword);

      const response = await fetch(
        `${BACKEND_URL}/auth/qr/${telegramQrToken}/password`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (data.status === "success") {
        setShowPasswordModal(false);
        setTwoFactorPassword("");
        setTelegramConnected(true);

        toast({
          title: "Telegram Connected",
          description:
            "Successfully connected to your Telegram account. You can now sync your chats when ready.",
        });
      } else {
        throw new Error(data.detail || "Failed to verify password");
      }
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
        <h2 className="text-[36px] leading-[44px] tracking-[2px] text-white mb-2">
          Select
          <br /> Your Chats
        </h2>
        <p className="text-[#ffffff48]">
          Select your Discord and Telegram groups and chats to start syncing
          your conversations.
        </p>
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
                  discordChats.map((group) => (
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
                          <p className="font-medium text-sm">
                            {group.group_name}
                          </p>
                          <p className="text-xs text-black bg-[#3589ff] px-2 py-1 rounded-[6px]">
                            {group.member_count} channels
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
                {telegramConnected ? loading? (<p className="text-sm text-gray-500 text-center py-4"> Loading...</p>) : (
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
              {/* <div className={`text-sm font-semibold ${canContinue ? 'text-[#50DF3A]' : 'text-[#FDCB35]'}`}>
        {canContinue ? '✓ Ready to proceed' : 'Connect at least one platform'}
      </div> */}
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
                src={`data:image/png;base64,${telegramQrCode}`}
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
                  setTelegramQrToken(null);
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
