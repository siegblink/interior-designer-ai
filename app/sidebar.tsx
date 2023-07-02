"use client";

import { useState } from "react";
import { Header } from "./header";
import { MobileSidebar } from "./mobile-sidebar";
import { DesktopSidebar } from "./desktop-sidebar";

export function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

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
