// src/components/Layout.tsx

import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { SidebarNav } from "./SidebarNav";
import { useLocation } from "react-router-dom";

type LayoutProps = {
  children: React.ReactNode;
  onSelectDiscordServer: (serverId: string | null) => void;
  selectedDiscordServer: string | null;
};

const Layout: React.FC<LayoutProps> = ({ children, onSelectDiscordServer, selectedDiscordServer }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  return (
    <div className="flex min-h-screen max-w-screen bg-[#171717]">
    {/* Sidebar: full height, fixed width */}
    <SidebarNav activePage={location.pathname}   selectedDiscordServer={selectedDiscordServer} onSelectDiscordServer={onSelectDiscordServer}/>
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
};

export default Layout;
