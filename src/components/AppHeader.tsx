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
};

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  setIsNotificationPanel,
  isNotificationPanel,
  onOpenPinnedPanel,
  setIsPinnedOpen,
  isPinnedOpen,
  isSearchOpen,
  setIsSearchOpen
}) => {
  const { user, signOut } = useAuth();
  const [dropdown, setDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchOptions, setSearchOptions] = useState<string[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>(["filter: Shitcoin Alpha", "Test Search text"]);
  const searchRef = useRef<HTMLDivElement>(null);

  // useEffect(()=>{
  //   if(searchTerm.length>0){
  //     setIsSearchOpen(!isSearchOpen)
  //   }
  // },[searchTerm])
  const options = [
    "from: a user",
    "mentions: a user or channel",
    "from: a channel or user",
    "filter: a channel or user",
    "to-do: a task or reminder",
    "favourite: a message or task"
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleAddOption = (option: string) => {
    if (!selectedOptions.includes(option)) {
      setSelectedOptions([...selectedOptions, option]);
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
    <header className="flex items-center justify-between mx-6 py-4">
      <div className="flex items-center gap-3">
        {/* Logo and Title */}
      </div>
      <div className="flex items-center gap-3 relative">
        <div className="relative flex-1 flex items-center bg-[#212121] py-2 px-4 rounded-[12px]">
          <Search className="w-5 h-5 text-[#ffffff48] absolute left-2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setDropdown(e.target.value !== '');
              setIsSearchOpen(e.target.value!=='')
            }}
            placeholder="Search message"
            className="bg-transparent outline-none text-white flex-1 placeholder:text-[#ffffff48] pl-8 pr-8"
          />
          {searchTerm && (
            <button
              className="absolute right-2 text-[#ffffff48] hover:text-white"
              onClick={() => {setSearchTerm("");setIsSearchOpen(false)}}
              tabIndex={-1}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {dropdown && (
          <div ref={searchRef} className="absolute top-full mt-2 bg-[#212121] rounded-lg shadow-lg w-64 p-4 z-40">
            <div className="">
              <span className="text-[#ffffff80] text-sm">Search Options</span>
              {options.map(option => (
                <div
                  key={option}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer ${selectedOptions.includes(option) ? 'bg-[#5389ff]' : 'hover:bg-[#2d2d2d]'}`}
                  onClick={() => handleAddOption(option)}
                >
                  <span className="text-white">{option}</span>
                  <Plus className="text-white w-4 h-4" />
                </div>
              ))}
            </div>
          {searchHistory.length>0 &&  <div className="mt-4">
              <span className="text-[#ffffff80] text-sm">History</span>
              {searchHistory.slice(0, 5).map(historyItem => (
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
            </div>}
          </div>
        )}
        <div className="p-2 border rounded-[10px] border-[#ffffff09] inline-flex items-center justify-center cursor-pointer">
          <Filter className="h-4 w-4 fill-[#84afff] text-[#84afff]" />
        </div>
        <div className="p-2 border rounded-[10px] border-[#ffffff09] inline-flex items-center justify-center cursor-pointer">
          <Pin className="h-4 w-4 fill-[#84afff] text-[#84afff]" onClick={() => setIsPinnedOpen(!isPinnedOpen)} />
        </div>
        <div className="p-2 border rounded-[10px] border-[#ffffff09] inline-flex items-center justify-center cursor-pointer">
          <Bell className="h-4 w-4 fill-[#84afff] text-[#84afff]" onClick={() => setIsNotificationPanel(!isNotificationPanel)} />
        </div>
      </div>
    </header>
  );
};