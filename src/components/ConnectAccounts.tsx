
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Users, Check, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

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
      // Simulate checking connected accounts with fake data
      const onboardingData = localStorage.getItem(`chatpilot_accounts_${user.id}`);
      if (onboardingData) {
        const data = JSON.parse(onboardingData);
        setTelegramConnected(data.telegram || false);
        setDiscordConnected(data.discord || false);
        
        if (data.telegram && data.discord) {
          onAccountsConnected();
        }
      }
    }
  }, [user, onAccountsConnected]);

  const connectTelegram = async () => {
    if (!user) return;
    
    setLoading(prev => ({ ...prev, telegram: true }));
    
    // Simulate connection delay
    setTimeout(() => {
      setTelegramConnected(true);
      setLoading(prev => ({ ...prev, telegram: false }));
      
      // Save to localStorage for simulation
      const existingData = JSON.parse(localStorage.getItem(`chatpilot_accounts_${user.id}`) || '{}');
      localStorage.setItem(`chatpilot_accounts_${user.id}`, JSON.stringify({
        ...existingData,
        telegram: true
      }));
      
      toast({
        title: "Telegram Connected",
        description: "Successfully connected to your Telegram account",
      });
      
      // Check if both are connected
      if (discordConnected) {
        onAccountsConnected();
      }
    }, 2000);
  };

  const connectDiscord = async () => {
    if (!user) return;
    
    setLoading(prev => ({ ...prev, discord: true }));
    
    // Simulate connection delay
    setTimeout(() => {
      setDiscordConnected(true);
      setLoading(prev => ({ ...prev, discord: false }));
      
      // Save to localStorage for simulation
      const existingData = JSON.parse(localStorage.getItem(`chatpilot_accounts_${user.id}`) || '{}');
      localStorage.setItem(`chatpilot_accounts_${user.id}`, JSON.stringify({
        ...existingData,
        discord: true
      }));
      
      toast({
        title: "Discord Connected",
        description: "Successfully connected to your Discord account",
      });
      
      // Check if both are connected
      if (telegramConnected) {
        onAccountsConnected();
      }
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Platforms</h2>
        <p className="text-gray-600">Connect your Discord and Telegram accounts to get started</p>
      </div>

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
                  <p className="text-sm text-muted-foreground">
                    Connect your Telegram account to access your chats
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {telegramConnected ? (
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                  >
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
                  <p className="text-sm text-muted-foreground">
                    Connect your Discord account to access your servers and channels
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {discordConnected ? (
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Button
                    onClick={connectDiscord}
                    variant="outline"
                    className="gap-2"
                    disabled={loading.discord}
                  >
                    {loading.discord && <Loader2 className="w-4 h-4 animate-spin" />}
                    Connect
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {telegramConnected && discordConnected && (
        <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
              <p className="text-green-800 dark:text-green-300 font-medium">
                All accounts connected successfully!
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
