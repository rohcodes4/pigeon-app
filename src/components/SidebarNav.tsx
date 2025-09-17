import { toast } from "@/hooks/use-toast";
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
  BotMessageSquare,
  Users,
} from "lucide-react";
import logo from "@/assets/images/sidebarLogo.png";
import { useNavigate } from "react-router-dom";
// import { supabase } from "@/integrations/supabase/client"; // Removed Supabase import
import { useUserSettings } from "@/hooks/useUserSettings";
import { useTheme, Theme } from "@/hooks/useTheme"; // Correctly import Theme

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
interface SidebarNavProps {
  activePage: string;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({ activePage }) => {
  const { user, checkAuth } = useAuth(); // Destructure checkAuth

  const navMap: { [key: string]: string } = {
    "/": "AI",
    "/smart-tasks": "Tasks",
    "/bookmarks": "Bookmarks",
    "/contacts": "Contacts",
    "/ai": "AiChat",
    "/help": "Help",
    // add more as needed
  };
  const { settings, updateSettings, loading } = useUserSettings();
  const { setTheme: setGlobalTheme } = useTheme(); // Destructure setTheme from useTheme
const isHelpPage = activePage === "/help";
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

  // Fetch connection status from backend
  useEffect(() => {
    if (!authUser) return;
    const fetchStatuses = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const [tgRes, dcRes] = await Promise.all([
          fetch(`${BACKEND_URL}/auth/telegram/status`, { headers }),
          fetch(`${BACKEND_URL}/auth/discord/status`, { headers }),
        ]);
        if (tgRes.ok) {
          const tg = await tgRes.json();
          setTelegramConnected(!!tg.connected);
        }
        if (dcRes.ok) {
          const dc = await dcRes.json();
          setDiscordConnected(!!dc.connected);
        }
      } catch (e) {
        // ignore transient errors
      }
    };
    fetchStatuses();
  }, [authUser]);

  const logOut = async () => {
    await signOut(); // Call signOut from useAuth
  };

  const DISCORD_CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID;
  const REDIRECT_URI = "http://localhost:8000/auth/discord/callback"; // Or your frontend callback route if you handle tokens client-side
  const DISCORD_OAUTH_URL = `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20email`;

  const connectDiscord = async () =>{
    try {
      const response = await fetch(`${BACKEND_URL}/auth/discord/start`, {
        method: "POST",
      });
      const data = await response.json();

      if (response.ok) {
        handleOAuthPopup(data.oauth_url, "discord");
      } else {
        throw new Error(
          data.detail || "Failed to start Discord authentication"
        );
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  }


  // OAuth handlers
  const handleOAuthPopup = (url: string, platform: string) => {
    const popup = window.open(
      url,
      `${platform}_oauth`,
      "width=500,height=600,scrollbars=yes,resizable=yes"
    );

    const handleMessage = async (event: MessageEvent) => {
      // Allow messages from the backend (localhost:8000) to frontend (localhost:8080)
      const allowedOrigins = [
        window.location.origin, // Frontend origin (localhost:8080)
        import.meta.env.VITE_BACKEND_URL || "http://localhost:8000", // Backend origin
      ];

      console.log("OAuth message received:", {
        origin: event.origin,
        allowedOrigins,
        data: event.data,
      });

      if (!allowedOrigins.includes(event.origin)) {
        console.log("Message origin not allowed:", event.origin);
        return;
      }

      const { type, data, error } = event.data;

      if (type === `${platform.toUpperCase()}_AUTH_SUCCESS`) {
        console.log("OAuth success:", data);
        console.log("Setting access_token for Discord:", data.discord_access_token);
        localStorage.setItem("access_token", data.discord_access_token);

        // Verify token was stored
        const storedToken = localStorage.getItem("access_token");
        console.log("Stored token:", storedToken ? "exists" : "missing");

        toast({
          title: "Welcome!",
          description: `You have been signed in with ${platform}.`,
        });

        console.log("Calling checkAuth...");
        await checkAuth();

        try {
          // Mark Discord connected in onboarding storage, if applicable
          const meRes = await fetch(`${BACKEND_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${data.access_token}` },
          });
          const me = meRes.ok ? await meRes.json() : null;
          if (me && me.id) {
            const key = `chatpilot_accounts_${me.id}`;
            const existing = JSON.parse(localStorage.getItem(key) || "{}");
            const updated = { ...existing };
            updated.discord = true;
            localStorage.setItem(key, JSON.stringify(updated));
          }
        } catch (e) {
          console.log("Failed to set Discord connected flag:", e);
        }
        console.log("checkAuth completed");

        popup?.close();
        window.removeEventListener("message", handleMessage);
        clearInterval(checkClosed);
        clearTimeout(timeout);
      } else if (type === `${platform.toUpperCase()}_AUTH_ERROR`) {
        console.log("OAuth error:", error);
        toast({
          title: "Authentication Error",
          description: error || `Failed to sign in with ${platform}`,
          variant: "destructive",
        });
        popup?.close();
        window.removeEventListener("message", handleMessage);
        clearInterval(checkClosed);
        clearTimeout(timeout);
      }
    };

    window.addEventListener("message", handleMessage);

    // Check if popup is closed manually
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        window.removeEventListener("message", handleMessage);
        clearInterval(checkClosed);
        clearTimeout(timeout);
      }
    }, 1000);

    // Add timeout for OAuth flow (5 minutes)
    const timeout = setTimeout(() => {
      console.log("OAuth timeout reached");
      popup?.close();
      window.removeEventListener("message", handleMessage);
      clearInterval(checkClosed);
      toast({
        title: "Authentication Timeout",
        description: `${platform} authentication timed out. Please try again.`,
        variant: "destructive",
      });
    }, 5 * 60 * 1000);
  };

  useEffect(() => {
    if (window.location.hash.includes("access_token")) {
      const params = new URLSearchParams(window.location.hash.substring(1));
      const token = params.get("access_token");
      const type = params.get("token_type");
      console.log('token')
      console.log(token)
      console.log(type)
      // Store token, call Discord API etc.
    }
  }, []);
  

  const [discordToken, setDiscordToken] = useState(null);

  // useEffect(() => {
  //   window.electronAPI.onDiscordToken((token) => {
  //     console.log("Received Discord token:", token);
  //     setDiscordToken(token);
  //     // Use the token for your app logic
  //   });
  // }, []);

  function getDiscordAccessToken(): Promise<string> {
    return new Promise((resolve, reject) => {
      // Listen once for the discord-token event
      const handler = (event, token) => {
        console.log('[Vite app] Discord token received:', token);
        window.electronAPI.offDiscordToken?.(handler); // remove listener if supported
        resolve(token);
      };
  
      // Add listener for token
      window.electronAPI.onDiscordToken((token) => {
        console.log('[Vite app] Discord token received:', token);
        resolve(token);
      });
  
      // Open Discord login window
      window.electronAPI.openDiscordLogin();
  
      // Optionally set a timeout to reject if no token received in time (e.g., 2 mins)
      setTimeout(() => {
        reject(new Error('Discord login timeout - token not received'));
      }, 2 * 60 * 1000);
    });
  }
  
  async function loginWithDiscord() {
    try {
      const token = await getDiscordAccessToken();
      console.log('Discord access token:', token);
      // Use token for API calls or auth flow
    } catch (e) {
      console.error('Failed to get Discord token:', e);
    }
  }
  
  // Call loginWithDiscord() on button click or app startup as needed

  
  return (
    <aside className={`h-screen w-16 flex flex-col items-center py-[18px] min-w-16 overflow-hidden bg-[#171717] flex-shrink-0 ${
      isHelpPage ? 'fixed left-0 top-0 z-40' : ''
    }`}>
      <img src={logo} alt="AI" className="w-9 h-9 mb-4" />
      <nav className="flex flex-col gap-4 flex-1">
        {/* AI */}
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
        </button>
        {/* Logs */}
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
        {/* Favourite */}
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
        {/* AI Chat */}
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

        {/* Users */}
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
        {/* Help */}
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
      </nav>
      <div className="flex flex-col items-center gap-6 mt-auto mb-4">
        {/* Discord Icon with Connected Badge */}
        <div className="relative bg-[#7B5CFA] rounded-[10px] p-2 group"
          onClick={() => loginWithDiscord()}
        >
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
