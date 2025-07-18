
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Users, Check, ArrowRight, RefreshCw, Inbox } from "lucide-react";
import { ConnectAccounts } from "@/components/ConnectAccounts";
import { ChatSelection } from "@/components/ChatSelection";
import { Header } from "@/components/Header";
import { cn } from "@/lib/utils";
import { ChatSyncing } from "./ChatSyncing";
import { useAuth } from "@/hooks/useAuth";

interface OnboardingFlowProps {
  onComplete: () => void;
}



export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [accountsConnected, setAccountsConnected] = useState(false);
  const [chatsSelected, setChatsSelected] = useState(false);
  const [approvedChats, setApprovedChats] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ discord: 0, telegram: 0 });
  const [syncComplete, setSyncComplete] = useState(false);
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [discordConnected, setDiscordConnected] = useState(false);
  const steps = [
    {
      id: "connect",
      title: "Connect Platforms",
      description: "Connect your Discord and Telegram accounts",
      icon: <Users className="w-6 h-6" />,
    },
    // {
    //   id: "select",
    //   title: "Select Chats",
    //   description: "Choose which chats to sync",
    //   icon: <MessageCircle className="w-6 h-6" />,
    // },
    {
      id: "sync",
      title: "Sync & Complete",
      description: "Syncing your conversations",
      icon: <Check className="w-6 h-6" />,
    },
  ];

  const handleAccountsConnected = () => {
    setAccountsConnected(true);
    // Check which accounts are connected from localStorage
    const user = { id: 'demo-user' }; // Mock user for demo
    const accountsData = localStorage.getItem(`chatpilot_accounts_${user.id}`);
    if (accountsData) {
      const accounts = JSON.parse(accountsData);
      setTelegramConnected(accounts.telegram || false);
      setDiscordConnected(accounts.discord || false);
    }
  };

  const handleChatsSelected = (chats) => {
    setApprovedChats(chats);
    setChatsSelected(true);    
  };

  useEffect(()=>{
    handleAccountsConnected()
  },[currentStep])
  const startSyncing = () => {
    setSyncing(true);
    setSyncComplete(false);
  
    // Simulate Discord syncing
    let discordProgress = 0;
    const discordInterval = setInterval(() => {
      discordProgress += 15;
      setSyncProgress(prev => ({ ...prev, discord: Math.min(discordProgress, 100) }));
      if (discordProgress >= 100) {
        clearInterval(discordInterval);
      }
    }, 400);
  
    // Simulate Telegram syncing (slightly delayed)
    setTimeout(() => {
      let telegramProgress = 0;
      const telegramInterval = setInterval(() => {
        telegramProgress += 12;
        setSyncProgress(prev => ({ ...prev, telegram: Math.min(telegramProgress, 100) }));
        if (telegramProgress >= 100) {
          clearInterval(telegramInterval);
          // Complete syncing after both are done
          setTimeout(() => {
            setSyncing(false);
            setSyncComplete(true);
          }, 500);
        }
      }, 350);
    }, 800);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 2) {
      setCurrentStep(currentStep + 1);
    } else {
      // Start syncing process
      setCurrentStep(currentStep + 1);
      setSyncing(true);
      setSyncComplete(false);
      
      // Simulate Discord syncing
      let discordProgress = 0;
      const discordInterval = setInterval(() => {
        discordProgress += 15;
        setSyncProgress(prev => ({ ...prev, discord: Math.min(discordProgress, 100) }));
        if (discordProgress >= 100) {
          clearInterval(discordInterval);
        }
      }, 400);

      // Simulate Telegram syncing (slightly delayed)
      setTimeout(() => {
        let telegramProgress = 0;
        const telegramInterval = setInterval(() => {
          telegramProgress += 12;
          setSyncProgress(prev => ({ ...prev, telegram: Math.min(telegramProgress, 100) }));
          if (telegramProgress >= 100) {
            clearInterval(telegramInterval);
            // Complete syncing after both are done
            setTimeout(() => {
              setSyncing(false);
              setSyncComplete(true);
            }, 500);
          }
        }, 350);
      }, 800);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  const restartOnboarding = () => {
    // Clear localStorage
    if (!user) return; // Prevent errors if user is not loaded yet
    localStorage.removeItem(`chatpilot_accounts_${user.id}`);
    localStorage.removeItem(`chatpilot_chats_${user.id}`);
    
    // Reset all states
    setCurrentStep(0);
    setAccountsConnected(false);
    setChatsSelected(false);
    setSyncing(false);
    setSyncProgress({ discord: 0, telegram: 0 });
    setSyncComplete(false);
    setTelegramConnected(false);
    setDiscordConnected(false);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return accountsConnected;
      case 1:
        return true;
        case 2:
          return true;
      // case 0:
      //   return accountsConnected;
      // case 1:
      //   return chatsSelected;
      //   case 2:
      //     return true;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
        case 0:
          return <ConnectAccounts 
            onAccountsConnected={handleAccountsConnected} 
            onContinue={nextStep}
            telegramConnected={telegramConnected}
            setTelegramConnected={setTelegramConnected}
            discordConnected={discordConnected}
            setDiscordConnected={setDiscordConnected}
          />;
        case 1:
          return (
            <ChatSyncing
              onComplete={onComplete}
              chatsSelected={true} // or remove if not needed
              approvedChats={[]}   // or remove if not needed
              restartOnboarding={restartOnboarding}
              telegramConnected={telegramConnected}
              setTelegramConnected={setTelegramConnected}
              discordConnected={discordConnected}
              setDiscordConnected={setDiscordConnected}
            />
          );
        // case 0:
      //   return <ConnectAccounts 
      //   onAccountsConnected={handleAccountsConnected} 
      //   onContinue={nextStep}
      //   telegramConnected={telegramConnected}
      //   setTelegramConnected={setTelegramConnected}
      //   discordConnected={discordConnected}
      //   setDiscordConnected={setDiscordConnected}  />;
      // case 1:
      //   return <ChatSelection 
      //   onChatsSelected={handleChatsSelected}  
      //   onContinue={nextStep}
      //   telegramConnected={telegramConnected}
      //   setTelegramConnected={setTelegramConnected}
      //   discordConnected={discordConnected}
      //   setDiscordConnected={setDiscordConnected}
      //   />;
      //   case 2:
      //     return (
      //       <ChatSyncing
      //         onComplete={onComplete}
      //         chatsSelected={chatsSelected}
      //         approvedChats={approvedChats}
      //         restartOnboarding={restartOnboarding}
      //         telegramConnected={telegramConnected}
      //   setTelegramConnected={setTelegramConnected}
      //   discordConnected={discordConnected}
      //   setDiscordConnected={setDiscordConnected}
      //       />
      //     );
//       case 2:
//         return (
//           <div className="space-y-8">
//             {/* Connection Status Header */}
//             <div className="text-center space-y-4">
//               <h2 className="text-2xl font-bold text-gray-900">All platforms connected successfully</h2>
//               <div className="flex gap-4 justify-center">
//                 <Badge variant={discordConnected ? "default" : "secondary"} className="flex items-center gap-2">
//                   <Users className="w-4 h-4" />
//                   Discord {discordConnected ? "Connected" : "Not Connected"}
//                 </Badge>
//                 <Badge variant={telegramConnected ? "default" : "secondary"} className="flex items-center gap-2">
//                   <MessageCircle className="w-4 h-4" />
//                   Telegram {telegramConnected ? "Connected" : "Not Connected"}
//                 </Badge>
//               </div>
//             </div>

//             {/* {!syncComplete ? (
//               <div className="max-w-2xl mx-auto">
//                 <Card>
//                   <CardContent className="p-8">
//                     <div className="text-center mb-8">
//                       <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//                       </div>
//                       <h3 className="text-xl font-semibold mb-2">Sync in Progress</h3>
//                       <p className="text-gray-600">Please wait while we sync your selected chats...</p>
//                     </div>

//                     <div className="space-y-6">
//                       <hr className="border-gray-200" />
                      
//                       {discordConnected && (
//                         <div className="space-y-3">
//                           <div className="flex justify-between items-center">
//                             <h4 className="font-medium flex items-center gap-2">
//                               <Users className="w-5 h-5 text-purple-600" />
//                               Discord Servers
//                             </h4>
//                             <span className="text-sm text-gray-600">3 servers connected</span>
//                           </div>
//                           <div className="flex items-center gap-3">
//                             <Progress value={syncProgress.discord} className="flex-1" />
//                             <span className="text-sm font-medium min-w-[3rem]">{syncProgress.discord}%</span>
//                           </div>
//                         </div>
//                       )}

//                       {telegramConnected && (
//                         <div className="space-y-3">
//                           <div className="flex justify-between items-center">
//                             <h4 className="font-medium flex items-center gap-2">
//                               <MessageCircle className="w-5 h-5 text-blue-600" />
//                               Telegram Chats
//                             </h4>
//                             <span className="text-sm text-gray-600">5 chats connected</span>
//                           </div>
//                           <div className="flex items-center gap-3">
//                             <Progress value={syncProgress.telegram} className="flex-1" />
//                             <span className="text-sm font-medium min-w-[3rem]">{syncProgress.telegram}%</span>
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   </CardContent>
//                 </Card>
//               </div>
//             ) : (
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
//                 <Card>
//                   <CardContent className="p-6">
//                     <div className="text-center space-y-4">
//                       <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
//                         <Check className="w-8 h-8 text-green-600" />
//                       </div>
//                       <div>
//                         <h3 className="font-semibold text-lg mb-2">Sync Complete</h3>
//                         <ul className="text-sm text-gray-600 space-y-2 text-left">
//                           <li className="flex items-center gap-2">
//                             <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
//                             <span>All conversations synced</span>
//                           </li>
//                           <li className="flex items-center gap-2">
//                             <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
//                             <span>Unified inbox ready</span>
//                           </li>
//                           <li className="flex items-center gap-2">
//                             <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
//                             <span>Real-time sync enabled</span>
//                           </li>
//                           <li className="flex items-center gap-2">
//                             <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
//                             <span>Notifications configured</span>
//                           </li>
//                         </ul>
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>

//                 <Card>
//                   <CardContent className="p-6">
//                     <div className="space-y-4">
//                       <div className="text-center">
//                         <h3 className="font-semibold text-lg mb-2">Synchronization successful!</h3>
//                         <ul className="text-sm text-gray-600 space-y-2 text-left mb-6">
//                           <li className="flex items-center gap-2">
//                             <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
//                             <span>Explore your unified inbox</span>
//                           </li>
//                           <li className="flex items-center gap-2">
//                             <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
//                             <span>Search across all platforms</span>
//                           </li>
//                           <li className="flex items-center gap-2">
//                             <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
//                             <span>Check AI-extracted tasks</span>
//                           </li>
//                           <li className="flex items-center gap-2">
//                             <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
//                             <span>Manage notification settings</span>
//                           </li>
//                         </ul>
//                       </div>
                      
//                       <div className="space-y-3">
//                         <Button onClick={onComplete} className="w-full gap-2">
//                           <Inbox className="w-4 h-4" />
//                           Continue to Inbox
//                         </Button>
//                         <Button onClick={restartOnboarding} variant="outline" className="w-full gap-2">
//                           <RefreshCw className="w-4 h-4" />
//                           Restart Onboarding
//                         </Button>
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>
//               </div>
//             )} */}
//             {!syncComplete ? (
//   <div className="flex justify-center">
//   <Card className="bg-[#10131A] border-0 shadow-none rounded-[20px] w-full max-w-lg">
//     <CardContent className="flex flex-col items-center px-8 py-10">
//       {/* Spinner */}
//       <div className="w-16 h-16 rounded-full bg-[#5389ff1a] flex items-center justify-center mb-6">
//         <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#5389ff] border-t-transparent"></div>
//       </div>
//       {/* Title & Description */}
//       <h2 className="text-2xl font-bold text-white mb-2 text-center">Syncing your chats...</h2>
//       <p className="text-[#b3b8c5] text-sm mb-8 text-center">
//         We’re securely syncing your selected Discord and Telegram conversations.<br />
//         This may take a few moments.
//       </p>
//       {/* Progress Bars */}
//       <div className="w-full flex flex-col gap-5 mb-8">
//         {discordConnected && (
//           <div>
//             <div className="flex items-center justify-between mb-1">
//               <span className="flex items-center gap-2 text-[#7289da] font-medium">
//                 <Users className="w-5 h-5" />
//                 Discord
//               </span>
//               <span className="text-xs text-[#b3b8c5]">{syncProgress.discord}%</span>
//             </div>
//             <Progress value={syncProgress.discord} className="h-2 bg-[#23272f]" />
//           </div>
//         )}
//         {telegramConnected && (
//           <div>
//             <div className="flex items-center justify-between mb-1">
//               <span className="flex items-center gap-2 text-[#229ED9] font-medium">
//                 <MessageCircle className="w-5 h-5" />
//                 Telegram
//               </span>
//               <span className="text-xs text-[#b3b8c5]">{syncProgress.telegram}%</span>
//             </div>
//             <Progress value={syncProgress.telegram} className="h-2 bg-[#23272f]" />
//           </div>
//         )}
//       </div>
//       {/* What to expect */}
//       <div className="w-full">
//         <h3 className="text-[#b3b8c5] text-xs font-semibold mb-2">What to expect:</h3>
//         <ul className="text-xs text-[#b3b8c5] space-y-2">
//           <li className="flex items-center gap-2">
//             <Check className="w-4 h-4 text-[#5389ff]" />
//             Chats will be available in your unified inbox.
//           </li>
//           <li className="flex items-center gap-2">
//             <Check className="w-4 h-4 text-[#5389ff]" />
//             You can search and filter across platforms.
//           </li>
//           <li className="flex items-center gap-2">
//             <Check className="w-4 h-4 text-[#5389ff]" />
//             AI-powered insights and tasks will appear here.
//           </li>
//         </ul>
//       </div>
//     </CardContent>
//   </Card>
// </div>
// ) : (
//   <div className="flex justify-center">
//     <Card className="bg-[#111111] border-0 shadow-none rounded-[18px] w-full max-w-xl">
//       <CardContent className="p-8 flex flex-col items-center">
//         <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
//           <Check className="w-8 h-8 text-green-600" />
//         </div>
//         <span className="text-lg font-semibold mb-1 text-white">Sync Complete</span>
//         <span className="text-xs text-[#ffffff48] rounded-full font-medium mb-4">
//           All conversations are now synced and your unified inbox is ready!
//         </span>
//         <ul className="text-xs text-[#ffffff48] space-y-2 mb-6">
//           <li className="flex gap-4"><Check className="w-4 h-4 flex-shrink-0 text-green-600" />All conversations synced</li>
//           <li className="flex gap-4"><Check className="w-4 h-4 flex-shrink-0 text-green-600" />Unified inbox ready</li>
//           <li className="flex gap-4"><Check className="w-4 h-4 flex-shrink-0 text-green-600" />Real-time sync enabled</li>
//           <li className="flex gap-4"><Check className="w-4 h-4 flex-shrink-0 text-green-600" />Notifications configured</li>
//         </ul>
//         <Button onClick={onComplete} className="w-full gap-2 bg-[#5389ff] hover:bg-[#4170cc] text-black rounded-[12px] px-3 py-2 shadow-none mb-2">
//           <Inbox className="w-4 h-4" />
//           Continue to Inbox
//         </Button>
//         <Button onClick={restartOnboarding} variant="outline" className="w-full gap-2">
//           <RefreshCw className="w-4 h-4" />
//           Restart Onboarding
//         </Button>
//       </CardContent>
//     </Card>
//   </div>
// )}
//           </div>
//         );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br">
      <Header />
      
      <div className="container mx-auto p-6 max-w-[1600px] mt-6">
        <Card className="w-full border-0 bg-[#171717]">
          <CardHeader>
            <div className="space-y-6">
              {/* Progress Steps */}
              {/* <div className="flex items-center justify-center space-x-8">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div className="flex flex-col items-center space-y-2">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                          index <= currentStep
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-400"
                        )}
                      >
                        {step.icon}
                      </div>
                      <div className="text-center">
                        <p className={cn(
                          "text-sm font-medium",
                          index <= currentStep ? "text-blue-600" : "text-gray-400"
                        )}>
                          {step.title}
                        </p>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={cn(
                          "w-16 h-0.5 mx-4 transition-colors",
                          index < currentStep ? "bg-blue-600" : "bg-gray-200"
                        )}
                      />
                    )}
                  </div>
                ))}
              </div> */}


<div className="flex items-center justify-start">
  {steps.map((step, index) => {
    const isCompleted = index < currentStep;
    const isActive = index === currentStep;

    return (
      <div key={step.id} className="flex items-center">
        {/* Step Circle */}
        <div className="flex flex-col items-center space-y-2">
        <div
  className={cn(
    "w-10 h-10 rounded-[12px] flex items-center justify-center border-0 transition-all duration-500",
    isCompleted
      ? "bg-[#5389ff] border-[#5389ff]"
      : isActive
      ? "bg-[#5389ff] border-[#5389ff]"
      : "bg-[#ffffff06] border-gray-200"
  )}
>
  <div
    className={cn(
      "w-4 h-4 rounded-full flex items-center justify-center transition-all duration-500",
      isCompleted
        ? "bg-black"
        : isActive
        ? "bg-black"
        : "bg-[#ffffff32]"
    )}
  >
    {isCompleted || isActive ? (
      // Checkmark SVG inside the circle
      <svg
        className="w-3 h-3 text-[#5389ff]"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 13l4 4L19 7"
        />
      </svg>
    ) : null}
  </div>
</div>
          {/* <div className="text-center">
            <p
              className={cn(
                "text-sm font-medium transition-colors duration-500",
                isCompleted || isActive ? "text-[#5389ff]" : "text-gray-400"
              )}
            >
              {step.title}
            </p>
          </div> */}
        </div>
        {/* Connecting Line */}
        {index < steps.length - 1 && (
          <div
            className={cn(
              "w-32 h-0.5 mx-4 rounded transition-colors duration-700",
              isCompleted
                ? "bg-[#5389ff]"
                : isActive
                ? "bg-[#ffffff12]"
                : "bg-[#ffffff12]"
            )}
            style={{
              transitionProperty: "background-color",
            }}
          />
        )}
      </div>
    );
  })}
</div>



              {/* <div className="text-center">
                <CardTitle className="text-2xl">{steps[currentStep].title}</CardTitle>
                <p className="text-gray-600 mt-2">{steps[currentStep].description}</p>
              </div> */}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {renderStepContent()}
            
            {/* {!syncing && !syncComplete && (
              <div className="flex justify-between pt-6">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                >
                  Previous
                </Button>
                <Button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="gap-2"
                >
                  {currentStep === steps.length - 1 ? "Start Sync" : "Next"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )} */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
