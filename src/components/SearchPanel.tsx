import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Clock, MessageCircle, ExternalLink, ThumbsUp, Heart, CalendarCogIcon } from "lucide-react";
import { FaDiscord, FaTelegramPlane } from "react-icons/fa";
import smartTodo from "@/assets/images/smartTodo.png";
import CustomCheckbox from "./CustomCheckbox";

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

export const SearchPanel = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  const [checkedItems, setCheckedItems] = useState<{ [id: number]: boolean }>({});
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('All');

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
  };

  // Mock search results
  const searchResults = [
    {
      id: 1,
      chatName: "James Steven",
      messageContent: "For the first time in MENA, Play It is a gaming platform...",
      timestamp: "2 min ago",
      platform: "Alpha Guild",
      author: "James Steven",
      reactions: { thumbsUp: 38, heart: 21, message: 16 },
    },
    {
      id: 2,
      chatName: "jameson",
      messageContent: "$GOR entered Proof-of-Cope meta...",
      timestamp: "2 min ago",
      platform: "Pow's Gem Calls",
      author: "jameson",
      reactions: { thumbsUp: 38, heart: 21, message: 16 },
    },
  ];

  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      setHasResults(true);
    }, 1500);
  };

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
    <div className="bg-[#171717] text-white min-w-[500px] border-l">
    <div className="flex justify-between items-center border-b py-2 px-2">
      <h2 className="text-lg font-bold">Search</h2>
      <select className="bg-[#fafafa10] text-white p-2 px-3 rounded">
        <option>All sources</option>
        <option>Telegram</option>
        <option>Discord</option>
      </select>
    </div>
    <div className="flex items-center justify-between space-x-2 mb-2 p-2 border-b">
      <div>550 Results</div>
      <div className="flex gap-2">
      {['All', 'Chats', 'ToDos', '@'].map((filter) => (
          <button
            key={filter}
            onClick={() => handleFilterChange(filter)}
            className={`px-4 py-2 rounded-[4px] ${
              selectedFilter === filter
                ? 'text-[#fafafa] bg-[#fafafa10]'
                : 'text-[#fafafa60] hover:text-[#fafafa] hover:bg-[#fafafa10]'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>
    </div>
    {selectedFilter === 'All' || selectedFilter === 'Chats' ? (

   <div className="mb-4 p-2 py-2">
      <div className="flex item-center justify-between mb-1">
      <h3 className="text-sm text-[#fafafa] mb-2">Chats</h3>
      <span className="text-[#fafafa60]">2 min ago</span>
      </div>
      <div className="flex items-start gap-3 py-3 px-4 rounded-[10px] shadow-sm mb-2 bg-[#222327] border border-[#fafafa10]">
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
    
    </div>
  ):null}
          {selectedFilter === 'All' || selectedFilter === 'ToDos' ? (

    <div className="p-2">
    <div className="flex item-center justify-between mb-1">
      <h3 className="text-sm text-[#fafafa] mb-2">To-dos / Requests</h3>
      <span className="text-[#fafafa60]">2 min ago</span>
      </div>
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
     <div className="flex w-full px-2 ">
      <button
  onClick={() => {handleSelectAll(filteredTodos)}}
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
          ):null}

          {selectedFilter === 'All' || selectedFilter === '@' ? (
<div className="mt-8 px-2 ">
      <div className="flex items-center justify-between gap-2 mb-2">
        
            <span className="text-xs text-[#fafafa] leading-none">@Mentions</span>
            <span className="text-xs font-[300] text-[#fafafa60] leading-none">2 MIN AGO</span>
        </div>
        <div className="bg-[#171717] py-2 rounded-[16px]" >

        {filteredTodos.map((todo) => (
      <div className="flex items-start gap-3 py-3 px-4 rounded-[10px] shadow-sm mb-2 bg-[#222327]">
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
       
      </div>
    ):null}

  </div>
  );
};