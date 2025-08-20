import { useAuth } from "@/hooks/useAuth";
import { BotMessageSquare, Plus, SendHorizonal, User, X } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";

interface Message {
  id: number;
  sender: "user" | "assistant";
  text: string;
}

interface AiChatBoxProps {
  selectedChat?: any; // Replace with your chat type
}

const AiChatBox: React.FC<AiChatBoxProps> = ({ selectedChat }) => {
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const attachRef = useRef<HTMLDivElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<
    {
      file: File;
      type: "image" | "video" | "doc";
      preview: string | null;
      status: "uploading" | "done";
    }[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load messages from selectedChat if available
  useEffect(() => {
    if (selectedChat && Array.isArray(selectedChat.messages)) {
      setMessages(selectedChat.messages);
    } else {
      setMessages([]);
    }
  }, [selectedChat]);

  const getFileType = (file: File): "image" | "video" | "doc" => {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";
    return "doc";
  };

  // Send user message and get AI response
  const sendMessage = async () => {
    const validInput = inputRef.current?.value.trim();
    if (!validInput) return;

    const userMessage: Message = {
      id: Date.now(),
      sender: "user",
      text: validInput,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    if (inputRef.current) inputRef.current.value = "";
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/chat/${selectedChat?.id}/message`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userMessage.text }),
        }
      );

      if (!response.ok) throw new Error("Failed to get AI reply");
      const data = await response.json();

      const assistantMessage: Message = {
        id: Date.now() + 1,
        sender: "assistant",
        text: data.reply,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "assistant",
          text: "Sorry, something went wrong.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full border-gray-700">
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map(({ id, sender, text }) => (
          <div
            key={id}
            className={`flex items-end mb-3 ${
              sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {sender === "assistant" && (
              <div className="w-9 h-9 rounded-full bg-[#23272f] p-2 flex justify-center items-center mr-2">
                <BotMessageSquare className="w-6 h-6 text-[#84afff]" />
              </div>
            )}
            <div
              className={`max-w-[80%] px-3 py-2 rounded-[6px] ${
                sender === "user"
                  ? "bg-[#5389ff] text-white self-end ml-auto"
                  : "bg-gray-700 text-gray-100 self-start mr-auto"
              }`}
            >
              {text}
            </div>
            {sender === "user" && user?.avatar ? (
              <img
                src={user.avatar}
                alt="User"
                className="w-9 h-9 rounded-full ml-2"
              />
            ) : sender === "user" ? (
              <div className="w-9 h-9 rounded-full bg-[#23272f] p-2 flex justify-center items-center ml-2">
                <User className="w-6 h-6" />
              </div>
            ) : null}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex-shrink-0 px-6 py-4 bg-gradient-to-t from-[#181A20] via-[#181A20ee] to-transparent">
        {/* Uploaded Files Preview */}
        {uploadedFiles.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {uploadedFiles.map((uf, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 bg-[#2d2d2d] px-3 py-2 rounded-[10px] text-white relative"
              >
                {/* Icon / Preview */}
                {uf.type === "image" ? (
                  <img
                    src={uf.preview ?? ""}
                    alt={uf.file.name}
                    className="w-8 h-8 rounded object-cover"
                  />
                ) : uf.type === "video" ? (
                  <span className="w-8 h-8 flex items-center justify-center bg-[#444] rounded">
                    🎥
                  </span>
                ) : (
                  <span className="w-8 h-8 flex items-center justify-center bg-[#444] rounded">
                    📄
                  </span>
                )}

                {/* Name */}
                <span className="text-xs max-w-[150px] truncate">
                  {uf.file.name}
                </span>

                {/* Loader */}
                {uf.status === "uploading" && (
                  <div className="w-4 h-4 border-2 border-[#84afff] border-t-transparent rounded-full animate-spin"></div>
                )}

                {/* Remove */}
                <X
                  className="w-4 h-4 text-gray-400 hover:text-red-400 cursor-pointer"
                  onClick={() =>
                    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx))
                  }
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex">
          <div className="flex grow items-center bg-[#212121] rounded-[10px] px-4 py-2 shadow-lg">
            <div ref={attachRef} className="relative">
              <Plus
                className="text-black bg-[#fafafa60] rounded-full mr-2 w-[18px] h-[18px] cursor-pointer"
                onClick={() => setShowAttachMenu((prev) => !prev)}
              />

              {/* Attachment Popup Menu */}
              {showAttachMenu && (
                <div className="absolute bottom-[130%] left-0 mb-2 px-3 py-2 bg-[#2d2d2d] text-white text-sm rounded-lg shadow-lg border border-[#ffffff14] z-50">
                  <input
                    ref={fileInputRef}
                    type="file"
                    style={{ display: "none" }}
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []).map(
                        (file) => ({
                          file,
                          type: getFileType(file),
                          preview: file.type.startsWith("image/")
                            ? URL.createObjectURL(file)
                            : null,
                          status: "uploading" as const,
                        })
                      );

                      setUploadedFiles((prev) => [...prev, ...files]);
                      setShowAttachMenu(false);

                      setTimeout(() => {
                        setUploadedFiles((prev) =>
                          prev.map((f) =>
                            files.includes(f) ? { ...f, status: "done" } : f
                          )
                        );
                      }, 2000);
                    }}
                  />
                  <p
                    className="mb-1 cursor-pointer hover:text-[#84afff] w-max"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Attach File
                  </p>
                  <p
                    className="mb-1 cursor-pointer hover:text-[#84afff] w-max"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Send Image
                  </p>
                  <p
                    className="mb-1 cursor-pointer hover:text-[#84afff] w-max"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Send Video
                  </p>
                </div>
              )}
            </div>
            <input
              ref={inputRef}
              type="text"
              placeholder="Type your message..."
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent outline-none text-white placeholder-[#ffffff48] text-sm"
              onChange={(e) => setInput(e.target.value)}
              value={input}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="ml-3 p-2 rounded-[10px] bg-[#5389ff] hover:bg-[#5389ff] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SendHorizonal className="w-5 h-5 text-black fill-black" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiChatBox;
