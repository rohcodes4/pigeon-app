import { useState, useEffect, useCallback } from "react"; // Add useCallback
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  MessageCircle,
  Users,
  Check,
  ExternalLink,
  Loader2,
  ArrowRight,
  Ban,
  Play,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { PlatformStatusBadges } from "./PlatformStatusBadges";
import ConnectTelegram from "./ConnectTelegram";
import telegram from "@/assets/images/telegram.png";
import discord from "@/assets/images/discord.png";
import play from "@/assets/images/play.png";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"; // Import AlertDialog components

interface ConnectAccountsProps {
  onAccountsConnected: () => void;
  onContinue?: () => void;
  telegramConnected: boolean;
  setTelegramConnected: React.Dispatch<React.SetStateAction<boolean>>;
  discordConnected: boolean;
  setDiscordConnected: React.Dispatch<React.SetStateAction<boolean>>;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const ConnectAccounts = ({
  onAccountsConnected,
  onContinue,
  telegramConnected,
  setTelegramConnected,
  discordConnected,
  setDiscordConnected,
}: ConnectAccountsProps) => {
  const { user, checkAuth } = useAuth();
  const [loading, setLoading] = useState({ telegram: false, discord: false });
  const [showTelegramQrModal, setShowTelegramQrModal] = useState(false);
  const [telegramQrCode, setTelegramQrCode] = useState<string | null>(null);
  const [telegramQrToken, setTelegramQrToken] = useState<string | null>(null);
  const [pollingIntervalId, setPollingIntervalId] =
    useState<NodeJS.Timeout | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [twoFactorPassword, setTwoFactorPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<"qr" | "phone">("qr");
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  const checkAllConnected = useCallback(() => {
    if (telegramConnected && discordConnected) {
      onAccountsConnected();
    }
  }, [telegramConnected, discordConnected, onAccountsConnected]);

  useEffect(() => {
    const fetchStatuses = async () => {
      if (!user) return;
      try {
        const token = localStorage.getItem("access_token");
        const tgRes = await fetch(`${BACKEND_URL}/auth/telegram/status`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (tgRes.ok) {
          const tg = await tgRes.json();
          setTelegramConnected(!!tg.connected);
        }
        const dcRes = await fetch(`${BACKEND_URL}/auth/discord/status`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (dcRes.ok) {
          const dc = await dcRes.json();
          setDiscordConnected(!!dc.connected);
        }
      } catch (e) {
        // ignore
      }
    };
    fetchStatuses();
  }, [user, setTelegramConnected, setDiscordConnected]);

  useEffect(() => {
    if (telegramQrToken && showTelegramQrModal) {
      const interval = setInterval(async () => {
        try {
          const token = localStorage.getItem("access_token");
          const response = await fetch(
            `${BACKEND_URL}/auth/qr/${telegramQrToken}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          let data = null;
          let isError = false;

          if (response.ok) {
            data = await response.json();
          } else {
            try {
              data = await response.json();
            } catch {
              data = { detail: "Unknown error" };
            }
            isError = true;
          }

          if (data && data.status === "success") {
            clearInterval(interval);
            setPollingIntervalId(null);
            setShowTelegramQrModal(false);
            setTelegramConnected(true); // Update local state
            toast({
              title: "Telegram Connected",
              description:
                "Successfully connected to your Telegram account. You can now sync your chats when ready.",
            });
            checkAllConnected();
          } else if (data && data.status === "password_required") {
            // 2FA password is required
            clearInterval(interval);
            setPollingIntervalId(null);
            setShowTelegramQrModal(false);
            setShowPasswordModal(true);
            toast({
              title: "Two-Factor Authentication Required",
              description:
                "Please enter your Telegram password to complete the connection.",
            });
          } else if (
            data &&
            (data.status === "error" || data.status === "invalid_token")
          ) {
            clearInterval(interval);
            setPollingIntervalId(null);
            setShowTelegramQrModal(false);
            setTelegramQrCode(null);
            setTelegramQrToken(null);
            toast({
              title: "Telegram Connection Failed",
              description: data.detail || "Please try again.",
              variant: "destructive",
            });
          } else if (isError || (data && data.detail)) {
            clearInterval(interval);
            setPollingIntervalId(null);
            setShowTelegramQrModal(false);
            setTelegramQrCode(null);
            setTelegramQrToken(null);
            toast({
              title: "Telegram Connection Error",
              description: data?.detail || "Unexpected response from server.",
              variant: "destructive",
            });
          }
          // else: still waiting, do nothing
        } catch (error) {
          clearInterval(interval);
          setPollingIntervalId(null);
          setShowTelegramQrModal(false);
          setTelegramQrCode(null);
          setTelegramQrToken(null);
          toast({
            title: "Telegram Connection Error",
            description: "Failed to check Telegram status. Please try again.",
            variant: "destructive",
          });
        }
      }, 3000); // Poll every 3 seconds
      setPollingIntervalId(interval);

      return () => {
        if (pollingIntervalId) {
          clearInterval(pollingIntervalId);
          setPollingIntervalId(null);
        }
      };
    }
  }, [
    telegramQrToken,
    showTelegramQrModal,
    checkAllConnected,
    setTelegramConnected,
  ]);

  const connectTelegram = async () => {
    if (!user) return;

    if (authMethod === "phone") {
      // For phone auth, we'll show the phone input modal
      setShowPhoneModal(true);
      return;
    }

    // QR code authentication
    setLoading((prev) => ({ ...prev, telegram: true }));
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${BACKEND_URL}/auth/qr`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || "Failed to initiate Telegram QR login"
        );
      }
      const data = await response.json();
      setTelegramQrCode(data.qr);
      setTelegramQrToken(data.token);
      setShowTelegramQrModal(true);
    } catch (error: any) {
      toast({
        title: "Telegram Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, telegram: false }));
    }
  };

  const submitTelegramPassword = async () => {
    if (!telegramQrToken || !twoFactorPassword.trim()) {
      toast({
        title: "Password Required",
        description: "Please enter your Telegram password.",
        variant: "destructive",
      });
      return;
    }

    setPasswordLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const formData = new FormData();
      formData.append("password", twoFactorPassword);

      const response = await fetch(
        `${BACKEND_URL}/auth/qr/${telegramQrToken}/password`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (data.status === "success") {
        setShowPasswordModal(false);
        setTwoFactorPassword("");
        setTelegramConnected(true);

        toast({
          title: "Telegram Connected",
          description:
            "Successfully connected to your Telegram account. You can now sync your chats when ready.",
        });
        checkAllConnected();
      } else {
        throw new Error(data.detail || "Failed to verify password");
      }
    } catch (error: any) {
      toast({
        title: "Authentication Failed",
        description: error.message || "Invalid password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const connectDiscord = async () => {
    if (!user) return;

    setLoading((prev) => ({ ...prev, discord: true }));

    try {
      // Start Discord OAuth flow with Authorization header so backend can link to current user
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${BACKEND_URL}/auth/discord/start`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to start Discord OAuth");
      }

      const data = await response.json();

      // Open Discord OAuth in a popup window
      const popup = window.open(
        data.oauth_url,
        "discord_oauth",
        "width=500,height=600,scrollbars=yes,resizable=yes"
      );

      if (!popup) {
        throw new Error("Popup blocked. Please allow popups for this site.");
      }

      // Listen for the OAuth callback
      const checkOAuthResult = () => {
        try {
          // Check if popup is closed
          if (popup.closed) {
            // OAuth completed, check if Discord is now connected
            setTimeout(() => {
              setDiscordConnected(true);
              setLoading((prev) => ({ ...prev, discord: false }));

              // Status is derived from backend

              toast({
                title: "Discord Connected",
                description: "Successfully connected to your Discord account.",
              });

              checkAllConnected();
            }, 1000);
            return;
          }

          // Check again in 1 second
          setTimeout(checkOAuthResult, 1000);
        } catch (error) {
          console.error("Error checking OAuth result:", error);
        }
      };

      checkOAuthResult();
    } catch (error: any) {
      toast({
        title: "Discord Connection Failed",
        description: error.message,
        variant: "destructive",
      });
      setLoading((prev) => ({ ...prev, discord: false }));
    }
  };

  const canContinue = telegramConnected || discordConnected;

  return (
    <div className="space-y-8 ">
      <div className="">
        <h2 className="text-[36px] leading-[44px] tracking-[2px] text-white mb-2">
          Connect
          <br /> Your Platforms
        </h2>
        <p className="text-[#ffffff48]">
          Connect your Discord and Telegram accounts to start syncing your
          conversations.
        </p>
      </div>
      <PlatformStatusBadges
        discordConnected={discordConnected}
        telegramConnected={telegramConnected}
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card
          className={`${
            discordConnected ? "bg-[#111111]" : "bg-[#ffffff06]"
          } border-0 shadow-none rounded-[18px]`}
        >
          <CardContent className="p-6 gap-5">
            <div className="flex gap-2 items-center">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#5389ff] flex items-center justify-center relative">
                <img src={discord} alt="Discord" className="w-6 h-6" />
                <span
                  className={`
      absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#23272f]
      ${discordConnected ? "bg-[#50DF3A]" : "bg-[#FDCB35]"}
    `}
                />
              </div>
              <div className="flex flex-col gap-0 mb-1">
                <span className="text-lg font-semibold mb-1 text-white">
                  Discord
                </span>
                <span
                  className={`text-xs text-[#ffffff48] rounded-full font-medium`}
                >
                  Connect your Discord account
                </span>
              </div>
            </div>
            <hr className="w-full h-0.5 my-4 bg-[#ffffff06]" />

            <div className="flex-1 text-[#ffffff72]">
              <p className="text-[#ffffff72] mb-4">What you'll get:</p>
              <ul className="text-xs text-[#ffffff48] space-y-2 mb-3">
                <li className="flex gap-4">
                  <Check className="w-4 h-4 flex-shrink-0" /> Access server
                  channels
                </li>
                <li className="flex gap-4">
                  <Check className="w-4 h-4 flex-shrink-0" /> View direct
                  messages
                </li>
                <li className="flex gap-4">
                  <Check className="w-4 h-4 flex-shrink-0" /> Manage
                  notifications
                </li>
                <li className="flex gap-4">
                  <Check className="w-4 h-4 flex-shrink-0" /> Real-time sync
                </li>
              </ul>
              <hr className="w-full h-0.5 my-4 bg-[#ffffff06]" />

              <div className="flex items-center justify-between mt-4">
                <span
                  className={`
    text-xs pr-3 py-1 flex gap-2 items-center 
    ${discordConnected ? "text-[#50DF3A]" : ""}
  `}
                >
                  <span>
                    {discordConnected ? (
                      <div className="bg-[#50DF3A] rounded-full p-1 flex items-center justify-center">
                        <Check className="w-3 h-3 text-black" />
                      </div>
                    ) : (
                      <Ban className="w-4 h-4" />
                    )}
                  </span>{" "}
                  <span>
                    {discordConnected ? "Connected" : "Not Connected"}
                  </span>
                </span>
                {discordConnected ? (
                  <Button
                    onClick={connectDiscord}
                    disabled={loading.discord}
                    className="bg-[#212121] hover:bg-[#4170cc] text-white font-semibold rounded-[12px] px-6 py-2 gap-2 shadow-none"
                  >
                    Reconnect
                  </Button>
                ) : (
                  <Button
                    onClick={connectDiscord}
                    disabled={loading.discord}
                    className="bg-[#2d2d2d] hover:bg-[#4170cc] text-white font-semibold rounded-[12px] px-6 py-2 gap-2 shadow-none"
                  >
                    {loading.discord && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    {discordConnected ? "Reconnect" : "Connect"}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className={`${
            telegramConnected ? "bg-[#111111]" : "bg-[#ffffff06]"
          } border-0 shadow-none rounded-[18px]`}
        >
          <CardContent className="p-6 gap-5">
            <div className="flex gap-2 items-center">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#5389ff] flex items-center justify-center relative">
                <img src={telegram} alt="Telegram" className="w-6 h-6" />
                <span
                  className={`
            absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#23272f]
            ${telegramConnected ? "bg-[#50DF3A]" : "bg-[#FDCB35]"}
          `}
                />
              </div>
              <div className="flex flex-col gap-0 mb-1">
                <span className="text-lg font-semibold mb-1 text-white">
                  Telegram
                </span>
                <span
                  className={`text-xs text-[#ffffff48] rounded-full font-medium`}
                >
                  Connect your Telegram account
                </span>
              </div>
            </div>
            <hr className="w-full h-0.5 my-4 bg-[#ffffff06]" />

            <div className="flex-1 text-[#ffffff72]">
              <p className="text-[#ffffff72] mb-4">What you'll get:</p>
              <ul className="text-xs text-[#ffffff48] space-y-2 mb-3">
                <li className="flex gap-4">
                  <Check className="w-4 h-4 flex-shrink-0" />
                  Access to all your Telegram chats
                </li>
                <li className="flex gap-4">
                  <Check className="w-4 h-4 flex-shrink-0" />
                  Message history and notifications
                </li>
                <li className="flex gap-4">
                  <Check className="w-4 h-4 flex-shrink-0" />
                  Smart summaries of channel activity
                </li>
                <li className="flex gap-4 h-4"></li>
              </ul>
              <hr className="w-full h-0.5 my-4 bg-[#ffffff06]" />

              <div className="flex items-center justify-between mt-4">
                <span
                  className={`
          text-xs pr-3 py-1 flex gap-2 items-center 
          ${telegramConnected ? "text-[#50DF3A]" : ""}
        `}
                >
                  <span>
                    {telegramConnected ? (
                      <div className="bg-[#50DF3A] rounded-full p-1 flex items-center justify-center">
                        <Check className="w-3 h-3 text-black" />
                      </div>
                    ) : (
                      <Ban className="w-4 h-4" />
                    )}
                  </span>
                  <span>
                    {telegramConnected ? "Connected" : "Not Connected"}
                  </span>
                </span>
                {telegramConnected ? (
                  <Button
                    onClick={connectTelegram}
                    disabled={loading.telegram}
                    className="bg-[#212121] hover:bg-[#4170cc] text-white font-semibold rounded-[12px] px-6 py-2 gap-2 shadow-none"
                  >
                    Reconnect
                  </Button>
                ) : (
                  <div className="flex flex-col gap-2">
                    {/* Authentication Method Toggle */}
                    <div className="flex gap-1 bg-[#212121] rounded-lg p-1">
                      <button
                        onClick={() => setAuthMethod("qr")}
                        className={`px-3 py-1 text-xs rounded-md transition ${
                          authMethod === "qr"
                            ? "bg-[#5389ff] text-white"
                            : "text-[#ffffff80] hover:text-white"
                        }`}
                      >
                        QR Code
                      </button>
                      <button
                        onClick={() => setAuthMethod("phone")}
                        className={`px-3 py-1 text-xs rounded-md transition ${
                          authMethod === "phone"
                            ? "bg-[#5389ff] text-white"
                            : "text-[#ffffff80] hover:text-white"
                        }`}
                      >
                        Phone
                      </button>
                    </div>
                    <Button
                      onClick={connectTelegram}
                      disabled={loading.telegram}
                      className="bg-[#2d2d2d] hover:bg-[#4170cc] text-white font-semibold rounded-[12px] px-6 py-2 gap-2 shadow-none"
                    >
                      {loading.telegram && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )}
                      {telegramConnected ? "Reconnect" : "Connect"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111111] border-0 shadow-none rounded-[18px]">
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4 ">
              <div className="w-full">
                <div className="flex flex-col gap-0 mb-1">
                  <span className="text-lg font-semibold mb-1 text-white">
                    Finalize Your Configuration
                  </span>
                  <span
                    className={`text-xs text-[#ffffff48] rounded-full font-medium`}
                  >
                    {canContinue
                      ? "You are connected, you can move forward."
                      : "Connect at least one platform."}
                  </span>
                </div>
                <hr className="w-full h-0.5 my-4 bg-[#ffffff06]" />

                <div className="flex-1 text-[#ffffff72]">
                  <p className="text-[#ffffff72] mb-4">What to anticipate:</p>
                  <ul className="text-xs text-[#ffffff48] space-y-2 mb-3">
                    <li className="flex gap-4">
                      <Check className="w-4 h-4 flex-shrink-0" />
                      Manually trigger chat sync when ready.
                    </li>
                    <li className="flex gap-4">
                      <Check className="w-4 h-4 flex-shrink-0" />
                      Choose your focus areas.
                    </li>
                    <li className="flex gap-4">
                      <Check className="w-4 h-4 flex-shrink-0" />
                      Discover the Focus Mode features.
                    </li>
                    <li className="flex gap-4 h-4"></li>
                  </ul>
                  <hr className="w-full h-0.5 my-4 bg-[#ffffff06]" />

                  <div className="flex items-center justify-between mt-4 h-10">
                    <span
                      className={`text-xs pr-3 py-1 flex gap-2 items-center text-[#84afff]`}
                    >
                      <span>Can't wait to help you!</span>
                    </span>
                    {canContinue && (
                      <Button
                        onClick={onContinue}
                        className="bg-[#5389ff] hover:bg-[#4170cc] text-black rounded-[12px] px-3 py-2 gap-2 shadow-none"
                      >
                        <img
                          src={play}
                          className="fill-black rounded-full w-4 h-4 object-contain"
                        />
                        Continue
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {telegramQrCode && (
        <AlertDialog
          open={showTelegramQrModal}
          onOpenChange={setShowTelegramQrModal}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Connect Telegram</AlertDialogTitle>
              <AlertDialogDescription>
                Scan the QR code with your Telegram app to connect your account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex justify-center p-4">
              <img
                src={`data:image/png;base64,${telegramQrCode}`}
                alt="Telegram QR Code"
                className="w-64 h-64"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setShowTelegramQrModal(false);
                  if (pollingIntervalId) {
                    clearInterval(pollingIntervalId);
                    setPollingIntervalId(null);
                  }
                  setTelegramQrCode(null);
                  setTelegramQrToken(null);
                  setLoading((prev) => ({ ...prev, telegram: false }));
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction disabled>
                Waiting for Scan...
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* 2FA Password Modal */}
      <AlertDialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Two-Factor Authentication</AlertDialogTitle>
            <AlertDialogDescription>
              Your Telegram account has two-factor authentication enabled.
              Please enter your password to complete the connection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-4 p-4">
            <Input
              type="password"
              placeholder="Enter your Telegram password"
              value={twoFactorPassword}
              onChange={(e) => setTwoFactorPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !passwordLoading) {
                  submitTelegramPassword();
                }
              }}
              disabled={passwordLoading}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowPasswordModal(false);
                setTwoFactorPassword("");
                setLoading((prev) => ({ ...prev, telegram: false }));
              }}
              disabled={passwordLoading}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={submitTelegramPassword}
              disabled={passwordLoading || !twoFactorPassword.trim()}
            >
              {passwordLoading && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              Connect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Phone Authentication Modal */}
      <AlertDialog open={showPhoneModal} onOpenChange={setShowPhoneModal}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Connect Telegram via Phone</AlertDialogTitle>
            <AlertDialogDescription>
              Enter your phone number to receive a verification code via
              Telegram.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="p-4">
            <ConnectTelegram
              onConnected={() => {
                setTelegramConnected(true);
                // Status is derived from backend
                toast({
                  title: "Telegram Connected",
                  description: "Successfully connected via phone.",
                });
                checkAllConnected();
                setShowPhoneModal(false);
              }}
              checkAuth={checkAuth}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowPhoneModal(false);
                setLoading((prev) => ({ ...prev, telegram: false }));
              }}
            >
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
