
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Settings, Bell, Moon, Sun, MessageCircle, Users, RefreshCw, Shield, LogOut } from "lucide-react";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const DashboardSettings = () => {
  const { user } = useAuth();
  const { settings, updateSettings, loading } = useUserSettings();
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([]);
  const [syncedGroups, setSyncedGroups] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchConnectedAccounts();
      fetchSyncedGroups();
    }
  }, [user]);

  const fetchConnectedAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from("connected_accounts")
        .select("*")
        .eq("user_id", user?.id);

      if (error) {
        console.error("Error fetching connected accounts:", error);
        return;
      }

      setConnectedAccounts(data || []);
    } catch (error) {
      console.error("Error fetching connected accounts:", error);
    }
  };

  const fetchSyncedGroups = async () => {
    try {
      const { data, error } = await supabase
        .from("synced_groups")
        .select("*")
        .eq("user_id", user?.id);

      if (error) {
        console.error("Error fetching synced groups:", error);
        return;
      }

      setSyncedGroups(data || []);
    } catch (error) {
      console.error("Error fetching synced groups:", error);
    }
  };

  const toggleGroupSync = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from("synced_groups")
        .update({ is_synced: !currentState })
        .eq("id", id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update group sync",
          variant: "destructive",
        });
        return;
      }

      setSyncedGroups(prev => 
        prev.map(group => 
          group.id === id ? { ...group, is_synced: !currentState } : group
        )
      );

      toast({
        title: "Group sync updated",
        description: "Your changes have been saved",
      });
    } catch (error) {
      console.error("Error updating group sync:", error);
    }
  };

  const disconnectAccount = async (accountId: string, platform: string) => {
    try {
      const { error } = await supabase
        .from("connected_accounts")
        .delete()
        .eq("id", accountId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to disconnect account",
          variant: "destructive",
        });
        return;
      }

      setConnectedAccounts(prev => prev.filter(account => account.id !== accountId));
      toast({
        title: `${platform} disconnected`,
        description: "Your account has been disconnected",
      });
    } catch (error) {
      console.error("Error disconnecting account:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Display Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="theme">Theme</Label>
                <p className="text-sm text-gray-500">Choose your preferred theme</p>
              </div>
              <Select 
                value={settings.theme} 
                onValueChange={(value) => updateSettings({ theme: value })}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4" /> Light
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="w-4 h-4" /> Dark
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4" /> System
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="focus-mode">Focus Mode</Label>
                <p className="text-sm text-gray-500">Show only pinned chats</p>
              </div>
              <Switch
                id="focus-mode"
                checked={settings.focus_mode}
                onCheckedChange={(checked) => updateSettings({ focus_mode: checked })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications">Notifications</Label>
                <p className="text-sm text-gray-500">Receive notifications for new messages</p>
              </div>
              <Switch
                id="notifications"
                checked={settings.notifications_enabled}
                onCheckedChange={(checked) => updateSettings({ notifications_enabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="summary-frequency">Summary Frequency</Label>
                <p className="text-sm text-gray-500">How often to generate AI summaries</p>
              </div>
              <Select 
                value={settings.summary_frequency} 
                onValueChange={(value) => updateSettings({ summary_frequency: value })}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">Real-time</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Connected Accounts
            </CardTitle>
            <CardDescription>
              Manage your connected messaging accounts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {connectedAccounts.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No accounts connected yet. Complete onboarding to connect your accounts.
              </p>
            ) : (
              connectedAccounts.map((account) => (
                <div 
                  key={account.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className={
                        account.platform === "telegram" ? "bg-blue-500 text-white" : "bg-purple-500 text-white"
                      }>
                        {account.platform_username?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{account.platform_username || "Unknown"}</p>
                        <Badge variant="outline" className={
                          account.platform === "telegram" ? "text-blue-600" : "text-purple-600"
                        }>
                          {account.platform}
                        </Badge>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 mt-1">
                        Connected
                      </Badge>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-gray-500 hover:text-red-500 hover:border-red-500"
                    onClick={() => disconnectAccount(account.id, account.platform)}
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Synced Groups & Chats
            </CardTitle>
            <CardDescription>
              Choose which groups to include in your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[240px] pr-4">
              {syncedGroups.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No groups found. Connect your accounts to see available groups.
                </p>
              ) : (
                <div className="space-y-3">
                  {syncedGroups.map((group) => (
                    <div 
                      key={group.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className={
                            group.platform === "telegram" ? "bg-blue-500 text-white" : "bg-purple-500 text-white"
                          }>
                            {group.group_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{group.group_name}</p>
                            <Badge variant="outline" className={
                              group.platform === "telegram" ? "text-blue-600" : "text-purple-600"
                            }>
                              {group.platform}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500">{group.member_count} members</p>
                        </div>
                      </div>
                      <Switch
                        checked={group.is_synced}
                        onCheckedChange={() => toggleGroupSync(group.id, group.is_synced)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Privacy Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="data-retention">Data Retention</Label>
                <p className="text-sm text-gray-500">How long to keep your message data</p>
              </div>
              <Select 
                value={settings.data_retention} 
                onValueChange={(value) => updateSettings({ data_retention: value })}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Retention" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">7 days</SelectItem>
                  <SelectItem value="30days">30 days</SelectItem>
                  <SelectItem value="90days">90 days</SelectItem>
                  <SelectItem value="unlimited">Unlimited</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
