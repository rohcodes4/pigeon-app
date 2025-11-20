import AI from "@/assets/images/aiBlue.png";
import Favourite from "@/assets/images/sidebar/Favourite.png";
import Help from "@/assets/images/sidebar/Help.png";
import Logs from "@/assets/images/sidebar/Logs.png";
import focusEnable from "@/assets/images/focusLoading.svg";
import focusDisable from "@/assets/images/focusSleep.svg";
import Discord from "@/assets/images/discord.png";
import Telegram from "@/assets/images/telegram.png";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  LogOut,
  Settings,
  User,
  Sun,
  Moon,
  Circle,
  BotMessageSquare,
  Users,
} from "lucide-react";
import logo from "@/assets/images/logo.svg";
import { useNavigate } from "react-router-dom";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useTheme, Theme } from "@/hooks/useTheme"; // Correctly import Theme
import FocusToggle from "./FocusToggle";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
interface SidebarNavProps {
  isFocusMode: boolean;
  setIsFocusMode: (boolean) => void;
  activePage: string;
  onSelectDiscordServer: (serverId: string | null) => void;
  selectedDiscordServer: string | null;
  guilds: any[] | null;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  isFocusMode,
  setIsFocusMode,
  activePage,
  onSelectDiscordServer,
  selectedDiscordServer,
  guilds,
}) => {
  const [guild, setGuild] = useState([]);

  useEffect(() => {
    const cachedGuilds = localStorage.getItem("discordGuilds");
    if (cachedGuilds) {
      try {
        const parsed = JSON.parse(cachedGuilds);
        if (Array.isArray(parsed)) {
          setDiscordServers(parsed);
        }
      } catch (err) {
        console.error("[localguild][localStorage] parse error:", err);
      }
    }

    async function fetchGuilds() {
      const guilds = await window.electronAPI.discord.getGuilds();
      let arr = [];
      if (guilds.data && typeof guilds.data === "object") {
        arr = [...guilds.data.entries()].map(([key, value]) => ({
          id: key,
          ...value,
        }));
      }
      if (arr.length > 0) {
        setDiscordServers(arr);
        localStorage.setItem("discordGuilds", JSON.stringify(arr));
      }
    }
    setTimeout(() => {
      fetchGuilds();
    }, 5000);
  }, []);

  useEffect(() => {
    let timer: any = null;
    const poll = async () => {
      const guilds = await window.electronAPI.discord.getGuilds();
      const guildArray = [...guilds.data.entries()].map(([key, value]) => ({
        id: key,
        ...value,
      }));
      setGuild(guildArray);
      localStorage.setItem("discordGuilds", JSON.stringify(guildArray));
      setDiscordServers(guildArray);
    };
    timer = setTimeout(poll, 30000);
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  const [discordServers, setDiscordServers] = useState([]);

  const navMap: { [key: string]: string } = {
    "/": "AI",
    "/smart-tasks": "Tasks",
    "/bookmarks": "Bookmarks",
    "/contacts": "Contacts",
    "/ai": "AiChat",
    "/help": "Help",
  };
  const { settings, updateSettings, loading } = useUserSettings();
  const { setTheme: setGlobalTheme } = useTheme();
  const isHelpPage = activePage === "/help";
  useEffect(() => {
    if (!loading) {
      setTheme(settings.theme);
    }
  }, [loading, settings.theme]);

  const [showProfile, setShowProfile] = useState(false);
  const [theme, setTheme] = useState(settings.theme || "default");
  const [totalUnread, setTotalUnread] = useState(0);
  const [discordConnected, setDiscordConnected] = useState(false);
  const [telegramConnected, setTelegramConnected] = useState(false);
  const navigate = useNavigate();
  const { user: authUser, signOut } = useAuth();

  const handleThemeChange = (newTheme: Theme) => {
    updateSettings({ theme: newTheme });
    setTheme(newTheme);
    setGlobalTheme(newTheme);
  };

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

  // Helper function to get user display name
  const getUserDisplayName = (user: any) => {
    if (user?.full_name) {
      return user.full_name;
    }
    if (user?.username) {
      return user.username;
    }
    if (user?.email) {
      return user.email.split("@")[0];
    }
    return "User";
  };

  // Helper function to get user avatar
  const getUserAvatar = (user: any) => {
    if (user?.profile_picture) {
      return `${BACKEND_URL}/static/profile_photos/${user.profile_picture}`;
    }
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

  // Fetch connection status from backend
  useEffect(() => {
    if (!authUser) return;
    const fetchStatuses = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const [tgRes] = await Promise.all([
          fetch(`${BACKEND_URL}/auth/telegram/status`, { headers }),
        ]);
        if (tgRes.ok) {
          const tg = await tgRes.json();
          setTelegramConnected(!!tg.connected);
        }
        const res = await window.electronAPI.security.getDiscordToken();
        if (res?.success && res?.data) {
          setDiscordConnected(!!res.success);
        }
      } catch (e) {}
    };
    fetchStatuses();
  }, [authUser]);

  const logOut = async () => {
    await signOut();
  };

  const getTotalUnread = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const [unreadRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/unread-counts`, { headers }),
      ]);
      if (unreadRes.ok) {
        const unread = await unreadRes.json();
        console.log("unread", unread);
        setTotalUnread(unread.total_unread);
      }
    } catch (e) {}
  };
  useEffect(() => {
    getTotalUnread();
  }, []);
  return (
    <aside
      className={`h-screen w-16 flex flex-col items-center py-[18px] min-w-16 overflow-hidden bg-[#161717] flex-shrink-0 ${
        isHelpPage ? "fixed left-0 top-0 z-40" : ""
      }`}
    >
      <img src={logo} alt="Pigeon Logo" className="w-9 h-9 mb-4" />
      <nav className="flex flex-col gap-4 flex-1 mt-5">
        <button
          className={`relative p-2 rounded-[10px] flex items-center justify-center transition-colors
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
          {totalUnread > 0 && (
            <div className="absolute -right-1 -bottom-1 h-5 w-5 rounded-full bg-white text-black text-[10px] flex items-center justify-center">
              {totalUnread > 99 ? "99+" : totalUnread}
            </div>
          )}
        </button>
        <button
          className={`relative p-2 rounded-[10px] flex items-center justify-center transition-colors
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
        <button
          className={`relative p-2 rounded-[10px] flex items-center justify-center transition-colors
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
        <button
          className={`relative p-2 rounded-[10px] flex items-center justify-center transition-colors
    ${activeNav === "AIChat" ? "bg-[#212121]" : "hover:bg-[#212121]"}`}
          onClick={() => {
            setActiveNav("AIChat");
            navigate("/ai");
          }}
        >
          {activeNav === "AiChat" && (
            <span className="absolute left-[-13px] h-full top-0 bottom-2 w-1 rounded bg-[#3474ff]" />
          )}
          <BotMessageSquare
            className={`${
              activeNav === "AiChat" ? "opacity-1" : "opacity-[0.5]"
            } w-6 h-6`}
          />
        </button>

        <button
          className={`relative p-2 rounded-[10px] flex items-center justify-center transition-colors
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
        <button
          className={`relative p-2 rounded-[10px] flex items-center justify-center transition-colors
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
        <hr className="mb-2" />
        <FocusToggle
          imgTop={focusDisable}
          imgBottom={focusEnable}
          onToggle={() => setIsFocusMode(!isFocusMode)}
        />
      </nav>
      <div className="flex flex-col items-center gap-6 mt-auto mb-4">
        <div className="relative bg-[#7B5CFA] rounded-[10px] p-2 group">
          <img src={Discord} alt="Discord" className="w-4 h-4 rounded" />
          <span
            className={`absolute -bottom-0.5 -right-0.5 block w-2 h-2 rounded-full ${
              discordConnected ? "bg-green-500" : "bg-gray-500"
            }`}
          ></span>
          <div
            className="fixed left-14 opacity-0 group-hover:opacity-100 transition-opacity bg-[#111111] text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none border border-[#333]"
            style={{ zIndex: 99999 }}
          >
            {discordConnected ? "Discord Connected" : "Discord Not Connected"}
          </div>
        </div>
        <div className="relative bg-[#3474FF] rounded-[10px] p-2 group">
          <img src={Telegram} alt="Telegram" className="w-4 h-4 rounded" />
          <span
            className={`absolute -bottom-0.5 -right-0.5 block w-2 h-2 rounded-full ${
              telegramConnected ? "bg-green-500" : "bg-gray-500"
            }`}
          ></span>
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
