"use client";

import { Home, Palette, Settings, HelpCircle, Blocks } from "lucide-react";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navItems = [
  {
    title: "Design",
    icon: Home,
    href: "/",
    disabled: false,
  },
  {
    title: "Gallery",
    icon: Blocks,
    href: "/gallery",
    disabled: false,
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/settings",
    disabled: false,
  },
  {
    title: "Help",
    icon: HelpCircle,
    href: "/help",
    disabled: false,
  },
];

type Props = {
  variant: "inset" | "floating";
};

export function AppSidebar({ variant }: Props) {
  return (
    <Sidebar collapsible="icon" variant={variant}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/">
                <Palette className="size-5!" />
                <span className="text-base font-semibold">
                  Interior Designer
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild={!item.disabled}
                    disabled={item.disabled}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
