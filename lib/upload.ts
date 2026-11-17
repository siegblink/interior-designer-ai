import {
  ACCEPTED_FILE_TYPES,
  MAX_FILE_SIZE,
  MAX_IMAGE_DATA_URL_LENGTH,
} from "@/lib/constants";

/** Uploads are scaled down so their longer edge is at most this many pixels. */
export const MAX_UPLOAD_EDGE = 2048;

/**
 * Largest encoded image whose base64 data URL still fits in
 * MAX_IMAGE_DATA_URL_LENGTH (base64 turns 3 bytes into 4 characters; 64
 * characters are kept for the `data:image/...;base64,` prefix).
 */
export const MAX_UPLOAD_BYTES =
  Math.floor((MAX_IMAGE_DATA_URL_LENGTH - 64) / 4) * 3;

/** Returns why a file cannot be uploaded, or null when it is acceptable. */
export function validateUploadFile(file: {
  type: string;
  size: number;
}): string | null {
  if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
    return "Please upload a JPEG or PNG image";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "File size must be less than 5MB";
  }
  return null;
}

/**
 * Scales a size down, keeping its aspect ratio, so that the longer edge is at
 * most `maxEdge`. Sizes that already fit are returned unchanged.
 */
export function fitWithin(
  width: number,
  height: number,
  maxEdge: number
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) return { width, height };
  const scale = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}
