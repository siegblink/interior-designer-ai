"use client";

import { createContext, useContext, useState } from "react";

type DesignContextValue = {
  outputImage: string | null;
  setOutputImage: (url: string | null) => void;
};

const DesignContext = createContext<DesignContextValue | null>(null);

export function DesignProvider({ children }: { children: React.ReactNode }) {
  const [outputImage, setOutputImage] = useState<string | null>(null);
  return (
    <DesignContext.Provider value={{ outputImage, setOutputImage }}>
      {children}
    </DesignContext.Provider>
  );
}

export function useDesign(): DesignContextValue {
  const ctx = useContext(DesignContext);
  if (!ctx) throw new Error("useDesign must be used within DesignProvider");
  return ctx;
}
