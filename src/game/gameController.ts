// src/game/gameController.ts
import type { GameState, Guess } from "./types";
import { evaluateGuess } from "./evaluateGuess";

export function makeGuess(state: GameState, guess: Guess): GameState {
  const tiles = evaluateGuess(guess, state.puzzle.team);
  const nextGrid = [...state.gridTiles];
  nextGrid[state.guessesSoFar.length] = tiles;

  const newLives = state.livesRemaining - 1;
  const livesLost = 6 - newLives; // assuming max 6 lives

  // Update clue unlocks based on lives lost
  const newClueState = { ...state.clueState };
  if (livesLost >= 1) newClueState.strongestHitUnlocked = true;
  if (livesLost >= 2) newClueState.totalDpsUnlocked = true;
  if (livesLost >= 3) newClueState.elementsUnlocked = true;

  return {
    ...state,
    guessesSoFar: [...state.guessesSoFar, guess],
    gridTiles: nextGrid,
    livesRemaining: newLives,
    clueState: newClueState,
    isWin: tiles.every((t) => t === "GREEN"),
    isOver: tiles.every((t) => t === "GREEN") || newLives <= 0,
  };
}
