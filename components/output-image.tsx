"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const STAGES = [
  "Analyzing room structure...",
  "Applying design theme...",
  "Rendering details...",
  "Finalizing design...",
];

const STAGE_INTERVAL_MS = 7000;

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")} elapsed`;
}

interface OutputImageProps {
  isLoading: boolean;
}

/**
 * The "AI Design" panel before a result exists: a placeholder, or progress
 * while a design is being generated. The result itself is shown by
 * ImageComparison.
 */
export function OutputImage({ isLoading }: OutputImageProps) {
  const [elapsed, setElapsed] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setElapsed(0);
      setStageIndex(0);
      return;
    }

    const elapsedTimer = setInterval(() => {
      setElapsed((s) => s + 1);
    }, 1000);

    const stageTimer = setInterval(() => {
      setStageIndex((i) => Math.min(i + 1, STAGES.length - 1));
    }, STAGE_INTERVAL_MS);

    return () => {
      clearInterval(elapsedTimer);
      clearInterval(stageTimer);
    };
  }, [isLoading]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="relative aspect-4/3">
            <Skeleton className="h-full w-full" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Sparkles className="text-muted-foreground h-8 w-8 animate-pulse" />
              <p className="text-foreground text-sm font-medium">
                {STAGES[stageIndex]}
              </p>
              <p className="text-muted-foreground text-sm tabular-nums">
                {formatElapsed(elapsed)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-muted-foreground/25 hover:border-muted-foreground/50 border-2 border-dashed">
      <CardContent className="flex aspect-4/3 items-center justify-center p-8">
        <p className="text-muted-foreground text-center">
          Your AI-generated design will appear here
        </p>
      </CardContent>
    </Card>
  );
}
