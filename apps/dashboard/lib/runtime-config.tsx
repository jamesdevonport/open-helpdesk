"use client";

import { createContext, useContext, ReactNode } from "react";

type RuntimeConfig = {
  convexUrl: string;
  convexSiteUrl: string;
  siteUrl: string;
};

const RuntimeConfigContext = createContext<RuntimeConfig | null>(null);

export function RuntimeConfigProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: RuntimeConfig;
}) {
  return (
    <RuntimeConfigContext.Provider value={value}>
      {children}
    </RuntimeConfigContext.Provider>
  );
}

export function useRuntimeConfig() {
  const value = useContext(RuntimeConfigContext);

  if (!value) {
    throw new Error("Runtime config is unavailable.");
  }

  return value;
}
