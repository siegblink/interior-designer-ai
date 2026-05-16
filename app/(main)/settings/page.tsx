"use client";

import {
  Home,
  Scale,
  Palette,
  Sparkles,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTheme } from "next-themes";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { Separator } from "@/components/ui/separator";
import { ROOM_TYPES, DESIGN_THEMES } from "@/lib/constants";
import { useSettings } from "@/hooks/use-settings";
import { cn } from "@/lib/utils";
import type { RoomType, DesignTheme } from "@/types";

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

interface StylePreset {
  value: number;
  label: string;
  description: string;
  icon: LucideIcon;
}

const STYLE_PRESETS: StylePreset[] = [
  {
    value: 4,
    label: "Faithful",
    description: "Keeps your room's layout intact",
    icon: Home,
  },
  {
    value: 9,
    label: "Balanced",
    description: "A blend of your space and the style",
    icon: Scale,
  },
  {
    value: 14,
    label: "Creative",
    description: "More AI freedom with the design",
    icon: Palette,
  },
  {
    value: 19,
    label: "Bold",
    description: "Full AI reimagining of your space",
    icon: Sparkles,
  },
];

export default function SettingsPage() {
  const [settings, setSettings] = useSettings();
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          These defaults pre-fill the Design page every time you open the app.
        </p>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Design Defaults</CardTitle>
          <CardDescription>
            Choose your preferred starting point for new designs.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
            <div className="flex flex-1 flex-col gap-3">
              <label className="text-sm font-medium">Default Theme</label>
              <Combobox
                options={DESIGN_THEMES}
                value={settings.theme}
                onValueChange={(theme: DesignTheme) => setSettings({ theme })}
                placeholder="Select theme..."
                searchPlaceholder="Search themes..."
                emptyText="No theme found."
              />
            </div>

            <div className="flex flex-1 flex-col gap-3">
              <label className="text-sm font-medium">Default Room Type</label>
              <Combobox
                options={ROOM_TYPES}
                value={settings.room}
                onValueChange={(room: RoomType) => setSettings({ room })}
                placeholder="Select room..."
                searchPlaceholder="Search rooms..."
                emptyText="No room found."
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <label className="text-sm font-medium">
                Default Style Strength
              </label>
              <p className="text-muted-foreground mt-0.5 text-sm">
                How freely the AI reimagines your space
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {STYLE_PRESETS.map((preset) => {
                const Icon = preset.icon;
                const isSelected = settings.scale === preset.value;
                return (
                  <button
                    key={preset.value}
                    onClick={() => setSettings({ scale: preset.value })}
                    className={cn(
                      "flex flex-col gap-2 rounded-lg border p-4 text-left transition-colors",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        isSelected ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                    <div>
                      <div className="text-sm font-medium">{preset.label}</div>
                      <div className="text-muted-foreground mt-0.5 text-sm">
                        {preset.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose your preferred color scheme.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 sm:w-72">
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = theme === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border p-4 text-sm transition-colors",
                    isSelected
                      ? "border-primary bg-primary/5 font-medium"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  {option.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
