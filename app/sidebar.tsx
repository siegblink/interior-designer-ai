"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Header } from "./header";
import { MobileSidebar } from "./mobile-sidebar";
import { DesktopSidebar } from "./desktop-sidebar";

export function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const pathname = usePathname();

  // Don't show sidebar on login page
  if (pathname === "/login") {
    return null;
  }

  return (
    <>
      <MobileSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <DesktopSidebar />
      <Header onClick={() => setSidebarOpen(true)} />
    </>
  );
}
