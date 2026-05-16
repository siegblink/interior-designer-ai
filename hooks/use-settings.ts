import { useState, useEffect, useCallback } from "react";
import type { RoomType, DesignTheme } from "@/types";
import { SCALE_DEFAULT } from "@/components/design-controls";

export interface Settings {
  theme: DesignTheme;
  room: RoomType;
  scale: number;
}

const STORAGE_KEY = "interior-designer-settings";

const DEFAULT_SETTINGS: Settings = {
  theme: "Modern",
  room: "Living Room",
  scale: SCALE_DEFAULT,
};

export function useSettings(): [Settings, (patch: Partial<Settings>) => void] {
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettingsState({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      }
    } catch {
      // ignore malformed storage
    }
  }, []);

  const setSettings = useCallback((patch: Partial<Settings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore write errors (private mode, storage full)
      }
      return next;
    });
  }, []);

  return [settings, setSettings];
}
