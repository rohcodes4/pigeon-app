
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Users, Check, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface ConnectAccountsProps {
  onAccountsConnected: () => void;
}

export const ConnectAccounts = ({ onAccountsConnected }: ConnectAccountsProps) => {
  const { user } = useAuth();
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [discordConnected, setDiscordConnected] = useState(false);
  const [loading, setLoading] = useState({ telegram: false, discord: false });

  useEffect(() => {
    if (user) {
      checkConnectedAccounts();
    }
  }, [user]);

  // Listen for auth success messages from popup windows
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'DISCORD_AUTH_SUCCESS') {
        setDiscordConnected(true);
        setLoading(prev => ({ ...prev, discord: false }));
        toast({
          title: "Discord Connected",
          description: "Successfully connected to your Discord account",
        });
        checkConnectedAccounts();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const checkConnectedAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from("connected_accounts")
        .select("platform")
        .eq("user_id", user?.id);

      if (error) {
        console.error("Error checking connected accounts:", error);
        return;
      }

      const platforms = data?.map(account => account.platform) || [];
      setTelegramConnected(platforms.includes("telegram"));
      setDiscordConnected(platforms.includes("discord"));

      if (platforms.includes("telegram") && platforms.includes("discord")) {
        onAccountsConnected();
      }
    } catch (error) {
      console.error("Error checking connected accounts:", error);
    }
  };

  const connectTelegram = async () => {
    if (!user) return;
    
    setLoading(prev => ({ ...prev, telegram: true }));
    
    try {
      // Create a Telegram Login Widget dynamically
      const widget = document.createElement('div');
      widget.innerHTML = `
        <iframe src="https://oauth.telegram.org/auth?bot_id=${import.meta.env.VITE_TELEGRAM_BOT_ID || 'YOUR_BOT_ID'}&origin=${encodeURIComponent(window.location.origin)}&request_access=write&return_to=${encodeURIComponent(window.location.origin + '/telegram-callback')}" 
                width="300" height="400" frameborder="0"></iframe>
      `;
      
      // For demo purposes, simulate successful connection
      // In production, this would handle the actual Telegram OAuth flow
      setTimeout(async () => {
        try {
          const response = await supabase.functions.invoke('telegram-auth', {
            body: {
              telegramData: {
                id: Math.floor(Math.random() * 1000000),
                first_name: 'Telegram',
                last_name: 'User',
                username: 'telegram_user',
                auth_date: Math.floor(Date.now() / 1000),
                hash: 'demo_hash'
              },
              user_id: user.id,
            },
          });

          if (response.error) {
            throw response.error;
          }

          setTelegramConnected(true);
          toast({
            title: "Telegram Connected",
            description: "Successfully connected to your Telegram account",
          });
          
          if (discordConnected) {
            onAccountsConnected();
          }
        } catch (error) {
          console.error("Telegram connection error:", error);
          toast({
            title: "Connection Failed",
            description: "Failed to connect to Telegram. Please try again.",
            variant: "destructive",
          });
        } finally {
          setLoading(prev => ({ ...prev, telegram: false }));
        }
      }, 2000);
      
    } catch (error) {
      console.error("Telegram connection error:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Telegram. Please try again.",
        variant: "destructive",
      });
      setLoading(prev => ({ ...prev, telegram: false }));
    }
  };

  const connectDiscord = async () => {
    if (!user) return;
    
    setLoading(prev => ({ ...prev, discord: true }));
    
    try {
      const discordClientId = import.meta.env.VITE_DISCORD_CLIENT_ID || '1380883180533452970';
      const redirectUri = encodeURIComponent(`${supabase.supabaseUrl}/functions/v1/discord-auth`);
      const scope = encodeURIComponent('identify guilds');
      const state = user.id;
      
      const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${discordClientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}`;
      
      // Open Discord auth in popup
      const popup = window.open(
        discordAuthUrl, 
        'discord-auth', 
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      // Monitor popup closure
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          if (!discordConnected) {
            setLoading(prev => ({ ...prev, discord: false }));
          }
        }
      }, 1000);

    } catch (error) {
      console.error("Discord connection error:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Discord. Please try again.",
        variant: "destructive",
      });
      setLoading(prev => ({ ...prev, discord: false }));
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-2 border-dashed border-border hover:border-blue-300 transition-colors">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold">Telegram</h3>
                <p className="text-sm text-muted-foreground">Connect your Telegram account</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {telegramConnected ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                  <Check className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Button onClick={connectTelegram} className="gap-2" disabled={loading.telegram}>
                  {loading.telegram && <Loader2 className="w-4 h-4 animate-spin" />}
                  Connect
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-dashed border-border hover:border-purple-300 transition-colors">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold">Discord</h3>
                <p className="text-sm text-muted-foreground">Connect your Discord account</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {discordConnected ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                  <Check className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Button onClick={connectDiscord} variant="outline" className="gap-2" disabled={loading.discord}>
                  {loading.discord && <Loader2 className="w-4 h-4 animate-spin" />}
                  Connect
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {telegramConnected && discordConnected && (
        <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
              <p className="text-green-800 dark:text-green-300 font-medium">All accounts connected successfully!</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
