import React, { createContext, useContext, useMemo } from "react";
import { useDiscordChannels } from "../hooks/useDiscord";

const DiscordContext = createContext<any>(null);

export function DiscordProvider({ children }: { children: React.ReactNode }) {
  const { guilds, channels, dms, loading, refresh, getGuildChannels } = useDiscordChannels();

  const value = useMemo(
    () => ({
      guilds,
      channels,
      dms,
      loading,
      refresh,
      getGuildChannels,
    }),
    [guilds, channels, dms, loading, refresh, getGuildChannels]
  );

  return <DiscordContext.Provider value={value}>{children}</DiscordContext.Provider>;
}

export function useDiscordContext() {
  const ctx = useContext(DiscordContext);
  if (!ctx) throw new Error("useDiscordContext must be used within a DiscordProvider");
  return ctx;
}
