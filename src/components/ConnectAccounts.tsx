
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
      // Simulate Telegram OAuth flow - in reality this would redirect to Telegram
      const response = await supabase.functions.invoke('telegram-auth', {
        body: {
          code: Math.random().toString(36).substring(7), // Demo code
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
  };

  const connectDiscord = async () => {
    if (!user) return;
    
    setLoading(prev => ({ ...prev, discord: true }));
    try {
      // const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID;
      // const redirectUri = encodeURIComponent('https://zyccvvhrdvgjjwcteywg.supabase.co/functions/v1/discord-auth');

      // const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify`;

      // window.location.href = discordAuthUrl;
      // Simulate Discord OAuth flow - in reality this would redirect to Discord
      const response = await supabase.functions.invoke('discord-auth', {
        body: {
          code: Math.random().toString(36).substring(7), // Demo code
          user_id: user.id,
        },
      });

      if (response.error) {
        throw response.error;
      }

      setDiscordConnected(true);
      toast({
        title: "Discord Connected",
        description: "Successfully connected to your Discord account",
      });
      
      if (telegramConnected) {
        onAccountsConnected();
      }
    } catch (error) {
      console.error("Discord connection error:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Discord. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, discord: false }));
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-2 border-dashed border-gray-200 hover:border-blue-300 transition-colors">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Telegram</h3>
                <p className="text-sm text-gray-600">Connect your Telegram account</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {telegramConnected ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
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

      <Card className="border-2 border-dashed border-gray-200 hover:border-purple-300 transition-colors">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold">Discord</h3>
                <p className="text-sm text-gray-600">Connect your Discord account</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {discordConnected ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
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
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-600" />
              <p className="text-green-800 font-medium">All accounts connected successfully!</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
