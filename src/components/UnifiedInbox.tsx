
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Users, Clock, TrendingUp, Filter, Pin } from "lucide-react";
import { ChatSummary } from "@/components/ChatSummary";
import { ChatList } from "@/components/ChatList";
import { useChatStats } from "@/hooks/useChatStats";

export const UnifiedInbox = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);

  // Get dynamic stats
  const stats = useChatStats(chats);

  // Handle chat updates from ChatList
  const handleChatsUpdate = (updatedChats: any[]) => {
    setChats(updatedChats);
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-8 h-8" />
              <div>
                <p className="text-blue-100">Active Chats</p>
                <p className="text-3xl font-bold">{stats.activeChats}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8" />
              <div>
                <p className="text-red-100">Unread Messages</p>
                <p className="text-3xl font-bold">{stats.unreadMessages}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8" />
              <div>
                <p className="text-green-100">Participants</p>
                <p className="text-3xl font-bold">{stats.totalParticipants}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8" />
              <div>
                <p className="text-purple-100">AI Summaries</p>
                <p className="text-3xl font-bold">{stats.aiSummaries}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Recent Chats ({stats.activeChats})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ChatList onSelectChat={setSelectedChat} selectedChat={selectedChat} />
            </CardContent>
          </Card>
        </div>

        {/* Chat Summary */}
        <div className="lg:col-span-2">
          {selectedChat ? (
            <ChatSummary chat={selectedChat} />
          ) : (
            <Card className="h-[600px] flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a chat to view summary and reply suggestions</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
