
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Users, Check, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ConnectAccountsProps {
  onAccountsConnected: () => void;
}

export const ConnectAccounts = ({ onAccountsConnected }: ConnectAccountsProps) => {
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [discordConnected, setDiscordConnected] = useState(false);

  const connectTelegram = () => {
    // This will be replaced with actual Supabase auth + Telegram integration
    setTimeout(() => {
      setTelegramConnected(true);
      toast({
        title: "Telegram Connected",
        description: "Successfully connected to your Telegram account",
      });
      if (discordConnected) {
        onAccountsConnected();
      }
    }, 1500);
  };

  const connectDiscord = () => {
    // This will be replaced with actual Discord OAuth
    setTimeout(() => {
      setDiscordConnected(true);
      toast({
        title: "Discord Connected",
        description: "Successfully connected to your Discord account",
      });
      if (telegramConnected) {
        onAccountsConnected();
      }
    }, 1500);
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
                <Button onClick={connectTelegram} className="gap-2">
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
                <Button onClick={connectDiscord} variant="outline" className="gap-2">
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
