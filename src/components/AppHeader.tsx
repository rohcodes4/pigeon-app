import { Bell, Check, ChevronDown, Filter, LogOut, Pin, Search, X } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/images/logo.png";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import ai from"@/assets/images/AiBlackBg.png";
import eye from"@/assets/images/eye.png";
import { SearchBarWithFilter } from "./SearchBarWithFIlter";
type AppHeaderProps = {
  title?: string;
};

export const AppHeader: React.FC<AppHeaderProps> = ({title}) => {
  const { user, signOut } = useAuth();
  const [dropdown, setDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <header className="flex items-center justify-between mx-6 py-4 ">
      <div className="flex items-center gap-3">
        {/* <img src={logo} className="w-8 h-8" alt="Logo" /> */}
        {/* <span className="text-xl text-white tracking-wide">{title}</span> */}
        {/* <span className="bg-[#5389ff] px-3 py-1 text-black font-semibold rounded-[12px]">3</span> */}
      </div>
      <div className="flex items-center gap-3 relative">
        {/* <Button className="bg-[#84afff] text-black"><img src={ai} className="w-4 h-4 object-contain"/>AI Summarize</Button> */}
        {/* <Button variant="secondary" className="bg-[#3474ff12] text-[#84afff]"><Check className="h-4 w-4"/>Mark all as read</Button> */}
        {/* <Button className="bg-transparent" variant="outline" ><img src={eye} className="w-4 h-4 object-contain"/>Focus Mode</Button> */}
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
      <div className="p-2 border rounded-[10px] border-[#ffffff09] inline-flex items-center justify-center">
  <Filter className="h-4 w-4 fill-[#84afff] text-[#84afff]" />
</div>
<div className="p-2 border rounded-[10px] border-[#ffffff09] inline-flex items-center justify-center">
  <Pin className="h-4 w-4 fill-[#84afff] text-[#84afff]" />
</div>
<div className="p-2 border rounded-[10px] border-[#ffffff09] inline-flex items-center justify-center">
  <Bell className="h-4 w-4 fill-[#84afff] text-[#84afff]" />
</div>
      
       
      </div>
    </header>
  );
};