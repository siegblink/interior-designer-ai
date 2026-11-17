"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { ImageDropzone } from "@/components/image-dropzone";
import { UploadedImage } from "@/components/uploaded-image";
import { OutputImage } from "@/components/output-image";
import { ImageComparison } from "@/components/image-comparison";
import { DesignControls } from "@/components/design-controls";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleAlert } from "lucide-react";
import { useSettings } from "@/hooks/use-settings";
import { useDesign } from "@/contexts/design-context";
import { generationErrorMessage, pickDesignImage } from "@/lib/generation";
import { SeoContent } from "@/components/seo-content";
import type { RoomType, DesignTheme } from "@/types";

interface DesignOutput {
  image: string;
  theme: DesignTheme;
  room: RoomType;
}

export default function HomePage() {
  const [settings, setSettings] = useSettings();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  // The design on screen, with the theme and room it was generated for. Saving
  // must use these, not the controls, which may have changed since.
  const [output, setOutput] = useState<DesignOutput | null>(null);
  const outputImage = output?.image ?? null;
  const selectedTheme = settings.theme;
  const selectedRoom = settings.room;
  const scale = settings.scale;
  const setSelectedTheme = (theme: DesignTheme) => setSettings({ theme });
  const setSelectedRoom = (room: RoomType) => setSettings({ room });
  const setScale = (scale: number) => setSettings({ scale });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setOutputImage: setContextOutputImage } = useDesign();
  const requestRef = useRef<AbortController | null>(null);

  // Stop waiting for a generation once this page is gone.
  useEffect(() => () => requestRef.current?.abort(), []);

  useEffect(() => {
    setContextOutputImage(outputImage);
    // Disarm the sidebar navigation guard once this page is gone.
    return () => setContextOutputImage(null);
  }, [outputImage, setContextOutputImage]);

  const handleImageUpload = useCallback((base64: string) => {
    setUploadedImage(base64);
    setOutput(null);
    setError(null);
  }, []);

  const handleRemoveImage = useCallback(() => {
    setUploadedImage(null);
    setOutput(null);
    setError(null);
  }, []);

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    toast.error(errorMessage);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!uploadedImage) return;

    const request = new AbortController();
    requestRef.current?.abort();
    requestRef.current = request;

    setIsLoading(true);
    setError(null);
    setOutput(null);

    try {
      const response = await fetch("/api/replicate", {
        method: "POST",
        signal: request.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: uploadedImage,
          theme: selectedTheme,
          room: selectedRoom,
          scale,
        }),
      });

      // Platform errors (413 body too large, 504 timeout) are not JSON.
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(generationErrorMessage(response.status, data));
      }

      const image = pickDesignImage(data?.output);
      if (image) {
        setOutput({ image, theme: selectedTheme, room: selectedRoom });
        toast.success("Design generated successfully!");
      } else {
        handleError("The model returned no image. Please try again.");
      }
    } catch (err) {
      if (request.signal.aborted) return;
      const message = err instanceof Error ? err.message : "An error occurred";
      handleError(message);
    } finally {
      if (!request.signal.aborted) setIsLoading(false);
    }
  }, [uploadedImage, selectedTheme, selectedRoom, scale, handleError]);

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <CircleAlert className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="leading-relaxed">
            Upload a photo of your room and let AI reimagine it with a new
            design style
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DesignControls
            selectedTheme={selectedTheme}
            selectedRoom={selectedRoom}
            scale={scale}
            onThemeChange={setSelectedTheme}
            onRoomChange={setSelectedRoom}
            onScaleChange={setScale}
            onGenerate={handleGenerate}
            isLoading={isLoading}
            canGenerate={!!uploadedImage}
          />
        </CardContent>
      </Card>

      <Separator />

      {output && uploadedImage && !isLoading ? (
        <ImageComparison
          before={uploadedImage}
          after={output.image}
          theme={output.theme}
          room={output.room}
          onRegenerate={handleGenerate}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <h2 className="text-sm font-medium">Original Photo</h2>
            {uploadedImage ? (
              <UploadedImage
                src={uploadedImage}
                onRemove={handleRemoveImage}
                disabled={isLoading}
              />
            ) : (
              <ImageDropzone
                onImageUpload={handleImageUpload}
                onError={handleError}
              />
            )}
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-medium">AI Design</h2>
            <OutputImage isLoading={isLoading} />
          </div>
        </div>
      )}

      <SeoContent />
    </div>
  );
}
