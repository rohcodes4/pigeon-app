import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import AIimg from "@/assets/images/aiBlue.png";
import {
  EyeIcon,
  UserIcon,
  LockClosedIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { Mail } from "lucide-react";
import google from "@/assets/images/google.png";
import telegram from "@/assets/images/telegram.png";
import discord from "@/assets/images/discord.png";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import ConnectTelegram from "./ConnectTelegram";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const AuthPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptTnC, setAcceptTnC] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialMode = params.get("mode") === "signup" ? false : true; // false = sign up, true = sign in
  const [isSignIn, setIsSignIn] = useState(initialMode);
  const { user, loading, checkAuth } = useAuth(); // Destructure checkAuth

  // Telegram authentication state
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const [telegramAuthMethod, setTelegramAuthMethod] = useState<"qr" | "phone">(
    "qr"
  );
  const [qrCode, setQrCode] = useState("");
  const [qrToken, setQrToken] = useState("");
  const [qrPolling, setQrPolling] = useState(false);
  const [qrNeedsPassword, setQrNeedsPassword] = useState(false);
  const [qrPassword, setQrPassword] = useState("");
  const [submittingQrPassword, setSubmittingQrPassword] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignIn) {
        // Handle Sign In with FastAPI backend
        const response = await fetch(`${BACKEND_URL}/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            username: username,
            password: password,
          }).toString(),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Authentication failed");
        }

        const data = await response.json(); // Parse the response to get the token
        localStorage.setItem("access_token", data.access_token); // Store the token

        toast({
          title: "Welcome back!",
          description: "You have been signed in successfully.",
        });
        await checkAuth();
      } else {
        // Handle Sign Up with FastAPI backend
        const response = await fetch(`${BACKEND_URL}/auth/signup`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            username: username,
            email: email,
            password: password,
          }).toString(),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Registration failed");
        }

        // After successful signup, you might want to log the user in immediately
        // For now, let's just make sure the user can sign in after registration
        const data = await response.json(); // Get any potential data from signup response
        // If signup also returns a token (unlikely for pure signup, but good to handle), store it.
        if (data.access_token) {
          localStorage.setItem("access_token", data.access_token);
        }

        toast({
          title: "Account created!",
          description: "You can now sign in.",
        });
        setIsSignIn(true);
        await checkAuth();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const submitQrPassword = async () => {
    if (!qrPassword) {
      toast({
        title: "2FA password required",
        description: "Please enter your Telegram 2FA password.",
        variant: "destructive",
      });
      return;
    }
    try {
      setSubmittingQrPassword(true);
      const authToken = localStorage.getItem("access_token");
      const response = await fetch(
        `${BACKEND_URL}/auth/qr/${qrToken}/password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          body: new URLSearchParams({ password: qrPassword }).toString(),
        }
      );
      const data = await response.json();
      if (response.ok && data.status === "success") {
        localStorage.setItem("access_token", data.access_token);

        // Trigger sync-dialogs in the background (non-blocking)
        fetch(`${BACKEND_URL}/api/sync-dialogs`, {
          method: "POST",
          headers: { Authorization: `Bearer ${data.access_token}` },
        })
          .then(() => {
            console.log("Completed initial chat sync after Telegram 2FA login");
          })
          .catch((syncError) => {
            console.error(
              "Failed to trigger initial sync after 2FA:",
              syncError
            );
          });

        toast({
          title: "Welcome!",
          description:
            "Telegram connected. Your chats are being synced in the background.",
        });
        setShowTelegramModal(false);
        setQrNeedsPassword(false);
        setQrPassword("");
        await checkAuth();
      } else {
        toast({
          title: "2FA failed",
          description: data.detail || "Invalid password or verification failed",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to submit 2FA password",
        variant: "destructive",
      });
    } finally {
      setSubmittingQrPassword(false);
    }
  };

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
        console.log("Setting access_token:", data.access_token);
        localStorage.setItem("access_token", data.access_token);

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

  const handleGoogleAuth = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/auth/google/start`, {
        method: "POST",
      });
      const data = await response.json();

      if (response.ok) {
        handleOAuthPopup(data.oauth_url, "google");
      } else {
        throw new Error(data.detail || "Failed to start Google authentication");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDiscordAuth = async () => {
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
  };

  const handleTelegramAuth = async () => {
    try {
      setIsLoading(true);

      if (telegramAuthMethod === "phone") {
        // For phone auth, just show the modal - no need to make API call yet
        setShowTelegramModal(true);
        return;
      }

      // QR code authentication
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${BACKEND_URL}/auth/qr`, {
        method: "POST",
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : undefined,
      });
      const data = await response.json();

      if (response.ok) {
        setQrCode(data.qr);
        setQrToken(data.token);
        setShowTelegramModal(true);
        startQRPolling(data.token);
      } else {
        throw new Error(
          data.detail || "Failed to start Telegram authentication"
        );
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startQRPolling = async (qrToken: string) => {
    setQrPolling(true);
    const authToken = localStorage.getItem("access_token");
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/auth/qr/${qrToken}`, {
          headers: authToken
            ? {
                Authorization: `Bearer ${authToken}`,
              }
            : undefined,
        });
        const data = await response.json();

        if (response.ok && data.status === "success") {
          clearInterval(pollInterval);
          setQrPolling(false);
          setShowTelegramModal(false);

          localStorage.setItem("access_token", data.access_token);

          // Trigger sync-dialogs in the background (non-blocking)
          fetch(`${BACKEND_URL}/api/sync-dialogs`, {
            method: "POST",
            headers: { Authorization: `Bearer ${data.access_token}` },
          })
            .then(() => {
              console.log("Completed initial chat sync after Telegram login");
            })
            .catch((syncError) => {
              console.error("Failed to trigger initial sync:", syncError);
            });

          toast({
            title: "Welcome!",
            description:
              "You have been signed in with Telegram. Your chats are being synced in the background.",
          });
          await checkAuth();
        } else if (data.status === "password_required") {
          clearInterval(pollInterval);
          setQrPolling(false);
          setQrNeedsPassword(true);
        } else if (data.status === "invalid_token") {
          clearInterval(pollInterval);
          setQrPolling(false);
          setShowTelegramModal(false);
          toast({
            title: "QR Code Expired",
            description: "Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        // Continue polling on network errors
        console.log("QR polling error:", error);
      }
    }, 2000); // Poll every 2 seconds

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      setQrPolling(false);
      if (showTelegramModal) {
        setShowTelegramModal(false);
        toast({
          title: "QR Code Expired",
          description: "Please try again.",
          variant: "destructive",
        });
      }
    }, 5 * 60 * 1000);
  };

  const closeTelegramModal = () => {
    setShowTelegramModal(false);
    setQrPolling(false);
    setQrCode("");
    setQrToken("");
    setQrNeedsPassword(false);
    setQrPassword("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br">
      <Header />
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[calc(100vh-80px)] ">
        {/* Custom Card based on Figma */}
        <div
          className={`w-full max-w-md rounded-2xl shadow-lg p-8 bg-[#111111]`}
        >
          <div className="mb-0 flex flex-col items-center justify-center gap-2">
            <img src={AIimg} alt="AI" className="w-16 h-16" />
            <h2 className={`text-2xl tracking-[1px] text-center text-white`}>
              {isSignIn ? "Sign In" : "Create Account"}
            </h2>
          </div>
          <div className="mt-0 mb-10 text-center text-[13px]">
            <p className="text-[#ffffff48]">
              {isSignIn ? "Need an account?" : "Already having an account?"}
              <Button
                variant="link"
                onClick={() => setIsSignIn(!isSignIn)}
                className="pl-1 text-[#5389ff]"
              >
                {isSignIn ? "Create Account" : "Sign in"}
              </Button>
            </p>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="flex items-center bg-[#212121] rounded-[12px] px-3">
              <UserIcon className="w-5 h-5 text-[#8c8c8c] mr-2" />
              <Input
                type="text"
                placeholder={isSignIn ? "Username" : "Enter a unique username"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="border-0 bg-transparent placeholder:text-[#8c8c8c] flex-1 pl-0 !outline-none focus:!outline-none  focus:ring-0"
              />
            </div>
            {/* Email (only for sign up) */}
            {!isSignIn && (
              <div className="flex items-center bg-[#212121] rounded-[12px] px-3">
                <Mail className="w-5 h-5 text-[#8c8c8c] mr-2" />
                <Input
                  type="email"
                  placeholder="youremail@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-0 bg-transparent placeholder:text-[#8c8c8c] flex-1 pl-0"
                />
              </div>
            )}
            <div className="flex items-center bg-[#212121] rounded-[12px] px-3 relative">
              <LockClosedIcon className="w-5 h-5 text-[#8c8c8c] mr-2" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="************"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-0 bg-transparent placeholder:text-[#8c8c8c] flex-1 pl-0 pr-10"
              />
              <button
                type="button"
                className="absolute right-3"
                tabIndex={-1}
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-5 h-5 text-[#8c8c8c]" />
                ) : (
                  <EyeIcon className="w-5 h-5 text-[#8c8c8c]" />
                )}
              </button>
            </div>
            {!isSignIn && (
              <div className="flex items-center space-x-2 py-3">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    id="tnc"
                    type="checkbox"
                    checked={acceptTnC}
                    onChange={(e) => setAcceptTnC(e.target.checked)}
                    className="peer sr-only"
                    required
                  />
                  <span className="w-4 h-4 rounded-[6px] border border-[#ffffff32] flex items-center justify-center peer-checked:bg-[#5389ff] peer-checked:[&>svg]:opacity-100 transition">
                    <svg
                      className="w-3 h-3 opacity-0 text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </span>
                  <span className="text-xs text-[#8c8c8c] select-none">
                    I accept and agree to all the{" "}
                    <a href="/terms" className="text-[#5389ff] underline">
                      Terms & Conditions.
                    </a>
                  </span>
                </label>
              </div>
            )}
            <Button
              type="submit"
              className={`w-full bg-[#5389ff] text-black hover:bg-blue-700 rounded-[12px]`}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : isSignIn ? "Sign In" : "Sign Up"}
            </Button>
          </form>

          <div className="relative flex items-center justify-center my-4">
            <div className="absolute left-0 right-0 h-px bg-white opacity-20"></div>
            <p className="relative z-10 bg-[#111111] text-center text-[13px] text-[#ffffff48] px-4">
              Or continue with
            </p>
          </div>
          <div className="flex items-center justify-center gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleAuth}
              className="w-max bg-[#212121] text-white hover:bg-blue-700 rounded-[12px] grow"
            >
              <img
                src={google}
                alt="google"
                className="w-5 h-5 object-contain "
              />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleTelegramAuth}
              className="w-max bg-[#212121] text-white hover:bg-blue-700 rounded-[12px] grow"
            >
              <img
                src={telegram}
                alt="telegram"
                className="w-5 h-5 object-contain"
              />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleDiscordAuth}
              className="w-max bg-[#212121] text-white hover:bg-blue-700 rounded-[12px] grow"
            >
              <img
                src={discord}
                alt="discord"
                className="w-5 h-5 object-contain"
              />
            </Button>
          </div>
        </div>
      </div>

      {/* Telegram Authentication Modal */}
      {showTelegramModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#111111] rounded-2xl p-8 max-w-sm w-full mx-4">
            <div className="text-center">
              <h3 className="text-xl text-white mb-4">Connect Telegram</h3>

              {/* Authentication Method Toggle */}
              <div className="flex gap-1 bg-[#212121] rounded-lg p-1 mb-6 mx-auto w-fit">
                <button
                  onClick={() => setTelegramAuthMethod("qr")}
                  className={`px-3 py-1 text-xs rounded-md transition ${
                    telegramAuthMethod === "qr"
                      ? "bg-[#5389ff] text-white"
                      : "text-[#ffffff80] hover:text-white"
                  }`}
                >
                  QR Code
                </button>
                <button
                  onClick={() => setTelegramAuthMethod("phone")}
                  className={`px-3 py-1 text-xs rounded-md transition ${
                    telegramAuthMethod === "phone"
                      ? "bg-[#5389ff] text-white"
                      : "text-[#ffffff80] hover:text-white"
                  }`}
                >
                  Phone
                </button>
              </div>

              {telegramAuthMethod === "qr" ? (
                <>
                  <p className="text-[#ffffff48] text-sm mb-6">
                    Open Telegram on your phone and scan this QR code to sign in
                  </p>
                </>
              ) : (
                <p className="text-[#ffffff48] text-sm mb-6">
                  Enter your phone number to receive a verification code
                </p>
              )}

              {telegramAuthMethod === "qr" ? (
                <>
                  {qrCode && (
                    <div className="flex justify-center mb-6">
                      <img
                        src={`data:image/png;base64,${qrCode}`}
                        alt="Telegram QR Code"
                        className="w-48 h-48 bg-white rounded-lg p-2"
                      />
                    </div>
                  )}

                  {qrPolling && (
                    <div className="mb-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#5389ff] mx-auto"></div>
                      <p className="text-[#ffffff48] text-sm mt-2">
                        Waiting for scan...
                      </p>
                    </div>
                  )}

                  {qrNeedsPassword && (
                    <div className="space-y-3">
                      <p className="text-[#ffffffb3] text-sm text-center">
                        Enter your Telegram 2FA password
                      </p>
                      <Input
                        type="password"
                        value={qrPassword}
                        onChange={(e) => setQrPassword(e.target.value)}
                        placeholder="Your 2FA password"
                        className="bg-[#212121] border-0"
                      />
                      <Button
                        onClick={submitQrPassword}
                        disabled={submittingQrPassword}
                        className="w-full bg-[#5389ff] text-black hover:bg-blue-700 rounded-[12px]"
                      >
                        {submittingQrPassword ? "Submitting..." : "Submit 2FA"}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="mb-6">
                  <ConnectTelegram />
                </div>
              )}

              <div className="flex gap-3 mt-3">
                <Button
                  onClick={closeTelegramModal}
                  variant="outline"
                  className="flex-1 bg-[#212121] text-white border-[#333] hover:bg-[#333]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (telegramAuthMethod === "qr") {
                      handleTelegramAuth();
                    } else {
                      // For phone method, just close modal and let user try again
                      closeTelegramModal();
                    }
                  }}
                  variant="outline"
                  className="flex-1 bg-[#212121] text-white border-[#333] hover:bg-[#333]"
                >
                  {telegramAuthMethod === "qr" ? "New QR" : "Try Again"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
