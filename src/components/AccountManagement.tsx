
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, Users, Check, ExternalLink, Loader2, Trash2, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

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
  const [notifications, setNotifications] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchAccounts();
      fetchNotifications();
    }
  }, [user]);

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from("connected_accounts")
        .select("*")
        .eq("user_id", user?.id);

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user?.id);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const disconnectAccount = async (accountId: string, platform: string) => {
    try {
      const { error } = await supabase
        .from("connected_accounts")
        .delete()
        .eq("id", accountId);

      if (error) throw error;

      // Also remove synced groups for this platform
      await supabase
        .from("synced_groups")
        .delete()
        .eq("user_id", user?.id)
        .eq("platform", platform);

      setAccounts(prev => prev.filter(acc => acc.id !== accountId));
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
      if (platform === "telegram") {
        const { error } = await supabase.functions.invoke('get-telegram-chats', {
          body: { user_id: user?.id },
        });
        if (error) throw error;
      } else if (platform === "discord") {
        const { error } = await supabase.functions.invoke('get-discord-guilds', {
          body: { user_id: user?.id },
        });
        if (error) throw error;
      }

      // Update last sync time
      await supabase
        .from("connected_accounts")
        .update({ last_sync_at: new Date().toISOString() })
        .eq("user_id", user?.id)
        .eq("platform", platform);

      toast({
        title: "Sync Complete",
        description: `${platform} chats have been synced`,
      });
      
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

  const updateNotificationPreference = async (groupId: string, platform: string, notificationType: string) => {
    try {
      const { error } = await supabase
        .from("notification_preferences")
        .upsert({
          user_id: user?.id,
          platform,
          group_id: groupId,
          notification_type: notificationType,
        });

      if (error) throw error;
      fetchNotifications();
    } catch (error) {
      console.error("Error updating notification preference:", error);
    }
  };

  // const connectDiscord = async () => {
  //   try {
  //     const discordClientId = '1380883180533452970';
  //     const redirectUri = encodeURIComponent(`https://zyccvvhrdvgjjwcteywg.supabase.co/functions/v1/discord-auth`);
  //     const scope = encodeURIComponent('identify guilds guilds.members.read');
  //     const state = user?.id;
      
  //     const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${discordClientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}`;
      
  //     window.open(discordAuthUrl, '_blank');
  //   } catch (error) {
  //     console.error("Discord connection error:", error);
  //     toast({
  //       title: "Connection Failed",
  //       description: "Failed to connect to Discord",
  //       variant: "destructive",
  //     });
  //   }
  // };

  const connectDiscord = async () => {
    try {
      const frontendUrl = encodeURIComponent(window.location.origin);
      const discordClientId = '1380883180533452970';
      const redirectUri = 'https://zyccvvhrdvgjjwcteywg.supabase.co/functions/v1/discord-auth'; // <-- unencoded
      const scope = encodeURIComponent('identify guilds guilds.members.read');
      // const state = user?.id;
      const stateObj = { userId: user?.id, redirectTo: window.location.origin };
      const stateParam = encodeURIComponent(JSON.stringify(stateObj));
      console.log("stateObj")
      console.log(stateObj)
      console.log("stateParam")
      console.log(stateParam)
  
      const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${discordClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${stateParam}`;
  
      window.open(discordAuthUrl, '_blank');
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
      const authWindow = window.open('', 'telegram-auth', 'width=500,height=600');
      if (!authWindow) throw new Error('Popup blocked');

      const telegramHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Telegram Login</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              height: 100vh; 
              margin: 0; 
              background: #f5f5f5;
            }
            .container {
              text-align: center;
              background: white;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Connect to Telegram</h2>
            <p>Click the button below to connect your Telegram account</p>
            <script async src="https://telegram.org/js/telegram-widget.js?22" 
                    data-telegram-login="chatPilot22_bot"
                    data-size="large" 
                    data-onauth="onTelegramAuth(user)" 
                    data-request-access="write">
            </script>
            <script>
              function onTelegramAuth(user) {
                window.opener?.postMessage({ 
                  type: 'TELEGRAM_AUTH_SUCCESS', 
                  data: user 
                }, '*');
                window.close();
              }
            </script>
          </div>
        </body>
        </html>
      `;

      authWindow.document.write(telegramHTML);
      authWindow.document.close();
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
            <div key={account.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg space-y-3 sm:space-y-0">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  account.platform === 'discord' ? 'bg-purple-100 dark:bg-purple-900' : 'bg-blue-100 dark:bg-blue-900'
                }`}>
                  {account.platform === 'discord' ? 
                    <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" /> : 
                    <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  }
                </div>
                <div>
                  <h4 className="font-medium capitalize">{account.platform}</h4>
                  <p className="text-sm text-muted-foreground">
                    {account.platform_username || 'Connected'}
                    {account.last_sync_at && (
                      <span className="block">
                        Last sync: {new Date(account.last_sync_at).toLocaleDateString()}
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
                  onClick={() => disconnectAccount(account.id, account.platform)}
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
            <Button onClick={connectDiscord} variant="outline" className="flex-1 gap-2">
              <Users className="w-4 h-4" />
              Connect Discord
            </Button>
            <Button onClick={connectTelegram} variant="outline" className="flex-1 gap-2">
              <MessageCircle className="w-4 h-4" />
              Connect Telegram
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
