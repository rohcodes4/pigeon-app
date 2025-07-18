import React, { useState } from "react";
import { Bell, Check, ChevronDown, ChevronRight, Heart, MoreHorizontal, Pin, PinOff, Plus, SmilePlus, VolumeX, X } from "lucide-react";
import { FaTelegramPlane, FaDiscord } from "react-icons/fa";
import discord from "@/assets/images/discord.png";
import telegram from "@/assets/images/telegram.png";
import smartIcon from "@/assets/images/sidebar/Chat.png";

const NotificationPanel = () => {
  const [openChannel, setOpenChannel] = useState('pow');
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);

  const [channels, setChannels] = useState({
    pow: [
      {
        id: 1,
        name: "James Steven",
        date: "17/07/25, 18:49",
        message: "For the first time in MENA, Play It is a gaming platform...",
        platform: "telegram",
        reactions: { replies: 38, likes: 21, thumbsUp: 16 },
      },
      {
        id: 2,
        name: "Alice Johnson",
        date: "17/07/25, 19:00",
        message: "Join us for an exciting event this weekend!",
        platform: "telegram",
        reactions: { replies: 12, likes: 30, thumbsUp: 5 },
      },
      {
        id: 3,
        name: "Bob Smith",
        date: "17/07/25, 20:15",
        message: "New updates are coming soon. Stay tuned!",
        platform: "telegram",
        reactions: { replies: 20, likes: 18, thumbsUp: 10 },
      },
    ],
    xt: [
      {
        id: 1,
        name: "Michael Saylor",
        date: "23/07/25, 18:49",
        message: "$GOR entered Proof-of-Cope meta. 0 devs. 100% community raid...",
        platform: "discord",
        reactions: { replies: 38, likes: 21, thumbsUp: 16 },
      },
      {
        id: 2,
        name: "Sarah Connor",
        date: "23/07/25, 19:30",
        message: "Check out the latest market trends!",
        platform: "discord",
        reactions: { replies: 15, likes: 25, thumbsUp: 8 },
      },
      {
        id: 3,
        name: "John Doe",
        date: "23/07/25, 20:45",
        message: "We're hosting a live Q&A session tomorrow.",
        platform: "discord",
        reactions: { replies: 22, likes: 19, thumbsUp: 12 },
      },
    ],
    // Add more channels here
    alpha: [
      {
        id: 1,
        name: "Alpha Bot",
        date: "24/07/25, 10:00",
        message: "Welcome to the Alpha channel!",
        platform: "telegram",
        reactions: { replies: 10, likes: 15, thumbsUp: 7 },
      },
      // More messages...
    ],
    beta: [
      {
        id: 1,
        name: "Beta Tester",
        date: "24/07/25, 11:30",
        message: "Beta testing is now open for all users.",
        platform: "discord",
        reactions: { replies: 18, likes: 22, thumbsUp: 9 },
      },
      // More messages...
    ],
    gamma: [
      {
        id: 1,
        name: "Gamma Group",
        date: "24/07/25, 12:45",
        message: "Join our group for exclusive content.",
        platform: "telegram",
        reactions: { replies: 25, likes: 30, thumbsUp: 14 },
      },
      // More messages...
    ],
    delta: [
      {
        id: 1,
        name: "Delta Team",
        date: "24/07/25, 14:00",
        message: "Team meeting scheduled for tomorrow.",
        platform: "discord",
        reactions: { replies: 20, likes: 18, thumbsUp: 10 },
      },
      // More messages...
    ],
  });

  const toggleChannel = (channel) => {
    setOpenChannel(openChannel === channel ? null : channel);
  };

  const removeMessage = (channelKey, messageId) => {
    setChannels((prevChannels) => ({
      ...prevChannels,
      [channelKey]: prevChannels[channelKey].filter((message) => message.id !== messageId),
    }));
  };

  const renderChats = (chats, channelKey) => {
    if(chats.length<=0) return;
    return chats?.map((chat) => (
      <div key={chat.id} className="relative flex items-start gap-2 mb-2 bg-[#212121] p-2 rounded-[10px] border border-[#ffffff09]">
        <div className="absolute top-2 right-2 cursor-pointer" onClick={() => removeMessage(channelKey, chat.id)}>
          <X className="w-4 h-4 text-[#fafafa60] hover:text-[#fafafa]" />
        </div>
        <div className="flex-shrink-0 w-8 flex items-center justify-center">
          <img
            src={`https://www.gravatar.com/avatar/${Math.random() * 100}?d=identicon&s=80`}
            className="w-7 h-7 rounded-full object-cover"
          />
        </div>
        <div className="grow rounded-[8px] px-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#fafafa] font-medium">{chat.name}</span>
            <span className="text-xs text-[#FAFAFA60]">{chat.date}</span>
          </div>
          <div className="text-sm text-[#fafafa] break-words w-full">{chat.message}</div>
          <div className="flex space-x-2 mt-2">
            <span className="text-xs rounded-full bg-[#ffffff16] px-2 py-1">🤍 {chat.reactions.replies}</span>
            <span className="text-xs rounded-full bg-[#ffffff16] px-2 py-1">🔥 {chat.reactions.likes}</span>
            <span className="text-xs rounded-full bg-[#ffffff16] px-2 py-1">😂 {chat.reactions.thumbsUp}</span>
            <span className="text-xs rounded-full bg-[#ffffff16] px-1 py-1 flex items-center"><SmilePlus className="w-3 h-3" /></span>
          </div>
        </div>
      </div>
    ));
  };

  return (
    <aside className="h-[calc(100vh-72px)] overflow-y-scroll overflow-x-hidden min-w-[500px] bg-[#111111] text-white rounded-2xl flex flex-col shadow-lg border border-[#23242a]">
      <div className="text-[#84AFFF] flex items-center gap-2 p-4">
        <Bell className="w-4 h-4 fill-[#84AFFF]" />
        <span className="">Notifications</span>
      </div>
      {Object.keys(channels).map((channelKey) => (
        <div key={channelKey} className="mb-2 px-4">
          <div
            className="flex justify-between items-center gap-2 mb-2 cursor-pointer"
            
          >
            <div className="flex items-center gap-2" onClick={() => toggleChannel(channelKey)}>
              {openChannel === channelKey ? <ChevronDown className="text-[#fafafa]" /> : <ChevronRight className="text-[#fafafa]" />}
              <div className="relative mr-2">
                <img
                  src={`https://www.gravatar.com/avatar/${Math.random() * 100}?d=identicon&s=80`}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <img
                  src={channels[channelKey][0]?.platform === "discord" ? discord : telegram}
                  className={`
                    absolute -bottom-2 -right-1
                    ${channels[channelKey][0]?.platform === "discord" ? "bg-[#7b5cfa]" : "bg-[#3474ff]"}
                    rounded-[4px] w-5 h-5 p-0.5 border-2 border-[#111111]
                  `}
                  alt={channels[channelKey][0]?.platform}
                />
              </div>
              <span className="text-sm text-[#fafafa] leading-none">{channelKey.replace(/^\w/, (c) => c.toUpperCase())}</span>
            </div>
            <div className="flex gap-2">
              <div className="bg-[#fafafa10] p-2 rounded-[6px]">
                <Check className="w-3 h-3 fill-[#fafafa60]" />
              </div>
              <div className="bg-[#fafafa10] p-2 rounded-[6px]">
                <PinOff className="w-3 h-3 fill-[#fafafa60]" />
              </div>
              <div className="bg-[#fafafa10] p-2 rounded-[6px] relative"  onClick={()=>{setOpenMenuId(openMenuId === channelKey ? null : channelKey);}}>
                <MoreHorizontal className="w-3 h-3 fill-[#fafafa60] z-50" 
                        
                       />
                {openMenuId === channelKey && (
                        <div className="absolute right-0 top-[30px] mt-2 bg-[#111111] border border-[#ffffff12] rounded-[10px] shadow-lg z-50 flex flex-col p-2 min-w-max">
                        <button className="flex gap-2 items-center justify-start rounded-[10px] px-4 py-2 text-left hover:bg-[#23272f] text-[#ffffff72] hover:text-white whitespace-nowrap">
                            <img src={smartIcon} className="w-6 h-6"/>
                          Add to Smart Channels
                        </button>
                        <button className="flex gap-2 items-center justify-start rounded-[10px] px-4 py-2 text-left hover:bg-[#23272f] text-[#ffffff72] hover:text-white whitespace-nowrap">
                            <Heart className="w-6 h-6" stroke="currentColor" fill="currentColor"/>
                          Save to Favorites
                        </button>
                        <button className="flex gap-2 items-center justify-start rounded-[10px] px-4 py-2 text-left hover:bg-[#23272f] text-[#ffffff72] hover:text-white whitespace-nowrap">
                        <Pin className="w-6 h-6" stroke="currentColor" fill="currentColor"/>                        
                          Pin Message
                        </button>
                        <button className="flex gap-2 items-center justify-start rounded-[10px] px-4 py-2 text-left hover:bg-[#23272f] text-[#ffffff72] hover:text-white whitespace-nowrap">
                        <Plus className="w-6 h-6" stroke="currentColor" fill="currentColor"/>                        
                          Add Tags
                        </button>
                        <button className="flex gap-2 items-center justify-start rounded-[10px] px-4 py-2 text-left hover:bg-[#23272f] text-[#f36363] hover:text-[#f36363] whitespace-nowrap">
                        <VolumeX className="w-6 h-6" stroke="currentColor" fill="currentColor"/>                        
                          Mute Channel
                        </button>
                      </div>
                      )}
              </div>
            </div>
          </div>
          {openChannel === channelKey && (
            <div className="px-0 py-2 rounded-[16px]">
              {renderChats(channels[channelKey], channelKey)}
            </div>
          )}
        </div>
      ))}
    </aside>
  );
};

export default NotificationPanel;