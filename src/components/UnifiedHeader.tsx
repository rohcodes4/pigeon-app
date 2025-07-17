import React from "react";
import { Search, Filter, Settings, Plus, CheckCheck } from "lucide-react";
import aiIMG from "@/assets/images/aiBlue.png";

type UnifiedHeaderProps = {
    title: string;
    smartText: string;
    isSmartSummary?: boolean;
    isReadAll?: boolean;
    setIsSmartSummary?: (value:boolean)=>void;
  };
const UnifiedHeader:React.FC<UnifiedHeaderProps> = ({
    title,
    smartText,
    isReadAll,
    isSmartSummary,
    setIsSmartSummary
}) => {
  return (
    <header className="flex items-center justify-between px-6 py-1 border-b border-[#23272f] rounded-tl-[12px]">
      {/* Left: Title and subtitle */}
      <div className="flex gap-2 items-center">
        <h1 className="text-[15px] text-[#ffffff72]">{title}</h1>
        <span className="p-1.5 rounded-[6px] text-[11px] text-[#84afff] bg-[#3474ff12]">All Channels</span>
        <span className="p-1.5 rounded-[6px] text-[11px] text-[#bfd6ff] bg-[#3474ff]">Telegram</span>
        <span className="p-1.5 rounded-[6px] text-[11px] text-[#d7d5ff] bg-[#7b5cfa]">Discord</span>
      </div>

      {/* Center: Search bar */}
      <div className="flex-1 flex justify-center px-6">
        <div className="relative w-full max-w-xs">
        </div>
      </div>

      {/* Right: Actions and avatar */}
      <div className="flex items-center gap-3">
        {isReadAll && <button className="p-1.5 my-1 flex gap-2 text-[11px] items-center rounded-lg bg-[#ffffff06] border border-[#ffffff03] text-[#ffffff32] hover:text-[#ffffff64] hover:bg-[#ffffff32] transition">
          <CheckCheck className="w-5 h-5" /> <span>Read All</span>
        </button>}
        <button   onClick={() => setIsSmartSummary(!isSmartSummary)} className="p-1.5 my-1 flex gap-2 text-[11px] items-center rounded-lg  text-[#84afff] bg-[#3474ff12] hover:text-[#ffffff] hover:bg-[#3474ff] transition">
          <img src={aiIMG} className="w-5 h-5" /><span>{smartText}</span>
        </button>
      </div>
    </header>
  );
};

export default UnifiedHeader;