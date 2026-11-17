import type { RoomType, DesignTheme } from "@/types";

export const ROOM_TYPES: RoomType[] = [
  "Living Room",
  "Bedroom",
  "Bathroom",
  "Kitchen",
  "Dining Room",
  "Home Office",
  "Kids Room",
];

export const DESIGN_THEMES: DesignTheme[] = [
  "Modern",
  "Minimalist",
  "Scandinavian",
  "Industrial",
  "Bohemian",
  "Traditional",
  "Coastal",
  "Mid-Century Modern",
];

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/png"];

// Longest image data URL a generation request may carry. Vercel rejects
// function request bodies over 4.5 MB, so the browser scales uploads down to
// fit this budget (lib/upload-image.ts) and the API refuses anything longer.
export const MAX_IMAGE_DATA_URL_LENGTH = 4_000_000;
