
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

export const ChatSelection = () => {
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
      // Update each group individually since we need to use individual updates
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
      <div className="text-center py-8">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <MessageCircle className="w-4 h-4 text-blue-600" />
        </div>
        <p className="text-gray-600">Loading your chats...</p>
      </div>
    );
  }

  if (chatGroups.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageCircle className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-600">
          No chats found. Make sure you've connected your Discord and Telegram accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Select chats to sync</h3>
          <p className="text-sm text-gray-600">Choose which conversations to include in your inbox</p>
        </div>
        <Button 
          onClick={saveAllChanges} 
          disabled={saving} 
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {saving ? "Saving..." : "Save Selection"}
        </Button>
      </div>

      <div className="space-y-3">
        {chatGroups.map((group) => (
          <Card key={group.id} className="border border-gray-200 hover:border-blue-200 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={group.is_synced}
                      onCheckedChange={() => toggleChatSync(group.id, group.is_synced)}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    {group.group_avatar ? (
                      <img
                        src={group.group_avatar}
                        alt={group.group_name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className={getPlatformColor(group.platform)}>
                          {getPlatformIcon(group.platform)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{group.group_name}</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="capitalize">{group.platform}</span>
                      {group.member_count && (
                        <>
                          <span>•</span>
                          <span>{group.member_count} members</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  group.is_synced 
                    ? 'bg-green-50 text-green-700' 
                    : 'bg-gray-50 text-gray-600'
                }`}>
                  {group.is_synced ? "Synced" : "Not Synced"}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
