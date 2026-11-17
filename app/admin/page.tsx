import { cookies } from "next/headers";
import { AdminSignIn } from "@/components/admin-sign-in";
import { AdminGallery } from "@/components/admin-gallery";
import { ADMIN_SESSION_COOKIE, isAdminSession } from "@/lib/admin-session";
import { listDesigns, type Design } from "@/lib/gallery";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const isAuthenticated = isAdminSession(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  );

  if (!isAuthenticated) {
    return <AdminSignIn />;
  }

  let designs: Design[] = [];
  try {
    designs = await listDesigns();
  } catch {
    // blob store unavailable — show empty gallery
  }

  return <AdminGallery initialDesigns={designs} />;
}
