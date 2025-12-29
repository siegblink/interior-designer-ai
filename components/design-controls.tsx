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
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        <div className="flex-1 space-y-2 md:w-[calc(50%-1rem)]">
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

        <div className="flex-1 space-y-2 md:w-[calc(50%-1rem)]">
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
