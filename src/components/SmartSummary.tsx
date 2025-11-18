import React, { useState, useRef, useEffect } from "react";
import {
  FaCog,
  FaChevronDown,
  FaStar,
  FaCheckCircle,
  FaClock,
  FaPlus,
  FaEllipsisH,
  FaChevronRight,
  FaChevronLeft,
  FaDiscord,
  FaTelegram,
  FaTelegramPlane,
} from "react-icons/fa";
import alphaImage from "@/assets/images/alphaFeatured.png";
import todoIcon from "@/assets/images/todoIcon.png";
import aiBlue from "@/assets/images/aiBlue.png";
import smartTodo from "@/assets/images/smartTodo.png";
import CustomCheckbox from "./CustomCheckbox";
import LinkPreview from "./LinkPreview";
import {
  CalendarCog,
  CalendarCogIcon,
  ThumbsUp,
  Heart,
  MessageCircle,
  X,
} from "lucide-react";
import ChatAvatar from "./ChatAvatar";
import { useSummarizeMessage } from "@/hooks/discord/useSummarizeMessage";
import {
  useChatMessagesForSummary,
} from "@/hooks/useDiscord";
import { mapDiscordMessageToItem } from "@/lib/utils";

const TIME_OPTIONS = [
  { label: "5 min", value: "5m" },
  { label: "30 min", value: "30m" },
  { label: "1 hr", value: "1h" },
  { label: "6 hr", value: "6h" },
  { label: "24 hr", value: "24h" },
];

const timeOptionMap = {
  "5m": 5,
  "30m": 30,
  "1h": 60,
  "6h": 360,
  "24h": 1440,
};

const todos = [
  {
    id: 1,
    label: "To-do",
    desc: "$GOR entered Proof-of-Cope meta...",
    tag: "#PORTALCOIN ",
    bot: "#BOT",
    icon: smartTodo,
    platform: "telegram",
  },
  {
    id: 2,
    label: "Reminder",
    desc: "Updates: Monad mainnet live",
    tag: "ALPHA GUILD ",
    bot: "",
    icon: smartTodo,
    platform: "discord",
  },
  // ...more items
];

const smartActivities = [
  {
    platform: "telegram",
    url: "https://t.me/examplechannel",
    content:
      "$GOR entered Proof-of-Cope meta. 0 devs. 100% community raid. ATH in 40 mins.",
    name: "WOLVERINE",
    channel: "POW'S GEM CALLS",
    img: `https://api.dicebear.com/7.x/bottts/svg?seed=alpha1`,
  },
  {
    platform: "discord",
    url: "https://discord.com/channels/example",
    content:
      "Big news: Project X just launched! 🚀 Join the discussion in #general.",
    name: "CRYPTOCAT",
    channel: "ALPHA SIGNALS",
    img: `https://api.dicebear.com/7.x/bottts/svg?seed=alpha2`,
  },
  {
    platform: "telegram",
    url: "https://slack.com/examplechannel",
    content: "Reminder: AMA with the devs at 5pm UTC today in #announcements.",
    name: "BOTMASTER",
    channel: "DEV UPDATES",
    img: `https://api.dicebear.com/7.x/bottts/svg?seed=alpha3`,
  },
];

// Add the API function
async function fetchChatSummary({
  chat_id,
  hours,
  limit = 20,
  selectedChat,
  summarizeMessages,
  messagesList,
  autoFetch = false,
}: {
  chat_id: number;
  hours?: number;
  limit?: number;
  selectedChat: any;
  summarizeMessages?: any;
  messagesList?: any;
  autoFetch?: boolean;
}) {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem("access_token");
  const params = new URLSearchParams();
  // if (hours) params.append("hours", hours.toString());
  console.log("hourss: hours");
  console.log("hourss: ", hours);
  if (hours !== undefined) {
    if (hours === 5 || hours === 30) {
      params.append("minutes", hours.toString());
    } else {
      params.append("minutes", (hours * 60).toString());
    }
  }
  if (limit !== undefined) params.append("limit", limit.toString());

  if (selectedChat?.platform == "discord" || autoFetch) {
    let summary = summarizeMessages(messagesList, true, "discord");
    return summary;
  }

  const response = await fetch(
    `${BACKEND_URL}/chats/${chat_id}/summary?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Summary request failed: ${response.status}`);
  }

  return response.json();
}

async function fetchAllSummary({
  hours,
  platform,
}: {
  hours?: number;
  platform?: string;
}) {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem("access_token");
  const params = new URLSearchParams();
  // if (hours) params.append("minutes", (hours * 60).toString());
  if (hours !== undefined) {
    if (hours === 5 || hours === 30) {
      params.append("minutes", hours.toString());
    } else {
      params.append("minutes", (hours * 60).toString());
    }
  }
  if (platform) params.append("platform", platform);

  const response = await fetch(
    `${BACKEND_URL}/api/smart-summary?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Summary request failed: ${response.status}`);
  }

  return response.json();
}

// Add tasks API functions
async function fetchTasks({ chat_id }) {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem("access_token");

  try {
    // First, extract tasks from the chat (this creates/updates tasks)
    const extractResponse = await fetch(
      `${BACKEND_URL}/chats/${chat_id}/extract_tasks`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (extractResponse.ok) {
      const extractResult = await extractResponse.json();
      console.log(
        `Extracted ${extractResult.extracted} tasks from chat ${chat_id}`
      );
    }

    // Then fetch the actual tasks for this chat
    const tasksResponse = await fetch(
      `${BACKEND_URL}/tasks?chat_id=${chat_id}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!tasksResponse.ok) {
      throw new Error(`Tasks fetch failed: ${tasksResponse.status}`);
    }

    return await tasksResponse.json();
  } catch (error) {
    console.error("Error in fetchTasks:", error);

    // Fallback: fetch all tasks
    try {
      const responseAll = await fetch(`${BACKEND_URL}/tasks`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!responseAll.ok) {
        throw new Error(`Fallback tasks fetch failed: ${responseAll.status}`);
      }

      return await responseAll.json();
    } catch (fallbackError) {
      console.error("Fallback tasks fetch also failed:", fallbackError);
      return []; // Return empty array as final fallback
    }
  }
}

async function fetchMentions(chat_id) {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem("access_token");
  console.log("chat_id");
  console.log(chat_id);
  try {
    // First, try the primary tasks endpoint for this chat
    const response = await fetch(
      `${BACKEND_URL}/ui/mentions?chat_id=${chat_id}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      // Fail: fall back to "all tasks"
      throw new Error(`Tasks request failed: ${response.status}`);
    }

    // Success: do NOT call responseAll, just return
    return await response.json();
  } catch (error) {
    // On error, run the fallback responseAll request
    // const responseAll = await fetch(`${BACKEND_URL}/tasks`, {
    //   method: "GET",
    //   headers: {
    //     Authorization: `Bearer ${token}`,
    //     "Content-Type": "application/json",
    //   },
    // });
    // return await responseAll.json();
  }
}

async function toggleTask(taskId: string) {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem("access_token");

  const response = await fetch(`${BACKEND_URL}/tasks/${taskId}/toggle`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Toggle task failed: ${response.status}`);
  }

  return response.json();
}

interface SmartSummaryProps {
  selectedChat?: any;
  chatId?: any;
  autoFetch?: boolean;
  closePanel: () => void;
}

const SmartSummary = ({
  selectedChat,
  chatId,
  autoFetch = false,
  closePanel,
}: SmartSummaryProps) => {
  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [selectedTime, setSelectedTime] = useState(TIME_OPTIONS[4]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const tabScrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [checkedItems, setCheckedItems] = useState<{ [id: number]: boolean }>(
    {}
  );
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [selectedTaskIds, setSelectedTaskIds] = useState(new Set());
  const [tasks, setTasks] = useState([]);
  const [mentions, setMentions] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [mentionsLoading, setMentionsLoading] = useState(false);
  const { summarizeMessages } = useSummarizeMessage();
  const { messages: discordMessagesforSummary, refresh } =
    useChatMessagesForSummary(selectedChat?.id, selectedTime.value);

  const handleTaskSelection = (taskId) => {
    setSelectedTaskIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    console.log(discordMessagesforSummary, "timebased smmary messages");
  }, [selectedChat?.id, selectedTime, discordMessagesforSummary]);

  const handleMarkSelectedComplete = async () => {
    if (selectedTaskIds.size === 0) return;

    try {
      // Get only the tasks that are not already completed
      const tasksToComplete = [...selectedTaskIds].filter((taskId) => {
        const task = tasks.find((t) => t.id === taskId);
        return task && task.status !== "done";
      });

      if (tasksToComplete.length === 0) {
        setSelectedTaskIds(new Set());
        return;
      }

      // Toggle all selected incomplete tasks
      await Promise.all(tasksToComplete.map((taskId) => toggleTask(taskId)));

      // Update local state
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          tasksToComplete.includes(task.id) ? { ...task, status: "done" } : task
        )
      );

      // Clear selection
      setSelectedTaskIds(new Set());
    } catch (error) {
      console.error("Failed to mark selected tasks complete:", error);
    }
  };

  const handleSelectAllTasks = () => {
    if (selectedTaskIds.size === tasks.length) {
      // Deselect all
      setSelectedTaskIds(new Set());
    } else {
      // Select all
      setSelectedTaskIds(new Set(tasks.map((task) => task.id)));
    }
  };

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
  };

  const handleCheckboxChange = (id: number) => {
    setCheckedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleGenerateSummary = async (timeOption = selectedTime) => {
    setSummaryLoading(true);
    try {
      let discordSummary;
      if (selectedChat?.platform === "discord") {
        const summary = await runSummary();
        setSummaryData(summary);
        setTasks(summary?.tasks);
        return;
      } else if (autoFetch) {
        discordSummary = await runSummary();
      }
      let summary;

      if (autoFetch) {
        summary = await fetchAllSummary({
          hours: parseInt(timeOption?.value?.replace(/\D/g, "")) || 24,
          platform: "telegram",
        });
        const mergedTasks = [
          ...(discordSummary?.tasks || []),
          ...(summary?.tasks?.recent_tasks || []),
        ];

        // Merge summaries from both sources
        const mergedSummaryData = [
           ...(discordSummary ? [discordSummary] : []),
          ...(summary?.chat_summaries || []),
        ];
        setTasks(mergedTasks || []);
        setSummaryData(mergedSummaryData || []);
      } else {
        summary = await fetchChatSummary({
          chat_id: selectedChat.id,
          hours: parseInt(timeOption?.value?.replace(/\D/g, "")) || 24, // Extract number from selectedTime
          limit: 20,
          selectedChat: selectedChat,
        });
        setSummaryData(summary);
      }
    } catch (error) {
      console.error("Failed to generate summary:", error);
      setSummaryData({ error: "Failed to generate summary" });
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleSelectAll = () => {
    const allSelected = tasks.every((task) => task.status === "done");

    // For now, just toggle the UI - you can implement bulk toggle later
    if (allSelected) {
      setCheckedItems({});
    } else {
      const allChecked: { [id: string]: boolean } = {};
      tasks.forEach((task) => {
        allChecked[task.id] = true;
      });
      setCheckedItems(allChecked);
    }
  };

  const handleTaskToggle = async (taskId) => {
    try {
      await toggleTask(taskId);

      // Update the local task state immediately
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId
            ? { ...task, status: task.status === "done" ? "open" : "done" }
            : task
        )
      );

      // Remove from selected tasks if it was selected
      setSelectedTaskIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    } catch (error) {
      console.error("Failed to toggle task:", error);
    }
  };

  const handleFetchTasks = async () => {
    setTasksLoading(true);
    try {
      if (selectedChat?.id) {
        const fetchedTasks = await fetchTasks({ chat_id: selectedChat?.id });
        console.log("fetchTasks result:", fetchedTasks);

        // Ensure we have an array
        if (Array.isArray(fetchedTasks)) {
          setTasks(fetchedTasks);
        } else {
          console.warn("fetchTasks did not return an array:", fetchedTasks);
          setTasks([]); // Set empty array if not an array
        }
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      setTasks([]); // Set empty array on error
    } finally {
      setTasksLoading(false);
    }
  };

  const handleFetchMentions = async () => {
    setMentionsLoading(true);
    try {
      const fetchedMentions = await fetchMentions(selectedChat.id);
      console.log("fetchMentions result:", fetchedMentions);

      // Ensure we have an array
      if (Array.isArray(fetchedMentions)) {
        setMentions(fetchedMentions?.all_messages);
      } else {
        console.warn("fetchTasks did not return an array:", fetchedMentions);
        setMentions([]); // Set empty array if not an array
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      setMentions([]); // Set empty array on error
    } finally {
      setMentionsLoading(false);
    }
  };

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem("access_token");

  const getAutoTaskStatus = async (chatId) => {
    console.log("selectedChat");
    console.log(chatId);
    const response = await fetch(`${BACKEND_URL}/chats/${chatId}/auto_tasks`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("autotask");
    console.log(response);
  };

  useEffect(() => {
    handleGenerateSummary();
    const checkScroll = () => {
      const el = tabScrollRef.current;
      if (!el) return;
      setShowLeftArrow(el.scrollLeft > 0);
      setShowRightArrow(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    };
    checkScroll();
    const el = tabScrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
    }
    return () => {
      if (el) el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  const runSummary = async () => {
    try {
      setSummaryLoading(true);
      console.log("[run summary] selectedTime:", selectedTime.value);

      const selectedValue = selectedTime.value; // e.g., "5m", "1h", "24h"
      console.log(`[run summary] parsed selectedValue: ${selectedValue}`);

      const minutes = timeOptionMap[selectedValue] ?? 1440; // Default 24 hours
      console.log(`[run summary] calculated minutes: ${minutes}`);

      const now = new Date();
      const cutoff = new Date(now.getTime() - minutes * 60 * 1000);
      console.log(`[run summary] current time: ${now.toISOString()}`);
      console.log(`[run summary] cutoff time: ${cutoff.toISOString()}`);
      console.log(discordMessagesforSummary, "discord messagelist for summary");

      const messages = [...discordMessagesforSummary].map(
        mapDiscordMessageToItem
      );
      console.log(`[run summary] merged messages length: ${messages.length}`);

      const uniqueMessages = messages.filter(
        (msg, index, self) => index === self.findIndex((m) => m.id === msg.id)
      );
      console.log(
        `[run summary] unique messages count: ${uniqueMessages.length}`
      );

      uniqueMessages.forEach((msg) => {
        console.log(
          `[run summary] message id: ${msg.id}, timestamp: ${msg.timestamp}`
        );
      });

      const recentMessages = uniqueMessages.filter((msg) => {
        const cleanTimestamp = msg.timestamp.replace(/\.\d+/, ""); // Clean microseconds
        const msgDate = new Date(cleanTimestamp);
        console.log(
          `[run summary] comparing msgDate: ${msgDate.toISOString()} to cutoff: ${cutoff.toISOString()}`
        );
        return msgDate >= cutoff;
      });

      console.log(
        `[run summary] recent messages count (within time window): ${recentMessages.length}`
      );
      console.log(`[run summary] recent messages:`, recentMessages);

      if (recentMessages.length <= 1) {
        console.warn("[run summary] Not enough recent messages to summarize.");
        setSummaryData(null);
        setSummaryLoading(false);
        return;
      }

      let summary = await fetchChatSummary({
        chat_id: selectedChat?.id,
        hours: minutes / 60, // converting minutes to hours here
        limit: 20,
        selectedChat,
        summarizeMessages,
        messagesList: recentMessages, // use filtered recentMessages here,
        autoFetch: true,
      });
      console.log("[run summary] received summary:", summary);

      return summary;
    } catch (err) {
      console.error("[run summary] Failed to fetch summary:", err);
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    if (
      !discordMessagesforSummary ||
      discordMessagesforSummary.length <= 1 ||
      (selectedChat?.platform !== "discord" && !autoFetch)
    )
      return;
    handleGenerateSummary()
  }, [discordMessagesforSummary, selectedChat]);

  const scrollTabs = (dir: "left" | "right") => {
    const el = tabScrollRef.current;
    if (!el) return;
    const scrollAmount = 120;
    el.scrollBy({
      left: dir === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };
  function readableTimestamp(timestamp) {
    if (!timestamp) return "";

    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "";

    // Options for formatting date and time
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    };
    return date.toLocaleString(undefined, options);
  }

  function formatDueText(task) {
    console.log(task);
    const due = task.due;

    if (!due) return null;
    if (due === "Done") return "Done";
    if (/Due in \d+/.test(due)) return due;

    const dueDate = new Date(due);
    if (isNaN(dueDate.getTime())) return due;

    const now = new Date();
    const diffMs = dueDate.getTime() - now.getTime();
    if (diffMs <= 0) return "Now";

    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d`;
    } else if (diffHours > 0) {
      return `${diffHours}hr`;
    } else {
      return `${diffMins}min`;
    }
  }

  // Auto-fetch tasks when Todo filter is selected
  useEffect(() => {
    if (
      (selectedFilter === "Todo" || selectedFilter === "All") &&
      tasks?.length === 0 &&
      !tasksLoading
    ) {
      handleFetchTasks();
    }
  }, [selectedFilter]);

  // Add this useEffect to auto-generate summary when chat is selected
  useEffect(() => {
    if (selectedChat && selectedChat !== "all-channels" && selectedChat.id) {
      handleGenerateSummary();
      handleFetchTasks();
      handleFetchMentions();
    }
  }, [selectedChat]); // This will trigger when selectedChat changes

  // Add this useEffect to regenerate summary when time interval changes
  useEffect(() => {
    if (
      selectedChat &&
      selectedChat !== "all-channels" &&
      selectedChat.id &&
      summaryData
    ) {
      // Only regenerate if we already have summary data (user has generated at least once)
      handleGenerateSummary();
    }
  }, [selectedTime]); // This will trigger when selectedTime changes

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  function renderFormattedSummary(text: string) {
    // Split on **, even indices are normal text, odd indices are bold text
    const parts = text.split(/(\*\*[^\*]+\*\*)/g).filter(Boolean);

    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={idx}>{part.slice(2, -2)}</strong>;
      }
      return <React.Fragment key={idx}>{part}</React.Fragment>;
    });
  }

  return (
    <aside className={`rounded-[10px] h-[calc(100vh-72px)] overflow-y-scroll overflow-x-hidden min-w-[400px] 2xl:min-w-[500px] ${autoFetch?"max-w-full":"max-w-[400px]"} bg-[#111111] text-white flex flex-col shadow-lg border border-[#23242a] grow`}>
      {/* Header */}
      <div className="flex items-center justify-left gap-4 px-2  py-3 border-b">
        <div className="flex items-center justify-center">
          <span className="font-meidum text-[13px] text-[#ffffff72]">
            Smart Summary
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              className="flex items-center justify-center gap-1 bg-[#212121] px-2 py-1 rounded-[6px] text-xs font-medium"
              onClick={() => setDropdownOpen((open) => !open)}
            >
              <CalendarCog className="h-4 w-4 " />
              {selectedTime.label} <FaChevronDown className="ml-1 text-xs" />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-1 w-24 bg-[#212121] border border-[#333] rounded-[6px] overflow-hidden shadow-lg z-10">
                {TIME_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    className={`block w-full text-left px-2 py-1  text-xs hover:bg-[#333] ${
                      selectedTime.value === option.value
                        ? "text-blue-400"
                        : "text-white"
                    }`}
                    onClick={() => {
                      setSelectedTime(option);
                      setDropdownOpen(false);
                      handleGenerateSummary(option);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleGenerateSummary}
            disabled={
              summaryLoading || !selectedChat || selectedChat === "all-channels"
            }
            className="py-1 px-2 my-1 flex gap-2 text-[11px] items-center rounded-[10px] cursor-pointer text-[#84afff] bg-[#3474ff12] hover:text-[#ffffff] hover:bg-[#3474ff] transition"
          >
            {summaryLoading ? "Generating..." : "Summarize"}
          </button>
        </div>
       {!autoFetch && <div
          className="ml-auto text-[#ffffff72] cursor-pointer"
          onClick={closePanel}
        >
          <X />
        </div>}
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-end gap-2 text-xs py-3 px-2 border-b ">
        <div className="flex flex-nowrap overflow-x-auto relative">
          {showLeftArrow && (
            <button
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 shadow "
              style={{
                background:
                  "linear-gradient(to left, transparent, rgba(0,0,0,1) 70%)",
              }}
              onClick={() => scrollTabs("left")}
              aria-label="Scroll left"
            >
              <FaChevronLeft size={14} />
            </button>
          )}
          <div
            ref={tabScrollRef}
            className="flex flex-nowrap justify-end overflow-x-auto scrollbar-hide gap-2 text-xs px-0"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <button
              className={`flex-shrink-0 flex items-center whitespace-nowrap gap-1 px-2 py-1 hover:text-white text-[#fafafa60] hover:bg-[#fafafa10] rounded-lg leading-1
      ${
        selectedFilter === "All"
          ? "text-[#fafafa] bg-[#fafafa10]"
          : "text-[#fafafa60] hover:text-[#fafafa] hover:bg-[#fafafa10]"
      }`}
              onClick={() => handleFilterChange("All")}
            >
              All
            </button>
            <button
              className={`flex-shrink-0 flex items-center whitespace-nowrap gap-1 px-2 py-1 hover:text-white text-[#fafafa60] hover:bg-[#fafafa10] rounded-lg leading-1 
      ${
        selectedFilter === "Alpha"
          ? "text-[#fafafa] bg-[#fafafa10]"
          : "text-[#fafafa60] hover:text-[#fafafa] hover:bg-[#fafafa10]"
      }`}
              onClick={() => handleFilterChange("Alpha")}
            >
              Alpha
            </button>
            <button
              className={`flex-shrink-0 flex items-center whitespace-nowrap gap-1 px-2 py-1 hover:text-white text-[#fafafa60] hover:bg-[#fafafa10] rounded-lg leading-1 
      ${
        selectedFilter === "Todo"
          ? "text-[#fafafa] bg-[#fafafa10]"
          : "text-[#fafafa60] hover:text-[#fafafa] hover:bg-[#fafafa10]"
      }`}
              onClick={() => handleFilterChange("Todo")}
            >
              To-dos
            </button>
            <button
              className={`flex-shrink-0 flex items-center whitespace-nowrap gap-1 px-2 py-1 hover:text-white text-[#fafafa60] hover:bg-[#fafafa10] rounded-lg leading-1 
      ${
        selectedFilter === "@"
          ? "text-[#fafafa] bg-[#fafafa10]"
          : "text-[#fafafa60] hover:text-[#fafafa] hover:bg-[#fafafa10]"
      }`}
              onClick={() => handleFilterChange("@")}
            >
              @
            </button>
          </div>
          {showRightArrow && (
            <button
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 shadow"
              style={{
                background:
                  "linear-gradient(to right, transparent, rgba(0,0,0,1) 70%)",
              }}
              onClick={() => scrollTabs("right")}
              aria-label="Scroll right"
            >
              <FaChevronRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Alpha/Summary Section */}
      {selectedFilter === "All" || selectedFilter === "Alpha" ? (
        <div className="rounded-xl mb-2 px-2 mt-4">
          <div className="flex justify-between items-center gap-2 mb-2">
            <span className="text-xs text-[#fafafa] leading-none">
              {selectedChat && selectedChat !== "all-channels"
                ? selectedChat.name
                : "Summary"}
            </span>
            <span className="text-xs font-[300] text-[#fafafa60] leading-none">
              {summaryData ? "JUST NOW" : "2 MIN AGO"}
            </span>
          </div>
          <div className="bg-[#171717] px-8 py-4 rounded-[16px]">
            {summaryLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                <span className="ml-2 text-sm text-[#fafafa60]">
                  Generating summary...
                </span>
              </div>
            ) : summaryData?.length ? (
              summaryData.map((summary) => (
                <>
                  <div className="mt-4">
                    {" "}
                    <ChatAvatar
                      name={summary.chat_title}
                      avatar={
                        summary.photo_url ||
                        `${BACKEND_URL}/chat_photo/${summary.chat_id}`
                      }
                      backupAvatar={`${BACKEND_URL}/contact_photo/${summary.chat_id}`}
                    />{" "}
                    {summary.chat_title}
                  </div>{" "}
                  <div className="text-sm text-[#fafafa] whitespace-pre-wrap leading-relaxed">
                    {renderFormattedSummary(summary.summary)}
                  </div>
                </>
              ))
            ) : summaryData?.summary ? (
              <div className="text-sm text-[#fafafa] whitespace-pre-wrap leading-relaxed">
                {renderFormattedSummary(summaryData.summary)}
              </div>
            ) : summaryData?.error ? (
              <div className="text-sm text-red-400">{summaryData.error}</div>
            ) : (
              <ul className="list-disc list-outside text-sm text-[#fafafa] space-y-1 [--tw-prose-bullets:#84afff] marker:text-[#84afff]">
                <li>No summary available yet.</li>
                <li>
                  Click the "Summarize" button to generate a summary for the
                  selected chat.
                </li>
                <li>Select a specific chat to see its summary.</li>
                <li>
                  Summary will be generated based on recent messages in the
                  chat.
                </li>
              </ul>
            )}
          </div>
        </div>
      ) : null}

      {/* To-dos / Requests */}
      {selectedFilter === "All" || selectedFilter === "Todo" ? (
        <div className="mb-2 px-2 mt-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs text-[#fafafa] leading-none">
              To-dos / Requests
            </span>
            <span className="text-xs font-[300] text-[#fafafa60] leading-none">
              {tasks?.length > 0 ? "JUST NOW" : "2 MIN AGO"}
            </span>
          </div>
          <div className="bg-[#171717] px-2 py-2 rounded-[16px]">
            {tasksLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                <span className="ml-2 text-sm text-[#fafafa60]">
                  Loading tasks...
                </span>
              </div>
            ) : tasks?.length === 0 ? (
              <div className="text-sm text-[#fafafa60] text-center py-4">
                No tasks available
              </div>
            ) : (
              <>
                {tasks?.map((task) => (
                  <div
                    className={`flex items-start gap-0 mb-2 bg-[#222327] p-2 rounded-[6px] border border-[#ffffff09] transition-opacity ${
                      task.status === "done" ? "opacity-60" : ""
                    }`}
                    key={task.id}
                  >
                    <div className="flex-shrink-0 w-8 flex items-center justify-center">
                      <CustomCheckbox
                        checked={selectedTaskIds.has(task.id)}
                        onChange={() => handleTaskSelection(task.id)}
                        className="mt-2"
                      />
                    </div>
                    <div className="grow bg-[#222327] rounded-[8px] px-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`bg-[#fafafa10] border-[#ffffff03] border-2 shadow-xl text-xs px-1 py-0.5 rounded-[6px] font-medium flex items-center gap-1 ${
                            task.status === "done"
                              ? "text-green-300"
                              : task.priority === "HIGH"
                              ? "text-red-300"
                              : task.priority === "MEDIUM"
                              ? "text-yellow-300"
                              : "text-blue-300"
                          }`}
                        >
                          <img src={smartTodo} className="h-4 w-4" />
                          {task.status === "done" ? "Completed" : "To-do"}
                        </span>
                      </div>
                      <div
                        className={`text-sm break-words w-full ${
                          task.status === "done"
                            ? "text-[#fafafa60] line-through"
                            : "text-[#fafafa]"
                        }`}
                      >
                        <p className="mt-2"> {task.text}</p>
                      </div>
                      <span className="text-xs text-[#fafafa60] flex gap-1 items-center mt-1">
                        {task.chat_title && <span>{task.chat_title}</span>}
                        <span>
                          {(() => {
                            const dateStr = new Date(
                              task.created_at
                            ).toLocaleDateString();
                            return dateStr === "Invalid Date" ? "" : dateStr;
                          })()}
                        </span>
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span
                        className={`rounded-[6px] text-center px-2 py-1 text-xs ${
                          task.priority === "HIGH"
                            ? "bg-[#F03D3D12] text-[#F68989]"
                            : task.priority === "MEDIUM"
                            ? "bg-[#FFA50012] text-[#FFB347]"
                            : "bg-[#00FF0012] text-[#90EE90]"
                        }`}
                      >
                        {task.priority || "Low"}
                      </span>
                      {formatDueText(task) && (
                        <span className="h-6 flex-shrink-0 flex gap-1 items-center bg-[#fafafa10] text-[#ffffff72] px-2 py-1 rounded-[6px] text-[12px]">
                          <CalendarCogIcon className="w-4 h-4" />
                          {formatDueText(task)}
                        </span>
                      )}
                      {/* Individual task toggle button */}
                      <button
                        onClick={() => handleTaskToggle(task.id)}
                        className={`text-xs px-2 py-1 rounded-[6px] transition ${
                          task.status === "done"
                            ? "bg-[#28a74512] text-[#28a745] hover:bg-[#28a74522]"
                            : "bg-[#3474ff12] text-[#84afff] hover:bg-[#3474ff22]"
                        }`}
                        title={
                          task.status === "done"
                            ? "Mark as incomplete"
                            : "Mark as complete"
                        }
                      >
                        {task.status === "done" ? "Undo" : "Done"}
                      </button>
                    </div>
                  </div>
                ))}

                {/* Bulk action buttons */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#ffffff09]">
                  <button
                    onClick={handleSelectAllTasks}
                    className="text-xs text-gray-400 hover:text-white px-3 py-2 rounded-[6px] hover:bg-[#ffffff06]"
                  >
                    {selectedTaskIds?.size === tasks?.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                  <div className="flex gap-2">
                    <span className="text-xs text-[#fafafa60] px-2 py-2">
                      {selectedTaskIds.size} selected
                    </span>
                    <button
                      onClick={handleMarkSelectedComplete}
                      disabled={selectedTaskIds.size === 0}
                      className="bg-[#3474ff12] text-[#84afff] hover:text-[#ffffff] hover:bg-[#3474ff72] disabled:opacity-50 disabled:cursor-not-allowed text-xs px-4 py-2 rounded-[8px] transition"
                    >
                      Mark Complete
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}

      {/* Mentions*/}
      {selectedFilter === "All" || selectedFilter === "@" ? (
        <div className="mb-2 px-2 mt-4 ">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs text-[#fafafa] leading-none">
              @Mentions
            </span>
            <span className="text-xs font-[300] text-[#fafafa60] leading-none">
              2 MIN AGO
            </span>
          </div>
          <div className="bg-[#171717] px-2 py-2 rounded-[16px]">
            {mentionsLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                <span className="ml-2 text-sm text-[#fafafa60]">
                  Loading mentions...
                </span>
              </div>
            ) : mentions.length === 0 ? (
              <div className="text-sm text-[#fafafa60] text-center py-4">
                No mentions available
              </div>
            ) : (
              <>
                {mentions.map((mention) => (
                  <div
                    className="flex items-start gap-3 py-3 px-4 rounded-[10px] shadow-sm mb-2 bg-[#212121]"
                    key={mention._id}
                  >
                    {/* Avatar */}

                    <ChatAvatar
                      name={mention.sender.username}
                      avatar={`${BACKEND_URL}/chat_photo/${mention.sender.id}`}
                      backupAvatar={`${BACKEND_URL}/contact_photo/${mention.sender.id}`}
                    />
                    {/* Message Content */}
                    <div className="flex-1">
                      <div className="flex items-center justify-start gap-2">
                        <span className="text-[#ffffff] font-[300] text-sm">
                          {mention.sender.first_name} {mention.sender.last_name}
                        </span>
                        {/* <span className="text-xs text-[#fafafa99]">#general</span> */}
                        <span className="text-xs text-[#fafafa99]">
                          {readableTimestamp(mention.timestamp)}
                        </span>
                      </div>
                      <div className="flex items-center gap-0 mt-1 bg-[#3474ff] w-max rounded-[6px]">
                        <FaTelegramPlane className="text-[#ffffff] w-3 h-3 ml-1" />
                        <span className="text-xs text-white  rounded pr-2 pl-1 py-0.5">
                          {mention.chat.title}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-[#e0e0e0]">
                        {/* <span className="text-[#84afff]">@everyone</span> Stealth
                    claim just opened. Zero tax, no presale. Contract verified 2
                    mins ago. */}
                        {mention.raw_text}
                      </div>
                      {/* Reactions */}
                      {/* <div className="flex gap-3 mt-2">
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
                  </div> */}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      ) : null}
    </aside>
  );
};

export default SmartSummary;
