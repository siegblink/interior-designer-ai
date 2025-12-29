"use client";

import Image from "next/image";
import { Download, Sparkles } from "lucide-react";
import { saveAs } from "file-saver";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface OutputImageProps {
  src: string | null;
  isLoading: boolean;
}

export function OutputImage({ src, isLoading }: OutputImageProps) {
  const handleDownload = () => {
    if (src) {
      saveAs(src, "interior-design.png");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="relative aspect-[4/3]">
            <Skeleton className="h-full w-full" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <Sparkles className="h-8 w-8 animate-pulse text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Generating your design...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!src) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex min-h-[300px] items-center justify-center p-8">
          <p className="text-center text-muted-foreground">
            Your AI-generated design will appear here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="relative p-0">
        <div className="relative aspect-[4/3]">
          <Image
            src={src}
            alt="AI generated design"
            fill
            className="object-cover"
          />
        </div>
        <Button
          variant="secondary"
          size="icon"
          className="absolute right-2 top-2"
          onClick={handleDownload}
        >
          <Download className="h-4 w-4" />
          <span className="sr-only">Download image</span>
        </Button>
      </CardContent>
    </Card>
  );
}
