// ... existing code ...
import AI from "@/assets/images/aiBlue.png";
import Chat from "@/assets/images/sidebar/Chat.png";
import Doc from "@/assets/images/sidebar/Doc.png";
import Favourite from "@/assets/images/sidebar/Favourite.png";
import Help from "@/assets/images/sidebar/Help.png";
import Lobby from "@/assets/images/sidebar/Lobby.png";
import Logs from "@/assets/images/sidebar/Logs.png";
import Notification from "@/assets/images/sidebar/Notification.png";
import Discord from "@/assets/images/discord.png";
import Telegram from "@/assets/images/telegram.png";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowUpCircle,
  LogOut,
  Settings,
  User,
  Sun,
  Moon,
  Circle,
  Users,
} from "lucide-react";
import logo from "@/assets/images/sidebarLogo.png";
import { useNavigate } from "react-router-dom";
// import { supabase } from "@/integrations/supabase/client"; // Removed Supabase import
import { useUserSettings } from "@/hooks/useUserSettings";
import { useTheme, Theme } from "@/hooks/useTheme"; // Correctly import Theme

interface SidebarNavProps {
  activePage: string;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({ activePage }) => {
  const navMap: { [key: string]: string } = {
    "/": "AI",
    "/smart-tasks": "Tasks",
    "/bookmarks": "Bookmarks",
    "/contacts": "Contacts",
    "/help": "Help",
    // add more as needed
  };
  const { settings, updateSettings, loading } = useUserSettings();
  const { setTheme: setGlobalTheme } = useTheme(); // Destructure setTheme from useTheme

  useEffect(() => {
    if (!loading) {
      setTheme(settings.theme);
    }
  }, [loading, settings.theme]);

  const [showProfile, setShowProfile] = useState(false);
  const [theme, setTheme] = useState(settings.theme || "default");
  const [discordConnected, setDiscordConnected] = useState(false);
  const [telegramConnected, setTelegramConnected] = useState(false);
  const navigate = useNavigate();
  const { user: authUser, signOut } = useAuth(); // Destructure signOut from useAuth

  const handleThemeChange = (newTheme: Theme) => {
    // Use Theme type
    updateSettings({ theme: newTheme });
    setTheme(newTheme);
    setGlobalTheme(newTheme); // Pass Theme type directly
  };

  // const { user } = useAuth();
  // console.log(user)
  const themes: { value: Theme; icon: React.ReactNode }[] = [
    { value: "default", icon: <Circle className="w-5 h-5" /> },
    { value: "light", icon: <Sun className="w-5 h-5" /> },
    { value: "dark", icon: <Moon className="w-5 h-5" /> },
  ];
  const profileRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  function gravatarUrl(seed: string) {
    return `https://www.gravatar.com/avatar/${btoa(seed)}?d=identicon&s=80`;
  }
  useEffect(() => {
    if (!showProfile) return;
    function handleClick(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node) &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setShowProfile(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showProfile]);

  const themeIndex = themes.findIndex((t) => t.value === theme);

  // const user = {
  //   name: "Jane Doe",
  //   email: "jane.doe@email.com",
  //   avatar: User,
  // };

  // Helper function to get user display name
  const getUserDisplayName = (user: any) => {
    if (user?.full_name) {
      return user.full_name;
    }
    if (user?.username) {
      return user.username;
    }
    if (user?.email) {
      return user.email.split("@")[0]; // Show username part of email
    }
    return "User";
  };

  // Helper function to get user avatar
  const getUserAvatar = (user: any) => {
    if (user?.username) {
      return gravatarUrl(user.username);
    }
    if (user?.email) {
      return gravatarUrl(user.email);
    }
    return gravatarUrl("user");
  };

  const [activeNav, setActiveNav] = useState(navMap[activePage] || "AI");

  useEffect(() => {
    setActiveNav(navMap[activePage] || "AI");
  }, [activePage]);

  // Check connection status from localStorage
  useEffect(() => {
    if (authUser) {
      const onboardingData = localStorage.getItem(
        `chatpilot_accounts_${authUser.id}`
      );
      if (onboardingData) {
        try {
          const data = JSON.parse(onboardingData);
          setDiscordConnected(data.discord || false);
          setTelegramConnected(data.telegram || false);
        } catch (error) {
          console.error("Error parsing connection data:", error);
        }
      }
    }
  }, [authUser]);

  const logOut = async () => {
    await signOut(); // Call signOut from useAuth
  };
  return (
    <aside className="h-screen w-16 flex flex-col items-center py-[18px] min-w-16 overflow-hidden">
      <img src={logo} alt="AI" className="w-9 h-9 mb-4" />
      <nav className="flex flex-col gap-4 flex-1">
        {/* AI */}
        <button
          className={`relative p-2 rounded-lg flex items-center justify-center transition-colors
            ${activeNav === "AI" ? "bg-[#212121]" : "hover:bg-[#212121]"}`}
          onClick={() => {
            setActiveNav("AI");
            navigate("/");
          }}
        >
          {activeNav === "AI" && (
            <span className="absolute left-[-13px] h-full top-0 bottom-2 w-1 rounded bg-[#3474ff]" />
          )}
          <img src={AI} alt="AI" className={`w-6 h-6`} />
        </button>
        {/* Logs */}
        <button
          className={`relative p-2 rounded-lg flex items-center justify-center transition-colors
            ${activeNav === "Tasks" ? "bg-[#212121]" : "hover:bg-[#212121]"}`}
          onClick={() => {
            setActiveNav("Tasks");
            navigate("/smart-tasks");
          }}
        >
          {activeNav === "Tasks" && (
            <span className="absolute left-[-13px] h-full top-0 bottom-2 w-1 rounded bg-[#3474ff]" />
          )}
          <img
            src={Logs}
            alt="Logs"
            className={`${
              activeNav === "Tasks" ? "opacity-1" : "opacity-[0.5]"
            } w-6 h-6`}
          />
        </button>
        {/* Favourite */}
        <button
          className={`relative p-2 rounded-lg flex items-center justify-center transition-colors
            ${
              activeNav === "Bookmarks" ? "bg-[#212121]" : "hover:bg-[#212121]"
            }`}
          onClick={() => {
            setActiveNav("Bookmarks");
            navigate("/bookmarks");
          }}
        >
          {activeNav === "Bookmarks" && (
            <span className="absolute left-[-13px] h-full top-0 bottom-2 w-1 rounded bg-[#3474ff]" />
          )}
          <img
            src={Favourite}
            alt="Bookmarks"
            className={`${
              activeNav === "Bookmarks" ? "opacity-1" : "opacity-[0.5]"
            } w-6 h-6`}
          />
        </button>
        {/* Users */}
        <button
          className={`relative p-2 rounded-lg flex items-center justify-center transition-colors
            ${
              activeNav === "Contacts" ? "bg-[#212121]" : "hover:bg-[#212121]"
            }`}
          onClick={() => {
            setActiveNav("Contacts");
            navigate("/contacts");
          }}
        >
          {activeNav === "Contacts" && (
            <span className="absolute left-[-13px] h-full top-0 bottom-2 w-1 rounded bg-[#3474ff]" />
          )}
          <Users
            className={`${
              activeNav === "Contacts" ? "opacity-1" : "opacity-[0.5]"
            } w-6 h-6`}
          />
        </button>
        {/* Help */}
        <button
          className={`relative p-2 rounded-lg flex items-center justify-center transition-colors
            ${activeNav === "Help" ? "bg-[#212121]" : "hover:bg-[#212121]"}`}
          onClick={() => {
            setActiveNav("Help");
            navigate("/help");
          }}
        >
          {activeNav === "Help" && (
            <span className="absolute left-[-13px] h-full top-0 bottom-2 w-1 rounded bg-[#3474ff]" />
          )}
          <img
            src={Help}
            alt="Help"
            className={`${
              activeNav === "Help" ? "opacity-1" : "opacity-[0.5]"
            } w-6 h-6`}
          />
        </button>
      </nav>
      <div className="flex flex-col items-center gap-6 mt-auto mb-4">
        {/* Discord Icon with Connected Badge */}
        <div className="relative bg-[#7B5CFA] rounded-[10px] p-2 group">
          <img src={Discord} alt="Discord" className="w-4 h-4 rounded" />
          <span
            className={`absolute -bottom-0.5 -right-0.5 block w-2 h-2 rounded-full ${
              discordConnected ? "bg-green-500" : "bg-gray-500"
            }`}
          ></span>

          {/* Tooltip */}
          <div
            className="fixed left-14 opacity-0 group-hover:opacity-100 transition-opacity bg-[#111111] text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none border border-[#333]"
            style={{ zIndex: 99999 }}
          >
            {discordConnected ? "Discord Connected" : "Discord Not Connected"}
          </div>
        </div>

        {/* Telegram Icon with Connected Badge */}
        <div className="relative bg-[#3474FF] rounded-[10px] p-2 group">
          <img src={Telegram} alt="Telegram" className="w-4 h-4 rounded" />
          <span
            className={`absolute -bottom-0.5 -right-0.5 block w-2 h-2 rounded-full ${
              telegramConnected ? "bg-green-500" : "bg-gray-500"
            }`}
          ></span>

          {/* Tooltip */}
          <div
            className="fixed left-14 opacity-0 group-hover:opacity-100 transition-opacity bg-[#111111] text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none border border-[#333]"
            style={{ zIndex: 99999 }}
          >
            {telegramConnected
              ? "Telegram Connected"
              : "Telegram Not Connected"}
          </div>
        </div>
        <hr className="h-0.5 w-full bg-[#ffffff12]" />
        {/* Profile Icon with Popover */}
        <div
          className="relative"
          onMouseEnter={() => setShowProfile(true)}
          ref={profileRef}
        >
          {authUser ? (
            <img
              src={getUserAvatar(authUser)}
              alt="Profile"
              className="w-8 h-8 rounded-full border-2 border-[#23272f] cursor-pointer"
              onClick={() => setShowProfile((prev) => !prev)}
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full border-2 border-[#23272f] cursor-pointer bg-[#212121] flex items-center justify-center"
              onClick={() => setShowProfile((prev) => !prev)}
            >
              <User className="w-4 h-4 text-[#ffffff72]" />
            </div>
          )}
          {showProfile && (
            <div
              ref={popoverRef}
              className="fixed bottom-20 -right-100 bg-[#212121] rounded-xl shadow-2xl p-4 min-w-[240px] flex flex-col gap-3"
              style={{
                zIndex: 9999,
              }}
            >
              {" "}
              {/* Name */}
              <div className="flex items-center gap-3">
                {authUser ? (
                  <>
                    <img
                      src={getUserAvatar(authUser)}
                      alt="Profile"
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex flex-col items-start">
                      <span className="text-[#ffffff72] text-[15px] font-[300]">
                        {getUserDisplayName(authUser)}
                      </span>
                      <span className="text-[12px] text-[#ffffff48]">
                        {authUser?.email || "No email"}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-full bg-[#212121] flex items-center justify-center">
                      <User className="w-4 h-4 text-[#ffffff72]" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-[#ffffff72] text-[15px] font-[300]">
                        Guest
                      </span>
                      <span className="text-[12px] text-[#ffffff48]">
                        Not signed in
                      </span>
                    </div>
                  </>
                )}
              </div>
              {/* Email */}
              {/* Theme Selection */}
              {/* <div className="flex flex gap-6 items-center mt-2">
                <span className="text-xs text-[#ffffff72] flex items-center h-9">
                  Theme
                </span>
                <div className="relative w-full h-9 bg-[#171717] rounded-[1000px] flex items-center justify-between px-2 py-6">
                  <span
                    className="absolute top-1.5 left-2 w-9 h-9 rounded-full transition-transform duration-300"
                    style={{
                      background: "#2d2d2d",
                      transform: `translateX(${themeIndex * 46}px)`, // 44px = icon size (32px) + gap (12px)
                      zIndex: 1,
                    }}
                  />
                  {themes.map((t, idx) => (
                    <button
                      key={t.value}
                      onClick={() => handleThemeChange(t.value)}
                      className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors duration-300 relative mx-1 text-white ${
                        theme === t.value ? "opacity-1" : "opacity-[0.2]"
                      }`}
                      type="button"
                      style={{ zIndex: 2 }}
                    >
                      <span className="relative z-10">{t.icon}</span>
                    </button>
                  ))}
                </div>
              </div> */}
              {/* Actions */}
              <div className="flex flex-col gap-2 mt-2">
                <button
                  className="p-2 flex items-center gap-2 text-xs text-[#ffffff72] hover:text-[#5389FF] transition"
                  onClick={() => navigate("/settings")}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                {/* <button className="p-2 flex items-center gap-2 text-xs text-[#ffffff72] hover:text-[#5389FF] transition">
                  <ArrowUpCircle className="w-4 h-4" />
                  Upgrade
                </button> */}
                {authUser ? (
                  <button
                    className="p-2 flex items-center gap-2 text-xs text-red-600 transition"
                    onClick={logOut}
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                ) : (
                  <button
                    className="p-2 flex items-center gap-2 text-xs text-[#5389FF] transition"
                    onClick={() => navigate("/auth")}
                  >
                    <User className="w-4 h-4" />
                    Sign In
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
