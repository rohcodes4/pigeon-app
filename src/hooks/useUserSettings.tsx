
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "./use-toast";

interface UserSettings {
  theme: string;
  summary_frequency: string;
  notifications_enabled: boolean;
  focus_mode: boolean;
  data_retention: string;
}

export const useUserSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>({
    theme: "light",
    summary_frequency: "daily",
    notifications_enabled: true,
    focus_mode: false,
    data_retention: "30days",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching settings:", error);
        return;
      }

      if (data) {
        setSettings({
          theme: data.theme,
          summary_frequency: data.summary_frequency,
          notifications_enabled: data.notifications_enabled,
          focus_mode: data.focus_mode,
          data_retention: data.data_retention,
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      const { error } = await supabase
        .from("user_settings")
        .update({
          ...newSettings,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user?.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update settings",
          variant: "destructive",
        });
        return;
      }

      setSettings(prev => ({ ...prev, ...newSettings }));
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
