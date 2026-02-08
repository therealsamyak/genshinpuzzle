import { useState, useEffect, useCallback } from "react";
import type { GameState, Guess, Element } from "../game/types";
import { initialState } from "../game/initialState";
import { makeGuess } from "../game/gameController";
import { CHARACTER_DATA } from "../game/characters";
import TopTabs from "./TopTabs";

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

  const [filterMode, setFilterMode] = useState<"all" | "elements">("all");

  const [activeElements, setActiveElements] = useState<
    Record<Element, boolean>
  >(() =>
    ELEMENTS.reduce(
      (acc, el) => {
        acc[el] = false; // all element buttons off by default; "All" mode shows everything
        return acc;
      },
      {} as Record<Element, boolean>,
    ),
  );

  const clickAll = () => {
    setFilterMode("all");
    // turn all element buttons off
    setActiveElements(
      ELEMENTS.reduce(
        (acc, el) => {
          acc[el] = false;
          return acc;
        },
        {} as Record<Element, boolean>,
      ),
    );
  };

  const toggleElement = (el: Element) => {
    setFilterMode("elements");
    setActiveElements((prev) => {
      const next = { ...prev, [el]: !prev[el] };

      const anyOn = ELEMENTS.some((e) => next[e]);
      if (!anyOn) {
        setFilterMode("all");
      }

      return next;
    });
  };

  const [state, setState] = useState<GameState>(initialState);
  const [preview, setPreview] = useState<string[]>([]);

  const removePreviewAt = (index: number) => {
    setPreview((prev) => prev.filter((_, i) => i !== index));
  };

  const isGameOver = state.isWin || state.isOver;

  const answerPreview = state.puzzle.team.map((c) => c.name);
  const displaySlots = isGameOver ? answerPreview : preview;

  // Flatten guessed characters
  const guessedCharacters = state.guessesSoFar.flatMap((g) => g.characters);

  // Characters that were ever GREEN
  const correctCharacters = state.guessesSoFar.flatMap((g, i) =>
    g.characters.filter((_, j) => state.gridTiles[i][j] === "GREEN"),
  );

  // ---- Preview controls ----

  const addToPreview = (name: string) => {
    if (isGameOver) return;
    if (preview.length >= 4) return;
    if (preview.includes(name)) return; // 👈 prevent duplicates

    setPreview((prev) => [...prev, name]);
  };

  const removeLastPreview = useCallback(() => {
    setPreview((prev) => prev.slice(0, -1));
  }, []);

  const submitGuess = useCallback(() => {
    if (preview.length !== 4 || isGameOver) return;

    const guess: Guess = { characters: preview };
    const next = makeGuess(state, guess);

    // If this guess wins, reveal all hints (but still allow the user to "see them all")
    const finalState = next.isWin
      ? {
          ...next,
          clueState: {
            ...next.clueState,
            strongestHitUnlocked: true,
            totalDpsUnlocked: true,
            elementsUnlocked: true,
            strongestHitRevealed: true,
            totalDpsRevealed: true,
            elementsRevealed: true,
          },
        }
      : next;

    setState(finalState);
    setPreview([]);
  }, [preview, isGameOver, state]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isGameOver) return;

      if (e.key === "Backspace") {
        e.preventDefault();
        removeLastPreview();
      }

      if (e.key === "Enter") {
        e.preventDefault();
        submitGuess();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isGameOver, removeLastPreview, submitGuess]);

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
    <div style={{ minHeight: "100vh" }}>
      <TopTabs
        statusText={
          isGameOver
            ? state.isWin
              ? "You solved the puzzle"
              : "Game Over"
            : undefined
        }
        statusColor={state.isWin ? "lightgreen" : "#ff6b6b"}
      />

      <div style={{ padding: "1rem" }}>
        {/* ================= MAIN LAYOUT ================= */}
        <div
          style={{
            display: "flex",
            gap: "2rem",
            minHeight: "100vh",
            justifyContent: "flex-start", // ✅ top (main axis)
            alignItems: "stretch", // ✅ normal
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
              {/* Character Select */}
              {[0, 1, 2, 3].map((i) => {
                const char = displaySlots[i];

                return (
                  <div
                    key={i}
                    onClick={() => !isGameOver && char && removePreviewAt(i)}
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
                    title={char ? `${char} (click to remove)` : undefined}
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
              {/* All button (same style as element buttons) */}
              <button
                onClick={clickAll}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 6,
                  border: "1px solid #444",
                  background: filterMode === "all" ? "#3a3a3a" : "#1a1a1a",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  opacity: filterMode === "all" ? 1 : 0.6,
                }}
                title="All"
                aria-pressed={filterMode === "all"}
              >
                <span style={{ fontSize: 12, fontWeight: 700 }}>ALL</span>
              </button>

              {/* Element buttons (no None button) */}
              {ELEMENTS.map((el) => {
                const isOn = filterMode === "elements" && activeElements[el];

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
                      opacity: filterMode === "all" ? 0.6 : 1,
                    }}
                    title={el}
                    aria-pressed={isOn}
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
                .filter((entry) => {
                  const data = entry[1];
                  if (filterMode === "all") return true;
                  return activeElements[data.element as Element];
                })

                .map(([name]) => (
                  <button
                    key={name}
                    onClick={() => addToPreview(name)}
                    disabled={isGameOver}
                    title={name}
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
            {/* Hints */}
            <h3 style={{ marginTop: "1.5rem" }}>Hints</h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                columnGap: 12,
                rowGap: 12,
                alignItems: "center",
              }}
            >
              {/* Strongest Hit */}
              <button
                style={{ width: "100%" }}
                disabled={
                  !state.clueState.strongestHitUnlocked ||
                  state.clueState.strongestHitRevealed
                }
                onClick={() => revealHint("strongestHit")}
              >
                Reveal Strongest Hit
              </button>

              <div style={{ minHeight: 22, opacity: 0.9 }}>
                {state.clueState.strongestHitRevealed
                  ? state.puzzle.strongestHit
                  : ""}
              </div>

              {/* Total DPS */}
              <button
                style={{ width: "100%" }}
                disabled={
                  !state.clueState.totalDpsUnlocked ||
                  state.clueState.totalDpsRevealed
                }
                onClick={() => revealHint("totalDps")}
              >
                Reveal Total DPS
              </button>

              <div style={{ minHeight: 22, opacity: 0.9 }}>
                {state.clueState.totalDpsRevealed ? state.puzzle.totalDps : ""}
              </div>

              {/* Elements */}
              <button
                style={{ width: "100%" }}
                disabled={
                  !state.clueState.elementsUnlocked ||
                  state.clueState.elementsRevealed
                }
                onClick={() => revealHint("elements")}
              >
                Reveal Elements
              </button>

              <div
                style={{
                  minHeight: 22,
                  opacity: 0.9,
                  display: "flex",
                  gap: 6,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                {state.clueState.elementsRevealed
                  ? state.puzzle.team.map((c, idx) => (
                      <img
                        key={`${c.element}-${idx}`}
                        src={`/genshinpuzzle/icons/elements/${c.element}_Icon.png`}
                        alt={c.element}
                        title={c.element}
                        style={{
                          width: 22,
                          height: 22,
                          objectFit: "contain",
                          display: "block",
                        }}
                      />
                    ))
                  : ""}
              </div>
            </div>

            {/* Guesses */}
            <h3>Guesses</h3>
            {state.guessesSoFar.map((guess, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: "8px",
                  marginBottom: "0.5rem",
                  flexWrap: "nowrap",
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
                      title={char}
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 6,
                        border: "1px solid #444",
                        background: color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0,
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={CHARACTER_DATA[char].iconUrl}
                        alt={char}
                        style={{
                          width: 56,
                          height: 56,
                          objectFit: "contain",
                          display: "block",
                          margin: "0 auto",
                          pointerEvents: "none",
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
