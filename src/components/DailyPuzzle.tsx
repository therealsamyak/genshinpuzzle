import { useState, useEffect, useCallback, useRef } from "react";
import type { GameState, Guess, Element } from "../game/types";
import { initialState } from "../game/initialState";
import { makeGuess } from "../game/gameController";
import { CHARACTER_DATA } from "../game/characters";
import TopTabs from "./TopTabs";

type Props = { mode?: "daily" | "endless" };

export default function DailyPuzzle({ mode = "daily" }: Props) {

  // =========================================================
  // 1) CONSTANTS + TYPES
  // =========================================================

  const ELEMENTS: Element[] = ["Pyro", "Hydro", "Electro", "Cryo", "Dendro", "Anemo", "Geo"];

  type DailyScore = 1 | 2 | 3 | 4 | 5 | "FAIL";

  type TodayRunSnapshot = {
    date: string; // YYYY-MM-DD (UTC)
    puzzleId: string; // submission id (string)
    preview: string[];
    guesses: string[][]; // guessesSoFar as list of 4-char arrays
    isWin: boolean;
    isOver: boolean;
  };

  const STATS_COOKIE = "gdg_daily_scores_v1";
  const TODAY_RUN_COOKIE = "gdg_today_run_v1";

  // =========================================================
  // 2) COOKIE HELPERS (pure I/O)
  // =========================================================

  const getCookie = useCallback((name: string): string | null => {
    const parts = document.cookie.split("; ").map((p) => p.split("="));
    const hit = parts.find(([k]) => k === name);
    return hit ? decodeURIComponent(hit[1] ?? "") : null;
  }, []);

  const setCookie = useCallback((name: string, value: string, days = 365) => {
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
  }, []);

  const todayUTC = useCallback(() => new Date().toISOString().slice(0, 10), []);

  const loadScores = useCallback((): Record<string, DailyScore> => {
    try {
      const raw = getCookie(STATS_COOKIE);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as Record<string, DailyScore>;
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }, [getCookie]);

  const saveScores = useCallback(
    (scores: Record<string, DailyScore>) => {
      setCookie(STATS_COOKIE, JSON.stringify(scores), 365);
    },
    [setCookie],
  );

  const loadTodayRun = useCallback((): TodayRunSnapshot | null => {
    try {
      const raw = getCookie(TODAY_RUN_COOKIE);
      if (!raw) return null;
      return JSON.parse(raw) as TodayRunSnapshot;
    } catch {
      return null;
    }
  }, [getCookie]);

  const saveTodayRun = useCallback(
    (snap: TodayRunSnapshot) => {
      setCookie(TODAY_RUN_COOKIE, JSON.stringify(snap), 7);
    },
    [setCookie],
  );

  const clearTodayRun = useCallback(() => {
    setCookie(TODAY_RUN_COOKIE, "", 0);
  }, [setCookie]);

  // =========================================================
  // 3) UI + GAME STATE
  // =========================================================

  const [filterMode, setFilterMode] = useState<"all" | "elements">("all");

  const [activeElements, setActiveElements] = useState<Record<Element, boolean>>(() =>
    ELEMENTS.reduce(
      (acc, el) => {
        acc[el] = false;
        return acc;
      },
      {} as Record<Element, boolean>,
    ),
  );

  const [showStats, setShowStats] = useState(false);
  const [scoresSnapshot, setScoresSnapshot] = useState<Record<string, DailyScore>>(() =>
    loadScores(),
  );

  const [state, setState] = useState<GameState>(initialState);
  const [preview, setPreview] = useState<string[]>([]);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [puzzleImageUrl, setPuzzleImageUrl] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [prevDate, setPrevDate] = useState<string | null>(null);
  const [nextDate, setNextDate] = useState<string | null>(null);
  const [isDateLoading, setIsDateLoading] = useState(false);

  const [endlessNonce, setEndlessNonce] = useState(0);

  // Endless-only: avoid repeats within this session (best-effort)
  const seenEndlessIdsRef = useRef<Set<string>>(new Set());

  // Used to avoid writing placeholder state into cookies mid-load
  const [loadedPuzzleId, setLoadedPuzzleId] = useState<string | null>(null);

  const isTodaySelected = selectedDate === todayUTC();
  const isGameOver = state.isWin || state.isOver;
  const isEndless = mode === "endless";

  const revealAllHintsIfWin = (s: GameState): GameState => {
    if (!s.isWin) return s;
    return {
      ...s,
      clueState: {
        ...s.clueState,
        strongestHitUnlocked: true,
        totalDpsUnlocked: true,
        elementsUnlocked: true,
        strongestHitRevealed: true,
        totalDpsRevealed: true,
        elementsRevealed: true,
        constellationsRefinementsUnlocked: true,
        constellationsRefinementsRevealed: true,
      },
    };
  };

  // =========================================================
  // 4) FILTER CONTROLS
  // =========================================================

  const clickAll = () => {
    setFilterMode("all");
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
      if (!anyOn) setFilterMode("all");

      return next;
    });
  };

  // =========================================================
  // 5) CANONICAL “TODAY RUN” PERSISTENCE
  //    - one canonical writer + one manual flush
  // =========================================================

  const canPersistToday = useCallback(() => {
    if (isEndless) return false;
    if (!isTodaySelected) return false;
    if (isDateLoading) return false;
    if (!loadedPuzzleId) return false;
    if (String(state.puzzle.id) !== loadedPuzzleId) return false;
    return true;
  }, [isTodaySelected, isDateLoading, loadedPuzzleId, state.puzzle.id]);

  const writeTodayRun = useCallback(() => {
    if (!canPersistToday()) return;

    saveTodayRun({
      date: selectedDate,
      puzzleId: loadedPuzzleId!, // safe after canPersistToday()
      preview,
      guesses: state.guessesSoFar.map((g) => g.characters),
      isWin: state.isWin,
      isOver: state.isOver,
    });
  }, [
    canPersistToday,
    saveTodayRun,
    selectedDate,
    loadedPuzzleId,
    preview,
    state.guessesSoFar,
    state.isWin,
    state.isOver,
  ]);

  // Manual flush used when leaving today via arrows
  const persistTodayNow = useCallback(() => {
    writeTodayRun();
  }, [writeTodayRun]);

  // -----------------------------
  // DATE NAVIGATION HANDLER
  // -----------------------------
  const goToDate = (d: string) => {
    // If we are leaving today's puzzle, persist progress first
    persistTodayNow();

    // Block autosave effects during transition render
    setIsDateLoading(true);
    setPrevDate(null);
    setNextDate(null);

    setSelectedDate(d);
  };

  // Autosave whenever the run changes (today only, loaded puzzle only)
  useEffect(() => {
    writeTodayRun();
  }, [writeTodayRun]);

  // =========================================================
  // 6) DAILY SCORE RECORDING (on game end, today only)
  // =========================================================

  const recordScoreIfToday = useCallback(
    (finalState: GameState) => {
      if (isEndless) return;
      if (selectedDate !== todayUTC()) return;
      if (!finalState.isOver) return;

      const scores = loadScores();
      if (scores[selectedDate]) return; // already recorded for this date

      if (finalState.isWin) {
        const guessesTaken = finalState.guessesSoFar.length; // 1..5
        const clamped = Math.min(5, Math.max(1, guessesTaken)) as 1 | 2 | 3 | 4 | 5;
        scores[selectedDate] = clamped;
      } else {
        scores[selectedDate] = "FAIL";
      }

      saveScores(scores);
      setScoresSnapshot(scores);
      setShowStats(true);
    },
    [selectedDate, todayUTC, loadScores, saveScores],
  );

  // =========================================================
  // 7) LOAD PUZZLE (and restore today run if applicable)
  // =========================================================

  useEffect(() => {
    const load = async () => {
      // Clear UI state immediately when switching date / puzzle
      setLoadError(null);
      setPuzzleImageUrl(null);
      setPreview([]);
      setState(initialState);

      setPrevDate(null);
      setNextDate(null);

      setLoadedPuzzleId(null);
      setIsDateLoading(true);

      try {
        const tryLimit = isEndless ? 6 : 1;
        let row: any = null;

        for (let attempt = 0; attempt < tryLimit; attempt++) {
          const endpoint = isEndless
            ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_random_puzzle`
            : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_daily_puzzle?date=${selectedDate}`;

          const res = await fetch(endpoint, {
            method: "GET",
            headers: {
              apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
          });

          if (!res.ok) {
            const text = await res.text();
            setIsDateLoading(false);

            if (!isEndless && res.status === 404 && text.includes("No unused submissions left")) {
              setLoadError("No daily puzzles available right now. Please check back later.");
              return;
            }

            setLoadError(
              isEndless
                ? "Failed to load endless puzzle. Please try again."
                : "Failed to load daily puzzle. Please refresh and try again.",
            );
            return;
          }

          const candidate = await res.json();

          if (!isEndless) {
            row = candidate;
            break;
          }

          const idStr = String(candidate?.id ?? "");
          if (!idStr) {
            row = candidate;
            break;
          }

          if (!seenEndlessIdsRef.current.has(idStr)) {
            seenEndlessIdsRef.current.add(idStr);
            row = candidate;
            break;
          }

          // duplicate -> try again
        }

        if (!row) {
          setIsDateLoading(false);
          setLoadError("No new endless puzzles found right now. Try again later.");
          return;
        }

        // If server corrected date, update and let effect rerun (daily only)
        if (!isEndless && row.date && row.date !== selectedDate) {
          setSelectedDate(row.date);
          setIsDateLoading(false);
          return;
        }

        setIsDateLoading(false);

        if (!isEndless) {
          setPrevDate(row.prev_date ?? null);
          setNextDate(row.next_date ?? null);
        } else {
          setPrevDate(null);
          setNextDate(null);
        }

        setPuzzleImageUrl(row.image_url ?? null);

        const teamNames: string[] = row.team ?? [];
        const elements: string[] = row.elements ?? [];

        const baseState: GameState = {
          ...initialState,
          puzzle: {
            ...initialState.puzzle,
            id: String(row.id),
            strongestHit: Number(row.strongest_hit),
            totalDps: Number(row.total_dps),
            team: teamNames.map((name: string, i: number) => ({
              name,
              element: (elements[i] ?? "None") as Element,
              individualDps: 0,
              damagePercentage: 0,
            })),
            constellations: row.constellations ?? ["Hidden", "Hidden", "Hidden", "Hidden"],
            refinements: row.refinements ?? ["Hidden", "Hidden", "Hidden", "Hidden"],
            genshinUid: row.genshin_uid ?? null,
          },
        };

        setLoadedPuzzleId(String(row.id));

        // Restore only for TODAY + daily mode, only if puzzleId matches
        if (!isEndless) {
          const isToday = row.date === todayUTC();
          const run = loadTodayRun();

          if (isToday && run && run.date === row.date && run.puzzleId === String(row.id)) {
            let rebuilt = baseState;
            for (const g of run.guesses) rebuilt = makeGuess(rebuilt, { characters: g });

            setState(revealAllHintsIfWin(rebuilt));
            setPreview(run.preview ?? []);
            return;
          }

          // If we're on today but cookie refers to a different puzzle, discard it
          if (isToday && run && run.date === row.date && run.puzzleId !== String(row.id)) {
            clearTodayRun();
          }
        }

        setState(baseState);
      } catch (e) {
        setIsDateLoading(false);
        console.error("Failed to load puzzle:", e);
        setLoadError(
          isEndless
            ? "Failed to load endless puzzle. Please try again."
            : "Failed to load daily puzzle. Please refresh and try again.",
        );
      }
    };

    load();
  }, [selectedDate, endlessNonce, isEndless, todayUTC, loadTodayRun, clearTodayRun]);

  // =========================================================
  // 8) GAMEPLAY CONTROLS
  // =========================================================

  const nextEndlessPuzzle = () => {
    if (!isEndless) return;

    // clear current run UI immediately
    setLoadError(null);
    setPuzzleImageUrl(null);
    setPreview([]);
    setState(initialState);
    setLoadedPuzzleId(null);

    setEndlessNonce((n) => n + 1);
  };

  const removePreviewAt = (index: number) => {
    setPreview((prev) => prev.filter((_, i) => i !== index));
  };

  const addToPreview = (name: string) => {
    if (isGameOver) return;

    // toggle: if already selected, remove it
    if (preview.includes(name)) {
      setPreview((prev) => prev.filter((c) => c !== name));
      return;
    }

    if (preview.length >= 4) return;
    setPreview((prev) => [...prev, name]);
  };

  const removeLastPreview = useCallback(() => {
    setPreview((prev) => prev.slice(0, -1));
  }, []);

  const submitGuess = useCallback(() => {
    if (preview.length !== 4 || isGameOver) return;

    const guess: Guess = { characters: preview };
    const next = makeGuess(state, guess);

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
            constellationsRefinementsUnlocked: true,
            constellationsRefinementsRevealed: true,
          },
        }
      : next;

    setState(finalState);
    recordScoreIfToday(finalState);

    setPreview([]);
    // No manual today-run write needed; autosave will run
  }, [preview, isGameOver, state, recordScoreIfToday]);

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

  // =========================================================
  // 9) HINT REVEAL
  // =========================================================

  const revealHint = (
    hint: "strongestHit" | "totalDps" | "elements" | "constellationsRefinements",
  ) => {
    setState((prev) => ({
      ...prev,
      clueState: { ...prev.clueState, [`${hint}Revealed`]: true },
    }));
  };

  // =========================================================
  // 10) DERIVED RENDER VALUES
  // =========================================================

  const answerPreview = state.puzzle.team.map((c) => c.name);
  const displaySlots = isGameOver ? answerPreview : preview;

  // Characters that were ever GREEN (exact match)
  const correctCharacters = state.guessesSoFar.flatMap((g, i) =>
    g.characters.filter((_, j) => state.gridTiles[i][j] === "GREEN"),
  );

  // Characters that were ever totally wrong (GRAY)
  const wrongCharacters = state.guessesSoFar.flatMap((g, i) =>
    g.characters.filter((_, j) => state.gridTiles[i][j] === "GRAY"),
  );

  const getGridBg = (name: string) => {
    if (correctCharacters.includes(name)) return "#2f6f3a"; // green
    if (wrongCharacters.includes(name)) return "#1f1f1f"; // darker for wrong
    return "#2a2a2a"; // neutral
  };

  // =========================================================
  // 11) RENDER
  // =========================================================

  return (
    <div style={{ minHeight: "100vh" }}>
      <TopTabs
        onShowScores={() => setShowStats(true)}
        statusText={isGameOver ? (state.isWin ? "You solved the puzzle" : "Game Over") : undefined}
        statusColor={state.isWin ? "lightgreen" : "#ff6b6b"}
      />

      {/* ================= STATS MODAL ================= */}
      {showStats && (
        <button
          type="button"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            border: "none",
            padding: 0,
          }}
          onClick={() => setShowStats(false)}
          aria-label="Close stats"
        >
          <div
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            style={{
              width: 520,
              maxWidth: "92vw",
              border: "1px solid #444",
              borderRadius: 10,
              background: "#1f1f1f",
              padding: 14,
            }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.stopPropagation();
                setShowStats(false);
              }
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ fontWeight: 700 }}>Your Daily Results</div>
              <button
                onClick={() => setShowStats(false)}
                style={{
                  width: 32,
                  height: 32,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>

            {(() => {
              const bins = [1, 2, 3, 4, 5, "FAIL"] as const;
              const counts: Record<(typeof bins)[number], number> = {
                1: 0,
                2: 0,
                3: 0,
                4: 0,
                5: 0,
                FAIL: 0,
              };

              for (const v of Object.values(scoresSnapshot)) {
                if (v === "FAIL") counts.FAIL++;
                else counts[v]++;
              }

              const max = Math.max(1, ...Object.values(counts));

              return (
                <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                  {bins.map((b) => {
                    const n = counts[b];
                    const pct = (n / max) * 100;
                    const label = b === "FAIL" ? "Fail" : String(b);

                    return (
                      <div
                        key={label}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "40px 1fr 40px",
                          gap: 10,
                          alignItems: "center",
                        }}
                      >
                        <div style={{ opacity: 0.85 }}>{label}</div>
                        <div
                          style={{
                            height: 14,
                            border: "1px solid #444",
                            borderRadius: 6,
                            overflow: "hidden",
                            background: "#2a2a2a",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${pct}%`,
                              background: "#555",
                            }}
                          />
                        </div>
                        <div style={{ textAlign: "right", opacity: 0.85 }}>{n}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </button>
      )}

      <div style={{ padding: "1rem" }}>
        {/* ================= MAIN LAYOUT ================= */}
        <div
          style={{
            display: "flex",
            gap: "2rem",
            minHeight: "100vh",
            justifyContent: "flex-start",
            alignItems: "stretch",
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
                const char = displaySlots[i];

                return (
                  <button
                    type="button"
                    key={i}
                    disabled={!char || isGameOver}
                    onClick={() => removePreviewAt(i)}
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
                      padding: 0,
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
                          pointerEvents: "none",
                        }}
                      />
                    )}
                  </button>
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

              <button onClick={removeLastPreview} disabled={preview.length === 0 || isGameOver}>
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
                      src={`${import.meta.env.BASE_URL}icons/elements/${el}_Icon.png`}
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
          <div style={{ width: "480px", flexShrink: 0 }}>

            {/* ENDLESS */}
            {isEndless && (
              <div
                style={{
                  marginTop: "1rem",
                  marginBottom: "0.75rem",
                  padding: 10,
                  border: "1px solid #444",
                  borderRadius: 8,
                  background: "#1f1f1f",
                  opacity: 0.95,
                  fontSize: 13,
                  lineHeight: 1.4,
                }}
              >
                Endless mode may show puzzles that could appear in a future Daily. There aren&apos;t enough
                entries to fully separate the pools.
              </div>
            )}

            {isEndless && (
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.75rem" }}>
                <button type="button" onClick={nextEndlessPuzzle}>
                  Next Puzzle
                </button>
              </div>
            )}

            {/* DATE */}
            {!isEndless && (
              <div
                style={{
                  marginTop: "1rem",
                  marginBottom: "0.75rem",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                {!isDateLoading && prevDate ? (
                  <button
                    onClick={() => {
                      // Flush today progress before leaving today
                      goToDate(prevDate);
                    }}
                    aria-label="Previous day"
                    title="Previous day"
                    style={{
                      width: 28,
                      height: 32,
                      padding: 0,
                      border: "none",
                      background: "transparent",
                      color: "inherit",
                      opacity: 0.9,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      lineHeight: 1,
                      fontSize: 18,
                    }}
                  >
                    ◀
                  </button>
                ) : (
                  <div style={{ width: 28, height: 32 }} />
                )}

                <div
                  style={{
                    border: "1px solid #444",
                    borderRadius: 10,
                    padding: "6px 14px",
                    background: "#1f1f1f",
                    fontSize: 13,
                    opacity: 0.95,
                    userSelect: "none",
                    minWidth: 130,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {selectedDate}
                </div>

                {!isDateLoading && nextDate ? (
                  <button
                    onClick={() => {
                      goToDate(nextDate);
                    }}
                    aria-label="Next day"
                    title="Next day"
                    style={{
                      width: 28,
                      height: 32,
                      padding: 0,
                      border: "none",
                      background: "transparent",
                      color: "inherit",
                      opacity: 0.9,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      lineHeight: 1,
                      fontSize: 18,
                    }}
                  >
                    ▶
                  </button>
                ) : (
                  <div style={{ width: 28, height: 32 }} />
                )}
              </div>
            )}

            {/* IMAGE */}
            {loadError && (
              <div
                style={{
                  marginTop: "1rem",
                  marginBottom: "0.75rem",
                  padding: 10,
                  border: "1px solid #444",
                  borderRadius: 8,
                  background: "#1f1f1f",
                  opacity: 0.95,
                  fontSize: 13,
                }}
              >
                {loadError}
              </div>
            )}

            {puzzleImageUrl && (
              <div style={{ marginTop: "1rem", marginBottom: "0.75rem" }}>
                <img
                  src={puzzleImageUrl}
                  alt="Puzzle"
                  style={{
                    width: "100%",
                    border: "1px solid #444",
                    borderRadius: 8,
                    display: "block",
                  }}
                />
              </div>
            )}

            {/* UID */}
            {state.puzzle.genshinUid && (
              <div
                style={{
                  marginBottom: 12,
                  fontSize: 13,
                  opacity: 0.85,
                }}
              >
                UID:{" "}
                <a
                  href={`https://enka.network/u/${state.puzzle.genshinUid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "inherit",
                    textDecoration: "underline",
                    fontWeight: "normal",
                  }}
                >
                  {state.puzzle.genshinUid}
                </a>
              </div>
            )}

            {/* Hints */}
            <h3 style={{ marginTop: "1.5rem" }}>Hints</h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 2fr",
                columnGap: 12,
                rowGap: 12,
                alignItems: "center",
              }}
            >
              {/* Constellations + Refinements */}
              <button
                style={{ width: "100%" }}
                disabled={
                  !state.clueState.constellationsRefinementsUnlocked ||
                  state.clueState.constellationsRefinementsRevealed
                }
                onClick={() => revealHint("constellationsRefinements")}
              >
                Constellations & Refinements
              </button>

              <div style={{ minHeight: 22, opacity: 0.9 }}>
                {state.clueState.constellationsRefinementsRevealed
                  ? [0, 1, 2, 3]
                      .map((i) => {
                        const c = state.puzzle.constellations?.[i] ?? "Hidden";
                        const r = state.puzzle.refinements?.[i] ?? "Hidden";

                        const cShown = c !== "Hidden" ? c : "";
                        const rShown = r !== "Hidden" ? r : "";

                        if (!cShown && !rShown) return "Hidden";
                        return `${cShown}${rShown}`;
                      })
                      .join(" | ")
                  : ""}
              </div>

              {/* Strongest Hit */}
              <button
                style={{ width: "100%" }}
                disabled={
                  !state.clueState.strongestHitUnlocked || state.clueState.strongestHitRevealed
                }
                onClick={() => revealHint("strongestHit")}
              >
                Strongest Hit
              </button>

              <div style={{ minHeight: 22, opacity: 0.9 }}>
                {state.clueState.strongestHitRevealed ? state.puzzle.strongestHit : ""}
              </div>

              {/* Total DPS */}
              <button
                style={{ width: "100%" }}
                disabled={!state.clueState.totalDpsUnlocked || state.clueState.totalDpsRevealed}
                onClick={() => revealHint("totalDps")}
              >
                Total DPS
              </button>

              <div style={{ minHeight: 22, opacity: 0.9 }}>
                {state.clueState.totalDpsRevealed ? state.puzzle.totalDps : ""}
              </div>

              {/* Elements */}
              <button
                style={{ width: "100%" }}
                disabled={!state.clueState.elementsUnlocked || state.clueState.elementsRevealed}
                onClick={() => revealHint("elements")}
              >
                Elements
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
                        src={`${import.meta.env.BASE_URL}icons/elements/${c.element}_Icon.png`}
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
            <div
              style={{
                fontSize: 12,
                opacity: 0.8,
                marginBottom: 10,
                lineHeight: 1.5,
              }}
            >
              <span style={{ color: "#2f6f3a", fontWeight: 600 }}>Green</span> = Correct character{" "}
              {" | "}
              <span style={{ color: "#7a6a2b", fontWeight: 600 }}>Yellow</span> = Correct element{" "}
              {" | "}Order does not matter
            </div>

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
                    tile === "GREEN" ? "#2f6f3a" : tile === "YELLOW" ? "#7a6a2b" : "#555";

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
