// FocusMode.tsx
import React, { createContext, useContext, useState, ReactNode } from "react";

type FocusModeType = {
  value: boolean;
  setValue: (v: boolean) => void;
};

const FocusMode = createContext<FocusModeType | undefined>(undefined);

export function useGlobalFocus() {
  const context = useContext(FocusMode);
  if (!context)
    throw new Error("useGlobalFocus must be used within a FocusProvider");
  return context;
}

interface FocusModeProviderProps {
  children: ReactNode;
}

export function FocusModeProvider({ children }: FocusModeProviderProps) {
  const [value, setValue] = useState<boolean>(false);

  return (
    <FocusMode.Provider value={{ value, setValue }}>
      {children}
    </FocusMode.Provider>
  );
}
