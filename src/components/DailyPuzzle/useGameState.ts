import { useState, useCallback, useEffect } from "react";
import type { GameState, Guess, Element } from "../../game/types";
import { initialState } from "../../game/initialState";
import { makeGuess } from "../../game/gameController";
import { usePuzzle } from "./usePuzzle";

export type DailyScore = 1 | 2 | 3 | 4 | 5 | "FAIL";

export type TodayRunSnapshot = {
  date: string; // YYYY-MM-DD (UTC)
  puzzleId: string; // submission id (string)
  preview: string[];
  guesses: string[][]; // guessesSoFar as list of 4-char arrays
  isWin: boolean;
  isOver: boolean;
};

interface UseGameStateProps {
  mode?: "daily" | "endless";
  scoresSnapshot: Record<string, DailyScore>;
  todayRun: TodayRunSnapshot | null;
  setTodayRun: (run: TodayRunSnapshot | null) => void;
  clearTodayRun: () => void;
}

interface UseGameStateReturn {
  // State
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  preview: string[];
  setPreview: React.Dispatch<React.SetStateAction<string[]>>;
  loadError: string | null;
  setLoadError: (error: string | null) => void;
  selectedDate: string;
  isDateLoading: boolean;
  setIsDateLoading: (loading: boolean) => void;
  endlessNonce: number;
  setEndlessNonce: React.Dispatch<React.SetStateAction<number>>;

  // Setters for puzzle data
  puzzleImageUrl: string | null;
  loadedPuzzleId: string | null;
  prevDate: string | null;
  nextDate: string | null;

  // Game functions
  revealAllHintsIfWin: (s: GameState) => GameState;
  nextEndlessPuzzle: () => void;
  removePreviewAt: (index: number) => void;
  addToPreview: (name: string) => void;
  removeLastPreview: () => void;
  submitGuess: () => void;
  revealHint: (
    hint: "strongestHit" | "totalDps" | "elements" | "constellationsRefinements",
  ) => void;
  goToDate: (d: string) => void;

  // Persistence functions
  canPersistToday: () => boolean;
  writeTodayRun: (overridePreview?: string[], overrideState?: GameState) => void;
  persistTodayNow: () => void;
  recordScoreIfToday: (finalState: GameState) => void;

  // Derived values
  isTodaySelected: boolean;
  isGameOver: boolean;
  isEndless: boolean;
  correctCharacters: string[];
  wrongCharacters: string[];
  getGridBg: (name: string) => string;
  canShare: boolean;
  answerPreview: string[];
  displaySlots: string[];
  buildShareText: (finalState: GameState) => string;
  tileToEmoji: (t: string) => string;
}

export function useGameState({
  mode = "daily",
  scoresSnapshot,
  todayRun,
  setTodayRun,
  clearTodayRun,
}: UseGameStateProps): UseGameStateReturn {
  const todayUTC = useCallback(() => new Date().toISOString().slice(0, 10), []);

  // =========================================================
  // STATE
  // =========================================================

  const [state, setState] = useState<GameState>(initialState);
  const [preview, setPreview] = useState<string[]>([]);

  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [isDateLoading, setIsDateLoading] = useState(false);

  const [endlessNonce, setEndlessNonce] = useState(0);

  const isTodaySelected = selectedDate === todayUTC();
  const isGameOver = state.isWin || state.isOver;
  const isEndless = mode === "endless";

  const {
    data: puzzleData,
    isLoading: isPuzzleLoading,
    error: puzzleError,
  } = usePuzzle(isEndless ? "endless" : "daily", selectedDate, endlessNonce);

  setIsDateLoading(isPuzzleLoading);
  setLoadError(puzzleError);

  const puzzleImageUrl = puzzleData?.image_url ?? null;
  const loadedPuzzleId = puzzleData ? String(puzzleData.id) : null;
  const prevDate = isEndless ? null : (puzzleData?.prev_date ?? null);
  const nextDate = isEndless ? null : (puzzleData?.next_date ?? null);

  // =========================================================
  // HELPER FUNCTIONS
  // =========================================================

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
  // PERSISTENCE FUNCTIONS
  // =========================================================

  const canPersistToday = useCallback(() => {
    if (isEndless) return false;
    if (!isTodaySelected) return false;
    if (isDateLoading) return false;
    if (!loadedPuzzleId) return false;
    if (String(state.puzzle.id) !== loadedPuzzleId) return false;
    return true;
  }, [isEndless, isTodaySelected, isDateLoading, loadedPuzzleId, state.puzzle.id]);

  const writeTodayRun = useCallback(
    (overridePreview?: string[], overrideState?: GameState) => {
      if (!canPersistToday()) return;

      const actualPreview = overridePreview ?? preview;
      const actualState = overrideState ?? state;

      setTodayRun({
        date: selectedDate,
        puzzleId: loadedPuzzleId!, // safe after canPersistToday()
        preview: actualPreview,
        guesses: actualState.guessesSoFar.map((g) => g.characters),
        isWin: actualState.isWin,
        isOver: actualState.isOver,
      });
    },
    [canPersistToday, setTodayRun, selectedDate, loadedPuzzleId, preview, state],
  );

  // Manual flush used when leaving today via arrows
  const persistTodayNow = useCallback(() => {
    writeTodayRun();
  }, [writeTodayRun]);

  // -----------------------------
  // DATE NAVIGATION HANDLER
  // -----------------------------
  const goToDate = (d: string) => {
    persistTodayNow();
    setIsDateLoading(true);
    setSelectedDate(d);
  };

  // =========================================================
  // SCORE RECORDING
  // =========================================================

  const recordScoreIfToday = useCallback(
    (finalState: GameState) => {
      if (isEndless) return;
      if (selectedDate !== todayUTC()) return;
      if (!finalState.isOver) return;

      const scores = scoresSnapshot;
      if (scores[selectedDate]) return; // already recorded for this date

      if (finalState.isWin) {
        const guessesTaken = finalState.guessesSoFar.length; // 1..5
        const clamped = Math.min(5, Math.max(1, guessesTaken)) as 1 | 2 | 3 | 4 | 5;
        scores[selectedDate] = clamped;
      } else {
        scores[selectedDate] = "FAIL";
      }
    },
    [isEndless, selectedDate, todayUTC, scoresSnapshot],
  );

  // =========================================================
  // LOAD PUZZLE (and restore today run if applicable)
  // =========================================================

  useEffect(() => {
    if (!puzzleData) {
      setPreview([]);
      setState(initialState);
      return;
    }

    if (!isEndless && puzzleData.date && puzzleData.date !== selectedDate) {
      setSelectedDate(puzzleData.date);
      return;
    }

    const teamNames: string[] = puzzleData.team ?? [];
    const elements: string[] = puzzleData.elements ?? [];

    const baseState: GameState = {
      ...initialState,
      puzzle: {
        ...initialState.puzzle,
        id: String(puzzleData.id),
        strongestHit: Number(puzzleData.strongest_hit),
        totalDps: Number(puzzleData.total_dps),
        team: teamNames.map((name: string, i: number) => ({
          name,
          element: (elements[i] ?? "None") as Element,
          individualDps: 0,
          damagePercentage: 0,
        })),
        constellations: (puzzleData.constellations ?? [
          "Hidden",
          "Hidden",
          "Hidden",
          "Hidden",
        ]) as GameState["puzzle"]["constellations"],
        refinements: (puzzleData.refinements ?? [
          "Hidden",
          "Hidden",
          "Hidden",
          "Hidden",
        ]) as GameState["puzzle"]["refinements"],
        genshinUid: puzzleData.genshin_uid ?? null,
      },
    };

    if (!isEndless) {
      const isToday = puzzleData.date === todayUTC();
      const run = todayRun;

      if (
        isToday &&
        run &&
        run.date === puzzleData.date &&
        run.puzzleId === String(puzzleData.id)
      ) {
        let rebuilt = baseState;
        for (const g of run.guesses) rebuilt = makeGuess(rebuilt, { characters: g });

        setState(revealAllHintsIfWin(rebuilt));
        setPreview(run.preview ?? []);
        return;
      }

      if (
        isToday &&
        run &&
        run.date === puzzleData.date &&
        run.puzzleId !== String(puzzleData.id)
      ) {
        clearTodayRun();
      }
    }

    setState(baseState);
    setPreview([]);
  }, [puzzleData, isEndless, selectedDate, todayUTC, todayRun, clearTodayRun]);

  // =========================================================
  // GAMEPLAY CONTROLS
  // =========================================================

  const nextEndlessPuzzle = () => {
    if (!isEndless) return;
    setLoadError(null);
    setPreview([]);
    setState(initialState);
    setEndlessNonce((n) => n + 1);
  };

  const removePreviewAt = (index: number) => {
    const newPreview = preview.filter((_, i) => i !== index);
    setPreview(newPreview);
    writeTodayRun(newPreview);
  };

  const addToPreview = (name: string) => {
    if (isGameOver) return;

    // toggle: if already selected, remove it
    if (preview.includes(name)) {
      const newPreview = preview.filter((c) => c !== name);
      setPreview(newPreview);
      writeTodayRun(newPreview);
      return;
    }

    if (preview.length >= 4) return;
    const newPreview = [...preview, name];
    setPreview(newPreview);
    writeTodayRun(newPreview);
  };

  const removeLastPreview = useCallback(() => {
    const newPreview = preview.slice(0, -1);
    setPreview(newPreview);
    writeTodayRun(newPreview);
  }, [preview, writeTodayRun]);

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
    writeTodayRun([], finalState);
  }, [preview, isGameOver, state, recordScoreIfToday, writeTodayRun]);

  // =========================================================
  // HINT REVEAL
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
  // DERIVED RENDER VALUES
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

  const canShare = mode === "daily" && selectedDate === todayUTC() && isGameOver;

  const tileToEmoji = (t: string) => (t === "GREEN" ? "🟩" : t === "YELLOW" ? "🟨" : "⬛");

  const buildShareText = (finalState: GameState) => {
    const isFail = !finalState.isWin && finalState.isOver;
    const scoreText = isFail ? "FAIL" : `${finalState.guessesSoFar.length}/5`;

    const header =
      mode === "endless" ? `Dummle Endless, ${scoreText}` : `Dummle ${selectedDate}, ${scoreText}`;

    const lines = finalState.gridTiles
      .slice(0, finalState.guessesSoFar.length)
      .map((row) => row.map(tileToEmoji).join(""));

    return [header, ...lines].join("\n");
  };

  return {
    state,
    setState,
    preview,
    setPreview,
    loadError,
    setLoadError,
    selectedDate,
    isDateLoading,
    setIsDateLoading,
    endlessNonce,
    setEndlessNonce,

    puzzleImageUrl,
    loadedPuzzleId,
    prevDate,
    nextDate,

    revealAllHintsIfWin,
    nextEndlessPuzzle,
    removePreviewAt,
    addToPreview,
    removeLastPreview,
    submitGuess,
    revealHint,
    goToDate,

    canPersistToday,
    writeTodayRun,
    persistTodayNow,
    recordScoreIfToday,

    isTodaySelected,
    isGameOver,
    isEndless,
    correctCharacters,
    wrongCharacters,
    getGridBg,
    canShare,
    answerPreview,
    displaySlots,
    buildShareText,
    tileToEmoji,
  };
}
