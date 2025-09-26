export const ChatWindow = ({ messages }) => (
    <div className="flex-1 overflow-y-auto px-4 py-6 bg-[#10131A]">
      {messages.map((msg, idx) => (
        <div key={idx} className={`mb-4 flex ${msg.isMe ? "justify-end" : "justify-start"}`}>
          <div className={`max-w-xs px-4 py-2 rounded-lg ${msg.isMe ? "bg-[#5389ff] text-black" : "bg-[#23272f] text-white"}`}>
            {msg.text}
          </div>
        </div>
      ))}
    </div>
  );