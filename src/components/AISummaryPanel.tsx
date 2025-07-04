import { Sparkles } from "lucide-react";

export const AISummaryPanel = () => (
  <div className="bg-[#23272f] rounded-xl p-4 mb-4 flex items-center gap-3 shadow">
    <Sparkles className="w-6 h-6 text-[#5389ff]" />
    <div>
      <div className="text-white font-semibold">AI Summary</div>
      <div className="text-[#b3b8c5] text-sm">
        You have 3 unread messages, 2 tasks due today, and 1 new mention.
      </div>
    </div>
  </div>
);