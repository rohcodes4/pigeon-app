import React, { useState, useRef, useEffect } from "react";
import { FaCog, FaChevronDown, FaStar, FaCheckCircle, FaClock, FaPlus, FaEllipsisH, FaChevronRight, FaChevronLeft, FaDiscord, FaTelegram, FaTelegramPlane } from "react-icons/fa";
import alphaImage from "@/assets/images/alphaFeatured.png";
import todoIcon from "@/assets/images/todoIcon.png";
import aiBlue from "@/assets/images/aiBlue.png";
import smartTodo from "@/assets/images/smartTodo.png";
import CustomCheckbox from "./CustomCheckbox";
import LinkPreview from "./LinkPreview";

const TIME_OPTIONS = [
  { label: "5 min", value: "5m" },
  { label: "30 min", value: "30m" },
  { label: "1 hr", value: "1h" },
  { label: "6 hr", value: "6h" },
  { label: "24 hr", value: "24h" },
];


const todos = [
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
    // ...more items
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

const SmartSummary = () => {
  const [selectedTime, setSelectedTime] = useState(TIME_OPTIONS[4]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const tabScrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
const [checkedItems, setCheckedItems] = useState<{ [id: number]: boolean }>({});

const handleCheckboxChange = (id: number) => {
    setCheckedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSelectAll = () => {
    const allChecked: { [id: number]: boolean } = {};
    todos.forEach(todo => {
      allChecked[todo.id] = true;
    });
    setCheckedItems(allChecked);
  };
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

  return (
    <aside className="h-[calc(100vh-72px)] overflow-y-scroll overflow-x-hidden w-[40vw] min-w-[340px] bg-[#111111] text-white rounded-2xl p-2 flex flex-col gap-4 shadow-lg border border-[#23242a]"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-[200] text-[#ffffff72]">Smart Summary</span>
        <div className="flex items-center gap-2">
          {/* Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              className="flex items-center bg-[#23242a] px-2 py-1 rounded-lg text-xs font-medium"
              onClick={() => setDropdownOpen((open) => !open)}
            >
              {selectedTime.label} <FaChevronDown className="ml-1 text-xs" />
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
      <div className="flex items-center gap-2 text-xs mb-2">
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
      className="flex flex-nowrap overflow-x-auto scrollbar-hide gap-2 text-xs px-0"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <button className="flex-shrink-0 flex items-center whitespace-nowrap gap-1 px-2 py-1 text-white rounded-lg ">
        Smart Digest
      </button>
      <button className="flex-shrink-0 flex items-center whitespace-nowrap gap-1 px-2 py-1 hover:text-white rounded-lg">
        🔥 <span className="text-[#ffffff48] ">Alpha</span>
      </button>
      <button className="flex-shrink-0 flex items-center whitespace-nowrap gap-1 px-2 py-1 hover:text-white rounded-lg">
        💼 <span className="text-[#ffffff48] ">Tasks</span>
      </button>
      <button className="flex-shrink-0 flex items-center whitespace-nowrap gap-1 px-2 py-1 hover:text-white rounded-lg">
        💬 <span className="text-[#ffffff48] ">Mentions</span>
      </button>
      <button className="flex-shrink-0 flex items-center whitespace-nowrap gap-1 px-2 py-1 text-white rounded-lg ">
        Smart Digest
      </button>
      <button className="flex-shrink-0 flex items-center whitespace-nowrap gap-1 px-2 py-1 hover:text-white rounded-lg">
        🔥 <span className="text-[#ffffff48] ">Alpha</span>
      </button>
      <button className="flex-shrink-0 flex items-center whitespace-nowrap gap-1 px-2 py-1 hover:text-white rounded-lg">
        💼 <span className="text-[#ffffff48] ">Tasks</span>
      </button>
      <button className="flex-shrink-0 flex items-center whitespace-nowrap gap-1 px-2 py-1 hover:text-white rounded-lg">
        💬 <span className="text-[#ffffff48] ">Mentions</span>
      </button>
      {/* Add more tabs if needed */}
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

      {/* Digest Section */}
      <div className=" rounded-xl mb-2">
        <div className="flex items-center gap-2 mb-2">
            <img className="h-4 w-4 object-contain" src={alphaImage} alt="Alpha" />
            <span className="text-xs text-[#84afff] leading-none">Alpha</span>
            <span className="text-xs font-[300] text-[#ffffff32] leading-none">2 MIN AGO</span>
        </div>
        <div className="bg-[#171717] px-6 py-2 rounded-[16px]">
        <ul className=" list-disc list-outside text-sm text-[#ffffff72] space-y-1 [--tw-prose-bullets:#fdcb35] marker:text-[#fdcb35]">
            <li>Frustration over delays: Users upset about 5–6 week silence on V2 and lack of communication.</li>
            <li>Market sentiment: Bearish tone; some fear potential Binance delisting.</li>
            <li>Requests: Community pushing for V2 timeline and AMAs/Discord setup.</li>
            <li>Trading: No alpha shared; sentiment negative.</li>
        </ul>
        </div>
      </div>


      {/* To-dos / Requests */}
      <div className="mb-2">
      <div className="flex items-center gap-2 mb-2">
        
            <img className="h-4 w-4 object-contain" src={todoIcon} alt="Alpha" />
            <span className="text-xs text-[#84afff] leading-none">To-dos / Requests</span>
            <span className="text-xs font-[300] text-[#ffffff32] leading-none">2 MIN AGO</span>
        </div>
        <div className="bg-[#171717] px-2 py-2 rounded-[16px]" >

        {todos.map((todo) => (
      <div className="flex items-start gap-2 mb-2" key={todo.id}>
        <CustomCheckbox
          checked={!!checkedItems[todo.id]}
          onChange={() => handleCheckboxChange(todo.id)}
        />
        <div className="flex-1 bg-[#212121] rounded-[8px] p-2">
          <div className="flex items-center gap-2">
            <span className="bg-[#212121] border-[#ffffff03] border-2 shadow-xl text-blue-300 text-xs px-2 py-0.5 rounded-[6px] font-medium flex items-center gap-1">
              <img src={todo.icon} className="h-4 w-4" />
              {todo.label}
              {todo.label=="Reminder" && <span className="bg-[#23242a] text-xs text-gray-400 px-2 py-0.5 rounded flex items-center gap-1"><FaClock className="text-gray-400" /> 3d</span>}
            </span>
            <button className="ml-auto p-1 bg-[#2d2d2d] border-2 border-[#ffffff03] rounded-[6px] hover:text-white text-[#ffffff72] ">
              <FaPlus />
            </button>
            <button className="p-1 bg-[#2d2d2d] border-2 border-[#ffffff03] rounded-[6px] hover:text-white text-[#ffffff72]">
              <FaEllipsisH />
            </button>
          </div>
          <div className="text-sm text-[#ffffff72] truncate mt-1">{todo.desc}</div>
          <span className={`text-xs ${todo.platform=="telegram"?'text-[#3474ff]':'text-[#7b5cfa]'} flex gap-1 items-center mt-1`}>
            {todo.platform=="telegram"?<FaTelegramPlane />:<FaDiscord/>}
            {todo.tag}
            {todo.bot && <span className="text-xs text-[#ffffff48]">{todo.bot}</span>}
          </span>
        </div>
      </div>
    ))}
      <div className="flex items-center justify-between mt-2">
          <button   
            onClick={handleSelectAll}
            className="w-[50%] text-xs text-gray-400 hover:text-white">Select All</button>
          <button className="w-[50%] bg-[#3474ff12] text-[#84afff] hover:text-[#ffffff] hover:bg-[#3474ff72] text-xs px-4 py-2 rounded-[8px]">Add Selected</button>
        </div>
    </div>
       
      </div>

      {/* Smart Activity */}
      <div className="flex items-center gap-2 mb-2">
        
        <img className="h-4 w-4 object-contain" src={todoIcon} alt="Alpha" />
        <span className="text-xs text-[#84afff] leading-none">Smart Activity</span>
        <span className="text-xs font-[300] text-[#ffffff32] leading-none">2 MIN AGO</span>
    </div>
    {smartActivities.map((activity, idx) => (
  <div key={idx} className="mb-4">
    
    <div className="bg-[#23242a] rounded-xl p-4 flex gap-2">
      <img
        src={activity.img}
        className="h-8 w-8 bg-[#453244] rounded-full p-1"
        alt="Profile"
      />
      <div>
        <div className="flex items-center gap-2 mb-2">
          <a
            href={activity.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`${activity.platform=="telegram"?'text-[#3474FF]':'text-[#7b5cfa]'} px-2 py-0.5 rounded font-medium text-xs hover:underline flex gap-1 items-center`}
          >
            {activity.platform=="telegram"?<FaTelegramPlane/>:<FaDiscord/>}
            {activity.channel}
          </a>
          <span className="text-xs text-gray-400">{activity.name}</span>
        </div>
        <div className="text-sm text-[#ffffff72] mb-2">
          {activity.content}
        </div>
        {/* Embedded card */}
        <LinkPreview url={activity.url} />
        {/* <div className="bg-[#181A20] rounded-lg p-3 border border-[#23242a]">
          <div className="font-semibold text-gray-100 mb-1 text-xs">Lorem Ipsum dolor sit amet</div>
          <div className="text-xs text-gray-400 mb-2">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sollicitudin dolor libero, quis ...
          </div>
          <div className="bg-[#23242a] h-16 rounded-lg" />
        </div> */}
      </div>
    </div>
  </div>
))}
      {/* <div className="bg-[#23242a] rounded-xl p-4 flex gap-2">
      <img
  src={`https://api.dicebear.com/7.x/bottts/svg?seed=${Math.random().toString(36).substring(2, 10)}`}
  className="h-8 w-8 bg-[#453244] rounded-full p-1"
  alt="Profile"
/>
        <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-pink-400 px-2 py-0.5 rounded font-medium text-xs">POW'S GEM CALLS</span>
          <span className="text-xs text-gray-400">WOLVERINE</span>
        </div>
        <div className="text-sm text-[#ffffff72]  mb-2">
          $GOR entered Proof-of-Cope meta. 0 devs. 100% community raid. ATH in 40 mins.
        </div>
        <div className="bg-[#181A20] rounded-lg p-3 border border-[#23242a]">
          <div className="font-semibold text-gray-100 mb-1 text-xs">Lorem Ipsum dolor sit amet</div>
          <div className="text-xs text-gray-400 mb-2">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sollicitudin dolor libero, quis ...</div>
          <div className="bg-[#23242a] h-16 rounded-lg" />
        </div>
        </div>
      </div> */}
      
    </aside>
  );
};

export default SmartSummary;