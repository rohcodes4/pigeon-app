// ... existing imports ...
import React, { useState } from "react";
import CustomCheckbox from "./CustomCheckbox";
import {
  FaDiscord,
  FaTelegramPlane,
  FaEdit,
  FaTrash,
  FaCheck,
  FaStar,
  FaBellSlash,
  FaArrowDown,
  FaArrowRight,
  FaExchangeAlt,
  FaPlus,
} from "react-icons/fa";
import { BellOff, CalendarCogIcon, Check, CheckCheck, ChevronDown, ChevronUp, MessageCircleMoreIcon, MoreHorizontal, Plus } from "lucide-react";
import todoIcon2 from "@/assets/images/todoIcon2.png";
import reminderIcon from "@/assets/images/reminderIcon.png";
import { FaCalendarAlt, FaTag, FaFlag } from "react-icons/fa";
import { Button } from "./ui/button";

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
        textColor: "#7DD3FC",      // Light blue text (Tailwind sky-300)
        bgColor: "#0ea5e912",      // Low opacity dark blue bg (Tailwind sky-500 + 7% opacity)
      },
  ];

const TIME_FILTERS = [
  "30 mins",
  "6 hr",
  "12 hr",
  "24 hr",
  "3 days",
  "1 week",
];

const platformIcon = (platform: string) =>
  platform === "discord" ? (
    <FaDiscord className="text-indigo-500" />
  ) : (
    <FaTelegramPlane className="text-blue-400" />
  );

// Add tasks for all sections
const INITIAL_TASKS = [
  {
    id: 1,
    name: "Explore Uniswap V3 liquidity pool update Explore Uniswap V3 liquidity pool update Explore Uniswap V3 liquidity pool update ",
    tags: [ "Sponsored", "Viral"],
    due: "5d",
    description: "",
    platform: "discord",
    channel: "PORTFOLIO/IN",
    server: "PORTAL",
    priority: "HIGH",
    status: "urgent",
    type: "todo",
  },
  {
    id: 2,
    name: "BABAYAGA whitelist event",
    tags: [ "Sponsored", "Viral"],
    due: "3d",
    description: "",
    platform: "discord",
    channel: "POW/S GIM CALLS",
    server: "BOT",
    priority: "MEDIUM",
    status: "urgent",
    type: "todo",
  },
  {
    id: 3,
    name: "SETH airdrop registration in Telegram group",
    tags: [ "Sponsored", "Viral"],
    due: "3",
    description: "",
    platform: "telegram",
    channel: "MICHAEL SABLE",
    server: "DM",
    priority: "MEDIUM",
    status: "urgent",
    type: "reminder", 
  },
  {
    id: 4,
    name: "Participate in BABAYAGA whitelist event!",
    tags: [ "Sponsored", "Viral"],
    due: "3",
    description: "",
    platform: "discord",
    channel: "ALPHA GUILD",
    server: "BOT",
    priority: "MEDIUM",
    status: "urgent",
    type: "todo",
  },
  {
    id: 5,
    name: "Join new DeFi project launch",
    tags: [ "Community"],
    due: "5d",
    description: "",
    platform: "telegram",
    channel: "DeFi Announcements",
    server: "Main",
    priority: "LOW",
    status: "today",
    type: "reminder", 
  },
  {
    id: 6,
    name: "Review weekly analytics",
    tags: [],
    due: "2d",
    description: "",
    platform: "discord",
    channel: "Analytics",
    server: "HQ",
    priority: "MEDIUM",
    status: "week",
    type: "todo",
  },
  {
    id: 7,
    name: "Completed: Testnet participation",
    tags: [],
    due: "Done",
    description: "",
    platform: "discord",
    channel: "Testnet",
    server: "Dev",
    priority: "LOW",
    status: "done",
    type: "reminder", 
  },
];

const getUniqueTags = (tasks) => {
  const tagSet = new Set();
  tasks.forEach((t) => t.tags.forEach((tag) => tagSet.add(tag)));
  return Array.from(tagSet);
};

function formatDueText(due) {
    if (!due || due === "Done") return "Done";
    // If already a relative string, just return it
    if (/Due in \d+/.test(due)) return due;
  
    // If ISO string, parse and format
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

const getUniqueChannels = (tasks) => {
  const channelSet = new Set();
  tasks.forEach((t) => channelSet.add(t.channel));
  return Array.from(channelSet);
};

const getUniqueServers = (tasks) => {
  const serverSet = new Set();
  tasks.forEach((t) => serverSet.add(t.server));
  return Array.from(serverSet);
};

const getDueDate = (due: string) => {
    if (!due || due === "Done") return null;
    const now = new Date();
    const match = due.match(/Due in (\d+)\s*(Days?|hr|mins?)/i);
    if (!match) return null;
    const value = parseInt(match[1], 10);
    if (due.includes("Day")) {
      now.setDate(now.getDate() + value);
    } else if (due.includes("hr")) {
      now.setHours(now.getHours() + value);
    } else if (due.includes("min")) {
      now.setMinutes(now.getMinutes() + value);
    }
    return now;
  };

const isWithinTimeFilter = (due: string, filter: string) => {
if (filter === "all" || !due || due === "Done") return true;
const dueDate = getDueDate(due);
if (!dueDate) return false;
const now = new Date();
const diffMs = dueDate.getTime() - now.getTime();
const diffMins = diffMs / (1000 * 60);
switch (filter) {
    case "30 mins":
    return diffMins <= 30;
    case "6 hr":
    return diffMins <= 6 * 60;
    case "12 hr":
    return diffMins <= 12 * 60;
    case "24 hr":
    return diffMins <= 24 * 60;
    case "3 days":
    return diffMins <= 3 * 24 * 60;
    case "1 week":
    return diffMins <= 7 * 24 * 60;
    default:
    return true;
}
};


const TasksPanel = () => {
    const [tasks, setTasks] = useState(INITIAL_TASKS);
    const [hoveredTask, setHoveredTask] = useState<number | null>(1);
    const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
    const [collapsed, setCollapsed] = useState<{ [key: string]: boolean }>({
      urgent: false,
      today: true,
      week: true,
      done: true,
    });
  
//     const [showTagModal, setShowTagModal] = useState(false);
// const [showDueModal, setShowDueModal] = useState(false);
// const [showPriorityModal, setShowPriorityModal] = useState(false);

const [openModal, setOpenModal] = useState<null | "tag" | "due" | "priority">(null);
const [openMoreMenu, setOpenMoreMenu] = useState<number | null>(null);
    // Filters
    const [sourceFilter, setSourceFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [timeFilter, setTimeFilter] = useState("all");

  // Create Task State
  const [newTask, setNewTask] = useState({
    name: "",
    tags: [],
    due: "",
    description: "",
    platform: "discord",
    channel: "",
    server: "",
    priority: "HIGH",
    status: "urgent",
    type: "todo",
  });
  const [newTagInput, setNewTagInput] = useState("");
  const uniqueTags = getUniqueTags(tasks);
  const uniqueChannels = getUniqueChannels(tasks);
  const uniqueServers = getUniqueServers(tasks);

  // CRUD handlers
  const toggleTaskSelection = (id: number) => {
    setSelectedTasks((prev) =>
      prev.includes(id) ? prev.filter((tid) => tid !== id) : [...prev, id]
    );
  };

  const markTaskDone = (id: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "done" } : t))
    );
  };

  const deleteTask = (id: number) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const markAllDone = (status: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.status === status ? { ...t, status: "done" } : t))
    );
  };

  const changePriority = (id: number, priority: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              priority,
              tags: [
                priority,
                ...t.tags.filter(
                  (tag) => tag !== "HIGH" && tag !== "MEDIUM" && tag !== "LOW"
                ),
              ],
            }
          : t
      )
    );
  };

  const moveTask = (id: number, newStatus: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );
  };

  // Create Task Handler
  const handleCreateTask = () => {
    if (!newTask.name.trim()) return;
    setTasks((prev) => [
      ...prev,
      {
        ...newTask,
        id: prev.length ? Math.max(...prev.map((t) => t.id)) + 1 : 1,
        tags: newTask.tags.length ? newTask.tags : [],
      },
    ]);
    setNewTask({
      name: "",
      tags: [],
      due: "",
      description: "",
      platform: "discord",
      channel: "",
      server: "",
      priority: "HIGH",
      status: "urgent",
      type:'todo'
    });
    setNewTagInput("");
  };

  // Tag selection for create
  const handleTagToggle = (tag: string) => {
    setNewTask((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleAddNewTag = () => {
    if (
      newTagInput.trim() &&
      !uniqueTags.includes(newTagInput.trim()) &&
      !newTask.tags.includes(newTagInput.trim())
    ) {
      setNewTask((prev) => ({
        ...prev,
        tags: [...prev.tags, newTagInput.trim()],
      }));
      setNewTagInput("");
    }
  };

  // Filtered tasks
  const filteredTasks = tasks.filter((t) => {
    let sourceOk =
      sourceFilter === "all" ||
      (sourceFilter === "discord" && t.platform === "discord") ||
      (sourceFilter === "telegram" && t.platform === "telegram");
    let priorityOk =
      priorityFilter === "all" || t.priority === priorityFilter.toUpperCase();
    let timeOk = isWithinTimeFilter(t.due, timeFilter);
    return sourceOk && priorityOk && timeOk;
  });

  // Task counts
  const totalTasks = filteredTasks.length;
  const sectionCounts = TASK_SECTIONS.map(
    (section) => filteredTasks.filter((t) => t.status === section.status).length
  );

  const selectAllTasks = () => {
    const allTaskIds = tasks.map((task) => task.id);
    setSelectedTasks(allTaskIds);
  };
  const markSelectedAsDone = () => {
    setTasks((prev) =>
      prev.map((task) =>
        selectedTasks.includes(task.id) ? { ...task, status: "done" } : task
      )
    );
    setSelectedTasks([]); // Clear selection after marking as done
  };

  return (
    <div className="bg-[#171717] text-white flex flex-col h-[calc(100vh-121px)] overflow-y-scroll">
      {/* Filters and Task Count */}
      <div className=" flex items-center justify-between gap-4 p-4 border-b border-gray-700">
        <div className="flex gap-4 items-center text-sm">
        <div className="border-r border-r-[#ffffff32] 2xl:pr-4 pr-0">
                <p className="uppercase text-[#ffffff32] font-[200] mb-1">Source</p>
          <select
            className="bg-[#2d2d2d] text-xs rounded-[8px] pl-1 pr-3 py-3 mr-3 text-[#ffffff72]"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
          >
            <option value="all">All Sources</option>
            <option value="discord">Discord</option>
            <option value="telegram">Telegram</option>
          </select>
          </div>

          {/* Priority as radio flex buttons */}
          <div className="border-r border-r-[#ffffff32] 2xl:pr-4 pr-2 text-xs ">
          <p className="uppercase text-[#ffffff32] font-[200] mb-1">Priority</p>

          <div className="flex gap-1 ">

          {["HIGH", "MEDIUM", "LOW"].map((level) => {
      // Determine selected style
      let selected =
      priorityFilter === level
        ? level === "HIGH"
          ? "bg-[#f03d3d12] text-[#F68989] border-[#f03d3d12]"
          : level === "MEDIUM"
          ? "bg-[#FCBF0412] text-[#FDD868] border-[#FCBF0412]"
          : "bg-[#00ff0012] text-[#7CF6A6] border-[#00ff0012]" // LOW
        : "bg-[#2d2d2d] text-[#ffffff32] ";
      return (
        <button
          key={level}
          className={`px-3 py-1 text-xs font-semibold border transition rounded-[8px] py-3 mr-1 ${selected}`}
          onClick={() =>
            setPriorityFilter(priorityFilter === level ? "all" : level)
          }
          type="button"
        >
          {level}
        </button>
      );
    })}
          </div>
          </div>
          <div>
          <p className="text-xs  uppercase text-[#ffffff32] font-[200] mb-1">Due</p>

          <select
            className="text-xs  bg-[#2d2d2d] rounded-[8px] pl-1 pr-3 py-3 mr-3 text-[#ffffff72]"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
          >
            <option value="all">All Times</option>
            {TIME_FILTERS.map((tf) => (
              <option key={tf} value={tf}>
                {tf}
              </option>
            ))}
          </select>
          </div>
        </div>
        <div className="text-xs 2xl:text-sm text-[#ffffff48] uppercase self-end flex gap-2 max-2xl:flex-col">
          <Button variant="ghost" onClick={selectAllTasks}>
Select All
            </Button>
          <Button variant="default" className="text-xs 2xl:text-sm bg-[#3474FF60] hover:text-[#3474FF] text-[#B8D1Ff]"
          onClick={markSelectedAsDone}>
Mark as Done
            </Button>
            {/* Showing {totalTasks} Task{totalTasks>1?'s':''} */}
          {/* Total Tasks: <span className="font-bold text-white">{totalTasks}</span>
          {TASK_SECTIONS.map((section, idx) => (
            <span key={section.status} className="ml-4">
              {section.title.split(" ")[0]}:{" "}
              <span className="font-bold text-white">{sectionCounts[idx]}</span>
            </span>
          ))} */}
        </div>
      </div>

      {/* Task Sections */}
      <div className="flex-1 overflow-y-auto p-4">
        {TASK_SECTIONS.map((section) => (
          <div key={section.status} className="py-2 border border-transparent border-b-[#ffffff09]">
            {/* Collapsible Header */}
            <div
                className="flex items-center justify-between font-bold cursor-pointer"
                style={{              
                  padding: "8px 16px"
                }}
                onClick={() => {
                    if (!collapsed[section.status]) {
                      // If already open, collapse all
                      setCollapsed(
                        TASK_SECTIONS.reduce((acc, s) => ({ ...acc, [s.status]: true }), {})
                      );
                    } else {
                      // Open only the clicked section
                      setCollapsed(
                        TASK_SECTIONS.reduce(
                          (acc, s) => ({
                            ...acc,
                            [s.status]: s.status !== section.status,
                          }),
                          {}
                        )
                      );
                    }
                  }}
            >
              <div className="flex items-center gap-2">
                {collapsed[section.status] ? (
                  <ChevronDown />
                ) : (
                  <ChevronUp />
                )}
                <span  className="font-[400]" style={{
                  color: section.textColor,
                  background: section.bgColor,
                  borderRadius: 8,
                  padding: "4px 10px"
                }}>
                {section.title} ({filteredTasks.filter((t) => t.status === section.status).length})
                </span>
              </div>
              {section.status !== "done" && (
                <button
                  className="text-xs text-[#ffffff48] hover:text-[#ffffff] rounded px-2 py-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Mark all as completed
                    setTasks((prev) =>
                      prev.map((t) =>
                        t.status === section.status &&
                        filteredTasks.some((ft) => ft.id === t.id)
                          ? { ...t, status: "done" }
                          : t
                      )
                    );
                  }}
                >
                    <CheckCheck className="w-4 h-4"/>
                </button>
              )}
            </div>
            {/* Section Tasks */}
            {!collapsed[section.status] && (
              <div className="space-y-2 ">
                {filteredTasks.filter((t) => t.status === section.status).length === 0 && (
                  <div className="text-gray-500 text-sm">No tasks</div>
                )}
                {filteredTasks
                  .filter((t) => t.status === section.status)
                  .map((task) => (
                    <div
                      key={task.id}
                      className="relative flex gap-5 items-center hover:bg-[#212121] rounded-[16px] p-3 hover:bg-[#2A2D36] transition group"
                      onMouseEnter={() => setHoveredTask(task.id)}
                      onMouseLeave={() => setHoveredTask(null)}
                    >
                      <CustomCheckbox
                        checked={selectedTasks.includes(task.id)}
                        onChange={() => toggleTaskSelection(task.id)}
                      />
                      <div className="flex-1 grow flex flex-col">
                        <div className="flex gap-2 items-center mb-2">
                      <span className="h-6 flex-shrink-0 flex gap-1 items-center bg-[#fafafa10] text-[#84AFFF] px-2 py-1 rounded-[6px]"><img className="h-4 w-4" src={task.type=="todo"?todoIcon2:reminderIcon}/>{task.type=="todo"?"To-do":"Reminder"}</span>
                      <span className="h-6 flex-shrink-0 flex gap-1 items-center bg-[#fafafa10] text-[#ffffff72] px-2 py-1 rounded-[6px]"><CalendarCogIcon className="w-4 h-4"/>{formatDueText(task.due)}</span>
                        <span className="text-[#ffffff72]">{task.name}</span>
                        </div>
                        <div className={`text-xs text-white flex gap-2 items-center mb-1 w-max rounded-[4px] px-2 py-0.5 ${task.platform=="telegram"?"bg-[#3474ff]":"bg-[#7B5CFA]"}`}>
                          
                      <div className="">{task.platform==="telegram"?<FaTelegramPlane/>:<FaDiscord/>}
                      </div>
                      
                          <span>{task.channel}</span>
                          {/* <span>#{task.server}</span> */}
                        </div>
                        <div className="flex gap-2 mt-1">
  {/* Priority tag (first tag) */}
  {/* {task.priority && (
    <span
      className={`
        text-xs rounded-[6px] px-2.5 py-1.5 font-semibold
        ${
          task.priority === "HIGH"
            ? "bg-[#f03d3d12] text-[#F68989]"
            : task.priority === "MEDIUM"
            ? "bg-[#FCBF0412] text-[#FDD868]"
            : task.priority === "LOW"
            ? "bg-[#00ff0012] text-[#7CF6A6]"
            : "bg-[#353945] text-[#A5B4FC]"
        }
      `}
    >
      {task.priority}
    </span> 
  )}*/}
  {/* Other tags */}
  {/* {task.tags.map((tag) => (
    <span
      key={tag}
      className="bg-[#7B5CFA24] text-xs text-[#BBB3FF] rounded-[6px] px-2.5 py-1.5"
    >
      {tag}
    </span>
  ))} */}
</div>
                      </div>
                      <div className="self-start">
                      {task.priority && (
    <span
      className={`
        text-xs rounded-[6px] px-2.5 py-1.5 font-semibold
        ${
          task.priority === "HIGH"
            ? "bg-[#f03d3d12] text-[#F68989]"
            : task.priority === "MEDIUM"
            ? "bg-[#FCBF0412] text-[#FDD868]"
            : task.priority === "LOW"
            ? "bg-[#00ff0012] text-[#7CF6A6]"
            : "bg-[#353945] text-[#A5B4FC]"
        }
      `}
    >
      {task.priority}
    </span>
  )}
                        </div>
                      {/* Hover actions */}
                      <div
                        className={`rounded-[8px] bg-[#242429] absolute right-4 -top-4 flex gap-0 ml-4 opacity-0 group-hover:opacity-100 transition ${
                          hoveredTask === task.id ? "opacity-100" : ""
                        }`}
                      >
                        <button title="Edit"
                        className="hover:text-[#84afff] border border-[#ffffff03] p-2"
                        onClick={()=>markTaskDone(task.id)}
                        >
                          <Check  className="h-4 w-4"/>
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
                        <button title="Mute"
                        className="hover:text-[#84afff] border border-[#ffffff03] p-2">

                        <BellOff className="h-4 w-4"/>
                        </button>
                        <button title="chat"
                        className="hover:text-[#84afff] border border-[#ffffff03] p-2">

                        <MessageCircleMoreIcon className="h-4 w-4"/>
                        </button>
                        <button
  title="more"
  className="relative hover:text-[#84afff] border border-[#ffffff03] p-2"
  onClick={(e) => {
    e.stopPropagation();
    setOpenMoreMenu(openMoreMenu === task.id ? null : task.id);
  }}
>
  <MoreHorizontal className="h-4 w-4" />
</button>
                        {openMoreMenu === task.id && (
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
        right: '-0', // adjust as needed to position to the left of the button
        top: '36px',    // adjust as needed to position below the button
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
          deleteTask(task.id);
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
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom Bar for Creating Task */}
      <div className="p-4 flex flex-col gap-2">
  <div className="flex gap-2 items-center bg-[#212121] p-2 rounded-[8px]">
    <input
      className="flex-1 bg-[#212121] rounded-[10px] px-3 py-2 text-white"
      placeholder="Create a new Task / Reminder"
      value={newTask.name}
      onChange={(e) =>
        setNewTask((prev) => ({ ...prev, name: e.target.value }))
      }
    />

    {/* Tag Button & Modal */}
    {/* <div className="relative">
      <button
        className="flex items-center gap-2 bg-[#3474FF12] rounded-[10px] px-3 py-2 text-sm text-[#84AFFF]"
        onClick={() => setOpenModal(openModal === 'tag' ? null : 'tag')}
        type="button"
      >
        Tag <Plus/>
      </button>
      {openModal === "tag" && (
        <>
          <div
      className="fixed inset-0 z-40"
      onClick={() => setOpenModal(null)}
      style={{ background: "transparent" }}
    />
        <div className="absolute bottom-full left-0 mb-2 z-50 bg-[#111111] rounded-[10px] p-4 min-w-[220px] shadow-lg">
          <div className=" mb-2">Select Tags</div>
          <div className="flex flex-wrap gap-2 mb-2">
  {Array.from(new Set([...uniqueTags, ...newTask.tags])).map((tag) => {
    const isSelected = newTask.tags.includes(tag);
    return (
      <div key={tag} className="relative flex items-center">
        <button
          className={`px-2 py-1 rounded-[6px] text-xs transition ${
            isSelected
              ? "bg-blue-500 text-white pr-5"
              : "bg-[#353945] text-gray-300 hover:bg-[#23262F]"
          }`}
          onClick={() => handleTagToggle(tag)}
          type="button"
        >
          {tag}
        </button>
        {isSelected && (
          <button
            className="absolute right-0 top-[50%] px-1 text-xs text-white hover:text-red-400"
            style={{ transform: "translateY(-50%)", fontSize: "12px" }}
            onClick={(e) => {
              e.stopPropagation();
              handleTagToggle(tag);
            }}
            title="Remove tag"
            type="button"
          >
            ×
          </button>
        )}
      </div>
    );
  })}
</div>
<div className="flex gap-3">
          <input
            className="bg-[#181A20] rounded-[10px] px-3 py-2 text-xs text-gray-400 w-full"
            placeholder="Add new tag"
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddNewTag();
            }}
          /> <button
          className="bg-[#3474ff12] text-[#84afff] hover:bg-[#3474ff48] hover:text-[#84afff] px-3 py-1 rounded-[10px] text-xs" 
          onClick={handleAddNewTag}
        >
          Add
        </button>
        </div>
          
        </div>
        </>
      )}
    </div> */}

    {/* Due Date Button & Modal */}
    <div className="relative">
      <button
        className="flex items-center gap-2 bg-[#fafafa10] rounded-[10px] px-3 py-1 text-sm text-[#ffffff]"
        onClick={() => setOpenModal(openModal === 'due' ? null : 'due')}
        type="button"
      >
        <FaCalendarAlt /> Due Date
      </button>
      {openModal === "due" && (
        <>
          <div
      className="fixed inset-0 z-40"
      onClick={() => setOpenModal(null)}
      style={{ background: "transparent" }}
    />
        <div className="absolute bottom-full left-0 mb-2 z-50 bg-[#111111] rounded-[10px] p-4 min-w-[220px] shadow-lg">
          <div className=" mb-2 flex items-center gap-2">
            <FaCalendarAlt /> Select Due Date
          </div>
          <input
            type="datetime-local"
            className="bg-[#181A20] rounded px-2 py-1 text-xs text-gray-400 w-full mb-2"
            min={new Date().toISOString().slice(0, 16)}
            value={newTask.due}
            onChange={(e) =>
              setNewTask((prev) => ({ ...prev, due: e.target.value }))
            }
          />
          {/* <div className="flex justify-end">
            <button
              className="text-xs text-gray-400"
              onClick={() => setOpenModal(null)}
            >
              Close
            </button>
          </div> */}
        </div>
        </>
      )}
    </div>

    {/* Priority Button & Modal */}
    <div className="relative">
      <button
        className={`flex items-center gap-2 bg-[#111111] rounded-[10px] px-3 py-1 text-xs text-white
            ${
                newTask.priority === "HIGH"
      ? "bg-[#f03d3d12]"
      : newTask.priority === "MEDIUM"
      ? "bg-[#fcbf0412]"
      : "bg-[#00ff0010]"
            }    `}
        onClick={() => setOpenModal(openModal === 'priority' ? null : 'priority')}
                type="button"
      >

<span
  className={
    newTask.priority === "HIGH"
      ? "text-[#F68989]"
      : newTask.priority === "MEDIUM"
      ? "text-[#FDD868]"
      : "text-[#7CF6A6]"
  }
>
  {newTask.priority}
</span>      
{openModal === "priority" ? <ChevronUp /> : <ChevronDown />}

</button>
      {openModal === "priority" && (
        <>
          <div
      className="fixed inset-0 z-40"
      onClick={() => setOpenModal(null)}
      style={{ background: "transparent" }}
    />
        <div className="absolute bottom-full right-0 mb-2 z-50 bg-[#111111] rounded-[10px] p-4 min-w-[180px] shadow-lg flex flex-col gap-2">
          <div className=" mb-2 flex items-center gap-2">
            <FaFlag /> Select Priority
          </div>
          {["HIGH", "MEDIUM", "LOW"].map((level) => (
            <button
              key={level}
              className={`w-full text-left px-3 py-2 rounded text-xs font-semibold mb-1 ${
                newTask.priority === level
                  ? level === "HIGH"
                    ? "bg-[#f03d3d12] text-[#F68989]"
                    : level === "MEDIUM"
                    ? "bg-[#FCBF0412] text-[#FDD868]"
                    : "bg-[#00ff0012] text-[#7CF6A6]"
                  : "bg-[#353945] text-gray-300"
              }`}
              onClick={() => {
                setNewTask((prev) => ({ ...prev, priority: level }));
                setOpenModal(null);
              }}
              type="button"
            >
              {level}
            </button>
          ))}
          {/* <div className="flex justify-end">
            <button
              className="text-xs text-gray-400"
              onClick={() => setOpenModal(null)}
            >
              Close
            </button>
          </div> */}
        </div>
        </>
      )}
    </div>

    <button
      className=" rounded-full p-[3px] ml-2 border-2 border-[#fafafa60] hover:border-[#fafafa] text-[#fafafa60] hover:text-[#fafafa]"
      onClick={handleCreateTask}
      title="Add Task"
    >
      <Plus className="font-[100]  w-5 h-5"/>
    </button>
  </div>
</div>
     
      {/* <div className="p-4 border-t border-gray-700 bg-[#23262F] flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            className="flex-1 bg-[#181A20] rounded px-3 py-2 text-white"
            placeholder="Create a new Task / Reminder"
            value={newTask.name}
            onChange={(e) =>
              setNewTask((prev) => ({ ...prev, name: e.target.value }))
            }
          />
          <select
  className="bg-[#181A20] rounded px-2 py-1 text-xs"
  value={newTask.type}
  onChange={(e) =>
    setNewTask((prev) => ({ ...prev, type: e.target.value }))
  }
>
  <option value="todo">To-do</option>
  <option value="reminder">Reminder</option>
</select>
          <select
            className="bg-[#181A20] rounded px-2 py-1 text-xs"
            value={newTask.platform}
            onChange={(e) =>
              setNewTask((prev) => ({ ...prev, platform: e.target.value }))
            }
          >
            <option value="discord">Discord</option>
            <option value="telegram">Telegram</option>
          </select>
          <input
            type="date"
            className="bg-[#181A20] rounded px-2 py-1 text-xs text-gray-400"
            value={newTask.due}
            onChange={(e) =>
              setNewTask((prev) => ({ ...prev, due: e.target.value }))
            }
          />
          <select
            className="bg-[#181A20] rounded px-2 py-1 text-xs"
            value={newTask.priority}
            onChange={(e) =>
              setNewTask((prev) => ({ ...prev, priority: e.target.value }))
            }
          >
            <option>HIGH</option>
            <option>MEDIUM</option>
            <option>LOW</option>
          </select>
          <select
            className="bg-[#181A20] rounded px-2 py-1 text-xs"
            value={newTask.status}
            onChange={(e) =>
              setNewTask((prev) => ({ ...prev, status: e.target.value }))
            }
          >
            {TASK_SECTIONS.map((s) => (
              <option key={s.status} value={s.status}>
                {s.title}
              </option>
            ))}
          </select>
          <button
            className="bg-red-500 rounded px-3 py-2 ml-2"
            onClick={handleCreateTask}
            title="Add Task"
          >
            <FaPlus />
          </button>
        </div>
        <div className="flex gap-2 items-center mt-1">
          <div className="flex gap-1 flex-wrap">
            {uniqueTags.map((tag:string) => (
              <button
                key={tag}
                className={`px-2 py-0.5 rounded text-xs ${
                  newTask.tags.includes(tag)
                    ? "bg-blue-500 text-white"
                    : "bg-[#353945] text-gray-300"
                }`}
                onClick={() => handleTagToggle(tag)}
                type="button"
              >
                {tag}
              </button>
            ))}
          </div>
          <input
            className="bg-[#181A20] rounded px-2 py-1 text-xs text-gray-400 ml-2"
            placeholder="Add tag"
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddNewTag();
            }}
          />
          <button
            className="bg-blue-500 rounded px-2 py-1 text-xs text-white"
            onClick={handleAddNewTag}
            type="button"
          >
            Add Tag
          </button>
        </div>
        <div className="flex gap-2 mt-1">
          <select
            className="bg-[#181A20] rounded px-2 py-1 text-xs flex-1"
            value={newTask.channel}
            onChange={(e) =>
              setNewTask((prev) => ({ ...prev, channel: e.target.value }))
            }
          >
            <option value="">Select Channel</option>
            {uniqueChannels.map((ch:string) => (
              <option key={ch} value={ch}>
                {ch}
              </option>
            ))}
          </select>
          <select
            className="bg-[#181A20] rounded px-2 py-1 text-xs flex-1"
            value={newTask.server}
            onChange={(e) =>
              setNewTask((prev) => ({ ...prev, server: e.target.value }))
            }
          >
            <option value="">Select Server</option>
            {uniqueServers.map((sv:string) => (
              <option key={sv} value={sv}>
                {sv}
              </option>
            ))}
          </select>
        </div>
        <textarea
          className="bg-[#181A20] rounded px-3 py-2 text-white mt-1"
          placeholder="Description"
          value={newTask.description}
          onChange={(e) =>
            setNewTask((prev) => ({ ...prev, description: e.target.value }))
          }
        />
      </div> */}
    </div>
  );

};

export default TasksPanel;