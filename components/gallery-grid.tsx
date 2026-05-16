import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Design {
  url: string;
  theme: string;
  room: string;
  createdAt: string;
}

interface GalleryGridProps {
  initialDesigns: Design[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function GalleryGrid({ initialDesigns }: GalleryGridProps) {
  if (initialDesigns.length === 0) {
    return (
      <div className="flex min-h-100 flex-col items-center justify-center gap-3 text-center">
        <p className="text-muted-foreground text-sm">
          No saved designs yet. Generate a design and save it to see it here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {initialDesigns.map((design, i) => (
        <Card key={design.url} className="overflow-hidden">
          <CardContent className="relative p-0">
            <div className="relative aspect-4/3">
              <Image
                src={design.url}
                alt={`${design.theme} ${design.room}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                className="object-cover"
                priority={i < 3}
              />
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between gap-2 pt-3">
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary">{design.theme}</Badge>
              <Badge variant="outline">{design.room}</Badge>
            </div>
            <span className="text-muted-foreground shrink-0 text-xs">
              {formatDate(design.createdAt)}
            </span>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
