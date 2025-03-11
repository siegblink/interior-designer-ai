"use client";

import { useState } from "react";
import { DesktopSidebar } from "./desktop-sidebar";
import { MobileSidebar } from "./mobile-sidebar";
import { Header } from "./header";

export function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const navigation = [
    { name: "Home", href: "/", icon: "🏠" },
    { name: "History", href: "/history", icon: "📜" },
  ];

  return (
    <>
      <MobileSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        navigation={navigation}
      />
      <DesktopSidebar navigation={navigation} />
      <Header onClick={() => setSidebarOpen(true)} />
    </>
  );
}
