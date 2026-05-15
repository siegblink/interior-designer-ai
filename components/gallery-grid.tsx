"use client";

import { useState } from "react";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const [designs, setDesigns] = useState(initialDesigns);
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);

  async function handleDelete(url: string) {
    setDeletingUrl(url);
    setDesigns((prev) => prev.filter((d) => d.url !== url));

    try {
      const res = await fetch("/api/gallery", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Design removed from gallery.");
    } catch {
      toast.error("Failed to delete design. Please try again.");
      const res = await fetch("/api/gallery");
      const data = await res.json();
      setDesigns(data.designs ?? []);
    } finally {
      setDeletingUrl(null);
    }
  }

  if (designs.length === 0) {
    return (
      <div className="flex min-h-100 flex-col items-center justify-center gap-3 text-center">
        <p className="text-muted-foreground text-sm">
          No saved designs yet. Generate a design and save it to see it here.
        </p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {designs.map((design) => (
          <Card key={design.url} className="overflow-hidden">
            <CardContent className="relative p-0">
              <div className="relative aspect-4/3">
                <Image
                  src={design.url}
                  alt={`${design.theme} ${design.room}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  className="object-cover"
                />
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => handleDelete(design.url)}
                    disabled={deletingUrl === design.url}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete design</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete design</TooltipContent>
              </Tooltip>
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
    </TooltipProvider>
  );
}
