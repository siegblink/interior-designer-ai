import { list } from "@vercel/blob";
import { GalleryGrid } from "@/components/gallery-grid";

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

async function fetchDesigns(): Promise<Design[]> {
  try {
    const { blobs } = await list({ prefix: "designs/" });
    return blobs
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
    return [];
  }
}

export default async function GalleryPage() {
  const designs = await fetchDesigns();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Gallery</h1>
        <p className="text-muted-foreground text-sm">
          Your saved AI-generated designs.
        </p>
      </div>
      <GalleryGrid initialDesigns={designs} />
    </div>
  );
}
