import {
  DESIGN_THEMES,
  ROOM_TYPES,
  SCALE_DEFAULT,
  SCALE_MAX,
  SCALE_MIN,
} from "@/lib/constants";
import type { RoomType, DesignTheme } from "@/types";

export interface Settings {
  theme: DesignTheme;
  room: RoomType;
  scale: number;
}

export const SETTINGS_STORAGE_KEY = "interior-designer-settings";

export const DEFAULT_SETTINGS: Settings = {
  theme: "Modern",
  room: "Living Room",
  scale: SCALE_DEFAULT,
};

/** Keeps only the stored values the app (and the API) still accepts. */
export function sanitizeSettings(stored: unknown): Partial<Settings> {
  if (!stored || typeof stored !== "object") return {};
  const { theme, room, scale } = stored as Record<string, unknown>;
  const settings: Partial<Settings> = {};
  if (DESIGN_THEMES.includes(theme as DesignTheme)) {
    settings.theme = theme as DesignTheme;
  }
  if (ROOM_TYPES.includes(room as RoomType)) {
    settings.room = room as RoomType;
  }
  if (typeof scale === "number" && scale >= SCALE_MIN && scale <= SCALE_MAX) {
    settings.scale = scale;
  }
  return settings;
}

/** Parses the raw localStorage value into complete, valid settings. */
export function parseStoredSettings(raw: string | null): Settings {
  if (!raw) return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...sanitizeSettings(JSON.parse(raw)) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}
