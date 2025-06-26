
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Users, Check, ArrowRight } from "lucide-react";
import { ConnectAccounts } from "@/components/ConnectAccounts";
import { ChatSelection } from "@/components/ChatSelection";
import { cn } from "@/lib/utils";

interface OnboardingFlowProps {
  onComplete: () => void;
}

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [accountsConnected, setAccountsConnected] = useState(false);
  const [chatsSelected, setChatsSelected] = useState(false);
  const [syncing, setSyncing] = useState(false);

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
      // Simulate syncing process
      setTimeout(() => {
        setSyncing(false);
        onComplete();
      }, 3000);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
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
          <div className="text-center space-y-6">
            {syncing ? (
              <>
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Syncing Your Conversations</h3>
                  <p className="text-gray-600">
                    Please wait while we sync your selected chats...
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-12 h-12 text-green-600" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">All Set!</h3>
                  <p className="text-gray-600">
                    Your conversations have been synced successfully. ChatPilot is ready to use!
                  </p>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Pro tip:</strong> Check your Action Center for AI-extracted tasks from your chats!
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-4xl">
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
          
          {!syncing && (
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
                {currentStep === steps.length - 1 ? "Complete Setup" : "Next"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
