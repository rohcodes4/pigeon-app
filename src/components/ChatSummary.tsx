
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flame, CheckSquare, Link, RefreshCw, Clock, Users } from "lucide-react";
import { ReplyPanel } from "@/components/ReplyPanel";

interface ChatSummaryProps {
  chat: any;
}

export const ChatSummary = ({ chat }: ChatSummaryProps) => {
  const [isRegenerating, setIsRegenerating] = useState(false);

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

  const regenerateSummary = () => {
    setIsRegenerating(true);
    setTimeout(() => setIsRegenerating(false), 2000);
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
                {chat.avatar}
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  {chat.name}
                  <Badge variant="outline" className={
                    chat.platform === "telegram" ? "text-blue-600" : "text-purple-600"
                  }>
                    {chat.platform}
                  </Badge>
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
          <CardTitle>AI Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="alpha" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
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
            </TabsList>

            <TabsContent value="alpha" className="mt-4">
              <div className="space-y-3">
                {summaryData.alpha.map((item, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                    <Flame className="w-5 h-5 text-red-500 mt-0.5" />
                    <p className="text-sm">{item}</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="todos" className="mt-4">
              <div className="space-y-3">
                {summaryData.todos.map((item, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckSquare className="w-5 h-5 text-green-500 mt-0.5" />
                    <p className="text-sm">{item}</p>
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
                        <p className="text-sm font-medium">{item.title}</p>
                        <Badge variant="outline" className="text-xs mt-1">{item.type}</Badge>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Open
                    </Button>
                  </div>
                ))}
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
