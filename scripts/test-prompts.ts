import { buildPrompt } from "../lib/prompts";
import type { DesignTheme, RoomType } from "../types";

const THEMES: DesignTheme[] = [
  "Modern",
  "Minimalist",
  "Scandinavian",
  "Industrial",
  "Bohemian",
  "Traditional",
  "Coastal",
  "Mid-Century Modern",
];

const ROOMS: RoomType[] = ["Living Room", "Bedroom", "Kitchen"];

console.log("=== Prompt preview for all theme/room combos ===\n");

for (const theme of THEMES) {
  for (const room of ROOMS) {
    console.log(`[${theme} + ${room}]`);
    console.log(buildPrompt(theme, room));
    console.log();
  }
}
