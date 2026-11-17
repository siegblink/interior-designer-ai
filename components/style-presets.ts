import { Home, Palette, Scale, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SCALE_PRESETS } from "@/lib/constants";

type PresetValue = (typeof SCALE_PRESETS)[number]["value"];

// Keyed by preset value, so adding a preset without an icon is a type error.
const PRESET_ICONS: Record<PresetValue, LucideIcon> = {
  4: Home,
  9: Scale,
  14: Palette,
  19: Sparkles,
};

/** The style-strength presets with their icons, for the preset pickers. */
export const STYLE_PRESETS = SCALE_PRESETS.map((preset) => ({
  ...preset,
  icon: PRESET_ICONS[preset.value],
}));
