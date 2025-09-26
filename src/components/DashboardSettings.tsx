import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Palette,
  Bell,
  Shield,
  MessageSquare,
  Users,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useTheme } from "@/hooks/useTheme";
import { ChatSelection } from "./ChatSelection";
import { AccountManagement } from "./AccountManagement";
import { NotificationSettings } from "./NotificationSettings";

export const DashboardSettings = () => {
  const { settings, updateSettings, loading } = useUserSettings();
  const { theme, setTheme } = useTheme();
  const [discordConnected, setDiscordConnected] = useState(false);
  const [telegramConnected, setTelegramConnected] = useState(false);

  const handleThemeChange = (newTheme: "light" | "dark" | "default") => {
    setTheme(newTheme);
    toast({
      title: "Theme Updated",
      description: `Theme changed to ${newTheme}`,
    });
  };

  const handleSettingsUpdate = async (key: string, value: any) => {
    await updateSettings({ [key]: value });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading settings...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Settings className="w-5 h-5" />
            Dashboard Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="appearance" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto">
              <TabsTrigger
                value="appearance"
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3"
              >
                <Palette className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Appearance</span>
                <span className="sm:hidden">Theme</span>
              </TabsTrigger>
              <TabsTrigger
                value="accounts"
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3"
              >
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Accounts</span>
                <span className="sm:hidden">Accounts</span>
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3"
              >
                <Bell className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Notifications</span>
                <span className="sm:hidden">Alerts</span>
              </TabsTrigger>
              <TabsTrigger
                value="privacy"
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3"
              >
                <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Privacy</span>
                <span className="sm:hidden">Privacy</span>
              </TabsTrigger>
              <TabsTrigger
                value="chats"
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3"
              >
                <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Chat Selection</span>
                <span className="sm:hidden">Chats</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="appearance" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                  <div className="space-y-0.5">
                    <Label className="text-base">Theme</Label>
                    <div className="text-sm text-muted-foreground">
                      Choose your preferred theme
                    </div>
                  </div>
                  <Select value={theme} onValueChange={handleThemeChange}>
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="default">Default</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="accounts" className="space-y-4 mt-6">
              <AccountManagement />
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4 mt-6">
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                    <div className="space-y-0.5">
                      <Label className="text-base">Push Notifications</Label>
                      <div className="text-sm text-muted-foreground">
                        Receive notifications for new messages
                      </div>
                    </div>
                    <Switch
                      checked={settings?.notifications_enabled || false}
                      onCheckedChange={(checked) =>
                        handleSettingsUpdate("notifications_enabled", checked)
                      }
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                    <div className="space-y-0.5">
                      <Label className="text-base">Summary Frequency</Label>
                      <div className="text-sm text-muted-foreground">
                        How often to receive conversation summaries
                      </div>
                    </div>
                    <Select
                      value={settings?.summary_frequency || "daily"}
                      onValueChange={(value) =>
                        handleSettingsUpdate("summary_frequency", value)
                      }
                    >
                      <SelectTrigger className="w-full sm:w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realtime">Real-time</SelectItem>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <NotificationSettings />
              </div>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                  <div className="space-y-0.5">
                    <Label className="text-base">Focus Mode</Label>
                    <div className="text-sm text-muted-foreground">
                      Hide message previews and reduce distractions
                    </div>
                  </div>
                  <Switch
                    checked={settings?.focus_mode || false}
                    onCheckedChange={(checked) =>
                      handleSettingsUpdate("focus_mode", checked)
                    }
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                  <div className="space-y-0.5">
                    <Label className="text-base">Data Retention</Label>
                    <div className="text-sm text-muted-foreground">
                      How long to keep your conversation data
                    </div>
                  </div>
                  <Select
                    value={settings?.data_retention || "1year"}
                    onValueChange={(value) =>
                      handleSettingsUpdate("data_retention", value)
                    }
                  >
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7days">1 Week</SelectItem>
                      <SelectItem value="30days">1 Month</SelectItem>
                      <SelectItem value="90days">3 Months</SelectItem>
                      <SelectItem value="unlimited">Forever</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="chats" className="space-y-4 mt-6">
              <ChatSelection
                telegramConnected={telegramConnected}
                setTelegramConnected={setTelegramConnected}
                discordConnected={discordConnected}
                setDiscordConnected={setDiscordConnected}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
