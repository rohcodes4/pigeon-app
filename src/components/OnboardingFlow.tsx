
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MessageCircle, Users, Zap, ArrowRight, Check } from "lucide-react";
import { ConnectAccounts } from "@/components/ConnectAccounts";

interface OnboardingFlowProps {
  onComplete: () => void;
}

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [accountsConnected, setAccountsConnected] = useState(false);

  const steps = [
    {
      title: "Welcome to ChatPilot",
      description: "Your intelligent conversation management dashboard",
      content: (
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
            <MessageCircle className="w-12 h-12 text-white" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <Zap className="w-6 h-6 text-blue-600" />
              <div className="text-left">
                <h4 className="font-semibold text-black">AI-Powered Summaries</h4>
                <p className="text-sm text-gray-600">Get instant insights from your conversations</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
              <div className="text-left">
                <h4 className="font-semibold text-black">Unified Dashboard</h4>
                <p className="text-sm text-gray-600">Manage all your chats in one place</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
              <MessageCircle className="w-6 h-6 text-purple-600" />
              <div className="text-left">
                <h4 className="font-semibold text-black">Smart Replies</h4>
                <p className="text-sm text-gray-600">AI-suggested responses to save time</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Connect Your Accounts",
      description: "Link your Telegram and Discord accounts to get started",
      content: (
        <ConnectAccounts onAccountsConnected={() => setAccountsConnected(true)} />
      ),
    },
    {
      title: "You're All Set!",
      description: "Your dashboard is ready to use",
      content: (
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-12 h-12 text-green-600" />
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Welcome aboard!</h3>
            <p className="text-gray-600">
              ChatPilot will now start analyzing your conversations and providing intelligent summaries.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg">
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
    if (currentStep < steps.length - 1) {
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

  const canProceed = currentStep !== 1 || accountsConnected;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="space-y-4">
            <Progress value={progress} className="w-full" />
            <div className="text-center">
              <CardTitle className="text-2xl">{steps[currentStep].title}</CardTitle>
              <p className="text-gray-600 mt-2">{steps[currentStep].description}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {steps[currentStep].content}
          
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
              disabled={!canProceed}
              className="gap-2"
            >
              {currentStep === steps.length - 1 ? "Get Started" : "Next"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
