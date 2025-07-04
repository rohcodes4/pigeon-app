import { useState } from "react";
import { Search, X, ChevronDown, Filter, ChevronUp } from "lucide-react";
import { Button } from "./ui/button";
import filterIcon from "@/assets/images/filterChannel.png";

export const SearchBarWithFilter = ({
  searchTerm,
  setSearchTerm,
  coin,
  setCoin,
  onFilterClick,
  coinOptions = [],
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="flex items-center gap-4 rounded-xl px-4 py-2 mt-0 mb-6 shadow">
      {/* Search Bar */}
      <div className="relative flex-1 flex items-center bg-[#212121] py-2 px-4 rounded-[12px]">
        <Search className="w-5 h-5 text-[#ffffff48] absolute left-2" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search message"
          className="bg-transparent outline-none text-white flex-1 placeholder:text-[#ffffff48] pl-8 pr-8"
        />
        {searchTerm && (
          <button
            className="absolute right-2 text-[#ffffff48] hover:text-white"
            onClick={() => setSearchTerm("")}
            tabIndex={-1}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {/* Coin Filter Dropdown */}
      <div className="relative">
        <button
          className="flex items-center gap-2 bg-[#212121] text-[#ffffff] px-4 py-2 rounded-lg"
          onClick={() => setDropdownOpen((open) => !open)}
          type="button"
        >
          {coin ? (
            <div className="flex items-center gap-2">
              <img src={coin.image} alt={coin.name} className="w-5 h-5 rounded-full" />
              <span className="leading-1">{coin.name}</span>
              <span className="leading-1">|</span>
              <span className="text-xs leading-1">${coin.symbol}</span>
            </div>
          ) : (
            <span>Select Coin</span>
          )}
          {dropdownOpen?<ChevronUp className="w-5 h-5" />:<ChevronDown className="w-5 h-5" />}
        </button>
        {dropdownOpen && (
          <div className="absolute left-0 mt-2 bg-[#23272f] rounded shadow-lg z-50 min-w-[160px]">
            {coinOptions.map(opt => (
              <div
                key={opt.symbol}
                className="flex items-center gap-2 px-4 py-2 text-white hover:bg-[#181B23] cursor-pointer"
                onClick={() => {
                  setCoin(opt);
                  setDropdownOpen(false);
                }}
              >
                <img src={opt.image} alt={opt.name} className="w-5 h-5 rounded-full" />
                <span>{opt.name}</span>
                <span>|</span>
                <span className="text-xs text-[#b3b8c5]">${opt.symbol}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Filter Button */}
      <Button
      variant="outline"
        className="flex items-center gap-1 text-[#ffffff] hover:text-white px-3 py-1 rounded-lg bg-transparent"
        onClick={onFilterClick}
      >
        <img src={filterIcon} className="w-4 h-4" />
        Filter Channels
      </Button>
    </div>
  );
};