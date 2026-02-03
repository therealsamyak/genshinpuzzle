// src/game/types.ts
export type Element =
  | "Pyro"
  | "Hydro"
  | "Electro"
  | "Cryo"
  | "Anemo"
  | "Geo"
  | "Dendro"
  | "None";

export interface TeamCharacter {
  name: string;
  element: Element;
  individualDps: number;
  damagePercentage: number;
}

export interface Puzzle {
  id: string;
  version: number;
  damageTime: number;
  strongestHit: number;
  totalDps: number;
  team: TeamCharacter[];
}

export interface Guess {
  characters: string[];
}

export type TileState = "GREEN" | "YELLOW" | "GRAY";

export interface ClueState {
  strongestHitUnlocked: boolean;
  totalDpsUnlocked: boolean;
  elementsUnlocked: boolean;
  strongestHitRevealed: boolean;
  totalDpsRevealed: boolean;
  elementsRevealed: boolean;
}

export interface GameState {
  puzzle: Puzzle;
  guessesSoFar: Guess[];
  gridTiles: TileState[][];
  livesRemaining: number;
  clueState: ClueState;
  isWin: boolean;
  isOver: boolean;
}
