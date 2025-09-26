import { Bell, Pin, MoreVertical } from "lucide-react";

export const ChatHeader = ({ chat }) => (
  <div className="flex items-center justify-between px-4 py-3 border-b border-[#23272f] bg-[#181B23] rounded-t-xl">
    <div className="flex items-center gap-3">
      <img src={chat.avatar} className="w-8 h-8 rounded-full" alt={chat.name} />
      <div>
        <div className="text-white font-semibold">{chat.name}</div>
        <div className="text-xs text-[#b3b8c5]">{chat.platform}</div>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <button className="p-2 rounded hover:bg-[#23272f]"><Bell className="w-4 h-4 text-[#84afff]" /></button>
      <button className="p-2 rounded hover:bg-[#23272f]"><Pin className="w-4 h-4 text-[#84afff]" /></button>
      <button className="p-2 rounded hover:bg-[#23272f]"><MoreVertical className="w-4 h-4 text-[#84afff]" /></button>
    </div>
  </div>
);