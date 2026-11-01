"use client";

import { useState, type ReactNode } from "react";
import { Provider } from "react-redux";

import { makeStore } from "@/store";

interface StoreProviderProps {
  children: ReactNode;
}

export function StoreProvider({ children }: StoreProviderProps) {
  // useState keeps one store per mounted tree, so server renders never share state.
  const [store] = useState(makeStore);
  return <Provider store={store}>{children}</Provider>;
}
