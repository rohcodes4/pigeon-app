
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge  } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Settings, Search, CheckSquare, Bell, LogOut } from "lucide-react";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { UnifiedInbox } from "@/components/UnifiedInbox";
import { DashboardSettings } from "@/components/DashboardSettings";
import { SearchPanel } from "@/components/SearchPanel";
import { ActionCenter } from "@/components/ActionCenter";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [activeTab, setActiveTab] = useState("inbox");
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      // Check if user has completed onboarding
      const onboardingComplete = localStorage.getItem(`chatpilot_onboarded_${user.id}`);
      if (onboardingComplete) {
        setIsOnboarded(true);
        setIsConnected(true);
      }
    }
  }, [user]);
  useEffect(() => {
    if (user) {
      // Check if user has completed onboarding
      const onboardingComplete = localStorage.getItem(`chatpilot_onboarded_${user.id}`);
      console.log("onboarding?")
      console.log(onboardingComplete)
      if (onboardingComplete) {
        setIsOnboarded(true);
        setIsConnected(true);
      }
    }
  }, []);

  const handleOnboardingComplete = () => {
    if (user) {
      localStorage.setItem(`chatpilot_onboarded_${user.id}`, "true");
      setIsOnboarded(true);
      setIsConnected(true);
      toast({
        title: "Welcome to ChatPilot!",
        description: "Your dashboard is ready. Start managing your conversations.",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <MessageCircle className="w-7 h-7 text-white" />
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth page
  }

  if (!isOnboarded) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return (
    <Layout isConnected={isConnected}>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-white/10 backdrop-blur-sm">
            <TabsTrigger value="inbox" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              <span className="max-md:hidden">Unified Inbox</span>
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              <span className="max-md:hidden">Search</span>
            </TabsTrigger>
            <TabsTrigger value="actions" className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              <span className="max-md:hidden">Action Center</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="max-md:hidden">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inbox" className="mt-0">
            <UnifiedInbox />
          </TabsContent>

          <TabsContent value="search" className="mt-0">
            <SearchPanel />
          </TabsContent>

          <TabsContent value="actions" className="mt-0">
            <ActionCenter />
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <DashboardSettings />
          </TabsContent>
        </Tabs>
      </Layout>
  );
};

export default Index;