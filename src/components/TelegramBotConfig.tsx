
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface TelegramBotConfigProps {
  onBotConfigured: (botUsername: string) => void;
}

export const TelegramBotConfig = ({ onBotConfigured }: TelegramBotConfigProps) => {
  const [botUsername, setBotUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!botUsername.trim()) {
      toast({
        title: "Error",
        description: "Please enter your bot username",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Validate bot username format
      const cleanUsername = botUsername.replace('@', '');
      if (!cleanUsername.endsWith('_bot') && !cleanUsername.endsWith('Bot')) {
        toast({
          title: "Invalid Bot Username",
          description: "Bot usernames must end with 'bot' or 'Bot'",
          variant: "destructive",
        });
        return;
      }

      onBotConfigured(cleanUsername);
      toast({
        title: "Bot Configured",
        description: "Telegram bot has been configured successfully",
      });
    } catch (error) {
      toast({
        title: "Configuration Failed",
        description: "Failed to configure Telegram bot",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Configure Telegram Bot
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground space-y-2">
          <p>To connect Telegram, you need to create a bot first:</p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Message @BotFather on Telegram</li>
            <li>Use /newbot command</li>
            <li>Choose a name and username for your bot</li>
            <li>Copy the bot token to Supabase secrets</li>
            <li>Enter the bot username below</li>
          </ol>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="botUsername">Bot Username</Label>
            <Input
              id="botUsername"
              type="text"
              placeholder="@your_bot_username"
              value={botUsername}
              onChange={(e) => setBotUsername(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter your bot's username (with or without @)
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Configuring..." : "Configure Bot"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => window.open('https://t.me/BotFather', '_blank')}
              className="gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Open BotFather
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
