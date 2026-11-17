import { useState, useEffect, useCallback } from "react";
import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  parseStoredSettings,
  type Settings,
} from "@/lib/settings";

export type { Settings };

export function useSettings(): [Settings, (patch: Partial<Settings>) => void] {
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        setSettingsState(parseStoredSettings(stored));
      }
    } catch {
      // ignore unavailable storage
    }
  }, []);

  const setSettings = useCallback((patch: Partial<Settings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore write errors (private mode, storage full)
      }
      return next;
    });
  }, []);

  return [settings, setSettings];
}
