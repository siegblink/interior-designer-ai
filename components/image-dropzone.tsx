"use client";

import { Upload, ImageIcon } from "lucide-react";
import { useDropzone } from "@/hooks/use-dropzone";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface ImageDropzoneProps {
  onImageUpload: (base64: string) => void;
  onError: (error: string) => void;
}

export function ImageDropzone({ onImageUpload, onError }: ImageDropzoneProps) {
  const handleDrop = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      onImageUpload(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

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
          className="flex aspect-[4/3] flex-col items-center justify-center p-8"
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4 text-center">
            {isDragActive ? (
              <>
                <Upload className="text-primary h-12 w-12" />
                <p className="font-semibold">Drop your image here</p>
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
