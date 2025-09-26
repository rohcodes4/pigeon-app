
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flame, CheckSquare, Link, RefreshCw, Clock, Users, MessageSquare } from "lucide-react";
import { ReplyPanel } from "@/components/ReplyPanel";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Message {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    display_name: string;
    avatar: string | null;
  };
  timestamp: string;
  attachments: any[];
  embeds: any[];
}

interface ChatSummaryProps {
  chat: any;
}

export const ChatSummary = ({ chat }: ChatSummaryProps) => {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const { user } = useAuth();

  // Mock summary data - will be replaced with AI-generated content
  const summaryData = {
    alpha: [
      "BTC showing strong support at $42k level",
      "New DeFi protocol launching next week with potential 10x",
      "Institutional buying increasing in the options market",
    ],
    todos: [
      "Review the smart contract audit report by Friday",
      "Schedule team meeting for Q1 planning",
      "Follow up with marketing team on campaign metrics",
    ],
    links: [
      { title: "CoinDesk Article", url: "https://coindesk.com", type: "article" },
      { title: "Trading Chart Analysis", url: "https://tradingview.com", type: "chart" },
      { title: "Team Presentation", url: "https://docs.google.com", type: "document" },
    ],
  };

  useEffect(() => {
    if (chat && chat.platform === 'discord') {
      fetchMessages();
    }
  }, [chat]);

  const fetchMessages = async () => {
    if (!chat || chat.platform !== 'discord') return;
    
    setLoadingMessages(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-discord-messages', {
        body: { 
          user_id: user.id, 
          channel_id: chat.id,
          limit: 50
        }
      });

      if (error) {
        console.error('Failed to fetch messages:', error);
        return;
      }

      if (data?.messages) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const regenerateSummary = () => {
    setIsRegenerating(true);
    setTimeout(() => setIsRegenerating(false), 2000);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Chat Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                chat.platform === "telegram" ? "bg-blue-500" : "bg-purple-500"
              }`}>
                {chat.avatar !== "NA" && chat.avatar ? (
                  <img src={chat.avatar} className="rounded-full w-full h-full object-cover" alt={chat.name} />
                ) : (
                  chat.name.substring(0, 2)
                )}
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  {chat.name}
                  <Badge variant="outline" className={
                    chat.platform === "telegram" ? "text-blue-600" : "text-purple-600"
                  }>
                    {chat.platform}
                  </Badge>
                  {chat.recipient_id && (
                    <Badge variant="secondary" className="text-xs">
                      DM
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {chat.participants} {chat.isGroup ? "members" : "participants"}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Last active {chat.timestamp}
                  </div>
                </div>
              </div>
            </div>
            <Button onClick={regenerateSummary} disabled={isRegenerating} variant="outline" className="gap-2">
              <RefreshCw className={`w-4 h-4 ${isRegenerating ? "animate-spin" : ""}`} />
              {isRegenerating ? "Regenerating..." : "Regenerate"}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Content */}
      <Card>
        <CardHeader>
          <CardTitle>AI Summary & Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="alpha" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="alpha" className="flex items-center gap-2">
                <Flame className="w-4 h-4" />
                Alpha
              </TabsTrigger>
              <TabsTrigger value="todos" className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />
                To-dos
              </TabsTrigger>
              <TabsTrigger value="links" className="flex items-center gap-2">
                <Link className="w-4 h-4" />
                Links
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Messages
              </TabsTrigger>
            </TabsList>

            <TabsContent value="alpha" className="mt-4">
              <div className="space-y-3">
                {summaryData.alpha.map((item, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                    <Flame className="w-5 h-5 text-red-500 mt-0.5" />
                    <p className="text-sm text-black">{item}</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="todos" className="mt-4">
              <div className="space-y-3">
                {summaryData.todos.map((item, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckSquare className="w-5 h-5 text-green-500 mt-0.5" />
                    <p className="text-sm text-black">{item}</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="links" className="mt-4">
              <div className="space-y-3">
                {summaryData.links.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Link className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-black">{item.title}</p>
                        <Badge variant="outline" className="text-xs mt-1 text-black">{item.type}</Badge>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Open
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="messages" className="mt-4">
              <div className="space-y-4">
                {loadingMessages ? (
                  <div className="text-center py-4">Loading messages...</div>
                ) : messages.length > 0 ? (
                  <ScrollArea className="h-96">
                    <div className="space-y-3 pr-4">
                      {messages.map((message) => (
                        <div key={message.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                              {message.author.avatar ? (
                                <img 
                                  src={`https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}.png`}
                                  alt={message.author.username}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                message.author.username.substring(0, 2).toUpperCase()
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm">
                                  {message.author.display_name || message.author.username}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatTimestamp(message.timestamp)}
                                </span>
                              </div>
                              {message.content && (
                                <p className="text-sm text-gray-700 mb-2">{message.content}</p>
                              )}
                              {message.attachments.length > 0 && (
                                <div className="space-y-1">
                                  {message.attachments.map((attachment, index) => (
                                    <div key={index} className="text-xs text-blue-600">
                                      📎 {attachment.filename}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {message.embeds.length > 0 && (
                                <div className="text-xs text-gray-500">
                                  {message.embeds.length} embed(s)
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    {chat.platform === 'discord' ? 'No messages found' : 'Message fetching not available for this platform'}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Reply Panel */}
      <ReplyPanel chat={chat} />
    </div>
  );
};
