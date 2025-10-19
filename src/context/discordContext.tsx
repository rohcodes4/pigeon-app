// context/DiscordProvider.tsx
import React, { createContext, useContext } from "react";
import { useDiscordChannels } from "../hooks/useDiscord";

const DiscordContext = createContext<any>(null);

export function DiscordProvider({ children }: { children: React.ReactNode }) {
  const discordData = useDiscordChannels();
  return (
    <DiscordContext.Provider value={discordData}>
      {children}
    </DiscordContext.Provider>
  );
}

export function useDiscordContext() {
  return useContext(DiscordContext);
}
