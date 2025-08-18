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
  FaEdit,
  FaFlag,
  FaTrash,
} from "react-icons/fa";
import alphaImage from "@/assets/images/alphaFeatured.png";
import todoIcon from "@/assets/images/todoIcon.png";
import aiBlue from "@/assets/images/aiBlue.png";
import smartTodo from "@/assets/images/smartTodo.png";
import CustomCheckbox from "./CustomCheckbox";
import LinkPreview from "./LinkPreview";
import {
  BellOff,
  CalendarCogIcon,
  Check,
  ChevronDown,
  ChevronUp,
  MessageCircleMoreIcon,
  MoreHorizontal,
} from "lucide-react";

const TIME_OPTIONS = [
  { label: "5 min", value: "5m" },
  { label: "30 min", value: "30m" },
  { label: "1 hr", value: "1h" },
  { label: "6 hr", value: "6h" },
  { label: "24 hr", value: "24h" },
];

const TASK_SECTIONS = [
  {
    title: "!! URGENT ACTIONS REQUIRED",
    status: "urgent",
    color: "red",
    textColor: "#F68989",
    bgColor: "#f03d3d12",
  },
  {
    title: "🔥 TODAY'S OPPORTUNITIES",
    status: "today",
    color: "yellow",
    textColor: "#FDD868",
    bgColor: "#FCBF0412",
  },
  {
    title: "🚀 THIS WEEK'S PREP",
    status: "week",
    color: "green",
    textColor: "#7CF6A6",
    bgColor: "#00ff0012",
  },
  {
    title: "🎉 DONE",
    status: "done",
    color: "blue",
    textColor: "#7DD3FC", // Light blue text (Tailwind sky-300)
    bgColor: "#0ea5e912", // Low opacity dark blue bg (Tailwind sky-500 + 7% opacity)
  },
];

// const todos = [
//     {
//       id: 1,
//       label: "To-do",
//       desc: "$GOR entered Proof-of-Cope meta...",
//       tag: "#PORTALCOIN | $PORTAL",
//       bot: "#BOT",
//       icon: smartTodo,
//       platform: 'telegram'
//     },
//     {
//       id: 2,
//       label: "Reminder",
//       desc: "Updates: Monad mainnet live",
//       tag: "ALPHA GUILD | #GENERAL",
//       bot: "",
//       icon: smartTodo,
//       platform: 'discord'
//     },
//     // ...more items
//   ];

const filteredTodos = [
  {
    id: 1,
    label: "To-do",
    desc: "$GOR entered Proof-of-Cope meta...",
    tag: "#PORTALCOIN | $PORTAL",
    bot: "#BOT",
    icon: smartTodo,
    platform: "telegram",
    type: "todo",
  },
  {
    id: 2,
    label: "Reminder",
    desc: "Updates: Monad mainnet live",
    tag: "ALPHA GUILD | #GENERAL",
    bot: "",
    icon: smartTodo,
    platform: "discord",
    type: "reminder",
  },
  // ...more filtered items
];

const favoriteTodos = [
  {
    id: 101,
    label: "To-do",
    desc: "Check $ETH staking rewards",
    tag: "#ETH | #STAKING",
    bot: "#FAVBOT",
    icon: smartTodo,
    platform: "telegram",
    type: "todo",
  },
  // ...more favorite items
];

const backlogTodos = [
  {
    id: 201,
    label: "Reminder",
    desc: "Review last week's analytics Review last week's analytics Review last week's analytics Review last week's analytics",
    tag: "#ANALYTICS | #REVIEW",
    bot: "",
    icon: smartTodo,
    platform: "discord",
    type: "reminder",
  },
  {
    id: 202,
    label: "Reminder",
    desc: "Review last week's analytics",
    tag: "#ANALYTICS | #REVIEW",
    bot: "",
    icon: smartTodo,
    platform: "discord",
    type: "reminder",
  },
  // ...more backlog items
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

const todo = [
  filteredTodos,
  favoriteTodos,
  backlogTodos,
  filteredTodos,
  favoriteTodos,
  backlogTodos,
];

const SmartBookmark = () => {
  const [selectedTime, setSelectedTime] = useState(TIME_OPTIONS[4]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const tabScrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [checkedItems, setCheckedItems] = useState<{ [id: number]: boolean }>(
    {}
  );
  const [source, setSource] = useState<"all" | "tg" | "discord">("all");
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [selectedTab, setSelectedTab] = useState<
    "all" | "todo" | "reminder" | "mentions"
  >("all");
  const [openTab, setOpenTab] = useState<number | null>(0);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const dropdownRef2 = useRef<HTMLDivElement>(null);
  const [hoveredTask, setHoveredTask] = useState<number | null>(1);
  const [openMoreMenu, setOpenMoreMenu] = useState<number | null>(null);
  const [tasks, setTasks] = useState(todo);

  const markTaskDone = (id: number) => {
    setTasks((prev) =>
      prev.map((t: any) => (t?.id === id ? { ...t, status: "done" } : t))
    );
  };

  const deleteTask = (id: number) => {
    setTasks((prev) => prev.filter((t: any) => t?.id !== id));
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef2.current &&
        !dropdownRef2.current.contains(event.target as Node)
      ) {
        setShowSourceDropdown(false);
      }
    }
    if (showSourceDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSourceDropdown]);

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

  //   const handleSelectAll = () => {
  //     const allChecked: { [id: number]: boolean } = {};
  //     todos.forEach(todo => {
  //       allChecked[todo.id] = true;
  //     });
  //     setCheckedItems(allChecked);
  //   };
  useEffect(() => {
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

  const scrollTabs = (dir: "left" | "right") => {
    const el = tabScrollRef.current;
    if (!el) return;
    const scrollAmount = 120;
    el.scrollBy({
      left: dir === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

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
  return (
    <aside className="h-[calc(100vh-72px)] overflow-y-scroll overflow-x-hidden min-w-[500px] bg-[#111111] text-white rounded-2xl flex flex-col shadow-lg border border-[#23242a]">
      {/* Header */}
      <div className="flex items-center justify-between py-2 px-2">
        <span className="font-[200] text-[#ffffff72]">Tasks Digests</span>
        <div className="flex items-center gap-2">
          {/* Dropdown */}
          <div className="relative inline-block">
            <button
              className="bg-[#23262F] text-[#fafafa] text-[12px] py-1.5 px-2 rounded-[6px] flex items-center gap-2"
              onClick={() => setShowSourceDropdown((prev) => !prev)}
              type="button"
            >
              {/* {source === 'all' ? 'All' : source === 'tg' ? 'Telegram' : 'Discord'} */}
              Source
              <svg
                className="w-4 h-4 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {showSourceDropdown && (
              <div className="absolute left-0 mt-2 w-32 bg-[#23262F] rounded shadow-lg z-10">
                <button
                  className={`block w-full text-left px-4 py-2 hover:bg-[#353945] ${
                    source === "all" ? "font-bold" : ""
                  }`}
                  onClick={() => {
                    setSource("all");
                    setShowSourceDropdown(false);
                  }}
                >
                  All
                </button>
                <button
                  className={`block w-full text-left px-4 py-2 hover:bg-[#353945] ${
                    source === "tg" ? "font-bold" : ""
                  }`}
                  onClick={() => {
                    setSource("tg");
                    setShowSourceDropdown(false);
                  }}
                >
                  Telegram
                </button>
                <button
                  className={`block w-full text-left px-4 py-2 hover:bg-[#353945] ${
                    source === "discord" ? "font-bold" : ""
                  }`}
                  onClick={() => {
                    setSource("discord");
                    setShowSourceDropdown(false);
                  }}
                >
                  Discord
                </button>
              </div>
            )}
          </div>
          <div className="relative" ref={dropdownRef}>
            <button
              className="bg-[#23262F] text-[#fafafa] text-[12px] py-1.5 px-2 rounded-[6px] flex items-center gap-2"
              onClick={() => setDropdownOpen((open) => !open)}
            >
              <span className="flex items-center gap-2 truncate w-full">
                <CalendarCogIcon className="w-4 h-4" />
                <span className="truncate">{selectedTime.label}</span>
              </span>
              <FaChevronDown className="ml-2 text-xs" />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-1 w-24 bg-[#23242a] border border-[#333] rounded-lg shadow-lg z-10">
                {TIME_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    className={`block w-full text-left px-3 py-1 text-xs hover:bg-[#333] ${
                      selectedTime.value === option.value
                        ? "text-blue-400"
                        : "text-white"
                    }`}
                    onClick={() => {
                      setSelectedTime(option);
                      setDropdownOpen(false);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="p-2 hover:bg-[#23242a] rounded-lg">
            <FaCog />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-end items-center gap-2 text-xs mb-2 border-t border-b p-2">
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
            className="flex justify-end w-full flex-nowrap overflow-x-auto scrollbar-hide gap-2 text-xs px-0"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <button
              className={`flex-shrink-0 flex items-center whitespace-nowrap gap-1 px-2 py-1 rounded-lg ${
                selectedTab === "all"
                  ? "text-white bg-[#fafafa10]"
                  : "text-[#fafafa60] hover:text-white hover:bg-[#fafafa10]"
              }`}
              onClick={() => setSelectedTab("all")}
            >
              All
            </button>
            <button
              className={`flex-shrink-0 flex items-center whitespace-nowrap gap-1 px-2 py-1 rounded-lg ${
                selectedTab === "todo"
                  ? "text-white bg-[#fafafa10]"
                  : "text-[#fafafa60] hover:text-white hover:bg-[#fafafa10]"
              }`}
              onClick={() => setSelectedTab("todo")}
            >
              To-do's
            </button>
            <button
              className={`flex-shrink-0 flex items-center whitespace-nowrap gap-1 px-2 py-1 rounded-lg ${
                selectedTab === "reminder"
                  ? "text-white bg-[#fafafa10]"
                  : "text-[#fafafa60] hover:text-white hover:bg-[#fafafa10]"
              }`}
              onClick={() => setSelectedTab("reminder")}
            >
              Reminder's
            </button>
            <button
              className={`flex-shrink-0 flex items-center whitespace-nowrap gap-1 px-2 py-1 rounded-lg ${
                selectedTab === "mentions"
                  ? "text-white bg-[#fafafa10]"
                  : "text-[#fafafa60] hover:text-white hover:bg-[#fafafa10]"
              }`}
              onClick={() => setSelectedTab("mentions")}
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

      {TASK_SECTIONS.map((section, index) => (
        <div key={index} className="mb-2 px-2">
          <div
            className="flex justify-between items-center gap-2 mb-2 cursor-pointer"
            onClick={() => setOpenTab(openTab === index ? null : index)}
          >
            <span
              className="text-xs font-[200]"
              style={{ color: section.textColor }}
            >
              {section.title}
            </span>
            {openTab === index ? (
              <ChevronUp className="text-[#fafafa]" />
            ) : (
              <ChevronDown className="text-[#fafafa]" />
            )}
          </div>
          {openTab === index && (
            <div className="px-2 py-2 rounded-[16px]">
              {todo[index]
                .filter((todo) => {
                  if (selectedTab === "all" || selectedTab === "mentions") {
                    return true;
                  }
                  return todo.type.toLowerCase() === selectedTab;
                })
                .map((todo) => {
                  return (
                    <div
                      className="flex relative items-start gap-0 mb-2 bg-[#222327] p-2 rounded-[6px] border border-[#ffffff09]"
                      key={todo.id}
                      onMouseEnter={() => setHoveredTask(todo.id)}
                      onMouseLeave={() => setHoveredTask(null)}
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
                            <span className="text-xs text-[#ffffff48]">
                              {todo.bot}
                            </span>
                          )}
                          <span className="text-[#FAFAFA60]">
                            03/02/25, 18:49
                          </span>
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

                      <div
                        className={`shadow-lg rounded-[8px] bg-[#242429] absolute right-4 -top-4 flex gap-0 ml-4 opacity-0 group-hover:opacity-100 transition ${
                          hoveredTask === todo.id ? "opacity-100" : ""
                        }`}
                      >
                        <button
                          title="Edit"
                          className="hover:text-[#84afff] border border-[#ffffff03] p-2"
                          onClick={() => markTaskDone(todo.id)}
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        {/* <button title="Save to Favs">
                          <FaStar />
                        </button>
                        <select
                          className="bg-[#353945] text-xs rounded px-1 py-0.5"
                          value={task.priority}
                          onChange={(e) =>
                            changePriority(task.id, e.target.value)
                          }
                        >
                          <option>HIGH</option>
                          <option>MEDIUM</option>
                          <option>LOW</option>
                        </select> */}
                        <button
                          title="Mute"
                          className="hover:text-[#84afff] border border-[#ffffff03] p-2"
                        >
                          <BellOff className="h-4 w-4" />
                        </button>
                        <button
                          title="chat"
                          className="hover:text-[#84afff] border border-[#ffffff03] p-2"
                        >
                          <MessageCircleMoreIcon className="h-4 w-4" />
                        </button>
                        <button
                          title="more"
                          className="relative hover:text-[#84afff] border border-[#ffffff03] p-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMoreMenu(
                              openMoreMenu === todo.id ? null : todo.id
                            );
                          }}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {openMoreMenu === todo.id && (
                          <>
                            {/* Backdrop for outside click */}
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setOpenMoreMenu(null)}
                              style={{ background: "transparent" }}
                            />
                            <div
                              className="absolute z-50 min-w-[180px] bg-[#111111] rounded-[10px] shadow-lg p-2 flex flex-col gap-1"
                              style={{
                                right: "-0", // adjust as needed to position to the left of the button
                                top: "36px", // adjust as needed to position below the button
                              }}
                            >
                              <button
                                className="flex items-center gap-2 px-3 py-2 rounded text-sm text-[#ffffff72] hover:text-[#ffffff] hover:bg-[#23262F]"
                                onClick={() => {
                                  // handle edit
                                  setOpenMoreMenu(null);
                                }}
                              >
                                <FaEdit className="" /> Edit Task
                              </button>
                              <button
                                className="flex items-center gap-2 px-3 py-2 rounded text-sm text-[#ffffff72] hover:text-[#ffffff] hover:bg-[#23262F]"
                                onClick={() => {
                                  // handle save to favorites
                                  setOpenMoreMenu(null);
                                }}
                              >
                                <FaStar className="" /> Save to Favorites
                              </button>
                              <button
                                className="flex items-center gap-2 px-3 py-2 rounded text-sm text-[#ffffff72] hover:text-[#ffffff] hover:bg-[#23262F]"
                                onClick={() => {
                                  // handle change priority
                                  setOpenMoreMenu(null);
                                }}
                              >
                                <FaFlag className="" /> Change Priority
                              </button>
                              <button
                                className="flex items-center gap-2 px-3 py-2 rounded text-sm text-red-400 hover:bg-[#23262F]"
                                onClick={() => {
                                  // handle delete
                                  deleteTask(todo.id);
                                  setOpenMoreMenu(null);
                                }}
                              >
                                <FaTrash /> Delete Task
                              </button>
                            </div>
                          </>
                        )}
                        {/* <button title="Delete" onClick={() => deleteTask(task.id)}>
                          <FaTrash />
                        </button> */}
                        {/* {section.status !== "done" && (
                          <>
                            <button
                              title="Mark as Done"
                              onClick={() => markTaskDone(task.id)}
                            >
                              <FaCheck />
                            </button>
                            <select
                              title="Move to"
                              className="bg-[#353945] text-xs rounded px-1 py-0.5"
                              value={task.status}
                              onChange={(e) => moveTask(task.id, e.target.value)}
                            >
                              {TASK_SECTIONS.filter(
                                (s) => s.status !== task.status
                              ).map((s) => (
                                <option key={s.status} value={s.status}>
                                  Move to {s.title}
                                </option>
                              ))}
                            </select>
                          </>
                        )} */}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      ))}

      {/* To-dos / Requests */}
      {/* <div className="mb-2 px-2">
      <div className="flex justify-between items-center gap-2 mb-2 cursor-pointer"
          onClick={() => setOpenTab(openTab === 0 ? null : 0)}
>
        
<span className="text-xs font-[200] text-[#fafafa] leading-none">Filtered Streams</span>
    {openTab === 0
      ? <ChevronUp className="text-[#fafafa]" />
      : <ChevronDown className="text-[#fafafa]" />}
        </div>
        {openTab === 0 && (

<div className=" px-2 py-2 rounded-[16px]" >

{filteredTodos.map((todo) => (
<div className="flex  items-start gap-0 mb-2 bg-[#222327] p-2 rounded-[6px] border border-[#ffffff09]" key={todo.id}>
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
    </span>
   
  </div>
  <div className="text-sm text-[#fafafa] break-words w-full">{todo.desc}</div>
  <span className={`text-xs ${todo.platform=="telegram"?'text-[#3474ff]':'text-[#7b5cfa]'} flex gap-1 items-center mt-1`}>
    {todo.platform=="telegram"?<FaTelegramPlane />:<FaDiscord/>}
    {todo.tag.split('|')[0]}
    {todo.bot && <span className="text-xs text-[#ffffff48]">{todo.bot}</span>}
    <span className="text-[#FAFAFA60]">03/02/25, 18:49</span>
  </span>
</div>
<div className="flex flex-col gap-0">
    <span className="bg-[#F03D3D12] grow rounded-[6px] px-2 py-1 text-[#F68989]">High</span>
    <span className="bg-[#fafafa10] rounded-[6px] text-center grow flex items-center justify-center gap-1 text-[12px]"><CalendarCogIcon className="w-3 h-3"/> 3d</span>
</div>
</div>
))}
      <div className="flex items-center justify-between mt-2">
        </div>
    </div>
        )}       
      </div>

      <div className="mb-2 px-2">
      <div className="flex justify-between items-center gap-2 mb-2 cursor-pointer"
          onClick={() => setOpenTab(openTab === 1 ? null : 1)}
>
<span className="text-xs font-[200] text-[#fafafa] leading-none">Favourites</span>

{openTab === 1
      ? <ChevronUp className="text-[#fafafa]" />
      : <ChevronDown className="text-[#fafafa]" />}
        </div>
        {openTab === 1 && (

<div className=" px-2 py-2 rounded-[16px]" >

{favoriteTodos.map((todo) => (
<div className="flex  items-start gap-0 mb-2 bg-[#222327] p-2 rounded-[6px] border border-[#ffffff09]" key={todo.id}>
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
    </span>
  </div>
  <div className="text-sm text-[#fafafa] break-words w-full">{todo.desc}</div>
  <span className={`text-xs ${todo.platform=="telegram"?'text-[#3474ff]':'text-[#7b5cfa]'} flex gap-1 items-center mt-1`}>
    {todo.platform=="telegram"?<FaTelegramPlane />:<FaDiscord/>}
    {todo.tag.split('|')[0]}
    {todo.bot && <span className="text-xs text-[#ffffff48]">{todo.bot}</span>}
    <span className="text-[#FAFAFA60]">03/02/25, 18:49</span>
  </span>
</div>
<div className="flex flex-col gap-0">
    <span className="bg-[#F03D3D12] grow rounded-[6px] px-2 py-1 text-[#F68989]">High</span>
    <span className="bg-[#fafafa10] rounded-[6px] text-center grow flex items-center justify-center gap-1 text-[12px]"><CalendarCogIcon className="w-3 h-3"/> 3d</span>
</div>
</div>
))}
      <div className="flex items-center justify-between mt-2">
        </div>
    </div>
        )}       
      </div>
      <div className="mb-2 px-2">
      <div className="flex justify-between items-center gap-2 mb-2 cursor-pointer"
          onClick={() => setOpenTab(openTab === 2 ? null : 2)}
>
        
<span className="text-xs font-[200] text-[#fafafa] leading-none">Backlog</span>
    {openTab === 2
      ? <ChevronUp className="text-[#fafafa]" />
      : <ChevronDown className="text-[#fafafa]" />}
        </div>
        {openTab === 2 && (

        <div className=" px-2 py-2 rounded-[16px]" >

        {backlogTodos.map((todo) => (
      <div className="flex  items-start gap-0 mb-2 bg-[#222327] p-2 rounded-[6px] border border-[#ffffff09]" key={todo.id}>
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
            </span>
          </div>
          <div className="text-sm text-[#fafafa] break-words w-full">{todo.desc}</div>
          <span className={`text-xs ${todo.platform=="telegram"?'text-[#3474ff]':'text-[#7b5cfa]'} flex gap-1 items-center mt-1`}>
            {todo.platform=="telegram"?<FaTelegramPlane />:<FaDiscord/>}
            {todo.tag.split('|')[0]}
            {todo.bot && <span className="text-xs text-[#ffffff48]">{todo.bot}</span>}
            <span className="text-[#FAFAFA60]">03/02/25, 18:49</span>
          </span>
        </div>
        <div className="flex flex-col gap-0">
            <span className="bg-[#F03D3D12] grow rounded-[6px] px-2 py-1 text-[#F68989]">High</span>
            <span className="bg-[#fafafa10] rounded-[6px] text-center grow flex items-center justify-center gap-1 text-[12px]"><CalendarCogIcon className="w-3 h-3"/> 3d</span>
        </div>
      </div>
    ))}
      <div className="flex items-center justify-between mt-2">
        </div>
    </div>
        )}
       
      </div> */}
      <div className="flex w-full px-2">
        <button
          onClick={() => {
            handleSelectAll([
              ...filteredTodos,
              ...favoriteTodos,
              ...backlogTodos,
            ]);
          }}
          className="w-[50%] text-xs text-gray-400 hover:text-white"
        >
          Select All
        </button>
        <button
          onClick={() => handleAddAllSelected(filteredTodos)}
          className="w-[50%] bg-[#3474ff12] text-[#84afff] hover:text-[#ffffff] hover:bg-[#3474ff72] text-xs px-4 py-2 rounded-[8px]"
        >
          Add all Selected
        </button>
      </div>
    </aside>
  );
};

export default SmartBookmark;
