import { useState } from "react";
import type { GameState, Guess, Element} from "../game/types";
import { initialState } from "../game/initialState";
import { makeGuess } from "../game/gameController";
import { CHARACTER_DATA } from "../game/characters";


export default function DailyPuzzle() {
    const ELEMENTS: Element[] = [
    "Pyro",
    "Hydro",
    "Electro",
    "Cryo",
    "Dendro",
    "Anemo",
    "Geo",
  ];

  const [activeElements, setActiveElements] = useState<Record<Element, boolean>>(
    () =>
      ELEMENTS.reduce((acc, el) => {
        acc[el] = true;
        return acc;
      }, {} as Record<Element, boolean>)
  );

    const toggleElement = (el: Element) => {
    setActiveElements((prev) => ({
      ...prev,
      [el]: !prev[el],
    }));
  };

  const enableAllElements = () => {
    setActiveElements(
      ELEMENTS.reduce((acc, el) => {
        acc[el] = true;
        return acc;
      }, {} as Record<Element, boolean>)
    );
  };

  const disableAllElements = () => {
    setActiveElements(
      ELEMENTS.reduce((acc, el) => {
        acc[el] = false;
        return acc;
      }, {} as Record<Element, boolean>)
    );
  };


  const [state, setState] = useState<GameState>(initialState);
  const [preview, setPreview] = useState<string[]>([]);

  const removePreviewAt = (index: number) => {
    setPreview((prev) => prev.filter((_, i) => i !== index));
  };

  const isGameOver = state.isWin || state.isOver;

  // Flatten guessed characters
  const guessedCharacters = state.guessesSoFar.flatMap((g) => g.characters);

  // Characters that were ever GREEN
  const correctCharacters = state.guessesSoFar.flatMap((g, i) =>
    g.characters.filter((_, j) => state.gridTiles[i][j] === "GREEN")
  );

  // ---- Preview controls ----

  const addToPreview = (name: string) => {
    if (isGameOver) return;
    if (preview.length >= 4) return;
    if (preview.includes(name)) return; // 👈 prevent duplicates

    setPreview((prev) => [...prev, name]);
  };


  const removeLastPreview = () => {
    setPreview((prev) => prev.slice(0, -1));
  };

  const submitGuess = () => {
    if (preview.length !== 4 || isGameOver) return;
    const guess: Guess = { characters: preview };
    setState(makeGuess(state, guess));
    setPreview([]);
  };

  // ---- Hint reveal ----

  const revealHint = (hint: "strongestHit" | "totalDps" | "elements") => {
    setState((prev) => ({
      ...prev,
      clueState: { ...prev.clueState, [`${hint}Revealed`]: true },
    }));
  };

  // ---- Grid background color ----

  const getGridBg = (name: string) => {
    if (correctCharacters.includes(name)) return "#2f6f3a"; // green
    if (guessedCharacters.includes(name)) return "#7a6a2b"; // yellow-ish
    return "#2a2a2a"; // neutral
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Daily Puzzle</h2>

      {/* ================= MAIN LAYOUT ================= */}
      <div
        style={{
          display: "flex",
          gap: "2rem",
          minHeight: "100vh",
          justifyContent: "flex-start", // ✅ top (main axis)
          alignItems: "stretch",        // ✅ normal
        }}
      >
        {/* ============== LEFT SIDE ============== */}
        <div style={{ flex: 1, minWidth: 760, maxWidth: 760 }}>
          {/* Preview Row */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              justifyContent: "center",
              marginBottom: "1rem",
            }}
          >
            {[0, 1, 2, 3].map((i) => {
              const char = preview[i];

              return (
                <div
                  key={i}
                  onClick={() => char && removePreviewAt(i)}
                  style={{
                    width: 72,
                    height: 72,
                    border: "2px solid #444",
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#1f1f1f",
                    cursor: char ? "pointer" : "default",
                    opacity: char ? 1 : 0.6,
                  }}
                  title={char ? "Click to remove" : undefined}
                >
                  {char && (
                    <img
                      src={CHARACTER_DATA[char].iconUrl}
                      alt={char}
                      style={{
                        width: 56,
                        height: 56,
                        pointerEvents: "none", // IMPORTANT
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Controls */}
          <div style={{ textAlign: "center", marginBottom: "1rem" }}>
            <button
              onClick={submitGuess}
              disabled={preview.length !== 4 || isGameOver}
              style={{ marginRight: "0.5rem" }}
            >
              Submit Guess
            </button>

            <button
              onClick={removeLastPreview}
              disabled={preview.length === 0 || isGameOver}
            >
              Backspace
            </button>
          </div>

          {/* Element Filters */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px",
              marginBottom: "1rem",
              flexWrap: "wrap",
            }}
          >
            {ELEMENTS.map((el) => {
              const isOn = activeElements[el];

              return (
                <button
                  key={el}
                  onClick={() => toggleElement(el)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 6,
                    border: "1px solid #444",
                    background: isOn ? "#3a3a3a" : "#1a1a1a",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                  }}
                  title={el}
                >
                  <img
                    src={`/genshinpuzzle/icons/elements/${el}_Icon.png`}
                    alt={el}
                    style={{
                      width: 30,
                      height: 30,
                      objectFit: "contain",
                      display: "block",
                      margin: "0 auto",
                      opacity: isOn ? 1 : 0.35,
                      pointerEvents: "none",
                    }}
                  />
                </button>
              );
            })}

            <button onClick={disableAllElements} style={{ marginLeft: 12 }}>
              None
            </button>
            <button onClick={enableAllElements}>All</button>
          </div>


          {/* Character Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(10, 1fr)",
              gap: "8px",
              width: "100%",
            }}
          >
            {Object.entries(CHARACTER_DATA)
              .filter(([_, data]) => activeElements[data.element as Element])
              .map(([name]) => (
              <button
                key={name}
                onClick={() => addToPreview(name)}
                disabled={isGameOver}
                style={{
                  width: 64,
                  height: 64,
                  padding: 4,
                  borderRadius: 6,
                  border: "1px solid #444",
                  background: getGridBg(name),
                  cursor: "pointer",
                }}
              >
                <img
                  src={CHARACTER_DATA[name].iconUrl}
                  alt={name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* ============== RIGHT SIDE ============== */}
        <div style={{ width: "360px", flexShrink: 0 }}>
          {/* Guesses */}
          <h3>Guesses</h3>
          {state.guessesSoFar.map((guess, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: "8px",
                marginBottom: "0.5rem",
              }}
            >
              {guess.characters.map((char, j) => {
                const tile = state.gridTiles[i][j];
                const color =
                  tile === "GREEN"
                    ? "#2f6f3a"
                    : tile === "YELLOW"
                    ? "#7a6a2b"
                    : "#555";

                return (
                  <div
                    key={j}
                    style={{
                      flex: 1,
                      background: color,
                      borderRadius: 6,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px",
                    }}
                  >
                    <img
                      src={CHARACTER_DATA[char].iconUrl}
                      alt={char}
                      style={{ width: 24, height: 24 }}
                    />
                    <span>{char}</span>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Hints */}
          <h3 style={{ marginTop: "1.5rem" }}>Hints</h3>

          <button
            disabled={
              !state.clueState.strongestHitUnlocked ||
              state.clueState.strongestHitRevealed
            }
            onClick={() => revealHint("strongestHit")}
          >
            Reveal Strongest Hit
          </button>

          {state.clueState.strongestHitRevealed && (
            <div>Strongest Hit: {state.puzzle.strongestHit}</div>
          )}

          <button
            disabled={
              !state.clueState.totalDpsUnlocked ||
              state.clueState.totalDpsRevealed
            }
            onClick={() => revealHint("totalDps")}
          >
            Reveal Total DPS
          </button>

          {state.clueState.totalDpsRevealed && (
            <div>Total DPS: {state.puzzle.totalDps}</div>
          )}

          <button
            disabled={
              !state.clueState.elementsUnlocked ||
              state.clueState.elementsRevealed
            }
            onClick={() => revealHint("elements")}
          >
            Reveal Elements
          </button>

          {state.clueState.elementsRevealed && (
            <div>
              Elements: {state.puzzle.team.map((c) => c.element).join(", ")}
            </div>
          )}
        </div>
      </div>

      {/* Game Status */}
      {state.isWin && (
        <h3 style={{ color: "lightgreen", textAlign: "center" }}>
          🎉 You solved the puzzle!
        </h3>
      )}
      {state.isOver && !state.isWin && (
        <h3 style={{ color: "#ff6b6b", textAlign: "center" }}>Game Over</h3>
      )}
    </div>
  );
}
