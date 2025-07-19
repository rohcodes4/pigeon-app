import React, { useRef } from "react";
import discord from "@/assets/images/discordColor.png";
import telegram from "@/assets/images/telegramColor.png";
import discordWhite from "@/assets/images/discord.png";
import telegramWhite from "@/assets/images/telegram.png";
import {
  ThumbsUp,
  MessageCircle,
  Link2,
  Send,
  X,
  SendHorizonal,
  SmilePlus,
  SmilePlusIcon,
  Heart,
  Pin,
  Plus,
  VolumeX,
} from "lucide-react";
import moreIcon from "@/assets/images/moreIcon.png";
import pinIcon from "@/assets/images/pinIcon.png";
import replyIcon from "@/assets/images/replyIcon.png";
import taskIcon from "@/assets/images/taskIcon.png";
import smartIcon from "@/assets/images/sidebar/Chat.png";
import { FaDiscord, FaTelegramPlane } from "react-icons/fa";

// Dummy data generation
const platforms = ["Discord", "Telegram"] as const;
const tags = ["alpha", "presale", "airdrop"];
const channels = ["#general", "#alpha", "#announcements", null];
const names = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank"];
const messages = [
  "Check out this new project! https://example.com",
  "Alpha is live now!",
  "Presale starts tomorrow.",
  "Airdrop confirmed for next week.",
  "Join the discussion in #alpha.",
  "Here's the link: https://airdrop.com",
  "Excited for the launch!",
  "Anyone got whitelist?",
  "Big news coming soon.",
  "Don't miss the presale event!",
];

const servers =[ "POW'S GEM CALLS","CRYPTOCAT","BOTMASTER"]

function randomFrom<T>(arr: readonly T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysBack: number) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return date;
}

function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function gravatarUrl(seed: string) {
  return `https://www.gravatar.com/avatar/${btoa(seed)}?d=identicon&s=80`;
}


// Generate 30 dummy messages, oldest first
const dummyMessages = Array.from({ length: 30 }, (_, i) => {
  const date = randomDate(5);
  const platform = randomFrom(platforms);
  const channel = randomFrom(channels);
  const server = randomFrom(servers);
  const name = randomFrom(names);
  const message = randomFrom(messages);
  const messageTags = tags.filter(() => Math.random() < 0.3);
  const reactions = [
    {
      icon: <ThumbsUp className="w-4 h-4" />,
      count: Math.floor(Math.random() * 10),
    },
    {
      icon: <MessageCircle className="w-4 h-4" />,
      count: Math.floor(Math.random() * 5),
    },
  ].filter(() => Math.random() < 0.7);
  const hasLink = message.includes("http");
  return {
    id: i + 1,
    name,
    avatar: gravatarUrl(name + platform),
    platform,
    channel,
    server,
    date,
    message,
    tags: messageTags,
    reactions,
    hasLink,
    link: hasLink ? message.match(/https?:\/\/\S+/)?.[0] : null,
  };
}).sort((a, b) => a.date.getTime() - b.date.getTime()); // oldest first

const platformIcon = (platform: string) =>
  platform === "Discord" ? discord : telegram;

const UnifiedChatPanel: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [replyTo, setReplyTo] = React.useState<
    null | (typeof dummyMessages)[0]
  >(null);
  const [messages, setMessages] = React.useState(dummyMessages);
  const [openMenuId, setOpenMenuId] = React.useState<number | null>(null);

  const groupedByDate: { [date: string]: typeof messages } =
    React.useMemo(() => {
      const groups: { [date: string]: typeof messages } = {};
      messages.forEach((msg) => {
        const dateKey = formatDate(msg.date);
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(msg);
      });
      return groups;
    }, [messages]);

  const handleSend = () => {
    if (inputRef.current && inputRef.current.value.trim()) {
      const now = new Date();
      const newMsg = {
        id: messages.length + 1,
        name: "You", // or your user logic
        avatar: gravatarUrl("You" + (replyTo ? replyTo.platform : "Discord")), // match platform for avatar
        platform: replyTo ? replyTo.platform : "Discord", // use replyTo's platform if replying
        channel: replyTo ? replyTo.channel : "#general", // use replyTo's channel if replying
        server:replyTo? replyTo.channel:'Server',
        date: now,
        message: inputRef.current.value,
        tags: [],
        reactions: [],
        hasLink: inputRef.current.value.includes("http"),
        link: inputRef.current.value.match(/https?:\/\/\S+/)?.[0] || null,
        // Add replyTo reference if replying
        replyTo: replyTo
          ? {
              id: replyTo.id,
              name: replyTo.name,
              message: replyTo.message,
            }
          : null,
      };
      setMessages([...messages, newMsg]);
      inputRef.current.value = "";
      setReplyTo(null); // Clear reply after sending
    }
  };

  React.useEffect(() => {
    const handleClick = () => setOpenMenuId(null);
    if (openMenuId !== null) {
      window.addEventListener("click", handleClick);
      return () => window.removeEventListener("click", handleClick);
    }
  }, [openMenuId]);

  Object.entries(groupedByDate).map(([date, msgs]) => {
    msgs.map((msg)=>{
      console.log(msg.id)
      console.log(msg.server)
    })
  })
  return (
    <div className="relative h-[calc(100vh-136px)] flex flex-col">
      {/* Message List  */}
      <div className=" overflow-y-auto px-6 flex flex-col gap-4">
        {Object.entries(groupedByDate).map(([date, msgs]) => (
          <React.Fragment key={date}>
            <div className="flex items-center gap-2 my-4">
              <hr className="flex-1 border-[#23272f]" />
              <span className="text-xs text-[#ffffff32] px-2">{date}</span>
              <hr className="flex-1 border-[#23272f]" />
            </div>
            {msgs.map((msg) => (
              <div
                key={msg.id}
                className="flex items-start gap-3 py-3 px-4 rounded-[10px] shadow-sm mb-2 group hover:bg-[#212121]"
                onMouseLeave={() => setOpenMenuId(null)}
              >
                {/* Avatar */}
                <img
                  src={msg.avatar}
                  alt={msg.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                {/* Message Content */}
                <div className="flex-1 relative">
                  <div className="absolute right-0 top-0 flex gap-2 items-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button
                      className="p-1 rounded"
                      title="Reply"
                      onClick={(e) => {
                        e.stopPropagation();
                        setReplyTo(msg);
                      }}
                    >
                      <img src={replyIcon} className="w-6 h-6 text-[#84afff]" />
                    </button>
                    <button
                      className="p-1 rounded"
                      title="Copy"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(msg.message);
                      }}
                    >
                      <img src={pinIcon} className="w-6 h-6 text-[#84afff]" />
                    </button>
                    <button
                      className="p-1 rounded"
                      title="Share"
                      onClick={(e) => {
                        e.stopPropagation(); /* implement share logic */
                      }}
                    >
                      <img src={taskIcon} className="w-6 h-6 text-[#84afff]" />
                    </button>
                    <button
                      className="h-6 w-6 rounded-[6px] bg-[#2d2d2d] border border-[#ffffff03]"
                      title="Share"
                      onClick={(e) => {
                        e.stopPropagation(); /* implement share logic */
                      }}
                    >
                      <img
                        src={
                          msg.platform === "Discord"
                            ? discordWhite
                            : telegramWhite
                        }
                        className="w-4 h-4 text-[#84afff] mx-auto"
                      />
                    </button>
                    <button
                      className="p-1 rounded relative"
                      title="More"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === msg.id ? null : msg.id);
                      }}
                    >
                      <img src={moreIcon} className="w-6 h-6 text-[#84afff]" />
                      {/* Popup menu */}
                      {openMenuId === msg.id && (
                        <div className="absolute right-0 bottom-[110%] mt-2 bg-[#111111] border border-[#ffffff12] rounded-[10px] shadow-lg z-50 flex flex-col p-2 min-w-max">
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
                    </button>
                    {/* Add more buttons as needed */}
                  </div>
                  <div className="flex items-center justify-start gap-2">
                    <span className="text-[#ffffff72] font-[300]">
                      {msg.name}
                    </span>
                    <div className={`flex justify-center pl-2 items-center rounded-[4px] ${msg.platform==="Telegram"?'bg-[#3474ff]':'bg-[#7b5cfa]'}`}>
                    {msg.platform==="Telegram"?<FaTelegramPlane className="text-[#ffffff] w-3 h-3"/>:<FaDiscord className="text-[#ffffff] w-3 h-3"/>}

                    {msg.server && (
                      <span
                        className={`text-xs text-white${
                          msg.platform === "Discord"
                            ? ""
                            : ""
                        } rounded px-2 py-0.5`}
                      >
                        {msg.server}
                      </span>
                    )}
                    </div>
                    <span className="text-xs text-[#fafafa99]">{msg.channel}</span>
                    <span className="text-xs text-[#ffffff32]">
                      {formatTime(msg.date)}
                    </span>
                  </div>
                  {/* Reply context UI */}
                  {msg.replyTo && (
                    <div className="text-xs text-[#84afff] bg-[#23272f] rounded px-2 py-1 mb-1">
                      Replying to{" "}
                      <span className="font-semibold">{msg.replyTo.name}:</span>{" "}
                      <span className="text-[#ffffffb0]">
                        {msg.replyTo.message.slice(0, 40)}
                        {msg.replyTo.message.length > 40 ? "..." : ""}
                      </span>
                    </div>
                  )}
                  <div className="mt-1 text-sm text-[#e0e0e0]">
                    {msg.message}
                    {/* Link preview */}
                    {msg.hasLink && msg.link && (
                      <a
                        href={msg.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block mt-2 p-2 bg-[#23272f] rounded text-[#84afff] text-xs hover:underline"
                      >
                        <Link2 className="inline w-3 h-3 mr-1" />
                        {msg.link}
                      </a>
                    )}
                  </div>

                  {/* Reactions */}
                  {
                    <div className="flex gap-3 mt-2">
                      {msg.reactions.map((r, i) => (
                        <span
                          key={i}
                          className="flex items-center gap-1 text-xs bg-[#ffffff06] rounded-full px-2 py-1 text-[#ffffff]"
                        >
                          {r.icon}
                          {r.count}
                        </span>
                      ))}
                      <span className="flex items-center gap-1 text-xs bg-[#ffffff06] rounded-full px-2 py-1 text-[#ffffff]">
                        <SmilePlusIcon className="h-4 w-4" />
                      </span>
                    </div>
                  }

                  {/* Tags */}
                  {msg.tags.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {msg.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-[#3474ff12] text-[#84afff] rounded-full px-2 py-0.5"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
      <div className=" bottom-12 left-0 w-full px-6 py-4 bg-gradient-to-t from-[#181A20] via-[#181A20ee] to-transparent">
        {/* Replying to box */}
        {replyTo && (
          <div className="flex items-center mb-2 px-4 py-2 rounded-[10px] bg-[#111111] text-xs text-[#84afff]">
            <div className="grow flex flex-col">
              <div className="uppercase flex items-center">
                <span className="font-[200] text-[#ffffff32] mr-2">
                  Replying to
                </span>
                <span className="text-[#ffffff72] font-[400]">
                  {replyTo.name}
                </span>
                <img
                  src={platformIcon(replyTo.platform)}
                  alt={replyTo.platform}
                  className="w-4 h-4 rounded-full ml-2"
                />
                {replyTo.channel && (
                  <span
                    className={`text-xs ${
                      replyTo.platform === "Discord"
                        ? "text-[#7b5cfa]"
                        : "text-[#3474ff]"
                    } rounded px-2 py-0.5`}
                  >
                    {replyTo.channel}
                  </span>
                )}
              </div>
              <span className="truncate flex-1 text-[#ffffff32] mt-1">
                {replyTo.message.slice(0, 130)}
                {replyTo.message.length > 130 ? "..." : ""}
              </span>
            </div>
            <button
              className="ml-2 p-1 rounded-full hover:bg-[#2d2d2d] transition"
              onClick={() => setReplyTo(null)}
              aria-label="Cancel reply"
            >
              <X className="w-4 h-4 text-[#ffffff48]" />
            </button>
          </div>
        )}
        <div className="flex">
          <div className="flex grow items-center bg-[#212121] rounded-[10px] px-4 py-2 shadow-lg">
            <Plus className="text-black bg-[#fafafa60] rounded-full mr-2 w-[18px] h-[18px]"/>
            <input
              ref={inputRef}
              type="text"
              placeholder={
                replyTo && replyTo.name
                  ? `Replying to ${replyTo.name}...`
                  : "Type your message..."
              }
              className="flex-1 bg-transparent outline-none text-white placeholder-[#ffffff48] text-sm"
            />
          </div>
          <button
            onClick={handleSend}
            className="ml-3 p-2 rounded-[10px] bg-[#5389ff] hover:bg-[#5389ff] transition"
          >
            <SendHorizonal className="w-5 h-5 text-black fill-black" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnifiedChatPanel;
