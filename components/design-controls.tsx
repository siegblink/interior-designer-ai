"use client";

import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-2">
        <label className="text-sm font-medium">Design Theme</label>
        <Select
          value={selectedTheme}
          onValueChange={(value) => onThemeChange(value as DesignTheme)}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select theme" />
          </SelectTrigger>
          <SelectContent>
            {DESIGN_THEMES.map((theme) => (
              <SelectItem key={theme} value={theme}>
                {theme}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 space-y-2">
        <label className="text-sm font-medium">Room Type</label>
        <Select
          value={selectedRoom}
          onValueChange={(value) => onRoomChange(value as RoomType)}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select room" />
          </SelectTrigger>
          <SelectContent>
            {ROOM_TYPES.map((room) => (
              <SelectItem key={room} value={room}>
                {room}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={onGenerate}
        disabled={!canGenerate || isLoading}
        className="sm:w-auto"
      >
        {isLoading ? (
          <>
            <Wand2 className="mr-2 h-4 w-4 animate-pulse" />
            Generating...
          </>
        ) : (
          <>
            <Wand2 className="mr-2 h-4 w-4" />
            Design this room
          </>
        )}
      </Button>
    </div>
  );
}
