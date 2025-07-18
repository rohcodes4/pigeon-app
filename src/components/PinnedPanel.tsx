import React, { useState, useRef, useEffect } from "react";
import { FaCog, FaChevronDown, FaStar, FaCheckCircle, FaClock, FaPlus, FaEllipsisH, FaChevronRight, FaChevronLeft, FaDiscord, FaTelegram, FaTelegramPlane } from "react-icons/fa";
import alphaImage from "@/assets/images/alphaFeatured.png";
import todoIcon from "@/assets/images/todoIcon.png";
import aiBlue from "@/assets/images/aiBlue.png";
import smartTodo from "@/assets/images/smartTodo.png";
import CustomCheckbox from "./CustomCheckbox";
import LinkPreview from "./LinkPreview";
import { CalendarCogIcon, ChevronDown, ChevronUp } from "lucide-react";

const TIME_OPTIONS = [
  { label: "5 min", value: "5m" },
  { label: "30 min", value: "30m" },
  { label: "1 hr", value: "1h" },
  { label: "6 hr", value: "6h" },
  { label: "24 hr", value: "24h" },
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
      platform: 'telegram'
    },
    {
      id: 2,
      label: "Reminder",
      desc: "Updates: Monad mainnet live",
      tag: "ALPHA GUILD | #GENERAL",
      bot: "",
      icon: smartTodo,
      platform: 'discord'
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
      platform: 'telegram'
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
      platform: 'discord'
    },
    {
      id: 202,
      label: "Reminder",
      desc: "Review last week's analytics",
      tag: "#ANALYTICS | #REVIEW",
      bot: "",
      icon: smartTodo,
      platform: 'discord'
    },
    // ...more backlog items
  ];

  const smartActivities = [
    {
      platform: "telegram",
      url: "https://t.me/examplechannel",
      content: "$GOR entered Proof-of-Cope meta. 0 devs. 100% community raid. ATH in 40 mins.",
      name: "WOLVERINE",
      channel: "POW'S GEM CALLS",
      img: `https://api.dicebear.com/7.x/bottts/svg?seed=alpha1`,
    },
    {
      platform: "discord",
      url: "https://discord.com/channels/example",
      content: "Big news: Project X just launched! 🚀 Join the discussion in #general.",
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

const PinnedPanel = () => {
  const [selectedTime, setSelectedTime] = useState(TIME_OPTIONS[4]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const tabScrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
const [checkedItems, setCheckedItems] = useState<{ [id: number]: boolean }>({});
const [source, setSource] = useState<'all' | 'tg' | 'discord'>('all');
const [showSourceDropdown, setShowSourceDropdown] = useState(false);
const [selectedTab, setSelectedTab] = useState<'all' | 'todo' | 'reminder' | 'mentions'>('all');
const [openTab, setOpenTab] = useState<number | null>(0);
const [selectedTasks, setSelectedTasks] = useState([]);
const dropdownRef2 = useRef<HTMLDivElement>(null);
useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (dropdownRef2.current && !dropdownRef2.current.contains(event.target as Node)) {
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
    el.scrollBy({ left: dir === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
  };
  
  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
    todosArray.forEach(todo => {
      newChecked[todo.id] = true;
    });
    setCheckedItems(newChecked);
    setSelectedTasks(todosArray)
  };

  const handleAddAllSelected = (todosArray) => {
     
    // Do something with selectedTodos, e.g.:
    console.log("Adding these todos:", selectedTasks);
    // You can add your logic here (e.g., move to another list, send to API, etc.)
  };
  return (
    <aside className="h-[calc(100vh-72px)] overflow-y-scroll overflow-x-hidden min-w-[500px] bg-[#111111] text-white rounded-2xl flex flex-col shadow-lg border border-[#23242a]"
    >
      {/* Header */}
      <div className="flex items-center justify-between py-2 px-2">
        <span className="font-[200] text-[#ffffff72]">Pinned</span>
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
    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  </button>
  {showSourceDropdown && (
    <div className="absolute left-0 mt-2 w-32 bg-[#23262F] rounded shadow-lg z-10">
      <button
        className={`block w-full text-left px-4 py-2 hover:bg-[#353945] ${source === 'all' ? 'font-bold' : ''}`}
        onClick={() => { setSource('all'); setShowSourceDropdown(false); }}
      >
        All
      </button>
      <button
        className={`block w-full text-left px-4 py-2 hover:bg-[#353945] ${source === 'tg' ? 'font-bold' : ''}`}
        onClick={() => { setSource('tg'); setShowSourceDropdown(false); }}
      >
        Telegram
      </button>
      <button
        className={`block w-full text-left px-4 py-2 hover:bg-[#353945] ${source === 'discord' ? 'font-bold' : ''}`}
        onClick={() => { setSource('discord'); setShowSourceDropdown(false); }}
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
    <CalendarCogIcon className="w-4 h-4"/>
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
                      selectedTime.value === option.value ? "text-blue-400" : "text-white"
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
        <div className="flex flex-nowrap overflow-x-auto relative"
        >
       {showLeftArrow && <button
  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 shadow "
  style={{
    background: "linear-gradient(to left, transparent, rgba(0,0,0,1) 70%)"
  }}
  onClick={() => scrollTabs("left")}
  aria-label="Scroll left"
>
  <FaChevronLeft size={14} />
</button>}
<div
  ref={tabScrollRef}
  className="flex justify-end w-full flex-nowrap overflow-x-auto scrollbar-hide gap-2 text-xs px-0"
  style={{ WebkitOverflowScrolling: "touch" }}
>
  <button
    className={`flex-shrink-0 flex items-center whitespace-nowrap gap-1 px-2 py-1 rounded-lg ${
      selectedTab === 'all'
        ? 'text-white bg-[#fafafa10]'
        : 'text-[#fafafa60] hover:text-white hover:bg-[#fafafa10]'
    }`}
    onClick={() => setSelectedTab('all')}
  >
    All
  </button>
  <button
    className={`flex-shrink-0 flex items-center whitespace-nowrap gap-1 px-2 py-1 rounded-lg ${
      selectedTab === 'todo'
        ? 'text-white bg-[#fafafa10]'
        : 'text-[#fafafa60] hover:text-white hover:bg-[#fafafa10]'
    }`}
    onClick={() => setSelectedTab('todo')}
  >
    To-do's
  </button>
  <button
    className={`flex-shrink-0 flex items-center whitespace-nowrap gap-1 px-2 py-1 rounded-lg ${
      selectedTab === 'reminder'
        ? 'text-white bg-[#fafafa10]'
        : 'text-[#fafafa60] hover:text-white hover:bg-[#fafafa10]'
    }`}
    onClick={() => setSelectedTab('reminder')}
  >
    Reminder's
  </button>
  <button
    className={`flex-shrink-0 flex items-center whitespace-nowrap gap-1 px-2 py-1 rounded-lg ${
      selectedTab === 'mentions'
        ? 'text-white bg-[#fafafa10]'
        : 'text-[#fafafa60] hover:text-white hover:bg-[#fafafa10]'
    }`}
    onClick={() => setSelectedTab('mentions')}
  >
    @
  </button>
</div>
   {showRightArrow && <button
  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 shadow"
  style={{
    background: "linear-gradient(to right, transparent, rgba(0,0,0,1) 70%)"
  }}
  onClick={() => scrollTabs("right")}
  aria-label="Scroll right"
>
  <FaChevronRight size={14} />
</button>}
        
        </div>
      </div>


      {/* To-dos / Requests */}
      <div className="mb-2 px-2">
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
      {/* {todo.label=="Reminder" && <span className="bg-[#23242a] text-xs text-gray-400 px-2 py-0.5 rounded flex items-center gap-1"></span>} */}
    </span>
    {/* <button className="ml-auto p-1 bg-[#2d2d2d] border-2 border-[#ffffff03] rounded-[6px] hover:text-white text-[#ffffff72] ">
      <FaPlus />
    </button>
    <button className="p-1 bg-[#2d2d2d] border-2 border-[#ffffff03] rounded-[6px] hover:text-white text-[#ffffff72]">
      <FaEllipsisH />
    </button> */}
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
          {/* <button   
            onClick={handleSelectAll}
            className="w-[50%] text-xs text-gray-400 hover:text-white">Select All</button>
          <button className="w-[50%] bg-[#3474ff12] text-[#84afff] hover:text-[#ffffff] hover:bg-[#3474ff72] text-xs px-4 py-2 rounded-[8px]">Add Selected</button> */}
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
      {/* {todo.label=="Reminder" && <span className="bg-[#23242a] text-xs text-gray-400 px-2 py-0.5 rounded flex items-center gap-1"></span>} */}
    </span>
    {/* <button className="ml-auto p-1 bg-[#2d2d2d] border-2 border-[#ffffff03] rounded-[6px] hover:text-white text-[#ffffff72] ">
      <FaPlus />
    </button>
    <button className="p-1 bg-[#2d2d2d] border-2 border-[#ffffff03] rounded-[6px] hover:text-white text-[#ffffff72]">
      <FaEllipsisH />
    </button> */}
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
          {/* <button   
            onClick={handleSelectAll}
            className="w-[50%] text-xs text-gray-400 hover:text-white">Select All</button>
          <button className="w-[50%] bg-[#3474ff12] text-[#84afff] hover:text-[#ffffff] hover:bg-[#3474ff72] text-xs px-4 py-2 rounded-[8px]">Add Selected</button> */}
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
              {/* {todo.label=="Reminder" && <span className="bg-[#23242a] text-xs text-gray-400 px-2 py-0.5 rounded flex items-center gap-1"></span>} */}
            </span>
            {/* <button className="ml-auto p-1 bg-[#2d2d2d] border-2 border-[#ffffff03] rounded-[6px] hover:text-white text-[#ffffff72] ">
              <FaPlus />
            </button>
            <button className="p-1 bg-[#2d2d2d] border-2 border-[#ffffff03] rounded-[6px] hover:text-white text-[#ffffff72]">
              <FaEllipsisH />
            </button> */}
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
          {/* <button   
            onClick={handleSelectAll}
            className="w-[50%] text-xs text-gray-400 hover:text-white">Select All</button>
          <button className="w-[50%] bg-[#3474ff12] text-[#84afff] hover:text-[#ffffff] hover:bg-[#3474ff72] text-xs px-4 py-2 rounded-[8px]">Add Selected</button> */}
        </div>
    </div>
        )}
       
      </div>
      <div className="flex w-full px-2">
      <button
  onClick={() => {handleSelectAll(filteredTodos);handleSelectAll(favoriteTodos);handleSelectAll(backlogTodos)}}
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

export default PinnedPanel;