"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface UploadedImageProps {
  src: string;
  onRemove: () => void;
}

export function UploadedImage({ src, onRemove }: UploadedImageProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="relative p-0">
        <div className="relative aspect-[4/3]">
          <Image src={src} alt="Uploaded room" fill className="object-cover" />
        </div>
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Remove image</span>
        </Button>
      </CardContent>
    </Card>
  );
}
