"use client";

import { Wand2, Home, Scale, Palette, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { ROOM_TYPES, DESIGN_THEMES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { RoomType, DesignTheme } from "@/types";

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

export const SCALE_DEFAULT = 9;

interface DesignControlsProps {
  selectedTheme: DesignTheme;
  selectedRoom: RoomType;
  scale: number;
  onThemeChange: (theme: DesignTheme) => void;
  onRoomChange: (room: RoomType) => void;
  onScaleChange: (value: number) => void;
  onGenerate: () => void;
  isLoading: boolean;
  canGenerate: boolean;
}

export function DesignControls({
  selectedTheme,
  selectedRoom,
  scale,
  onThemeChange,
  onRoomChange,
  onScaleChange,
  onGenerate,
  isLoading,
  canGenerate,
}: DesignControlsProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
        <div className="flex flex-1 flex-col gap-3">
          <label className="text-sm font-medium">Design Theme</label>
          <Combobox
            options={DESIGN_THEMES}
            value={selectedTheme}
            onValueChange={onThemeChange}
            placeholder="Select theme..."
            searchPlaceholder="Search themes..."
            emptyText="No theme found."
            disabled={isLoading}
          />
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <label className="text-sm font-medium">Room Type</label>
          <Combobox
            options={ROOM_TYPES}
            value={selectedRoom}
            onValueChange={onRoomChange}
            placeholder="Select room..."
            searchPlaceholder="Search rooms..."
            emptyText="No room found."
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <label className="text-sm font-medium">Style Strength</label>
          <p className="text-muted-foreground mt-0.5 text-sm">
            How freely the AI reimagines your space
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STYLE_PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isSelected = scale === preset.value;
            return (
              <button
                key={preset.value}
                onClick={() => onScaleChange(preset.value)}
                disabled={isLoading}
                className={cn(
                  "flex flex-col gap-2 rounded-lg border p-4 text-left transition-colors disabled:pointer-events-none disabled:opacity-50",
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

      <Button
        size="lg"
        onClick={onGenerate}
        disabled={!canGenerate || isLoading}
        className="w-full md:w-fit"
      >
        {isLoading ? (
          <>
            <Wand2 className="animate-pulse" />
            Generating
          </>
        ) : (
          <>
            <Wand2 />
            Generate Design
          </>
        )}
      </Button>
    </div>
  );
}
