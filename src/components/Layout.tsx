// src/components/Layout.tsx

import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { SidebarNav } from "./SidebarNav";
import { useLocation } from "react-router-dom";

type LayoutProps = {
  children: React.ReactNode;
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  return (
    <div className="flex h-screen bg-[#171717] overflow-hidden relative">
      {/* Sidebar: fixed height, no scroll */}
      <div className="relative z-10">
        <SidebarNav activePage={location.pathname} />
      </div>
      {/* Right side: scrollable content */}
      <div className="flex-1 overflow-y-auto relative z-0">{children}</div>
    </div>
  );
};

export default Layout;
