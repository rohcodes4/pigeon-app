import { Send } from "lucide-react";

export const ChatInput = ({ value, onChange, onSend }) => (
  <div className="flex items-center gap-2 px-4 py-3 border-t border-[#23272f] bg-[#181B23] rounded-b-xl">
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder="Type a message..."
      className="flex-1 bg-transparent outline-none text-white placeholder:text-[#b3b8c5]"
    />
    <button
      onClick={onSend}
      className="bg-[#5389ff] text-black rounded-full p-2 hover:bg-[#4170cc]"
    >
      <Send className="w-5 h-5" />
    </button>
  </div>
);