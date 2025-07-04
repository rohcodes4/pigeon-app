
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import logo from "@/assets/images/logo.png";

export const Header = () => {
  const { user } = useAuth();

  return (
    <header className="w-full bg-[#00000012] backdrop-blur-sm px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <Link to="/" className="flex items-center">
          <div className="w-9 h-9 rounded-full flex items-center justify-center">
            <img src={logo} className="w-9 h-9 text-white" />
          </div>
        </Link>
        
        {user ? (
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-blue-100 text-blue-600">
              {user.email?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="flex justify-end gap-4">
          <Link to="/auth">
            <Button variant="outline" className="bg-[#3474FF12] text-[#84afff] rounded-[10px] px-[16px] py-[8px] border-0" size="sm">
              Sign In
            </Button>
          </Link>
          <Link to="/auth">
            <Button variant="outline" className="bg-[#5389ff] text-black  rounded-[10px] px-[16px] py-[8px]" size="sm">
              Sign In
            </Button>
          </Link>
          </div>
        )}
      </div>
    </header>
  );
};
