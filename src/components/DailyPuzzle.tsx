// Remove React import if you aren’t using it directly
import { useState } from "react";
import type { GameState, Guess } from "../game/types";
import { initialState } from "../game/initialState";
import { makeGuess } from "../game/gameController";
import { CHARACTER_DATA } from "../game/characters";

export default function DailyPuzzle() {
  const [state, setState] = useState<GameState>(initialState);
  const [selectedCharacters, setSelectedCharacters] = useState(
    ["Character", "Character", "Character", "Character"]
  );

  // Flatten all characters guessed so far
  const guessedCharacters = state.guessesSoFar.flatMap((g) => g.characters);

  // Flatten all characters guessed correctly (GREEN tiles)
  const correctCharacters = state.guessesSoFar.flatMap((g, i) =>
    g.characters.filter((_c, j) => state.gridTiles[i][j] === "GREEN")
  );

  const isGameOver = state.isWin || state.isOver;

  const handleSelect = (idx: number, value: string) => {
    const next = [...selectedCharacters];
    next[idx] = value;
    setSelectedCharacters(next);
  };

  const handleGuess = () => {
    if (isGameOver || selectedCharacters.includes("Character")) return;
    const guess: Guess = { characters: [...selectedCharacters] };
    setState(makeGuess(state, guess));
    setSelectedCharacters(["Character", "Character", "Character", "Character"]);
  };

  const revealHint = (hint: "strongestHit" | "totalDps" | "elements") => {
    setState((prev) => ({
      ...prev,
      clueState: { ...prev.clueState, [`${hint}Revealed`]: true },
    }));
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Daily Puzzle</h2>

      {/* Dropdowns */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        {selectedCharacters.map((c, i) => (
          <select
            key={i}
            value={c}
            onChange={(e) => handleSelect(i, e.target.value)}
            disabled={isGameOver}
            style={{
              minWidth: "120px",
              backgroundColor:
                c === "Character"
                  ? "white"
                  : correctCharacters.includes(c)
                  ? "lightgreen"
                  : "white",
              color: "black",
            }}
          >
            <option disabled>Character</option>
            {Object.keys(CHARACTER_DATA).map((name) => {
              const isCorrect = correctCharacters.includes(name);
              const wasGuessed = guessedCharacters.includes(name) && !isCorrect;

              return (
                <option
                  key={name}
                  value={name}
                  disabled={wasGuessed}
                  style={{
                    color: wasGuessed ? "#999" : "black",
                    backgroundColor: isCorrect ? "lightgreen" : "white",
                  }}
                >
                  {name}
                </option>
              );
            })}
          </select>
        ))}
        <button
          onClick={handleGuess}
          disabled={isGameOver || selectedCharacters.includes("Character")}
          style={{ padding: "0.5rem 1rem" }}
        >
          Submit
        </button>
      </div>

      {/* Guesses */}
      <div>
        <h3>Guesses</h3>
        {state.guessesSoFar.map((guess, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: "0.5rem",
              marginTop: "0.25rem",
              justifyContent: "flex-start",
            }}
          >
            {guess.characters.map((char, j) => {
              const tile = state.gridTiles[i][j];
              const color =
                tile === "GREEN" ? "green" : tile === "YELLOW" ? "yellow" : "lightgray";

              return (
                <div
                  key={j}
                  style={{
                    width: "120px",
                    textAlign: "center",
                    backgroundColor: color,
                    padding: "0.5rem",
                    borderRadius: "0.25rem",
                    color: "black",
                  }}
                >
                  {char}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Hints */}
      <div style={{ marginTop: "1rem" }}>
        <h3>Hints</h3>

        <button
          disabled={!state.clueState.strongestHitUnlocked || state.clueState.strongestHitRevealed}
          onClick={() => revealHint("strongestHit")}
        >
          Reveal Strongest Hit
        </button>
        {state.clueState.strongestHitRevealed && (
          <div>Strongest Hit: {state.puzzle.strongestHit}</div>
        )}

        <button
          disabled={!state.clueState.totalDpsUnlocked || state.clueState.totalDpsRevealed}
          onClick={() => revealHint("totalDps")}
        >
          Reveal Total DPS
        </button>
        {state.clueState.totalDpsRevealed && <div>Total DPS: {state.puzzle.totalDps}</div>}

        <button
          disabled={!state.clueState.elementsUnlocked || state.clueState.elementsRevealed}
          onClick={() => revealHint("elements")}
        >
          Reveal Elements
        </button>
        {state.clueState.elementsRevealed && (
          <div>Elements in Team: {state.puzzle.team.map((c) => c.element).join(", ")}</div>
        )}
      </div>

      {/* Game over / win message */}
      {state.isWin && <h3 style={{ color: "green" }}>🎉 You solved the puzzle!</h3>}
      {state.isOver && !state.isWin && <h3 style={{ color: "red" }}>Game Over</h3>}
    </div>
  );
}
