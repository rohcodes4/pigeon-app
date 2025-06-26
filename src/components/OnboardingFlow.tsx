
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MessageCircle, Users, Zap, ArrowRight, Check, ArrowLeft } from "lucide-react";
import { ConnectAccounts } from "@/components/ConnectAccounts";
import { ChatSelection } from "@/components/ChatSelection";

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
      title: "Connect Your Accounts",
      description: "Link your Discord and Telegram accounts to get started",
      content: (
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Connect your platforms</h3>
              <p className="text-gray-600">
                Connect your Discord and Telegram accounts to start managing your conversations
              </p>
            </div>
          </div>
          <ConnectAccounts onAccountsConnected={() => setAccountsConnected(true)} />
        </div>
      ),
    },
    {
      title: "Select Your Chats",
      description: "Choose which conversations you want to sync",
      content: (
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Select chats to sync</h3>
              <p className="text-gray-600">
                Choose which conversations you want to include in your unified inbox
              </p>
            </div>
          </div>
          <ChatSelection />
        </div>
      ),
    },
    {
      title: "Platforms Connected",
      description: "Successfully connected to your platforms",
      content: (
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">Platforms connected successfully!</h3>
            <p className="text-gray-600">
              Your Discord and Telegram accounts are now connected. We'll start syncing your conversations.
            </p>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                <strong>Great!</strong> Your accounts are ready for synchronization.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Syncing Complete",
      description: "Your conversations are ready",
      content: (
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <Zap className="w-10 h-10 text-blue-600" />
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">All set!</h3>
            <p className="text-gray-600">
              Your conversations have been synced successfully. ChatPilot is ready to help you manage your communications.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Pro tip:</strong> Check your Action Center for AI-extracted tasks from your chats!
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const nextStep = () => {
    if (currentStep === 1) {
      // Simulate syncing process
      setSyncing(true);
      setTimeout(() => {
        setSyncing(false);
        setCurrentStep(2);
      }, 2000);
    } else if (currentStep === 2) {
      // Move to syncing complete
      setSyncing(true);
      setTimeout(() => {
        setSyncing(false);
        setCurrentStep(3);
      }, 2000);
    } else if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
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
        return true; // Can proceed from chat selection
      case 2:
        return true; // Can proceed from platform connected
      case 3:
        return true; // Can proceed from syncing complete
      default:
        return true;
    }
  };

  if (syncing) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <MessageCircle className="w-8 h-8 text-blue-600" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-900">Syncing your conversations...</h3>
            <p className="text-gray-600">This may take a few moments</p>
          </div>
          <div className="w-64 mx-auto">
            <Progress value={66} className="w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">ChatPilot</h1>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-gray-900">{steps[currentStep].title}</h2>
            <p className="text-gray-600">{steps[currentStep].description}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Step {currentStep + 1} of {steps.length}</span>
            <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="w-full h-2" />
        </div>

        {/* Content */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8">
            {steps[currentStep].content}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>
          <Button
            onClick={nextStep}
            disabled={!canProceed()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            {currentStep === steps.length - 1 ? "Get Started" : "Continue"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
