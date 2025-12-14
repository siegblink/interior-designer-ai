"use client";

import { useState, useEffect } from "react";
import { Header } from "./header";
import { MobileSidebar } from "./mobile-sidebar";
import { DesktopSidebar } from "./desktop-sidebar";
import { AnimatePresence } from "framer-motion";

export function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Close sidebar when pressing escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <>
      <AnimatePresence>
        {sidebarOpen && (
          <MobileSidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
        )}
      </AnimatePresence>
      <DesktopSidebar />
      <Header onClick={() => setSidebarOpen(true)} />
    </>
  );
}
