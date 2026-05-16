"use client";
import { createContext, useContext } from "react";

export const SidebarContext = createContext<{ openSidebar: () => void }>({
  openSidebar: () => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}
