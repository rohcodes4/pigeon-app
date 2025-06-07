
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Settings, Bell, Moon, Sun, MessageCircle, Users, RefreshCw, Shield, LogOut } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export const DashboardSettings = () => {
  const [theme, setTheme] = useState("light");
  const [summaryFrequency, setSummaryFrequency] = useState("daily");
  const [notifications, setNotifications] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [dataRetention, setDataRetention] = useState("30days");
  
  // Mock connected accounts - will be replaced with real data
  const connectedAccounts = [
    {
      id: 1,
      type: "telegram",
      name: "John Doe",
      avatar: "JD",
      status: "connected",
    },
    {
      id: 2,
      type: "discord",
      name: "John Doe",
      avatar: "JD",
      status: "connected",
    },
  ];

  // Mock synced groups - will be replaced with real data
  const syncedGroups = [
    {
      id: 1,
      name: "Crypto Traders Elite",
      platform: "telegram",
      members: 156,
      synced: true,
      avatar: "CTE",
    },
    {
      id: 2,
      name: "Development Team",
      platform: "discord",
      members: 12,
      synced: true,
      avatar: "DT",
    },
    {
      id: 3,
      name: "Marketing Squad",
      platform: "discord",
      members: 8,
      synced: true,
      avatar: "MS",
    },
    {
      id: 4,
      name: "Product Roadmap",
      platform: "telegram",
      members: 22,
      synced: false,
      avatar: "PR",
    },
    {
      id: 5,
      name: "Community Chat",
      platform: "discord",
      members: 345,
      synced: false,
      avatar: "CC",
    },
  ];

  const toggleGroupSync = (id: number) => {
    // Will be replaced with actual API call
    toast({
      title: "Group sync updated",
      description: "Your changes have been saved",
    });
  };

  const disconnectAccount = (type: string) => {
    // Will be replaced with actual API call
    toast({
      title: `${type} disconnected`,
      description: "Your account has been disconnected",
    });
  };

  const saveSettings = () => {
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated",
    });
  };

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
                value={theme} 
                onValueChange={setTheme}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light" className="flex items-center gap-2">
                    <Sun className="w-4 h-4" /> Light
                  </SelectItem>
                  <SelectItem value="dark" className="flex items-center gap-2">
                    <Moon className="w-4 h-4" /> Dark
                  </SelectItem>
                  <SelectItem value="system" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" /> System
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
                checked={focusMode}
                onCheckedChange={setFocusMode}
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
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="summary-frequency">Summary Frequency</Label>
                <p className="text-sm text-gray-500">How often to generate AI summaries</p>
              </div>
              <Select 
                value={summaryFrequency} 
                onValueChange={setSummaryFrequency}
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
            {connectedAccounts.map((account) => (
              <div 
                key={account.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className={
                      account.type === "telegram" ? "bg-blue-500 text-white" : "bg-purple-500 text-white"
                    }>
                      {account.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{account.name}</p>
                      <Badge variant="outline" className={
                        account.type === "telegram" ? "text-blue-600" : "text-purple-600"
                      }>
                        {account.type}
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
                  onClick={() => disconnectAccount(account.type)}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ))}
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
                          {group.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{group.name}</p>
                          <Badge variant="outline" className={
                            group.platform === "telegram" ? "text-blue-600" : "text-purple-600"
                          }>
                            {group.platform}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">{group.members} members</p>
                      </div>
                    </div>
                    <Switch
                      checked={group.synced}
                      onCheckedChange={() => toggleGroupSync(group.id)}
                    />
                  </div>
                ))}
              </div>
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
                value={dataRetention} 
                onValueChange={setDataRetention}
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

        <div className="flex justify-end">
          <Button onClick={saveSettings} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};
