import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import Index from "./pages/Index";
import { AuthPage } from "./components/AuthPage";
import NotFound from "./pages/NotFound";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import SmartTasks from "./pages/SmartTasks";
import Bookmarks from "./pages/Bookmarks";
import Contacts from "./pages/Contacts";
import Help from "./pages/Help";
import Settings from "./pages/Settings";
import { DashboardSettings } from "./components/DashboardSettings";
import AiChat from "./pages/AiChat";
import TaskTrackerWrapper from "./components/taskTrackerWrapper";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<TaskTrackerWrapper><Index /></TaskTrackerWrapper>} />
              <Route path="/smart-tasks" element={<TaskTrackerWrapper><SmartTasks /></TaskTrackerWrapper>} />
              <Route path="/bookmarks" element={<TaskTrackerWrapper><Bookmarks /></TaskTrackerWrapper>} />
              <Route path="/contacts" element={<TaskTrackerWrapper><Contacts /></TaskTrackerWrapper>} />
              <Route path="/ai" element={<TaskTrackerWrapper><AiChat /></TaskTrackerWrapper>} />
              <Route path="/help" element={<TaskTrackerWrapper><Help /></TaskTrackerWrapper>} />
              <Route path="/settings" element={<TaskTrackerWrapper><Settings /></TaskTrackerWrapper>} />
              <Route
                path="/dashboard-settings"
                element={<DashboardSettings />}
              />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
