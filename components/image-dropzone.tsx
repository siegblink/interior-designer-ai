"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, ImageIcon, Loader2 } from "lucide-react";
import { useDropzone } from "@/hooks/use-dropzone";
import { prepareUploadImage } from "@/lib/upload-image";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface ImageDropzoneProps {
  onImageUpload: (base64: string) => void;
  onError: (error: string) => void;
}

export function ImageDropzone({ onImageUpload, onError }: ImageDropzoneProps) {
  const [isPreparing, setIsPreparing] = useState(false);
  // Preparing a photo takes a moment. Only the newest pick may report back,
  // and nothing may once this dropzone is gone.
  const latestJob = useRef(0);
  useEffect(
    () => () => {
      latestJob.current += 1;
    },
    []
  );

  async function handleDrop(file: File) {
    const job = ++latestJob.current;
    setIsPreparing(true);
    try {
      const image = await prepareUploadImage(file);
      if (job === latestJob.current) onImageUpload(image);
    } catch {
      if (job === latestJob.current) {
        onError("Could not read the selected file. Please try another photo.");
      }
    } finally {
      if (job === latestJob.current) setIsPreparing(false);
    }
  }

  const { isDragActive, getRootProps, getInputProps } = useDropzone({
    onDrop: handleDrop,
    onError,
  });

  return (
    <Card
      className={cn(
        "cursor-pointer border-2 border-dashed transition-colors",
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-muted-foreground/50"
      )}
    >
      <CardContent className="p-0">
        <div
          {...getRootProps()}
          aria-busy={isPreparing}
          className="flex aspect-4/3 flex-col items-center justify-center p-8"
        >
          <input {...getInputProps()} />
          {/* Present from the start, so screen readers announce the change. */}
          <p role="status" className="sr-only">
            {isPreparing ? "Preparing your photo..." : ""}
          </p>
          <div className="flex flex-col items-center gap-4 text-center">
            {isDragActive ? (
              <>
                <Upload className="text-primary h-12 w-12" />
                <p className="font-semibold">Drop your image here</p>
              </>
            ) : isPreparing ? (
              <>
                <Loader2 className="text-muted-foreground h-12 w-12 animate-spin" />
                <p className="font-semibold">Preparing your photo...</p>
              </>
            ) : (
              <>
                <ImageIcon className="text-muted-foreground h-12 w-12" />
                <div>
                  <p className="font-semibold">Drag and drop your room photo</p>
                  <p className="text-muted-foreground text-sm">
                    or click to browse (JPEG/PNG, max 5MB)
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
