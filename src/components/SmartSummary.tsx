import React, { useState, useRef, useEffect } from "react";
import { FaCog, FaChevronDown, FaStar, FaCheckCircle, FaClock, FaPlus, FaEllipsisH, FaChevronRight, FaChevronLeft, FaDiscord, FaTelegram, FaTelegramPlane } from "react-icons/fa";
import alphaImage from "@/assets/images/alphaFeatured.png";
import todoIcon from "@/assets/images/todoIcon.png";
import aiBlue from "@/assets/images/aiBlue.png";
import smartTodo from "@/assets/images/smartTodo.png";
import CustomCheckbox from "./CustomCheckbox";
import LinkPreview from "./LinkPreview";
import { CalendarCog, CalendarCogIcon, ThumbsUp, Heart, MessageCircle } from "lucide-react";

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
      tag: "#PORTALCOIN ",
      bot: "#BOT",
      icon: smartTodo,
      platform: 'telegram'
    },
    {
      id: 2,
      label: "Reminder",
      desc: "Updates: Monad mainnet live",
      tag: "ALPHA GUILD ",
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
const [selectedFilter, setSelectedFilter] = useState('All');

const handleFilterChange = (filter: string) => {
  setSelectedFilter(filter);
};
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
    <aside className="h-[calc(100vh-72px)] overflow-y-scroll overflow-x-hidden min-w-[500px] bg-[#111111] text-white rounded-2xl py-2 flex flex-col shadow-lg border border-[#23242a]"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 px-2 border-b">
        <span className="font-[200] text-[#ffffff72]">Smart Summary</span>
        <div className="flex items-center gap-2">
          {/* Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              className="flex items-center justify-evenly gap-1 bg-[#23242a] px-2 py-1 rounded-lg text-xs font-medium"
              onClick={() => setDropdownOpen((open) => !open)}
            >
                    <CalendarCog className="h-4 w-4 "/>
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
      <div className="flex items-center justify-end gap-2 text-xs py-3 px-2 border-b ">
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
      className="flex flex-nowrap justify-end overflow-x-auto scrollbar-hide gap-2 text-xs px-0"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <button className={`flex-shrink-0 flex items-center whitespace-nowrap gap-1 px-2 py-1 hover:text-white text-[#fafafa60] hover:bg-[#fafafa10] rounded-lg leading-1
      ${
              selectedFilter === 'All'
                ? 'text-[#fafafa] bg-[#fafafa10]'
                : 'text-[#fafafa60] hover:text-[#fafafa] hover:bg-[#fafafa10]'
            }`}
       onClick={() => handleFilterChange('All')}>
        All
      </button>
      <button className={`flex-shrink-0 flex items-center whitespace-nowrap gap-1 px-2 py-1 hover:text-white text-[#fafafa60] hover:bg-[#fafafa10] rounded-lg leading-1 
      ${
              selectedFilter === 'Alpha'
                ? 'text-[#fafafa] bg-[#fafafa10]'
                : 'text-[#fafafa60] hover:text-[#fafafa] hover:bg-[#fafafa10]'
            }`}
       onClick={() => handleFilterChange('Alpha')}>

        Alpha
      </button>
      <button className={`flex-shrink-0 flex items-center whitespace-nowrap gap-1 px-2 py-1 hover:text-white text-[#fafafa60] hover:bg-[#fafafa10] rounded-lg leading-1 
      ${
              selectedFilter === 'Todo'
                ? 'text-[#fafafa] bg-[#fafafa10]'
                : 'text-[#fafafa60] hover:text-[#fafafa] hover:bg-[#fafafa10]'
            }`}
       onClick={() => handleFilterChange('Todo')}>

        To-dos
      </button>
      <button className={`flex-shrink-0 flex items-center whitespace-nowrap gap-1 px-2 py-1 hover:text-white text-[#fafafa60] hover:bg-[#fafafa10] rounded-lg leading-1 
      ${
              selectedFilter === '@'
                ? 'text-[#fafafa] bg-[#fafafa10]'
                : 'text-[#fafafa60] hover:text-[#fafafa] hover:bg-[#fafafa10]'
            }`}
       onClick={() => handleFilterChange('@')}>
        @
      </button>
      {/* <button className="flex-shrink-0 flex items-center whitespace-nowrap gap-1 px-2 py-1 text-white rounded-lg ">
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
      </button> */}
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

      {/* Alpha Section */}
      {selectedFilter === 'All' || selectedFilter === 'Alpha' ? (
    <div className=" rounded-xl mb-2 px-2 mt-4 ">
        <div className="flex justify-between items-center gap-2 mb-2">
            <span className="text-xs text-[#fafafa] leading-none">Alpha</span>
            <span className="text-xs font-[300] text-[#fafafa60] leading-none">2 MIN AGO</span>
        </div>
        <div className="bg-[#171717] px-8 py-4 rounded-[16px]">
        <ul className=" list-disc list-outside text-sm text-[#fafafa] space-y-1 [--tw-prose-bullets:#84afff] marker:text-[#84afff]">
            <li>Frustration over delays: Users upset about 5–6 week silence on V2 and lack of communication.</li>
            <li>Market sentiment: Bearish tone; some fear potential Binance delisting.</li>
            <li>Requests: Community pushing for V2 timeline and AMAs/Discord setup.</li>
            <li>Trading: No alpha shared; sentiment negative.</li>
        </ul>
        </div>
      </div>):null}


      {/* To-dos / Requests */}
      {selectedFilter === 'All' || selectedFilter === 'Todo' ? (

      <div className="mb-2 px-2 mt-4 ">
      <div className="flex items-center justify-between gap-2 mb-2">
        
            <span className="text-xs text-[#fafafa] leading-none">To-dos / Requests</span>
            <span className="text-xs font-[300] text-[#fafafa60] leading-none">2 MIN AGO</span>
        </div>
        <div className="bg-[#171717] px-2 py-2 rounded-[16px]" >

        {todos.map((todo) => (
   <div className="flex  items-start gap-0 mb-2 bg-[#222327] p-2 rounded-[6px] border border-[#ffffff09]" key={todo.id}>
   <div className="flex-shrink-0 w-8 flex items-center justify-center">
   <CustomCheckbox
   checked={!!checkedItems[todo.id]}
   onChange={()=>{}}
  //  onChange={() => handleCheckboxChange(todo)}
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
          <button   
            onClick={handleSelectAll}
            className="w-[50%] text-xs text-gray-400 hover:text-white">Select All</button>
          <button className="w-[50%] bg-[#3474ff12] text-[#84afff] hover:text-[#ffffff] hover:bg-[#3474ff72] text-xs px-4 py-2 rounded-[8px]">Add Selected</button>
        </div>
    </div>
       
      </div>
      ):null}

      {/* Mentions*/}
      {selectedFilter === 'All' || selectedFilter === '@' ?       (
        <div className="mb-2 px-2 mt-4 ">
      <div className="flex items-center justify-between gap-2 mb-2">
        
            <span className="text-xs text-[#fafafa] leading-none">@Mentions</span>
            <span className="text-xs font-[300] text-[#fafafa60] leading-none">2 MIN AGO</span>
        </div>
        <div className="bg-[#171717] px-2 py-2 rounded-[16px]" >

        {todos.map((todo) => (
      <div className="flex items-start gap-3 py-3 px-4 rounded-[10px] shadow-sm mb-2 bg-[#212121]">
      {/* Avatar */}
      <img
        src="https://www.gravatar.com/avatar/example?s=80"
        alt="James Steven"
        className="w-10 h-10 rounded-full object-cover"
      />
      {/* Message Content */}
      <div className="flex-1">
        <div className="flex items-center justify-start gap-2">
          <span className="text-[#ffffff] font-[300] text-sm">James Steven</span>
          <span className="text-xs text-[#fafafa99]">#general</span>
          <span className="text-xs text-[#fafafa99]">03/02/25, 18:49</span>
        </div>
        <div className="flex items-center gap-0 mt-1 bg-[#3474ff] w-max rounded-[6px]">
          <FaTelegramPlane className="text-[#ffffff] w-3 h-3 ml-1" />
          <span className="text-xs text-white  rounded pr-2 pl-1 py-0.5">
            Alpha Guild
          </span>
        </div>
        <div className="mt-2 text-sm text-[#e0e0e0]">
          <span className="text-[#84afff]">@everyone</span> Stealth claim just
          opened. Zero tax, no presale. Contract verified 2 mins ago.
        </div>
        {/* Reactions */}
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
       
      </div>):null}

      {/* Smart Activity */}
      {/* <div className="flex items-center gap-2 mb-2 px-2 ">
        
        <img className="h-4 w-4 object-contain" src={todoIcon} alt="Alpha" />
        <span className="text-xs text-[#84afff] leading-none">Smart Activity</span>
        <span className="text-xs font-[300] text-[#ffffff32] leading-none">2 MIN AGO</span>
    </div>
    {smartActivities.map((activity, idx) => (
  <div key={idx} className="mb-4 px-2 ">
    
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
        <LinkPreview url={activity.url} />
      
      </div>
    </div>
  </div>
))} */}
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