import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import aiAll from "@/assets/images/aiAll.png";
import {
  Search,
  Clock,
  MessageCircle,
  ExternalLink,
  ThumbsUp,
  Heart,
  CalendarCogIcon,
} from "lucide-react";
import { FaDiscord, FaTelegramPlane } from "react-icons/fa";
import smartTodo from "@/assets/images/smartTodo.png";
import CustomCheckbox from "./CustomCheckbox";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { mapToFullChat } from "@/lib/utils";

interface SearchPanelProps {
  searchQuery: string;
  selectedSource: string;
  setSelectedSource: (val: string) => void;
  selectedOptions: string[];
}

// const filteredTodos = []
const filteredTodos = [
  {
    id: 1,
    label: "To-do",
    desc: "$GOR entered Proof-of-Cope meta...",
    tag: "#PORTALCOIN | $PORTAL",
    bot: "#BOT",
    icon: smartTodo,
    platform: "telegram",
  },
  {
    id: 2,
    label: "Reminder",
    desc: "Updates: Monad mainnet live",
    tag: "ALPHA GUILD | #GENERAL",
    bot: "",
    icon: smartTodo,
    platform: "discord",
  },
];

// const mentionResults = []
const mentionResults = [
  {
    id: 1,
    label: "To-do",
    desc: "$GOR entered Proof-of-Cope meta...",
    tag: "#PORTALCOIN | $PORTAL",
    bot: "#BOT",
    icon: smartTodo,
    platform: "telegram",
  },
  {
    id: 2,
    label: "Reminder",
    desc: "Updates: Monad mainnet live",
    tag: "ALPHA GUILD | #GENERAL",
    bot: "",
    icon: smartTodo,
    platform: "discord",
  },
];

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const token = localStorage.getItem("access_token");

export const SearchPanel: React.FC<SearchPanelProps> = ({
  searchQuery,
  selectedSource,
  setSelectedSource,
  selectedOptions,
}) => {
  const { user } = useAuth();
  const username = user?.username;
  console.log(selectedOptions);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  const [checkedItems, setCheckedItems] = useState<{ [id: number]: boolean }>(
    {}
  );
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [isSourceOpen, setIsSourceOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);

  const navigate = useNavigate();
  const sources = [
    { label: "All sources", icon: null },
    {
      label: "Telegram",
      icon: <FaTelegramPlane className="text-[#3474ff] w-4 h-4" />,
    },
    {
      label: "Discord",
      icon: <FaDiscord className="text-[#7b5cfa] w-4 h-4" />,
    },
  ];

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const chatTypeMap: Record<string, string | undefined> = {
      from_user: "private",
      from_group: "group",
      from_channel: "channel",
      mentions_user_channel: "", // special case
      filter_channel_or_user: "group",
      todo_task: "",
      favourite_message_or_task: "",
    };

    const hasMentionsFilter = selectedOptions.includes("mentions_user_channel");

    let chatTypes: string[] = [];

    // Map all selected options except mentions_user_channel
    const otherFilters = selectedOptions.filter(
      (opt) => opt !== "mentions_user_channel"
    );

    if (otherFilters.length > 0) {
      chatTypes = otherFilters
        .map((opt) => chatTypeMap[opt])
        .filter((val) => val !== undefined)
        .flatMap((val) => (val ? val.split(",") : [""]))
        .map((s) => s.trim());
    }

    // If there are no non-mention filters, decide if we need a default fetch or skip
    if (chatTypes.length === 0 && !hasMentionsFilter) {
      chatTypes = [""]; // base search with empty chat_type
    }

    // --- Fetch logic ---
    // If mentions_user_channel is the ONLY filter, don't fetch — just filter existing results
    if (hasMentionsFilter && chatTypes.length === 0) {
      setSearchResults((prev) =>
        prev.filter((msg) => {
          const mentionPattern = new RegExp(`@${username}\\b`, "i");
          return mentionPattern.test(msg.raw_text || "");
        })
      );
      return; // skip fetch
    }

    // Otherwise, fetch normally
    setSearchLoading(true);

    Promise.all(
      chatTypes.map((type) =>
        fetchSearchMessages({
          keyword: searchQuery,
          chat_type: type,
          limit: 100,
        }).catch((err) => {
          console.error(`API Error for ${type}:`, err);
          return { messages: [] };
        })
      )
    )
      .then((resultsArrays) => {
        let combined = resultsArrays.flatMap((res) => res.messages || []);

        // Post-filter if mentions_user_channel is also active
        if (hasMentionsFilter && username) {
          const mentionPattern = new RegExp(`@${username}\\b`, "i");
          combined = combined.filter((msg) =>
            mentionPattern.test(msg.raw_text || "")
          );
        }

        // Deduplicate
        const uniqueMap = new Map();
        combined.forEach((msg) => {
          if (!uniqueMap.has(msg._id)) {
            uniqueMap.set(msg._id, msg);
          }
        });

        setSearchResults(Array.from(uniqueMap.values()));
      })
      .finally(() => setSearchLoading(false));
  }, [searchQuery, selectedSource, selectedOptions, username]);

  async function fetchSearchMessages({
    keyword,
    date_from,
    date_to,
    chat_type,
    limit = 20,
  }: {
    keyword: string;
    date_from?: string;
    date_to?: string;
    chat_type?: string;
    limit?: number;
  }) {
    console.log(chat_type);
    const params = new URLSearchParams();
    params.append("keyword", keyword);
    if (date_from) params.append("date_from", date_from);
    if (date_to) params.append("date_to", date_to);
    if (chat_type && selectedOptions.length >= 0)
      params.append("chat_type", chat_type);
    if (limit !== undefined) params.append("limit", limit.toString());

    const response = await fetch(`${BACKEND_URL}/search?${params.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Search request failed: ${response.status}`);
    }

    return response.json(); // => { messages: [...] }
  }

  // Mock search results
  // const searchResults = [
  //   {
  //     id: 1,
  //     chatName: "James Steven",
  //     messageContent: "For the first time in MENA, Play It is a gaming platform...",
  //     timestamp: "2 min ago",
  //     platform: "Alpha Guild",
  //     author: "James Steven",
  //     reactions: { thumbsUp: 38, heart: 21, message: 16 },
  //   },
  //   {
  //     id: 2,
  //     chatName: "jameson",
  //     messageContent: "$GOR entered Proof-of-Cope meta...",
  //     timestamp: "2 min ago",
  //     platform: "Pow's Gem Calls",
  //     author: "jameson",
  //     reactions: { thumbsUp: 38, heart: 21, message: 16 },
  //   },
  // ];
  const handleSend = (message) => {
    message.photo_url = message.chat?.id
      ? `${BACKEND_URL}/chat_photo/${message.chat.id}`
      : `https://www.gravatar.com/avatar/${
          message.sender?.id || "example"
        }?s=80`;
    navigate("/", { state: { selectedChat: mapToFullChat(message) } });
  };
  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      setHasResults(true);
    }, 1500);
  };

  function highlightMentions(text: string) {
    const mentionRegex = /(@[a-zA-Z0-9_]+)/g;
    const parts = text.split(mentionRegex);

    return parts.map((part, index) => {
      if (mentionRegex.test(part)) {
        return (
          <span key={index} className="text-blue-400 font-semibold">
            {part}
          </span>
        );
      }
      return part;
    });
  }

  const handleCheckboxChange = (task) => {
    setCheckedItems((prev) => ({
      ...prev,
      [task.id]: !prev[task.id],
    }));

    setSelectedTasks((prev) => {
      if (checkedItems[task.id]) {
        // If currently checked, remove from selectedTasks
        return prev.filter((t) => t.id !== task.id);
      } else {
        // If currently unchecked, add to selectedTasks
        return [...prev, task];
      }
    });
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const sendReaction = async (reaction, msgId) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("reaction", reaction); // match backend Form(...)

      const res = await fetch(
        `${BACKEND_URL}/api/messages/${msgId}/reactions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`, // JWT from login
          },
          body: formData,
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to send reaction");
      }

      const data = await res.json();
      setSuccess(`Reaction '${reaction}' added!`);
      console.log("Reaction added:", data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (todosArray) => {
    const newChecked = { ...checkedItems };
    todosArray.forEach((todo) => {
      newChecked[todo.id] = true;
    });
    setCheckedItems(newChecked);
    setSelectedTasks(todosArray);
  };

  const handleAddAllSelected = (todosArray) => {
    // Do something with selectedTodos, e.g.:
    console.log("Adding these todos:", selectedTasks);
    // You can add your logic here (e.g., move to another list, send to API, etc.)
  };

  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsSourceOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleReaction = async (
    msgId: string,
    type: "thumbsUp" | "heart" | "message"
  ) => {
    setSearchResults((prev) =>
      prev.map((msg) =>
        msg._id === msgId
          ? {
              ...msg,
              reactions: {
                ...msg.reactions,
                [type]: (msg.reactions?.[type] || 0) + 1,
              },
            }
          : msg
      )
    );
  };

  const handleJump = (msg)=>{
          msg.photo_url = msg.chat.id
      ? `${BACKEND_URL}/chat_photo/${msg.chat.id}`
      : `https://www.gravatar.com/avatar/${
          msg.sender?.id || "example"
        }?s=80`;
    navigate("/", { state: { selectedChat: mapToFullChat(msg), selectedMessageId:msg.id } });
    
  }

  return (
    <div className="bg-[#171717] text-white min-w-[500px] border-l h-[calc(100vh-72px)] overflow-y-scroll">
      <div className="flex justify-between items-center border-b py-2 px-2">
        <h2 className="text-lg font-bold">Search</h2>
        {/* <select className="bg-[#fafafa10] text-white p-2 px-3 rounded">
        <option>All sources</option>
        <option>Telegram</option>
        <option>Discord</option>
      </select> */}
        <div ref={dropdownRef} className="relative">
          <div className="relative">
            <div
              className="bg-[#fafafa10] text-white px-3 py-2 rounded flex items-center gap-2 cursor-pointer select-none"
              onClick={() => setIsSourceOpen(!isSourceOpen)}
            >
              {sources.find((s) => s.label === selectedSource)?.icon}
              <span>{selectedSource}</span>
              <svg
                className={`w-4 h-4 ml-auto transition-transform ${
                  isSourceOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                ></path>
              </svg>
            </div>

            {isSourceOpen && (
              <div className="absolute right-0 mt-1 bg-[#212121] rounded-xl shadow-lg w-40 z-50 border border-[#ffffff10] overflow-hidden flex-col gap-1">
                {sources.map((src) => (
                  <div
                    key={src.label}
                    className={`flex items-center gap-2  px-3 py-2 cursor-pointer hover:bg-[#2d2d2d] ${
                      selectedSource === src.label
                        ? "bg-[#3474ff60] text-white"
                        : "text-gray-300"
                    }`}
                    onClick={() => {
                      setSelectedSource(src.label);
                      setIsSourceOpen(false);
                    }}
                  >
                    {src.icon}
                    <span>{src.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between space-x-2 mb-2 p-2 border-b">
        <div>{searchResults.length} Results</div>
        <div className="flex gap-2">
          {["All", "Chats", "ToDos", "@"].map((filter, index) => {
            if (index === 1 && searchResults.length <= 0) return;
            if (index === 2 && filteredTodos.length <= 0) return;
            if (index === 3 && mentionResults.length <= 0) return;
            return (
              <button
                key={filter}
                onClick={() => handleFilterChange(filter)}
                className={`px-4 py-2 rounded-[4px] ${
                  selectedFilter === filter
                    ? "text-[#fafafa] bg-[#fafafa10]"
                    : "text-[#fafafa60] hover:text-[#fafafa] hover:bg-[#fafafa10]"
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>
      {selectedFilter === "All" || selectedFilter === "Chats" ? (
        <div className="mb-4 p-2 py-2">
          <div className="flex item-center justify-between mb-1">
            <h3 className="text-sm text-[#fafafa] mb-2">Chats</h3>
            <span className="text-[#fafafa60]">2 min ago</span>
          </div>
          <div className=" max-h-[400px] overflow-y-scroll flex-col items-start gap-3 py-3 px-4 rounded-[10px] shadow-sm mb-2">
            {/* Avatar */}
            {searchResults.map((msg) => {
              const ALL_REACTIONS = [
                { type: "thumbsUp", emoticon: "👍" },
                { type: "heart", emoticon: "❤️" },
                { type: "fire", emoticon: "🔥" },
                { type: "eyes", emoticon: "👀" },
              ];
              const reactionCounts = Array.isArray(msg.reactions)
                ? Object.fromEntries(
                    (msg.reactions || []).map((r) => {
                      const rawIcon =
                        (r?.reaction && (r.reaction.emoticon || r.reaction)) ||
                        "";
                      const normalized =
                        rawIcon === "❤" || rawIcon === "♥️" ? "❤️" : rawIcon;
                      return [normalized, r.count];
                    })
                  )
                : msg.reactions || {};

              // 1️⃣ Get only those with count > 0
              const nonZero = ALL_REACTIONS.filter(
                (r) => (reactionCounts[r.emoticon] || 0) > 0
              ).sort(
                (a, b) =>
                  (reactionCounts[b.emoticon] || 0) -
                  (reactionCounts[a.emoticon] || 0)
              );

              // 2️⃣ Fill the rest from all reactions ignoring already used ones
              const filled = [
                ...nonZero,
                ...ALL_REACTIONS.filter(
                  (r) => !nonZero.some((nz) => nz.type === r.type)
                ),
              ].slice(0, 3); // only 3 total

              // const ALL_REACTIONS = [
              //   { type: "thumbsUp", emoticon: "👍🏻" },
              //   { type: "heart", emoticon: "♥️" },
              //   { type: "fire", emoticon: "🔥" }
              // ];

              //             const reactionCounts = Array.isArray(msg.reactions)
              //             ? Object.fromEntries((msg.reactions || []).map(r => [r.reaction.emoticon, r.count]))
              //             : msg.reactions || {};
              return (
                <div
                  key={msg._id}
                  className="relative flex items-start gap-3 py-3 px-4 rounded-[10px] shadow-sm mb-2 bg-[#222327] border border-[#fafafa10]"
                  // onClick={handleSend.bind(this, msg)}
                  onMouseEnter={() => setHoveredId(msg._id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => handleJump(msg)}
                >
                  {hoveredId === msg._id && (
            <button
              onClick={(e) => {
                e.stopPropagation(); // prevent bubbling to div onClick
                handleJump(msg);
              }}
              className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs"
            >
              Jump
            </button>
          )}
                  {/* Avatar — if backend has sender avatar URL use it, else fallback */}
                  <img
                    src={
                      msg.chat?.id
                        ? `${BACKEND_URL}/chat_photo/${msg.chat.id}`
                        : `https://www.gravatar.com/avatar/${
                            msg.sender?.id || "example"
                          }?s=80`
                    }
                    onError={(e) => {
                      console.log(msg);
                      const target = e.currentTarget;
                      target.onerror = null; // Prevent infinite loop in case gravatar also fails
                      const fallbackTitle = msg.chat?.title || "AI"; // Provide a default title
                      target.src = aiAll;
                    }}
                    alt={msg.chat?.title}
                    className="w-10 h-10 rounded-full object-cover"
                  />

                  {/* Message Content */}
                  <div className="flex-1 ">
                    <div className="flex items-center justify-start gap-2">
                      <span className="text-[#ffffff] font-[300] text-sm">
                        {msg.chat?.username || msg.chat?.title || "Unknown"}
                      </span>

                      {/* Platform Badge */}
                      <div
                        className={`flex items-center gap-1 text-sm px-2 ${
                          msg.chat_type === "discord"
                            ? "bg-[#7b5cfa]"
                            : "bg-[#3474ff]"
                        } w-max rounded-[6px]`}
                      >
                        {msg.chat_type === "discord" ? (
                          <>
                            <FaDiscord className="text-[#ffffff] w-3 h-3" />
                            <span>Discord</span>
                          </>
                        ) : (
                          <>
                            <FaTelegramPlane className="text-[#ffffff] w-3 h-3" />
                            <span>Telegram</span>
                          </>
                        )}
                      </div>

                      {/* Channel / category */}
                      {msg.categories?.[0] && (
                        <span className="text-xs text-[#fafafa99]">
                          {msg.categories[0]}
                        </span>
                      )}
                    </div>

                    {/* Timestamp */}
                    <span className="text-xs text-[#fafafa99]">
                      {new Date(msg.timestamp).toLocaleString()}
                    </span>

                    {/* Message Text */}
                    <div className="mt-2 text-sm text-[#e0e0e0] max-w-[375px] break-words whitespace-pre-wrap">
                      {msg.raw_text
                        ? highlightMentions(msg.raw_text)
                        : "No message content"}
                    </div>

                    <div className="flex gap-1 mt-2">
                      {filled.map((reaction) => (
                        <span
                          key={reaction.type}
                          className="flex items-center gap-1 text-xs bg-[#fafafa10] rounded-[6px] px-2 py-1 text-[#ffffff] cursor-pointer"
                          onClick={() => {
                            console.log(msg);
                            sendReaction(reaction.emoticon, msg._id);
                          }}
                          // onClick={() => handleReaction(msg._id, reaction.type)}
                        >
                          {reaction.emoticon}
                          <span className="text-[#fafafa60]">
                            {reactionCounts[reaction.emoticon] || 0}
                          </span>
                        </span>
                      ))}
                      {/* {ALL_REACTIONS.map((reaction) => (
                        <span
                          key={reaction.type}
                          className="flex items-center gap-1 text-xs bg-[#fafafa10] rounded-[6px] px-2 py-1 text-[#ffffff] cursor-pointer"
                          onClick={() => handleReaction(msg._id, reaction.type)}
                        >
                          {reaction.emoticon}
                          <span className="text-[#fafafa60]">
                            {reactionCounts[reaction.emoticon] || 0}
                          </span>
                        </span>
                      ))} */}
                      {/* {msg.reactions.map((reaction)=>{

                      return(
                        <span
                      className="flex items-center gap-1 text-xs bg-[#fafafa10] rounded-[6px] px-2 py-1 text-[#ffffff] cursor-pointer"
                      onClick={() => handleReaction(msg._id, "thumbsUp")}
                    >
                      {reaction.reaction.emoticon}
                      <span className="text-[#fafafa60]">
                        {reaction?.count || 0}
                      </span>
                    </span>
                      )
                    })} */}

                      {/* {msg.reaction.length<0?(<><span
                      className="flex items-center gap-1 text-xs bg-[#fafafa10] rounded-[6px] px-2 py-1 text-[#ffffff] cursor-pointer"
                      onClick={() => handleReaction(msg._id, "thumbsUp")}
                    >
                      🔥{" "}
                      <span className="text-[#fafafa60]">
                        {msg?.reactions?.thumbsUp || 0}
                      </span>
                    </span>

                    <span
                      className="flex items-center gap-1 text-xs bg-[#fafafa10] rounded-[6px] px-2 py-1 text-[#ffffff] cursor-pointer"
                      onClick={() => handleReaction(msg._id, "heart")}
                    >
                      ♥️{" "}
                      <span className="text-[#fafafa60]">
                        {msg?.reactions?.heart || 0}
                      </span>
                    </span>

                    <span
                      className="flex items-center gap-1 text-xs bg-[#fafafa10] rounded-[6px] px-2 py-1 text-[#ffffff] cursor-pointer"
                      onClick={() => handleReaction(msg._id, "message")}
                    >
                      👍🏻{" "}
                      <span className="text-[#fafafa60]">
                        {msg?.reactions?.message || 0}
                      </span>
                    </span></>)} */}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* <img
        src="https://www.gravatar.com/avatar/example?s=80"
        alt="James Steven"
        className="w-10 h-10 rounded-full object-cover"
      />
      <div className="flex-1">
        <div className="flex items-center justify-start gap-2">
          <span className="text-[#ffffff] font-[300] text-sm">James Steven</span>
          <div className="flex items-center gap-0 mt-1 bg-[#3474ff] w-max rounded-[6px]">
          <FaTelegramPlane className="text-[#ffffff] w-3 h-3 ml-1" />
          <span className="text-xs text-white  rounded pr-2 pl-1 py-0.5">
            Alpha Guild
          </span>
        </div>
          <span className="text-xs text-[#fafafa99]">#general</span>
        </div>
        <span className="text-xs text-[#fafafa99]">03/02/25, 18:49</span>
        
        <div className="mt-2 text-sm text-[#e0e0e0]">
          <span className="text-[#84afff]">@everyone</span> Stealth claim just
          opened. Zero tax, no presale. Contract verified 2 mins ago.
        </div>
        <div className="flex gap-3 mt-2">
          <span className="flex items-center gap-1 text-xs bg-[#ffffff06] rounded-full px-2 py-1 text-[#ffffff]">
            <ThumbsUp className="w-4 h-4" />
            38
          </span>
          <span className="flex items-center gap-1 text-xs bg-[#ffffff06] rounded-full px-2 py-1 text-[#ffffff]">
            <Heart className="w-4 h-4" />
            21
          </span>
          <span className="flex items-center gap-1 text-xs bg-[#ffffff06] rounded-full px-2 py-1 text-[#ffffff]">
            <MessageCircle className="w-4 h-4" />
            16
          </span>
        </div>
      </div> */}
          </div>
        </div>
      ) : null}
      {(selectedFilter === "All" || selectedFilter === "ToDos") &&
      filteredTodos.length > 0 ? (
        <div className="p-2">
          <div className="flex item-center justify-between mb-1">
            <h3 className="text-sm text-[#fafafa] mb-2">To-dos / Requests</h3>
            <span className="text-[#fafafa60]">2 min ago</span>
          </div>
          {filteredTodos.map((todo) => (
            <div
              className="flex  items-start gap-0 mb-2 bg-[#222327] p-2 rounded-[6px] border border-[#ffffff09]"
              key={todo.id}
            >
              <div className="flex-shrink-0 w-8 flex items-center justify-center">
                <CustomCheckbox
                  checked={!!checkedItems[todo.id]}
                  onChange={() => handleCheckboxChange(todo)}
                  className="mt-2"
                />
              </div>
              <div className=" grow bg-[#222327] rounded-[8px] px-2">
                <div className="flex items-center gap-2">
                  <span className="bg-[#fafafa10] border-[#ffffff03] border-2 shadow-xl text-blue-300 text-xs px-1 py-0.5 rounded-[6px] font-medium flex items-center gap-1">
                    <img src={todo.icon} className="h-4 w-4" />
                    {todo.label}
                    {/* {todo.label=="Reminder" && <span className="bg-[#23242a] text-xs text-gray-400 px-2 py-0.5 rounded flex items-center gap-1"></span>} */}
                  </span>
                  {/* <button className="ml-auto p-1 bg-[#2d2d2d] border-2 border-[#ffffff03] rounded-[6px] hover:text-white text-[#ffffff72] ">
      <FaPlus />
    </button>
    <button className="p-1 bg-[#2d2d2d] border-2 border-[#ffffff03] rounded-[6px] hover:text-white text-[#ffffff72]">
      <FaEllipsisH />
    </button> */}
                </div>
                <div className="text-sm text-[#fafafa] break-words w-full">
                  {todo.desc}
                </div>
                <span
                  className={`text-xs ${
                    todo.platform == "telegram"
                      ? "text-[#3474ff]"
                      : "text-[#7b5cfa]"
                  } flex gap-1 items-center mt-1`}
                >
                  {todo.platform == "telegram" ? (
                    <FaTelegramPlane />
                  ) : (
                    <FaDiscord />
                  )}
                  {todo.tag.split("|")[0]}
                  {todo.bot && (
                    <span className="text-xs text-[#ffffff48]">{todo.bot}</span>
                  )}
                  <span className="text-[#FAFAFA60]">03/02/25, 18:49</span>
                </span>
              </div>
              <div className="flex flex-col gap-0">
                <span className="bg-[#F03D3D12] grow rounded-[6px] px-2 py-1 text-[#F68989]">
                  High
                </span>
                <span className="bg-[#fafafa10] rounded-[6px] text-center grow flex items-center justify-center gap-1 text-[12px]">
                  <CalendarCogIcon className="w-3 h-3" /> 3d
                </span>
              </div>
            </div>
          ))}
          <div className="flex w-full px-2 ">
            <button
              onClick={() => {
                handleSelectAll(filteredTodos);
              }}
              className="w-[50%] text-xs text-gray-400 hover:text-white py-3"
            >
              Select All
            </button>
            <button
              onClick={() => handleAddAllSelected(filteredTodos)}
              className="py-3 w-[50%] bg-[#3474ff12] text-[#84afff] hover:text-[#ffffff] hover:bg-[#3474ff72] text-xs px-4 py-2 rounded-[8px]"
            >
              Add all Selected
            </button>
          </div>
        </div>
      ) : null}

      {(selectedFilter === "All" || selectedFilter === "@") &&
      mentionResults.length > 0 ? (
        <div className="mt-8 px-2 ">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs text-[#fafafa] leading-none">
              @Mentions
            </span>
            <span className="text-xs font-[300] text-[#fafafa60] leading-none">
              2 MIN AGO
            </span>
          </div>
          <div className="bg-[#171717] py-2 rounded-[16px]">
            {mentionResults.map((msg) => (
              <div
                key={msg._id}
                className=" flex items-start gap-3 py-3 px-4 rounded-[10px] shadow-sm mb-2 bg-[#222327] border border-[#fafafa10]"
              >
                {/* Avatar — if backend has sender avatar URL use it, else fallback */}
                <img
                  src={`https://www.gravatar.com/avatar/${
                    msg.sender?.id || "example"
                  }?s=80`}
                  alt={msg.sender?.name || "User"}
                  className="w-10 h-10 rounded-full object-cover"
                />

                {/* Message Content */}
                <div className="flex-1 ">
                  <div className="flex items-center justify-start gap-2">
                    <span className="text-[#ffffff] font-[300] text-sm">
                      {msg.chat?.username || msg.chat?.title || "Unknown"}
                    </span>

                    {/* Platform Badge */}
                    <div
                      className={`flex items-center gap-1 text-sm px-2 ${
                        msg.chat_type === "discord"
                          ? "bg-[#7b5cfa]"
                          : "bg-[#3474ff]"
                      } w-max rounded-[6px]`}
                    >
                      {msg.chat_type === "discord" ? (
                        <>
                          <FaDiscord className="text-[#ffffff] w-3 h-3" />
                          <span>Discord</span>
                        </>
                      ) : (
                        <>
                          <FaTelegramPlane className="text-[#ffffff] w-3 h-3" />
                          <span>Telegram</span>
                        </>
                      )}
                    </div>

                    {/* Channel / category */}
                    {msg.categories?.[0] && (
                      <span className="text-xs text-[#fafafa99]">
                        {msg.categories[0]}
                      </span>
                    )}
                  </div>

                  {/* Timestamp */}
                  <span className="text-xs text-[#fafafa99]">
                    {msg.timestamp
                      ? new Date(msg.timestamp).toLocaleString()
                      : "No timestamp"}
                  </span>

                  {/* Message Text */}
                  <div className="mt-2 text-sm text-[#e0e0e0] max-w-[375px] break-words whitespace-pre-wrap">
                    {msg.raw_text ||
                      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam quis nostrud exercitation."}
                  </div>

                  <div className="flex gap-1 mt-2">
                    <span
                      className="flex items-center gap-1 text-xs bg-[#fafafa10] rounded-[6px] px-2 py-1 text-[#ffffff] cursor-pointer"
                      onClick={() => handleReaction(msg._id, "thumbsUp")}
                    >
                      🔥{" "}
                      <span className="text-[#fafafa60]">
                        {msg?.reactions?.thumbsUp || 0}
                      </span>
                    </span>

                    <span
                      className="flex items-center gap-1 text-xs bg-[#fafafa10] rounded-[6px] px-2 py-1 text-[#ffffff] cursor-pointer"
                      onClick={() => handleReaction(msg._id, "heart")}
                    >
                      ♥️{" "}
                      <span className="text-[#fafafa60]">
                        {msg?.reactions?.heart || 0}
                      </span>
                    </span>

                    <span
                      className="flex items-center gap-1 text-xs bg-[#fafafa10] rounded-[6px] px-2 py-1 text-[#ffffff] cursor-pointer"
                      onClick={() => handleReaction(msg._id, "message")}
                    >
                      👍🏻{" "}
                      <span className="text-[#fafafa60]">
                        {msg?.reactions?.message || 0}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {/* <div className="flex items-center justify-between mt-2">
          <button   
            onClick={handleSelectAll}
            className="w-[50%] text-xs text-gray-400 hover:text-white">Select All</button>
          <button className="w-[50%] bg-[#3474ff12] text-[#84afff] hover:text-[#ffffff] hover:bg-[#3474ff72] text-xs px-4 py-2 rounded-[8px]">Add Selected</button>
        </div> */}
          </div>
        </div>
      ) : null}
    </div>
  );
};
