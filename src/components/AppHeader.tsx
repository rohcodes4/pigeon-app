import React, { useState, useRef, useEffect } from "react";
import { Bell, Check, Filter, Pin, Search, X, Plus, Trash } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type AppHeaderProps = {
  title?: string;
  setIsNotificationPanel?: (value: boolean) => void;
  isNotificationPanel?: boolean;
  isPinnedOpen: boolean;
  isSearchOpen: boolean;
  onOpenPinnedPanel?: (value: boolean) => void;
  setIsPinnedOpen?: (value: boolean) => void;
  setIsSearchOpen?: (value: boolean) => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedOptions: string[];
  setSelectedOptions: (value: string[]) => void;
};

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  setIsNotificationPanel,
  isNotificationPanel,
  onOpenPinnedPanel,
  setIsPinnedOpen,
  isPinnedOpen,
  isSearchOpen,
  setIsSearchOpen,
  searchTerm,
  setSearchTerm,
  selectedOptions,
  setSelectedOptions,
}) => {
  const { user, signOut } = useAuth();
  const [dropdown, setDropdown] = useState(false);
  const [searchOptions, setSearchOptions] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  // const [searchHistory, setSearchHistory] = useState<string[]>(["filter: Shitcoin Alpha", "Test Search text"]);
  const searchRef = useRef<HTMLDivElement>(null);
  const [selectedSource, setSelectedSource] = useState("All sources");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // useEffect(()=>{
  //   if(searchTerm.length>0){
  //     setIsSearchOpen(!isSearchOpen)
  //   }
  // },[searchTerm])
  // const options = [
  //   "from: a user",
  //   "mentions: a user or channel",
  //   "from: a channel or user",
  //   "filter: a channel or user",
  //   "to-do: a task or reminder",
  //   "favourite: a message or task"
  // ];

  const options = [
    { value: "from_user", filters: ["user"], label: "From: a user" },
    { value: "from_group", filters: ["group"], label: "From: a group" },
    { value: "from_channel", filters: ["channel"], label: "From: a channel" },
    {
      value: "mentions_user_channel",
      filters: ["user", "channel"],
      label: "Mentions",
    },
    // {
    //   value: "filter_channel_or_user",
    //   filters: ["user", "channel"],
    //   label: "Filter: a channel or user",
    // },
    // {
    //   value: "todo_task",
    //   filters: ["todo_task"],
    //   label: "To-do: a task or reminder",
    // },
    // {
    //   value: "favourite_message_or_task",
    //   filters: ["favourite_message_or_task"],
    //   label: "Favourite: a message or task",
    // },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // const handleAddOption = (option: string) => {
  //   if (!selectedOptions.includes(option)) {
  //     setSelectedOptions([...selectedOptions, option]);
  //   }
  // };

  // const handleToggleOption = (option: string) => {
  //   if (selectedOptions.includes(option)) {
  //     setSelectedOptions(selectedOptions.filter(o => o !== option));
  //   } else {
  //     setSelectedOptions([...selectedOptions, option]);
  //   }
  // };

  const handleToggleOption = (value: string) => {
    if (selectedOptions.includes(value)) {
      setSelectedOptions(selectedOptions.filter((o) => o !== value));
    } else {
      setSelectedOptions([...selectedOptions, value]);
    }
  };

  const handleAddToSearch = (historyItem: string) => {
    setSearchTerm(historyItem);
    setDropdown(false);
  };

  const handleClearHistory = () => {
    setSearchHistory([]);
  };

  return (
    <header className="flex items-center justify-between mr-6 ml-3 py-4">
      <div className="flex items-center gap-3">      
      </div>
      <div className="flex items-center gap-3 relative">
        <div className="relative flex-1 flex items-center bg-[#212121] py-2 px-4 rounded-[8px]">
          <Search className="w-5 h-5 text-[#ffffff48] absolute left-2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setDropdown(e.target.value !== "");
              setIsSearchOpen(e.target.value !== "");
            }}
            placeholder="Search message"
            className="bg-transparent outline-none text-white flex-1 placeholder:text-[#ffffff48] pl-4 pr-8"
          />
          {searchTerm && (
            <button
              className="absolute right-2 text-[#ffffff48] hover:text-white"
              onClick={() => {
                setSearchTerm("");
                setIsSearchOpen(false);
              }}
              tabIndex={-1}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {dropdown && (
          <div
            ref={searchRef}
            className="absolute top-full mt-2 bg-[#212121] rounded-lg shadow-lg w-64 p-4 z-40"
          >
            <div className="">
              <span className="text-[#ffffff80] text-sm">Search Options</span>
              {options.map(({ value, label }) => {
                const isSelected = selectedOptions.includes(value);
                return (
                  <div
                    key={value}
                    className={`mb-1 flex items-center justify-between p-2 rounded cursor-pointer ${
                      isSelected ? "bg-[#5389ff]" : "hover:bg-[#2d2d2d]"
                    }`}
                    onClick={() => handleToggleOption(value)}
                  >
                    <span className="text-white">{label}</span>
                    {isSelected ? (
                      <X
                        className="text-white w-4 h-4 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOptions(
                            selectedOptions.filter((o) => o !== value)
                          );
                        }}
                      />
                    ) : (
                      <Plus className="text-white w-4 h-4" />
                    )}
                  </div>
                );
              })}
            </div>
            {searchHistory.length > 0 && (
              <div className="mt-4">
                <span className="text-[#ffffff80] text-sm">History</span>
                {searchHistory.slice(0, 5).map((historyItem) => (
                  <div
                    key={historyItem}
                    className="flex items-center justify-between p-2 hover:bg-[#2d2d2d] rounded cursor-pointer"
                    onClick={() => handleAddToSearch(historyItem)}
                  >
                    <span className="text-white">{historyItem}</span>
                  </div>
                ))}
                <div
                  className="flex items-center justify-between p-2 hover:bg-[#2d2d2d] rounded cursor-pointer"
                  onClick={handleClearHistory}
                >
                  <span className="text-white">Clear History</span>
                  <Trash className="text-white w-4 h-4" />
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="p-2 border rounded-[10px] border-[#ffffff09] inline-flex items-center justify-center cursor-pointer">
          <Pin
            className="h-4 w-4 fill-[#84afff] text-[#84afff]"
            onClick={() => setIsPinnedOpen(!isPinnedOpen)}
          />
        </div>
        <div className="p-2 border rounded-[10px] border-[#ffffff09] inline-flex items-center justify-center cursor-pointer">
          <Bell
            className="h-4 w-4 fill-[#84afff] text-[#84afff]"
            onClick={() => setIsNotificationPanel(!isNotificationPanel)}
          />
        </div>
      </div>
    </header>
  );
};
