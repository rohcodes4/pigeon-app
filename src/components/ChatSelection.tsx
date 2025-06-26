import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { MessageCircle, Users, Check, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

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

export const ChatSelection = ({ onChatsSelected }: ChatSelectionProps) => {
  const { user } = useAuth();
  const [chatGroups, setChatGroups] = useState<ChatGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchChatGroups();
    }
  }, [user]);

  const fetchChatGroups = async () => {
    try {
      const { data, error } = await supabase
        .from("synced_groups")
        .select("*")
        .eq("user_id", user?.id)
        .order("group_name");

      if (error) {
        console.error("Error fetching chat groups:", error);
        return;
      }

      setChatGroups(data || []);
    } catch (error) {
      console.error("Error fetching chat groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleChatSync = async (groupId: string, currentSyncStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("synced_groups")
        .update({ is_synced: !currentSyncStatus })
        .eq("id", groupId);

      if (error) {
        throw error;
      }

      setChatGroups(prev => 
        prev.map(group => 
          group.id === groupId 
            ? { ...group, is_synced: !currentSyncStatus }
            : group
        )
      );

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
    } catch (error) {
      console.error("Error updating chat sync:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update chat sync status",
        variant: "destructive",
      });
    }
  };

  const saveAllChanges = async () => {
    setSaving(true);
    try {
      const updatePromises = chatGroups.map(group => 
        supabase
          .from("synced_groups")
          .update({ is_synced: group.is_synced })
          .eq("id", group.id)
      );

      const results = await Promise.all(updatePromises);
      
      const hasError = results.some(result => result.error);
      if (hasError) {
        throw new Error("Failed to update some chat sync settings");
      }

      // Check if any chats are selected and notify parent
      const hasSelectedChats = chatGroups.some(group => group.is_synced);
      if (hasSelectedChats && onChatsSelected) {
        onChatsSelected();
      }

      toast({
        title: "Settings Saved",
        description: "All chat sync settings have been saved",
      });
    } catch (error) {
      console.error("Error saving changes:", error);
      toast({
        title: "Save Failed",
        description: "Failed to save chat sync settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    return platform === 'discord' ? <Users className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />;
  };

  const getPlatformColor = (platform: string) => {
    return platform === 'discord' ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading your chats...</div>
        </CardContent>
      </Card>
    );
  }

  if (chatGroups.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No chats found. Make sure you've connected your Discord and Telegram accounts.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Check className="w-5 h-5" />
              Select Chats to Sync
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
                    {group.group_avatar && (
                      <img
                        src={group.group_avatar}
                        alt={group.group_name}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${!group.group_avatar ? 'visible' : 'hidden'}`}>
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
