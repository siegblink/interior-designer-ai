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
