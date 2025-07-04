import { Check, ChevronDown, LogOut } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/images/logo.png";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import ai from"@/assets/images/AiBlackBg.png";
import eye from"@/assets/images/eye.png";
type AppHeaderProps = {
  title?: string;
};

export const AppHeader: React.FC<AppHeaderProps> = ({title}) => {
  const { user, signOut } = useAuth();
  const [dropdown, setDropdown] = useState(false);

  return (
    <header className="flex items-center justify-between mx-6 py-5 border-b border-[#23272f]">
      <div className="flex items-center gap-3">
        {/* <img src={logo} className="w-8 h-8" alt="Logo" /> */}
        <span className="text-xl text-white tracking-wide">{title}</span>
        <span className="bg-[#5389ff] px-3 py-1 text-black font-semibold rounded-[12px]">3</span>
      </div>
      <div className="flex items-center gap-3 relative">
        <Button className="bg-[#84afff] text-black"><img src={ai} className="w-4 h-4 object-contain"/>AI Summarize</Button>
        <Button variant="secondary" className="bg-[#3474ff12] text-[#84afff]"><Check className="h-4 w-4"/>Mark all as read</Button>
        <Button className="bg-transparent" variant="outline" ><img src={eye} className="w-4 h-4 object-contain"/>Focus Mode</Button>
       
       
      </div>
    </header>
  );
};