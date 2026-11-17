/**
 * The image to show from the model's output. The model returns its control
 * map first and the design second; fall back to the first image when there is
 * only one.
 */
export function pickDesignImage(output: unknown): string | null {
  if (!Array.isArray(output)) return null;
  const image: unknown = output[1] || output[0];
  return typeof image === "string" && image.length > 0 ? image : null;
}

/**
 * The message to show for a failed generation request. `data` is the parsed
 * response body, or null when the body was not JSON, as with errors the
 * hosting platform answers itself (413 body too large, 504 timeout).
 */
export function generationErrorMessage(status: number, data: unknown): string {
  const error = (data as { error?: unknown } | null)?.error;
  if (typeof error === "string" && error.length > 0) return error;
  if (status === 413) {
    return "Image is too large to upload. Try a smaller photo.";
  }
  if (status === 504) return "Generation timed out. Please try again.";
  // The Vercel Firewall answers these itself when one of its rules matches.
  if (status === 429) {
    return "Too many requests. Please wait a few minutes and try again.";
  }
  if (status === 403) {
    return "This request was blocked. Reload the page and try again.";
  }
  return "Failed to generate design";
}
