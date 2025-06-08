
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bell, MessageCircle, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface SyncedGroup {
  id: string;
  group_id: string;
  group_name: string;
  platform: string;
  is_synced: boolean;
}

interface NotificationPreference {
  id: string;
  platform: string;
  group_id: string;
  notification_type: string;
}

export const NotificationSettings = () => {
  const { user } = useAuth();
  const [syncedGroups, setSyncedGroups] = useState<SyncedGroup[]>([]);
  const [notifications, setNotifications] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSyncedGroups();
      fetchNotifications();
    }
  }, [user]);

  const fetchSyncedGroups = async () => {
    try {
      const { data, error } = await supabase
        .from("synced_groups")
        .select("*")
        .eq("user_id", user?.id)
        .eq("is_synced", true);

      if (error) throw error;
      setSyncedGroups(data || []);
    } catch (error) {
      console.error("Error fetching synced groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user?.id);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const updateNotificationPreference = async (groupId: string, platform: string, notificationType: string) => {
    try {
      const { error } = await supabase
        .from("notification_preferences")
        .upsert({
          user_id: user?.id,
          platform,
          group_id: groupId,
          notification_type: notificationType,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      fetchNotifications();
    } catch (error) {
      console.error("Error updating notification preference:", error);
    }
  };

  const getNotificationPreference = (groupId: string, platform: string) => {
    const pref = notifications.find(n => n.group_id === groupId && n.platform === platform);
    return pref?.notification_type || 'all';
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
          <div className="text-center">Loading notification settings...</div>
        </CardContent>
      </Card>
    );
  }

  if (syncedGroups.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            No synced chats found. Connect your accounts and sync some chats first.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notification Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {syncedGroups.map((group) => (
          <div key={group.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg space-y-3 sm:space-y-0">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800`}>
                <span className={getPlatformColor(group.platform)}>
                  {getPlatformIcon(group.platform)}
                </span>
              </div>
              <div>
                <h4 className="font-medium">{group.group_name}</h4>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {group.platform}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="w-full sm:w-40">
              <Select
                value={getNotificationPreference(group.group_id, group.platform)}
                onValueChange={(value) => updateNotificationPreference(group.group_id, group.platform, value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Messages</SelectItem>
                  <SelectItem value="mentions">Mentions Only</SelectItem>
                  <SelectItem value="none">No Notifications</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
