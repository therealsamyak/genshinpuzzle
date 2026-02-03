// src/game/evaluateGuess.ts
import type { Guess, TeamCharacter, TileState } from "./types";
import { CHARACTER_DATA } from "./characters";

/**
 * Evaluate a guess ignoring position.
 * Green: character is in the puzzle team.
 * Yellow: character's element exists in puzzle team.
 */
export function evaluateGuess(guess: Guess, puzzleTeam: TeamCharacter[]): TileState[] {
  const tiles: TileState[] = ["GRAY", "GRAY", "GRAY", "GRAY"];

  // Track which puzzle indices have been used for green/yellow
  const used = new Array(puzzleTeam.length).fill(false);

  // Step 1: mark greens (character exists anywhere)
  for (let i = 0; i < guess.characters.length; i++) {
    const guessedChar = guess.characters[i];
    const idx = puzzleTeam.findIndex((p, j) => !used[j] && p.name === guessedChar);

    if (idx !== -1) {
      tiles[i] = "GREEN";
      used[idx] = true; // mark this puzzle character as matched
    }
  }

  // Step 2: mark yellows (element exists anywhere, ignoring greens)
  for (let i = 0; i < guess.characters.length; i++) {
    if (tiles[i] === "GREEN") continue;

    const guessedChar = guess.characters[i];
    const guessedElement = CHARACTER_DATA[guessedChar]?.element;
    if (!guessedElement) continue;

    const idx = puzzleTeam.findIndex(
      (p, j) => !used[j] && p.element === guessedElement
    );

    if (idx !== -1) {
      tiles[i] = "YELLOW";
      used[idx] = true; // mark element as used
    }
  }

  return tiles;
}