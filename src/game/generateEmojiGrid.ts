// src/game/generateEmojiGrid.ts
import type { TileState } from "./types";

export function tileToEmoji(tile: TileState): string {
  switch (tile) {
    case "GREEN": return "🟩";
    case "YELLOW": return "🟨";
    case "GRAY": return "⬛";
    default: return "⬜";
  }
}
