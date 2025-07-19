
import { useState } from "react";
import { ChevronDown, ChevronUp, LogOut, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import logo from "@/assets/images/sidebarLogo.png";

export const Header = () => {
  const { user, signIn, signUp, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="w-full bg-[#00000012] backdrop-blur-sm px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <Link to="/" className="flex items-center">
          <div className="w-9 h-9 rounded-full flex items-center justify-center">
            <img src={logo} className="w-9 h-9 text-white" />
          </div>
        </Link>
        
        {user ? (
           <div className="flex items-center gap-2 relative bg-[#212121] p-2 pl-3 rounded-[12px]">
           {/* Avatar with green badge */}
           <div className="relative">
             <Avatar className="w-8 h-8">
               <AvatarFallback className="bg-blue-100 text-blue-600">
                 {user.email?.charAt(0).toUpperCase() || 'U'}
               </AvatarFallback>
             </Avatar>
             {/* Green badge */}
             <span className="absolute -bottom-0 -right-0 w-3 h-3 bg-[#35c220] border-2 border-white rounded-full" />
           </div>
           {/* Email */}
           <span className="text-white text-sm font-medium ml-2">{user.email}</span>
           {/* Dropdown */}
           <div className="relative ">
             <Button
               variant="ghost"
               size="icon"
               className="w-6 h-6 p-0 ml-1"
               onClick={() => setDropdownOpen((open) => !open)}
             >
               {dropdownOpen?<ChevronUp className="w-4 h-4 text-white" />:<ChevronDown className="w-4 h-4 text-white" />}
               
             </Button>
             {dropdownOpen && (
               <div className="absolute -right-1 mt-2 p-1 w-32 bg-[#212121] rounded shadow-lg z-50 rounded-b-[12px]">
                 <button
                   onClick={signOut}
                   className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-[#2d2d2d]"
                 >
                   <LogOut className="w-4 h-4 mr-2" />
                   Sign Out
                 </button>
               </div>
             )}
           </div>
         </div>
        ) : (
          <div className="flex justify-end gap-4">
            <Button onClick={signIn} variant="outline" className="bg-[#3474FF12] text-[#84afff] rounded-[10px] px-[16px] py-[8px] border-0" size="sm">
              Sign In
            </Button>
            <Button onClick={signUp} variant="outline" className="bg-[#5389ff] text-black  rounded-[10px] px-[16px] py-[8px]" size="sm">
              Sign Up
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};
