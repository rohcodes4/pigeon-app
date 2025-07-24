import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageCircle,
  Users,
  Check,
  ExternalLink,
  Loader2,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface ConnectedAccount {
  id: string;
  platform: string;
  platform_username: string | null;
  connected_at: string;
  last_sync_at: string | null;
}

interface NotificationPreference {
  id: string;
  platform: string;
  group_id: string;
  notification_type: string;
}

export const AccountManagement = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [notifications, setNotifications] = useState<NotificationPreference[]>(
    []
  );
  const [loading, setLoading] = useState(false); // Set to false initially
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      // TODO: Implement fetchAccounts and fetchNotifications from FastAPI backend
      // For now, loading is false and accounts/notifications are empty
      setLoading(false);
    }
  }, [user]);

  const fetchAccounts = async () => {
    // TODO: Replace with fetch call to FastAPI backend
    console.log("Fetching accounts from backend...");
    setLoading(false);
  };

  const fetchNotifications = async () => {
    // TODO: Replace with fetch call to FastAPI backend
    console.log("Fetching notifications from backend...");
  };

  const disconnectAccount = async (accountId: string, platform: string) => {
    try {
      // TODO: Replace with fetch call to FastAPI backend to disconnect account
      console.log(
        `Disconnecting ${platform} account ${accountId} from backend...`
      );

      setAccounts((prev) => prev.filter((acc) => acc.id !== accountId));
      toast({
        title: "Account Disconnected",
        description: `${platform} account has been disconnected`,
      });
    } catch (error) {
      console.error("Error disconnecting account:", error);
      toast({
        title: "Error",
        description: "Failed to disconnect account",
        variant: "destructive",
      });
    }
  };

  const syncChats = async (platform: string) => {
    setSyncing(platform);
    try {
      // TODO: Replace with fetch call to FastAPI backend to sync chats
      console.log(`Syncing ${platform} chats with backend...`);

      toast({
        title: "Sync Complete",
        description: `${platform} chats have been synced`,
      });

      // After successful sync, re-fetch accounts to update last_sync_at
      fetchAccounts();
    } catch (error) {
      console.error("Error syncing chats:", error);
      toast({
        title: "Sync Failed",
        description: `Failed to sync ${platform} chats`,
        variant: "destructive",
      });
    } finally {
      setSyncing(null);
    }
  };

  const updateNotificationPreference = async (
    groupId: string,
    platform: string,
    notificationType: string
  ) => {
    try {
      // TODO: Replace with fetch call to FastAPI backend to update notification preference
      console.log(
        `Updating notification preference for ${groupId} (${platform}) to ${notificationType}...`
      );

      fetchNotifications();
    } catch (error) {
      console.error("Error updating notification preference:", error);
    }
  };

  const connectDiscord = async () => {
    try {
      // TODO: Replace with fetch call to FastAPI backend to initiate Discord OAuth
      console.log("Initiating Discord connection with backend...");
      // Example: window.location.href = `/auth/discord/initiate?user_id=${user?.id}`;
      toast({
        title: "Connect Discord",
        description: "Please follow the instructions in the new window.",
      });
    } catch (error) {
      console.error("Discord connection error:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Discord",
        variant: "destructive",
      });
    }
  };

  const connectTelegram = async () => {
    try {
      // TODO: Replace with fetch call to FastAPI backend to initiate Telegram login
      console.log("Initiating Telegram connection with backend...");
      // Example: window.location.href = `/auth/telegram/initiate?user_id=${user?.id}`;
      toast({
        title: "Connect Telegram",
        description: "Please follow the instructions in the new window.",
      });
    } catch (error) {
      console.error("Telegram connection error:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Telegram",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading accounts...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg space-y-3 sm:space-y-0"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    account.platform === "discord"
                      ? "bg-purple-100 dark:bg-purple-900"
                      : "bg-blue-100 dark:bg-blue-900"
                  }`}
                >
                  {account.platform === "discord" ? (
                    <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  ) : (
                    <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <div>
                  <h4 className="font-medium capitalize">{account.platform}</h4>
                  <p className="text-sm text-muted-foreground">
                    {account.platform_username || "Connected"}
                    {account.last_sync_at && (
                      <span className="block">
                        Last sync:{" "}
                        {new Date(account.last_sync_at).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => syncChats(account.platform)}
                  disabled={syncing === account.platform}
                  className="gap-2"
                >
                  {syncing === account.platform ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Sync Chats
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() =>
                    disconnectAccount(account.id, account.platform)
                  }
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Disconnect
                </Button>
              </div>
            </div>
          ))}

          {accounts.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No accounts connected yet
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button
              onClick={connectDiscord}
              variant="outline"
              className="flex-1 gap-2"
            >
              <Users className="w-4 h-4" />
              Connect Discord
            </Button>
            <Button
              onClick={connectTelegram}
              variant="outline"
              className="flex-1 gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Connect Telegram
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
