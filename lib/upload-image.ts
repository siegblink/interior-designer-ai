import { MAX_UPLOAD_BYTES, MAX_UPLOAD_EDGE, fitWithin } from "@/lib/upload";

// Tried in order until the encoded image fits the request-size budget.
const JPEG_QUALITIES = [0.9, 0.8, 0.65];

function encodeJpeg(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", quality);
  });
}

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Read failed"));
    reader.readAsDataURL(blob);
  });
}

/**
 * Turns a photo the user picked into the data URL the app uploads: an upright
 * JPEG whose longer edge is at most MAX_UPLOAD_EDGE pixels.
 *
 * Phone photos are several megabytes, and the hosting platform rejects request
 * bodies over 4.5 MB, so the original file cannot be sent as it is. The model
 * works at a much lower resolution anyway. Browser only.
 */
export async function prepareUploadImage(file: Blob): Promise<string> {
  // Decoding applies the photo's EXIF orientation, so the result is upright.
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");

  try {
    const { width, height } = fitWithin(
      bitmap.width,
      bitmap.height,
      MAX_UPLOAD_EDGE
    );
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is not available");
    // JPEG has no transparency; put transparent PNGs on white, not black.
    context.fillStyle = "#fff";
    context.fillRect(0, 0, width, height);
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, 0, 0, width, height);

    for (const quality of JPEG_QUALITIES) {
      const blob = await encodeJpeg(canvas, quality);
      if (blob && blob.size <= MAX_UPLOAD_BYTES) {
        return await readAsDataUrl(blob);
      }
    }
    throw new Error("Image is too large to upload");
  } finally {
    bitmap.close();
    // Release the pixel buffer right away; Safari keeps few canvases alive.
    canvas.width = 0;
    canvas.height = 0;
  }
}
