import { GalleryGrid } from "@/components/gallery-grid";
import { listDesigns, type Design } from "@/lib/gallery";

export const dynamic = "force-dynamic";

async function fetchDesigns(): Promise<Design[]> {
  try {
    return await listDesigns();
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
