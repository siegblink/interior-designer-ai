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
              <Sparkles className="text-muted-foreground h-8 w-8 animate-pulse" />
              <p className="text-muted-foreground text-sm">
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
      <Card className="border-muted-foreground/25 hover:border-muted-foreground/50 border-2 border-dashed">
        <CardContent className="flex aspect-[4/3] items-center justify-center p-8">
          <p className="text-muted-foreground text-center">
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
            fill
            src={src}
            alt="AI generated design"
            className="object-cover"
          />
        </div>
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-2 right-2"
          onClick={handleDownload}
        >
          <Download className="h-4 w-4" />
          <span className="sr-only">Download image</span>
        </Button>
      </CardContent>
    </Card>
  );
}
