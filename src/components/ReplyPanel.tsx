
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Sparkles, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ReplyPanelProps {
  chat: any;
}

export const ReplyPanel = ({ chat }: ReplyPanelProps) => {
  const [customReply, setCustomReply] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Mock suggested replies - will be replaced with AI-generated suggestions
  const suggestedReplies = [
    "Thanks for sharing! I'll review this and get back to you.",
    "Interesting perspective. Let's discuss this in our next meeting.",
    "Could you provide more details about the timeline?",
    "I agree with this approach. Let's move forward.",
  ];

  const sendReply = async (message: string) => {
    setIsSending(true);
    
    // Simulate sending message
    setTimeout(() => {
      setIsSending(false);
      toast({
        title: "Message sent",
        description: `Reply sent to ${chat.name}`,
      });
      setCustomReply("");
    }, 1000);
  };

  const generateNewSuggestions = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 1500);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            AI Reply Suggestions
          </CardTitle>
          <Button 
            onClick={generateNewSuggestions} 
            disabled={isGenerating} 
            variant="outline" 
            size="sm"
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
            {isGenerating ? "Generating..." : "New Suggestions"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {suggestedReplies.map((reply, index) => (
            <div 
              key={index}
              className="border border-blue-200 rounded-lg p-3 bg-blue-50 hover:bg-blue-100 cursor-pointer transition-colors"
              onClick={() => sendReply(reply)}
            >
              <p className="text-sm text-blue-800 mb-2">{reply}</p>
              <div className="flex justify-end">
                <Badge variant="outline" className="text-xs bg-white">
                  Click to send
                </Badge>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4">
          <p className="text-sm text-gray-600 mb-2">Custom Reply</p>
          <div className="flex gap-2">
            <Textarea 
              value={customReply}
              onChange={(e) => setCustomReply(e.target.value)}
              placeholder="Type your custom reply..."
              className="resize-none"
            />
            <Button 
              onClick={() => sendReply(customReply)}
              disabled={!customReply.trim() || isSending}
              className="self-end gap-2"
            >
              <Send className="w-4 h-4" />
              {isSending ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
