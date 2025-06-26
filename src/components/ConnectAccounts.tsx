
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Users, Check, ExternalLink, Loader2, ArrowRight } from "lucide-react";
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
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Platforms</h2>
        <p className="text-gray-600">Connect at least one platform to continue</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Discord Box */}
        <Card className="border-2 border-dashed hover:border-purple-300 transition-colors">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto">
                <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Discord</h3>
                <ul className="text-sm text-gray-600 space-y-1 mb-4">
                  <li>• Access server channels</li>
                  <li>• View direct messages</li>
                  <li>• Manage notifications</li>
                  <li>• Real-time sync</li>
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
        </Card>

        {/* Telegram Box */}
        <Card className="border-2 border-dashed hover:border-blue-300 transition-colors">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto">
                <MessageCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Telegram</h3>
                <ul className="text-sm text-gray-600 space-y-1 mb-4">
                  <li>• Access group chats</li>
                  <li>• View private messages</li>
                  <li>• Bot integration</li>
                  <li>• Cloud sync</li>
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
        </Card>

        {/* Continue Box */}
        <Card className={`border-2 ${canContinue ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'} transition-colors`}>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${canContinue ? 'bg-green-100' : 'bg-gray-100'}`}>
                <ArrowRight className={`w-8 h-8 ${canContinue ? 'text-green-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Ready to Continue</h3>
                <ul className="text-sm text-gray-600 space-y-1 mb-4">
                  <li>• Select your chats</li>
                  <li>• Configure sync settings</li>
                  <li>• Start using ChatPilot</li>
                  <li>• Unified inbox ready</li>
                </ul>
              </div>
              <div className={`text-sm ${canContinue ? 'text-green-600' : 'text-gray-500'}`}>
                {canContinue ? '✓ Ready to proceed' : 'Connect at least one platform'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
