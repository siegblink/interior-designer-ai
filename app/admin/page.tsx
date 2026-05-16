import { cookies } from "next/headers";
import { list } from "@vercel/blob";
import { AdminSignIn } from "@/components/admin-sign-in";
import { AdminGallery } from "@/components/admin-gallery";

export const dynamic = "force-dynamic";

interface Design {
  url: string;
  theme: string;
  room: string;
  createdAt: string;
}

function decodePathname(pathname: string): { theme: string; room: string } {
  const filename = pathname.split("/").pop() ?? "";
  const withoutExt = filename.replace(/\.png$/, "");
  const [, encodedTheme, ...rest] = withoutExt.split("_");
  return {
    theme: decodeURIComponent(encodedTheme ?? ""),
    room: decodeURIComponent(rest.join("_")),
  };
}

export default async function AdminPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  const isAuthenticated =
    !!session?.value &&
    !!process.env.GALLERY_ADMIN_SECRET &&
    session.value === process.env.GALLERY_ADMIN_SECRET;

  if (!isAuthenticated) {
    return <AdminSignIn />;
  }

  let designs: Design[] = [];
  try {
    const { blobs } = await list({ prefix: "designs/" });
    designs = blobs
      .map((blob) => {
        const { theme, room } = decodePathname(blob.pathname);
        return {
          url: blob.url,
          theme,
          room,
          createdAt: blob.uploadedAt.toISOString(),
        };
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  } catch {
    // blob store unavailable — show empty gallery
  }

  return <AdminGallery initialDesigns={designs} />;
}
