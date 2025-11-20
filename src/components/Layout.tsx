// src/components/Layout.tsx

import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { SidebarNav } from "./SidebarNav";
import { useLocation } from "react-router-dom";

type LayoutProps = {
  children: React.ReactNode;
  onSelectDiscordServer: (serverId: string | null) => void;
  selectedDiscordServer: string | null;
  guilds: any[] | null;
  isFocusMode: boolean;
  setIsFocusMode: (boolean) => void;
};

const Layout: React.FC<LayoutProps> = ({
  isFocusMode,
  setIsFocusMode,
  children,
  onSelectDiscordServer,
  selectedDiscordServer,
  guilds,
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  return (
    <div className="flex min-h-screen max-w-screen bg-[#161717]">
      <SidebarNav
        guilds={guilds}
        activePage={location.pathname}
        isFocusMode={isFocusMode}
        setIsFocusMode={setIsFocusMode}
        selectedDiscordServer={selectedDiscordServer}
        onSelectDiscordServer={onSelectDiscordServer}
      />
      {children}
    </div>
  );
};

export default Layout;
