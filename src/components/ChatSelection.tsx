
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { MessageCircle, Users, Check, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface ChatGroup {
  id: string;
  group_id: string;
  group_name: string;
  group_avatar: string | null;
  platform: string;
  member_count: number | null;
  is_synced: boolean;
}

interface ChatSelectionProps {
  onChatsSelected?: () => void;
}

const fakeChatGroups: ChatGroup[] = [
  {
    id: "discord_1",
    group_id: "discord_general",
    group_name: "General Chat",
    group_avatar: null,
    platform: "discord",
    member_count: 156,
    is_synced: false,
  },
  {
    id: "discord_2",
    group_id: "discord_dev",
    group_name: "Development Team",
    group_avatar: null,
    platform: "discord",
    member_count: 23,
    is_synced: false,
  },
  {
    id: "discord_3",
    group_id: "discord_random",
    group_name: "Random",
    group_avatar: null,
    platform: "discord",
    member_count: 89,
    is_synced: false,
  },
  {
    id: "telegram_1",
    group_id: "tg_tech_talk",
    group_name: "Tech Talk",
    group_avatar: null,
    platform: "telegram",
    member_count: 342,
    is_synced: false,
  },
  {
    id: "telegram_2",
    group_id: "tg_friends",
    group_name: "Friends Group",
    group_avatar: null,
    platform: "telegram",
    member_count: 12,
    is_synced: false,
  },
  {
    id: "telegram_3",
    group_id: "tg_work",
    group_name: "Work Updates",
    group_avatar: null,
    platform: "telegram",
    member_count: 45,
    is_synced: false,
  },
];

export const ChatSelection = ({ onChatsSelected }: ChatSelectionProps) => {
  const { user } = useAuth();
  const [chatGroups, setChatGroups] = useState<ChatGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [discordConnected, setDiscordConnected] = useState(false);

  useEffect(() => {
    if (user) {
      // Check connected accounts
      const accountsData = localStorage.getItem(`chatpilot_accounts_${user.id}`);
      if (accountsData) {
        const accounts = JSON.parse(accountsData);
        setTelegramConnected(accounts.telegram || false);
        setDiscordConnected(accounts.discord || false);
      }

      setTimeout(() => {
        const savedSelections = localStorage.getItem(`chatpilot_chats_${user.id}`);
        let updatedGroups = [...fakeChatGroups];
        
        if (savedSelections) {
          const selections = JSON.parse(savedSelections);
          updatedGroups = updatedGroups.map(group => ({
            ...group,
            is_synced: selections[group.id] || false
          }));
        }
        
        setChatGroups(updatedGroups);
        setLoading(false);
        
        const hasSelectedChats = updatedGroups.some(group => group.is_synced);
        if (hasSelectedChats && onChatsSelected) {
          onChatsSelected();
        }
      }, 1000);
    }
  }, [user, onChatsSelected]);

  const toggleChatSync = async (groupId: string, currentSyncStatus: boolean) => {
    setChatGroups(prev => 
      prev.map(group => 
        group.id === groupId 
          ? { ...group, is_synced: !currentSyncStatus }
          : group
      )
    );

    const updatedSelections = { ...JSON.parse(localStorage.getItem(`chatpilot_chats_${user?.id}`) || '{}') };
    updatedSelections[groupId] = !currentSyncStatus;
    localStorage.setItem(`chatpilot_chats_${user?.id}`, JSON.stringify(updatedSelections));

    const hasSelectedChats = chatGroups.some(group => 
      group.id === groupId ? !currentSyncStatus : group.is_synced
    );
    
    if (hasSelectedChats && onChatsSelected) {
      onChatsSelected();
    }

    toast({
      title: !currentSyncStatus ? "Chat Added" : "Chat Removed",
      description: !currentSyncStatus 
        ? "Chat will now appear in your unified inbox" 
        : "Chat removed from unified inbox",
    });
  };

  const saveAllChanges = async () => {
    setSaving(true);
    
    setTimeout(() => {
      setSaving(false);
      
      const hasSelectedChats = chatGroups.some(group => group.is_synced);
      if (hasSelectedChats && onChatsSelected) {
        onChatsSelected();
      }

      toast({
        title: "Settings Saved",
        description: "All chat sync settings have been saved",
      });
    }, 1500);
  };

  const discordChats = chatGroups.filter(group => group.platform === 'discord');
  const telegramChats = chatGroups.filter(group => group.platform === 'telegram');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Chats to Sync</h2>
          <p className="text-gray-600">Choose which chats you want to include in your unified inbox</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading your chats...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Chats to Sync</h2>
        <p className="text-gray-600">Choose which chats you want to include in your unified inbox</p>
      </div>

      {/* Connection Status */}
      <div className="flex gap-4 justify-center mb-6">
        <Badge variant={discordConnected ? "default" : "secondary"} className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          Discord {discordConnected ? "Connected" : "Not Connected"}
        </Badge>
        <Badge variant={telegramConnected ? "default" : "secondary"} className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          Telegram {telegramConnected ? "Connected" : "Not Connected"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Discord Chats */}
        <Card className={`${discordConnected ? '' : 'opacity-50'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Discord Chats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {discordConnected ? (
              discordChats.map((group) => (
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
              <p className="text-sm text-gray-500 text-center py-4">Connect Discord to see chats</p>
            )}
          </CardContent>
        </Card>

        {/* Telegram Chats */}
        <Card className={`${telegramConnected ? '' : 'opacity-50'}`}>
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
        </Card>

        {/* Save Settings */}
        <Card className="flex items-center justify-center">
          <CardContent className="p-6 text-center">
            <Button onClick={saveAllChanges} disabled={saving} className="gap-2 mb-4">
              {saving ? "Saving..." : "Save Settings"}
              <Save className="w-4 h-4" />
            </Button>
            <p className="text-sm text-gray-600">
              {chatGroups.filter(g => g.is_synced).length} chats selected
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
