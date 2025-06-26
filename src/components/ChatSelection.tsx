
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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

// Fake chat data for simulation
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

  useEffect(() => {
    if (user) {
      // Simulate loading chat groups
      setTimeout(() => {
        // Load saved selections from localStorage
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
        
        // Check if any chats are already selected
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

    // Save to localStorage for simulation
    const updatedSelections = { ...JSON.parse(localStorage.getItem(`chatpilot_chats_${user?.id}`) || '{}') };
    updatedSelections[groupId] = !currentSyncStatus;
    localStorage.setItem(`chatpilot_chats_${user?.id}`, JSON.stringify(updatedSelections));

    // Check if any chats are selected and notify parent
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
    
    // Simulate saving delay
    setTimeout(() => {
      setSaving(false);
      
      // Check if any chats are selected and notify parent
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

  const getPlatformIcon = (platform: string) => {
    return platform === 'discord' ? <Users className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />;
  };

  const getPlatformColor = (platform: string) => {
    return platform === 'discord' ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400';
  };

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

  if (chatGroups.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Chats to Sync</h2>
          <p className="text-gray-600">Choose which chats you want to include in your unified inbox</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              No chats found. Make sure you've connected your Discord and Telegram accounts.
            </div>
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Check className="w-5 h-5" />
              Available Chats
            </CardTitle>
            <Button onClick={saveAllChanges} disabled={saving} className="gap-2">
              {saving ? "Saving..." : "Save All"}
              <Save className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {chatGroups.map((group) => (
            <Card key={group.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={group.is_synced}
                      onCheckedChange={() => toggleChatSync(group.id, group.is_synced)}
                    />
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800`}>
                      <span className={getPlatformColor(group.platform)}>
                        {getPlatformIcon(group.platform)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium">{group.group_name}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {group.platform}
                      </Badge>
                      {group.member_count && (
                        <span>{group.member_count} members</span>
                      )}
                    </div>
                  </div>
                </div>
                <Badge variant={group.is_synced ? "default" : "secondary"}>
                  {group.is_synced ? "Synced" : "Not Synced"}
                </Badge>
              </div>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
