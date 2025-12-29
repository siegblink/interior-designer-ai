"use client";

import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { ROOM_TYPES, DESIGN_THEMES } from "@/lib/constants";
import type { RoomType, DesignTheme } from "@/types";

interface DesignControlsProps {
  selectedTheme: DesignTheme;
  selectedRoom: RoomType;
  onThemeChange: (theme: DesignTheme) => void;
  onRoomChange: (room: RoomType) => void;
  onGenerate: () => void;
  isLoading: boolean;
  canGenerate: boolean;
}

export function DesignControls({
  selectedTheme,
  selectedRoom,
  onThemeChange,
  onRoomChange,
  onGenerate,
  isLoading,
  canGenerate,
}: DesignControlsProps) {
  return (
    <div className="flex flex-col gap-4">
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
