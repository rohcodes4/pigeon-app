
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Users, Check, ArrowRight, RefreshCw, Inbox } from "lucide-react";
import { ConnectAccounts } from "@/components/ConnectAccounts";
import { ChatSelection } from "@/components/ChatSelection";
import { Header } from "@/components/Header";
import { cn } from "@/lib/utils";

interface OnboardingFlowProps {
  onComplete: () => void;
}

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [accountsConnected, setAccountsConnected] = useState(false);
  const [chatsSelected, setChatsSelected] = useState(false);
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
    {
      id: "select",
      title: "Select Chats",
      description: "Choose which chats to sync",
      icon: <MessageCircle className="w-6 h-6" />,
    },
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

  const handleChatsSelected = () => {
    setChatsSelected(true);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Start syncing process
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
    const user = { id: 'demo-user' };
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
        return chatsSelected;
      case 2:
        return true;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <ConnectAccounts onAccountsConnected={handleAccountsConnected} />;
      case 1:
        return <ChatSelection onChatsSelected={handleChatsSelected} />;
      case 2:
        return (
          <div className="space-y-8">
            {/* Connection Status Header */}
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">All platforms connected successfully</h2>
              <div className="flex gap-4 justify-center">
                <Badge variant={discordConnected ? "default" : "secondary"} className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Discord {discordConnected ? "Connected" : "Not Connected"}
                </Badge>
                <Badge variant={telegramConnected ? "default" : "secondary"} className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Telegram {telegramConnected ? "Connected" : "Not Connected"}
                </Badge>
              </div>
            </div>

            {!syncComplete ? (
              <div className="max-w-2xl mx-auto">
                {/* Sync in Progress */}
                <Card>
                  <CardContent className="p-8">
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Sync in Progress</h3>
                      <p className="text-gray-600">Please wait while we sync your selected chats...</p>
                    </div>

                    <div className="space-y-6">
                      <hr className="border-gray-200" />
                      
                      {/* Discord Progress */}
                      {discordConnected && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium flex items-center gap-2">
                              <Users className="w-5 h-5 text-purple-600" />
                              Discord Servers
                            </h4>
                            <span className="text-sm text-gray-600">3 servers connected</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Progress value={syncProgress.discord} className="flex-1" />
                            <span className="text-sm font-medium min-w-[3rem]">{syncProgress.discord}%</span>
                          </div>
                        </div>
                      )}

                      {/* Telegram Progress */}
                      {telegramConnected && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium flex items-center gap-2">
                              <MessageCircle className="w-5 h-5 text-blue-600" />
                              Telegram Chats
                            </h4>
                            <span className="text-sm text-gray-600">5 chats connected</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Progress value={syncProgress.telegram} className="flex-1" />
                            <span className="text-sm font-medium min-w-[3rem]">{syncProgress.telegram}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              /* Sync Complete - Two Box Layout */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {/* Status Box */}
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <Check className="w-8 h-8 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Sync Complete</h3>
                        <ul className="text-sm text-gray-600 space-y-2 text-left">
                          <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span>All conversations synced</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span>Unified inbox ready</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span>Real-time sync enabled</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span>Notifications configured</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Next Steps Box */}
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="font-semibold text-lg mb-2">Synchronization successful!</h3>
                        <ul className="text-sm text-gray-600 space-y-2 text-left mb-6">
                          <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <span>Explore your unified inbox</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <span>Search across all platforms</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <span>Check AI-extracted tasks</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <span>Manage notification settings</span>
                          </li>
                        </ul>
                      </div>
                      
                      <div className="space-y-3">
                        <Button onClick={onComplete} className="w-full gap-2">
                          <Inbox className="w-4 h-4" />
                          Continue to Inbox
                        </Button>
                        <Button onClick={restartOnboarding} variant="outline" className="w-full gap-2">
                          <RefreshCw className="w-4 h-4" />
                          Restart Onboarding
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header />
      
      <div className="container mx-auto p-6 max-w-6xl mt-6">
        <Card className="w-full">
          <CardHeader>
            <div className="space-y-6">
              {/* Progress Steps */}
              <div className="flex items-center justify-center space-x-8">
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
              </div>

              <div className="text-center">
                <CardTitle className="text-2xl">{steps[currentStep].title}</CardTitle>
                <p className="text-gray-600 mt-2">{steps[currentStep].description}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {renderStepContent()}
            
            {!syncing && !syncComplete && (
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
