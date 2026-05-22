import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import SiteHeader from "@/components/site-header";
import { GithubCorner } from "@/components/github-corner";
import { DesignProvider } from "@/contexts/design-context";

type Props = {
  children: React.ReactNode;
};

export default function MainLayout({ children }: Props) {
  const style = {
    "--sidebar-width": "calc(var(--spacing) * 72)",
    "--header-height": "calc(var(--spacing) * 12)",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={style}>
      <DesignProvider>
        <GithubCorner />
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex-1 overflow-auto p-4 md:p-6">{children}</div>
        </SidebarInset>
      </DesignProvider>
    </SidebarProvider>
  );
}
