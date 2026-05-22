"use client";

import { useState } from "react";
import {
  Home,
  Palette,
  Settings,
  CircleHelp,
  Blocks,
  Download,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { saveAs } from "file-saver";
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
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useDesign } from "@/contexts/design-context";

const navItems = [
  { title: "Design", icon: Home, href: "/", disabled: false },
  { title: "Gallery", icon: Blocks, href: "/gallery", disabled: false },
  { title: "Settings", icon: Settings, href: "/settings", disabled: false },
  { title: "Help", icon: CircleHelp, href: "/help", disabled: false },
];

type Props = {
  variant: "inset" | "floating";
};

export function AppSidebar({ variant }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { outputImage, setOutputImage } = useDesign();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  function handleNavClick(e: React.MouseEvent, href: string) {
    if (outputImage && pathname !== href) {
      e.preventDefault();
      setPendingHref(href);
      setDialogOpen(true);
    }
  }

  function handleDownload() {
    if (outputImage) {
      saveAs(outputImage, "interior-design.png");
    }
  }

  function handleContinue() {
    if (pendingHref) {
      router.push(pendingHref);
    }
    setOutputImage(null);
    setDialogOpen(false);
    setPendingHref(null);
  }

  return (
    <Sidebar collapsible="icon" variant={variant}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]!p-1.5!"
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
                    isActive={pathname === item.href}
                  >
                    <Link
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item.href)}
                    >
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

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Design</AlertDialogTitle>
            <AlertDialogDescription>
              Your generated design will no longer be accessible once you leave
              this page. Download it to keep a copy before continuing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Stay
            </Button>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button onClick={handleContinue}>Leave anyway</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  );
}
