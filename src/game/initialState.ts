// src/game/initialState.ts
import type { GameState, TileState } from "./types";

export const initialState: GameState = {
  puzzle: {
    id: "puzzle1",
    version: 1,
    damageTime: 120,
    strongestHit: 5000,
    totalDps: 20000,
    team: [
      { name: "Aino", element: "Hydro", individualDps: 5000, damagePercentage: 25 },
      { name: "Amber", element: "Pyro", individualDps: 4000, damagePercentage: 20 },
      { name: "Barbara", element: "Hydro", individualDps: 3000, damagePercentage: 15 },
      { name: "Chasca", element: "Anemo", individualDps: 3000, damagePercentage: 15 },
    ],
  },
  guessesSoFar: [],
  gridTiles: Array.from({ length: 6 }, () => Array<TileState>(4).fill("GRAY")),
  livesRemaining: 5,
  clueState: {
    strongestHitUnlocked: false,
    totalDpsUnlocked: false,
    elementsUnlocked: false,
    strongestHitRevealed: false,
    totalDpsRevealed: false,
    elementsRevealed: false,
  },
  isWin: false,
  isOver: false,
};
