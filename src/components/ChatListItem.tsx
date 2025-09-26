import { Sparkles, Heart, HeartOff, Bell, BellOff, Plus, ExternalLink } from "lucide-react";

export const ChatListItem = ({
  chat,
  selected,
  onSelect,
  onPin,
  onMute,
  onAISummary,
  onAction,
  onOpenPlatform,
}) => {
  let lastUpdatedText = "";
  if (chat.aiSummary && chat.lastUpdated) {
    const now = Date.now();
    const updated = new Date(chat.lastUpdated).getTime();
    const diff = Math.floor((now - updated) / 1000);
    if (diff < 60) lastUpdatedText = `${diff} seconds ago`;
    else if (diff < 3600) lastUpdatedText = `${Math.floor(diff / 60)} minutes ago`;
    else if (diff < 86400) lastUpdatedText = `${Math.floor(diff / 3600)} hours ago`;
    else lastUpdatedText = `${Math.floor(diff / 86400)} days ago`;
  }

return (<div
    onClick={onSelect}
    className={`flex items-center gap-3 px-4 py-6 cursor-pointer border-b ${
      selected ? "bg-[#3474ff20] rounded-[16px] border-transparent" : "hover:bg-[#181B23] border-[#ffffff09]"
    }`}
  >
    <img src={chat.avatar} className="w-8 h-8 rounded-full self-start" alt={chat.name} />
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <span className={`${chat.aiSummary?"text-white":"text-[#ffffff48]"} font-medium mb-4`}>{chat.name}</span>
        {chat.unread > 0 && (
      <span className="bg-[#3474FF12] text-[#84AFFF] text-xs rounded-[6px] px-2 py-0.5 ml-1 self-start mt-0.5">
        {chat.unread} Message{chat.unread>1?"s":""}
      </span>
    )}
      {chat.aiSummary && <div className="text-[#ffffff32] self-start mt-0.5 leading-1 text-sm">Updated {lastUpdatedText}</div>}

        {/* {chat.isPinned && <Heart className="w-4 h-4 text-pink-500" />} */}
        {/* {chat.isMuted && <BellOff className="w-4 h-4 text-gray-400" />} */}
      </div>
      {chat.aiSummary?
      <div className="text-[10px] text-white">{chat.aiSummary}</div>
      :
      <div className={`${chat.aiSummary?"text-white":"text-[#ffffff48]"} text-xs truncate`}>No summaries yet...</div>
      }
      
    </div>
    
    {/* Icons */}
    <div className="flex items-center gap-2 ml-2">
      {/* 1. AI Summary */}
      <button
        className="p-1 rounded hover:bg-[#23272f]"
        title="Update AI Summary"
        onClick={e => { e.stopPropagation(); onAISummary(); }}
      >
        <Sparkles className="w-4 h-4 text-[#84afff]" />
      </button>
      {/* 2. Pin/Unpin */}
      <button
        className="p-1 rounded hover:bg-[#23272f]"
        title={chat.isPinned ? "Unpin" : "Pin"}
        onClick={e => { e.stopPropagation(); onPin(); }}
      >
        {chat.isPinned ? (
          <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
        ) : (
          <HeartOff className="w-4 h-4 text-[#b3b8c5]" />
        )}
      </button>
      {/* 3. Mute/Unmute */}
      <button
        className="p-1 rounded hover:bg-[#23272f]"
        title={chat.isMuted ? "Unmute" : "Mute"}
        onClick={e => { e.stopPropagation(); onMute(); }}
      >
        {chat.isMuted ? (
          <BellOff className="w-4 h-4 text-[#b3b8c5]" />
        ) : (
          <Bell className="w-4 h-4 text-[#84afff]" />
        )}
      </button>
      {/* 4. Action (Plus) */}
      <button
        className="p-1 rounded hover:bg-[#23272f]"
        title="Action"
        onClick={e => { e.stopPropagation(); onAction(); }}
      >
        <Plus className="w-4 h-4 text-[#84afff]" />
      </button>
      {/* 5. Open Platform */}
      <button
        className="p-1 rounded hover:bg-[#23272f]"
        title={`Open in ${chat.platform}`}
        onClick={e => { e.stopPropagation(); onOpenPlatform(); }}
      >
        <ExternalLink className="w-4 h-4 text-[#84afff]" />
      </button>
    </div>
  </div>
)};