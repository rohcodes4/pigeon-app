import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { toast } from "./use-toast";
import { Theme } from "./useTheme"; // Import Theme

interface UserSettings {
  theme: Theme; // Changed from string to Theme
  summary_frequency: string;
  notifications_enabled: boolean;
  focus_mode: boolean;
  data_retention: string;
}

export const useUserSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>({
    theme: "default", // Ensure initial value matches Theme type
    summary_frequency: "daily",
    notifications_enabled: true,
    focus_mode: false,
    data_retention: "30days",
  });
  const [loading, setLoading] = useState(false); // Set to false initially as we won't fetch from Supabase immediately

  useEffect(() => {
    if (user) {
      // TODO: Implement fetchSettings from FastAPI backend
      // For now, settings are hardcoded or loaded from local storage
      setLoading(false);
    }
  }, [user]);

  const fetchSettings = async () => {
    // TODO: Replace with fetch call to FastAPI backend
    // Example: const response = await fetch('/api/settings');
    // const data = await response.json();
    // setSettings(data);
    console.log("Fetching settings from backend...");
    // Mock data for now
    setSettings({
      theme: "default", // Ensure mock data matches Theme type
      summary_frequency: "daily",
      notifications_enabled: true,
      focus_mode: false,
      data_retention: "30days",
    });
    setLoading(false);
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      // TODO: Replace with fetch call to FastAPI backend to update settings
      // Example:
      // const response = await fetch('/api/settings', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(newSettings),
      // });
      // if (!response.ok) throw new Error('Failed to update settings');

      setSettings((prev) => ({ ...prev, ...newSettings }));
      toast({
        title: "Settings updated",
        description: "Your preferences have been saved",
      });
    } catch (error) {
      console.error("Error updating settings:", error);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  return {
    settings,
    updateSettings,
    loading,
  };
};
