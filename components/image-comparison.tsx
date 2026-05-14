"use client";

import {
  ReactCompareSlider,
  ReactCompareSliderImage,
  ReactCompareSliderHandle,
} from "react-compare-slider";
import { Download, RefreshCw } from "lucide-react";
import { saveAs } from "file-saver";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ImageComparisonProps {
  before: string;
  after: string;
  onRegenerate: () => void;
}

export function ImageComparison({
  before,
  after,
  onRegenerate,
}: ImageComparisonProps) {
  const handleDownload = () => {
    saveAs(after, "interior-design.png");
  };

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium">Compare Results</h2>
      <Card className="overflow-hidden">
        <CardContent className="relative p-0">
          <ReactCompareSlider
            itemOne={
              <div className="relative h-full w-full">
                <ReactCompareSliderImage src={before} alt="Original photo" />
                <span className="bg-background/80 absolute bottom-3 left-3 rounded px-2 py-1 text-sm font-medium backdrop-blur-sm">
                  Original
                </span>
              </div>
            }
            itemTwo={
              <div className="relative h-full w-full">
                <ReactCompareSliderImage
                  src={after}
                  alt="AI generated design"
                />
                <span className="bg-background/80 absolute right-3 bottom-3 rounded px-2 py-1 text-sm font-medium backdrop-blur-sm">
                  AI Design
                </span>
              </div>
            }
            handle={
              <ReactCompareSliderHandle
                buttonStyle={{
                  backdropFilter: "blur(4px)",
                  background: "hsl(var(--background) / 0.8)",
                  border: "2px solid hsl(var(--border))",
                  color: "hsl(var(--foreground))",
                }}
                linesStyle={{ color: "hsl(var(--border))" }}
              />
            }
            className="h-[65vh] w-full"
          />

          <TooltipProvider>
            <div className="absolute top-2 right-2 z-10 flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={onRegenerate}
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span className="sr-only">Try again</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Try again</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4" />
                    <span className="sr-only">Download image</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Download image</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>
    </div>
  );
}
