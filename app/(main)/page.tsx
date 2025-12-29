"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { ImageDropzone } from "@/components/image-dropzone";
import { UploadedImage } from "@/components/uploaded-image";
import { OutputImage } from "@/components/output-image";
import { DesignControls } from "@/components/design-controls";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import type { RoomType, DesignTheme } from "@/types";

export default function HomePage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [outputImage, setOutputImage] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<DesignTheme>("Modern");
  const [selectedRoom, setSelectedRoom] = useState<RoomType>("Living Room");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = useCallback((base64: string) => {
    setUploadedImage(base64);
    setOutputImage(null);
    setError(null);
  }, []);

  const handleRemoveImage = useCallback(() => {
    setUploadedImage(null);
    setOutputImage(null);
    setError(null);
  }, []);

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    toast.error(errorMessage);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!uploadedImage) return;

    setIsLoading(true);
    setError(null);
    setOutputImage(null);

    try {
      const response = await fetch("/api/replicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: uploadedImage,
          theme: selectedTheme,
          room: selectedRoom,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate design");
      }

      if (data.output && data.output.length > 0) {
        setOutputImage(data.output[1] || data.output[0]);
        toast.success("Design generated successfully!");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      handleError(message);
    } finally {
      setIsLoading(false);
    }
  }, [uploadedImage, selectedTheme, selectedRoom, handleError]);

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
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
            onThemeChange={setSelectedTheme}
            onRoomChange={setSelectedRoom}
            onGenerate={handleGenerate}
            isLoading={isLoading}
            canGenerate={!!uploadedImage}
          />
        </CardContent>
      </Card>

      <Separator />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-sm font-medium">Original Photo</h2>
          {uploadedImage ? (
            <UploadedImage src={uploadedImage} onRemove={handleRemoveImage} />
          ) : (
            <ImageDropzone
              onImageUpload={handleImageUpload}
              onError={handleError}
            />
          )}
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-medium">AI Design</h2>
          <OutputImage src={outputImage} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
