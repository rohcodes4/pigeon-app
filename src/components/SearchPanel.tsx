
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Filter, Lightbulb, Clock, MessageCircle, ExternalLink } from "lucide-react";

export const SearchPanel = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [hasResults, setHasResults] = useState(false);

  // Mock search results - will be replaced with actual search
  const searchResults = [
    {
      id: 1,
      chatName: "Crypto Traders Elite",
      messageContent: "The market is showing strong support at <mark>$42k</mark>. If we break that level, expect a run to <mark>$45k</mark>.",
      timestamp: "2 days ago",
      platform: "telegram",
      author: "Michael Chen",
    },
    {
      id: 2,
      chatName: "Development Team",
      messageContent: "We need to update the <mark>support</mark> documentation for the new API features.",
      timestamp: "Yesterday",
      platform: "discord",
      author: "Sarah Johnson",
    },
    {
      id: 3,
      chatName: "Marketing Squad",
      messageContent: "The new campaign shows strong <mark>support</mark> from our target demographic.",
      timestamp: "4 hours ago",
      platform: "discord",
      author: "James Wilson",
    },
  ];

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      setHasResults(true);
    }, 1500);
  };

  const suggestedSearches = ["meeting notes", "deadline", "alpha", "review"];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Global Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search-query" className="mb-2 block">Search Across All Conversations</Label>
              <div className="relative">
                <Input
                  id="search-query"
                  placeholder="Search for keywords, topics, or messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>
            <div className="self-end">
              <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
                {isSearching ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-gray-600">Filters</Label>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="cursor-pointer hover:bg-blue-50">
                Telegram
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-blue-50">
                Discord
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-blue-50">
                Last 7 days
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-blue-50">
                Only groups
              </Badge>
              <Button variant="outline" size="sm" className="gap-1">
                <Filter className="w-3 h-3" />
                More Filters
              </Button>
            </div>
          </div>

          {!hasResults && !isSearching && (
            <div className="pt-6">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                <Label className="text-gray-600">Suggested Searches</Label>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestedSearches.map((suggestion, index) => (
                  <Badge 
                    key={index}
                    variant="secondary" 
                    className="cursor-pointer"
                    onClick={() => {
                      setSearchQuery(suggestion);
                      handleSearch();
                    }}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {hasResults && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Results for "{searchQuery}"</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <div className="space-y-4 p-4">
                {searchResults.map((result) => (
                  <div key={result.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={
                          result.platform === "telegram" ? "text-blue-600" : "text-purple-600"
                        }>
                          {result.platform}
                        </Badge>
                        <h3 className="font-semibold">{result.chatName}</h3>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {result.timestamp}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3 mb-2">
                      <p 
                        className="text-sm"
                        dangerouslySetInnerHTML={{ __html: result.messageContent }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">From: {result.author}</span>
                      <Button variant="ghost" size="sm" className="gap-1">
                        <ExternalLink className="w-3 h-3" />
                        View in App
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
