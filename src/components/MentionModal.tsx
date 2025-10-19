import { mapDiscordToTelegramSchema, mapToFullChat } from "@/lib/utils";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";


export default function MentionModal({ username, avatar, userId, mention, message, onClose }) {
    const navigate = useNavigate();    
    console.log("scc mention",mention)
    console.log("scc message",message)
    return (
      <div className="fixed z-50 left-0 top-0 w-full h-full flex items-center justify-center bg-black bg-opacity-40">
        <div className="relative bg-[#111] shadow-lg p-6 rounded-[12px] shadow-lg min-w-[250px] flex gap-2 flex-col items-center">
        <button
            className="mt-2 text-gray-500 underline absolute top-1 right-2"
            onClick={onClose}
          >
            <X width={18} height={18}/>
          </button>
          <img src={avatar} alt={username} className="w-16 h-16 rounded-full mb-2" />
          <div className="font-bold text-lg mb-1">@{username}</div>
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded-[8px]"
            onClick={() => {
                onClose()
    // navigate("/", { state: { selectedChat:{
    //     id:mention.id,
    //     platform:"discord",
    //     name:mention.global_name || mention.username,
    //     photo_url: `https://cdn.discordapp.com/avatars/${mention.id}/${mention.avatar}.png`
    // }}});            
            }}
          >
            Send Message
          </button>
        
        </div>
      </div>
    );
  }
  