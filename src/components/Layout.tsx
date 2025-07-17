// src/components/Layout.tsx

import React from "react";
import { MessageCircle, Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { AppHeader } from "./AppHeader";
import { SidebarNav } from "./SidebarNav";
import { useLocation } from "react-router-dom";

type LayoutProps = {
  children: React.ReactNode;  
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out",
    });
  };

  return (
    <div className="flex min-h-screen bg-[#171717]">
    {/* Sidebar: full height, fixed width */}
    <SidebarNav activePage={location.pathname}/>
{children}
    {/* Right side: header at top, content below */}
    {/* <div className="flex-1 flex flex-col min-h-screen">
      <AppHeader title={title}/>
      <main className="flex-1 p-6 overflow-y-auto">
        {children}
      </main>
    </div> */}
  </div>
  );

  // return (
  //   <div className="min-h-screen bg-gradient-to-br ">
  //     <div className="container mx-auto p-6 max-w-7xl">
  //       {/* Header */}
  //       <header className="mb-8">
  //         <div className="flex items-center justify-between">
  //           <Link to="/">
  //           <div className="flex items-center gap-4">
  //             <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
  //               <MessageCircle className="w-7 h-7 text-white" />
  //             </div>
  //             <div>
  //               <h1 className="text-xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
  //                 ChatPilot
  //               </h1>
  //               <p className="text-gray-600 text-lg hidden md:block">Your intelligent conversation dashboard</p>
  //             </div>
  //           </div>
  //           </Link>
  //           {isConnected && (

  //           <div className="flex items-center gap-1 md:gap-4">
  //               <Badge variant="secondary" className="bg-green-100 text-green-800 px-3 py-1 flex items-center">
  //                 <div className="w-2 h-2 bg-green-500 rounded-full md:mr-2" />
  //                 <span className="hidden md:block">Connected</span>
  //               </Badge>
  //             <Button variant="outline" size="sm" className="gap-2">
  //               <Bell className="w-4 h-4" />
  //               <span className="hidden md:block">Notifications</span>
  //             </Button>
  //             <Button variant="outline" size="sm" className="gap-2" onClick={handleSignOut}>
  //               <LogOut className="w-4 h-4" />
  //               <span className="hidden md:block">Sign Out</span>
  //             </Button>
  //           </div>
  //             )}

  //         </div>
  //       </header>

  //       {/* Page Content */}
  //       {children}
  //     </div>
  //   </div>
  // );
};

export default Layout;
