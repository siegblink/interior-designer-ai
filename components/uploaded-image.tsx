"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface UploadedImageProps {
  src: string;
  onRemove: () => void;
  /** Disables removing the photo, e.g. while a design is being generated. */
  disabled?: boolean;
}

export function UploadedImage({
  src,
  onRemove,
  disabled = false,
}: UploadedImageProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="relative p-0">
        <div className="relative aspect-4/3">
          <Image
            src={src}
            alt="Uploaded room"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2"
          onClick={onRemove}
          disabled={disabled}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Remove image</span>
        </Button>
      </CardContent>
    </Card>
  );
}
