import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Users, Check, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    Telegram: any;
    onTelegramAuth: (user: any) => void;
  }
}

interface ConnectAccountsProps {
  onAccountsConnected: () => void;
}

const TelegramLogin = ({ onSuccess }: { onSuccess: () => void }) => {
  const { user } = useAuth();
  const [step, setStep] = useState<"phone" | "otp" | "success">("phone");
  const [phone, setPhone] = useState("+919840989414");
  const [phoneCodeHash, setPhoneCodeHash] = useState("");
  const [sessionString, setSessionString] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(()=>{
    console.log("step")
    console.log(step)
  },[step])
  // Start login by sending phone number
  async function requestLogin() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/telegram-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      setPhoneCodeHash(data.phoneCodeHash)
      setSessionString(data.session)
      console.log({data})
      if (!data.success) throw new Error(data.error || "Failed to send OTP");
      setStep("otp");
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  // Verify OTP
  async function submitOtp() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/telegram-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user?.id, phone, code: otp, phoneCodeHash, sessionString }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Invalid OTP");
      setStep("success");
      onSuccess();
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  if (step === "success") {
    return <p className="text-green-600 font-semibold">Telegram connected successfully! 🎉</p>;
  }

  return (
    <div className="space-y-3 max-w-xs mr-auto mt-2">
      {step === "phone" && (
        <>
          <input
            type="tel"
            placeholder="+1234567890"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={loading}
            className="w-full p-2 border rounded"
          />
          <Button onClick={requestLogin} disabled={loading || !phone} className="w-full">
            {loading ? "Sending OTP..." : "Send OTP"}
          </Button>
        </>
      )}

      {step === "otp" && (
        <>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            disabled={loading}
            className="w-full p-2 border rounded"
          />
          <Button onClick={submitOtp} disabled={loading || !otp} className="w-full">
            {loading ? "Verifying..." : "Verify OTP"}
          </Button>
        </>
      )}

      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
};

export const ConnectAccounts = ({ onAccountsConnected }: ConnectAccountsProps) => {
  const { user } = useAuth();
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [discordConnected, setDiscordConnected] = useState(false);
  const [loading, setLoading] = useState({ telegram: false, discord: false });
  const [showTelegramLogin, setShowTelegramLogin] = useState(false);

  useEffect(() => {
    if (user) {
      checkConnectedAccounts();
    }
  }, [user]);

  // Listen for auth success messages from popup windows (Discord etc.)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "DISCORD_AUTH_SUCCESS") {
        setDiscordConnected(true);
        setLoading((prev) => ({ ...prev, discord: false }));
        toast({
          title: "Discord Connected",
          description: "Successfully connected to your Discord account",
        });
        checkConnectedAccounts();
      } else if (event.data.type === "DISCORD_AUTH_ERROR") {
        toast({
          title: "Discord Connection Failed",
          description: event.data.error || "Something went wrong",
          variant: "destructive",
        });
        setLoading((prev) => ({ ...prev, discord: false }));
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const checkConnectedAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from("connected_accounts")
        .select("platform")
        .eq("user_id", user?.id);

      if (error) {
        console.error("Error checking connected accounts:", error);
        return;
      }

      const platforms = data?.map((account) => account.platform) || [];
      setTelegramConnected(!platforms.includes("telegram"));
      setDiscordConnected(!platforms.includes("discord"));
      onAccountsConnected();

      if (platforms.length > 0) {
        onAccountsConnected();
      }
    } catch (error) {
      console.error("Error checking connected accounts:", error);
    }
  };

  // Called after successful Telegram login via OTP component
  const handleTelegramSuccess = () => {
    setTelegramConnected(true);
    setShowTelegramLogin(false);
    toast({
      title: "Telegram Connected",
      description: "Successfully connected to your Telegram account",
    });
    checkConnectedAccounts();
  };

  // Show inline Telegram login form
  const openTelegramLogin = () => {
    setShowTelegramLogin(true);
  };

  const connectDiscord = async () => {
    if (!user) return;

    setLoading((prev) => ({ ...prev, discord: true }));

    try {
      const discordClientId = "1380883180533452970";
      const redirectUri = "https://zyccvvhrdvgjjwcteywg.supabase.co/functions/v1/discord-auth";
      const scope = encodeURIComponent("identify guilds");

      const stateObj = {
        userId: user.id,
      };
      const state = encodeURIComponent(JSON.stringify(stateObj));

      const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${discordClientId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=code&scope=${scope}&state=${state}`;

      const popup = window.open(
        discordAuthUrl,
        "discord-auth",
        "width=500,height=600,scrollbars=yes,resizable=yes"
      );

      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          if (!discordConnected) {
            setLoading((prev) => ({ ...prev, discord: false }));
          }
        }
      }, 1000);
    } catch (error) {
      console.error("Discord connection error:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Discord. Please try again.",
        variant: "destructive",
      });
      setLoading((prev) => ({ ...prev, discord: false }));
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-2 border-dashed border-border hover:border-blue-300 transition-colors">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold">Telegram</h3>
                <p className="text-sm text-muted-foreground">
                  Connect your Telegram account to access your chats
                </p>
                {showTelegramLogin && <TelegramLogin onSuccess={handleTelegramSuccess} />}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {telegramConnected ? (
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Button onClick={openTelegramLogin} className="gap-2" disabled={loading.telegram}>
                  {loading.telegram && <Loader2 className="w-4 h-4 animate-spin" />}
                  Connect
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-dashed border-border hover:border-purple-300 transition-colors">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold">Discord</h3>
                <p className="text-sm text-muted-foreground">
                  Connect your Discord account to access your servers
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {discordConnected ? (
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Button
                  onClick={connectDiscord}
                  variant="outline"
                  className="gap-2"
                  disabled={loading.discord}
                >
                  {loading.discord && <Loader2 className="w-4 h-4 animate-spin" />}
                  Connect
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {telegramConnected && discordConnected && (
        <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
              <p className="text-green-800 dark:text-green-300 font-medium">
                All accounts connected successfully!
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};



// import { useState, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { MessageCircle, Users, Check, ExternalLink, Loader2 } from "lucide-react";
// import { toast } from "@/hooks/use-toast";
// import { useAuth } from "@/hooks/useAuth";
// import { supabase } from "@/integrations/supabase/client";

// declare global {
//   interface Window {
//     Telegram: any;
//     onTelegramAuth: (user: any) => void;
//   }
// }

// interface ConnectAccountsProps {
//   onAccountsConnected: () => void;
// }

// export const ConnectAccounts = ({ onAccountsConnected }: ConnectAccountsProps) => {
//   const { user } = useAuth();
//   const [telegramConnected, setTelegramConnected] = useState(false);
//   const [discordConnected, setDiscordConnected] = useState(false);
//   const [loading, setLoading] = useState({ telegram: false, discord: false });

//   useEffect(() => {
//     if (user) {
//       checkConnectedAccounts();
//     }
//   }, [user]);

//   // Listen for auth success messages from popup windows
//   useEffect(() => {
//     const handleMessage = (event: MessageEvent) => {
//       if (event.data.type === 'DISCORD_AUTH_SUCCESS') {
//         setDiscordConnected(true);
//         setLoading(prev => ({ ...prev, discord: false }));
//         toast({
//           title: "Discord Connected",
//           description: "Successfully connected to your Discord account",
//         });
//         checkConnectedAccounts();
//       } else if (event.data.type === 'DISCORD_AUTH_ERROR') {
//         toast({
//           title: "Discord Connection Failed",
//           description: event.data.error || "Something went wrong",
//           variant: "destructive",
//         });
//         setLoading(prev => ({ ...prev, discord: false }));
//       } else if (event.data.type === 'TELEGRAM_AUTH_SUCCESS') {
//         handleTelegramAuth(event.data.data);
//       }
//     };

//     window.addEventListener('message', handleMessage);
//     return () => window.removeEventListener('message', handleMessage);
//   }, []);

//   const checkConnectedAccounts = async () => {
//     try {
//       const { data, error } = await supabase
//         .from("connected_accounts")
//         .select("platform")
//         .eq("user_id", user?.id);

//       if (error) {
//         console.error("Error checking connected accounts:", error);
//         return;
//       }

//       const platforms = data?.map(account => account.platform) || [];
//       setTelegramConnected(platforms.includes("telegram"));
//       setDiscordConnected(platforms.includes("discord"));

//       if (platforms.length > 0) {
//         onAccountsConnected();
//       }
//     } catch (error) {
//       console.error("Error checking connected accounts:", error);
//     }
//   };

//   const handleTelegramAuth = async (telegramData: any) => {
//     if (!user) return;
    
//     try {
//       const { data, error } = await supabase.functions.invoke('telegram-auth', {
//         body: {
//           telegramData: telegramData,
//           user_id: user.id,
//         },
//       });

//       if (error) {
//         throw error;
//       }

//       setTelegramConnected(true);
//       setLoading(prev => ({ ...prev, telegram: false }));
//       toast({
//         title: "Telegram Connected",
//         description: "Successfully connected to your Telegram account",
//       });
      
//       checkConnectedAccounts();
//     } catch (error) {
//       console.error("Telegram connection error:", error);
//       toast({
//         title: "Connection Failed",
//         description: "Failed to connect to Telegram. Please try again.",
//         variant: "destructive",
//       });
//       setLoading(prev => ({ ...prev, telegram: false }));
//     }
//   };

//   const connectTelegram = async () => {
//     if (!user) return;
    
//     setLoading(prev => ({ ...prev, telegram: true }));
    
//     try {
//       // Create a popup window for Telegram auth
//       const authWindow = window.open(
//         '', 
//         'telegram-auth', 
//         'width=500,height=600,scrollbars=yes,resizable=yes'
//       );

//       if (!authWindow) {
//         throw new Error('Popup blocked');
//       }

//       // Create the Telegram login widget HTML with a test bot
//       const telegramHTML = `
//         <!DOCTYPE html>
//         <html>
//         <head>
//           <title>Telegram Login</title>
//           <style>
//             body { 
//               font-family: Arial, sans-serif; 
//               display: flex; 
//               justify-content: center; 
//               align-items: center; 
//               height: 100vh; 
//               margin: 0; 
//               background: #f5f5f5;
//             }
//             .container {
//               text-align: center;
//               background: white;
//               padding: 20px;
//               border-radius: 8px;
//               box-shadow: 0 2px 10px rgba(0,0,0,0.1);
//             }
//           </style>
//         </head>
//         <body>
//           <div class="container">
//             <h2>Connect to Telegram</h2>
//             <p>Click the button below to connect your Telegram account</p>
//             <script async src="https://telegram.org/js/telegram-widget.js?22" 
//                     data-telegram-login="chatPilot22_bot"
//                     data-size="large" 
//                     data-onauth="onTelegramAuth(user)" 
//                     data-request-access="write">
//             </script>
//             <script>
//               function onTelegramAuth(user) {
//                 window.opener?.postMessage({ 
//                   type: 'TELEGRAM_AUTH_SUCCESS', 
//                   data: user 
//                 }, '*');
//                 window.close();
//               }
//             </script>
//           </div>
//         </body>
//         </html>
//       `;

//       authWindow.document.write(telegramHTML);
//       authWindow.document.close();

//       // Monitor popup closure
//       const checkClosed = setInterval(() => {
//         if (authWindow.closed) {
//           clearInterval(checkClosed);
//           if (!telegramConnected) {
//             setLoading(prev => ({ ...prev, telegram: false }));
//           }
//         }
//       }, 1000);
      
//     } catch (error) {
//       console.error("Telegram connection error:", error);
//       toast({
//         title: "Connection Failed",
//         description: "Failed to connect to Telegram. Please try again.",
//         variant: "destructive",
//       });
//       setLoading(prev => ({ ...prev, telegram: false }));
//     }
//   };

//   // const connectDiscord = async () => {
//   //   if (!user) return;
    
//   //   setLoading(prev => ({ ...prev, discord: true }));
    
//   //   try {
//   //     const discordClientId = '1380883180533452970';
//   //     const redirectUri = encodeURIComponent(`https://zyccvvhrdvgjjwcteywg.supabase.co/functions/v1/discord-auth`);
//   //     const scope = encodeURIComponent('identify guilds');
//   //     const state = user.id;
      
//   //     const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${discordClientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}`;
      
//   //     // Open Discord auth in popup
//   //     const popup = window.open(
//   //       discordAuthUrl, 
//   //       'discord-auth', 
//   //       'width=500,height=600,scrollbars=yes,resizable=yes'
//   //     );

//   //     // Monitor popup closure
//   //     const checkClosed = setInterval(() => {
//   //       if (popup?.closed) {
//   //         clearInterval(checkClosed);
//   //         if (!discordConnected) {
//   //           setLoading(prev => ({ ...prev, discord: false }));
//   //         }
//   //       }
//   //     }, 1000);

//   //   } catch (error) {
//   //     console.error("Discord connection error:", error);
//   //     toast({
//   //       title: "Connection Failed",
//   //       description: "Failed to connect to Discord. Please try again.",
//   //       variant: "destructive",
//   //     });
//   //     setLoading(prev => ({ ...prev, discord: false }));
//   //   }
//   // };

//   const connectDiscord = async () => {
//   if (!user) return;

//   setLoading(prev => ({ ...prev, discord: true }));

//   try {
//     const discordClientId = '1380883180533452970';
//     const redirectUri = 'https://zyccvvhrdvgjjwcteywg.supabase.co/functions/v1/discord-auth'; // unencoded for state
//     const scope = encodeURIComponent('identify guilds');

//     // Build state object with userId and redirectTo
//     const stateObj = {
//       userId: user.id,
//       // redirectTo: window.location.href, // or use window.location.origin + '/dashboard' if redirect target is fixed
//     };
//     const state = encodeURIComponent(JSON.stringify(stateObj));

//     const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${discordClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${state}`;

//     // Open Discord auth in popup
//     const popup = window.open(
//       discordAuthUrl,
//       'discord-auth',
//       'width=500,height=600,scrollbars=yes,resizable=yes'
//     );

//     // Monitor popup closure
//     const checkClosed = setInterval(() => {
//       if (popup?.closed) {
//         clearInterval(checkClosed);
//         if (!discordConnected) {
//           setLoading(prev => ({ ...prev, discord: false }));
//         }
//       }
//     }, 1000);

//   } catch (error) {
//     console.error("Discord connection error:", error);
//     toast({
//       title: "Connection Failed",
//       description: "Failed to connect to Discord. Please try again.",
//       variant: "destructive",
//     });
//     setLoading(prev => ({ ...prev, discord: false }));
//   }
// };

//   return (
//     <div className="space-y-4">
//       <Card className="border-2 border-dashed border-border hover:border-blue-300 transition-colors">
//         <CardContent className="p-6">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-4">
//               <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
//                 <MessageCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
//               </div>
//               <div>
//                 <h3 className="font-semibold">Telegram</h3>
//                 <p className="text-sm text-muted-foreground">Connect your Telegram account to access your chats</p>
//               </div>
//             </div>
//             <div className="flex items-center gap-3">
//               {telegramConnected ? (
//                 <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
//                   <Check className="w-3 h-3 mr-1" />
//                   Connected
//                 </Badge>
//               ) : (
//                 <Button onClick={connectTelegram} className="gap-2" disabled={loading.telegram}>
//                   {loading.telegram && <Loader2 className="w-4 h-4 animate-spin" />}
//                   Connect
//                   <ExternalLink className="w-4 h-4" />
//                 </Button>
//               )}
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       <Card className="border-2 border-dashed border-border hover:border-purple-300 transition-colors">
//         <CardContent className="p-6">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-4">
//               <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
//                 <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
//               </div>
//               <div>
//                 <h3 className="font-semibold">Discord</h3>
//                 <p className="text-sm text-muted-foreground">Connect your Discord account to access your servers</p>
//               </div>
//             </div>
//             <div className="flex items-center gap-3">
//               {discordConnected ? (
//                 <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
//                   <Check className="w-3 h-3 mr-1" />
//                   Connected
//                 </Badge>
//               ) : (
//                 <Button onClick={connectDiscord} variant="outline" className="gap-2" disabled={loading.discord}>
//                   {loading.discord && <Loader2 className="w-4 h-4 animate-spin" />}
//                   Connect
//                   <ExternalLink className="w-4 h-4" />
//                 </Button>
//               )}
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {telegramConnected && discordConnected && (
//         <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
//           <CardContent className="p-4">
//             <div className="flex items-center gap-3">
//               <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
//               <p className="text-green-800 dark:text-green-300 font-medium">All accounts connected successfully!</p>
//             </div>
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   );
// };
