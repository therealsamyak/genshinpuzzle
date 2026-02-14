import { useState, useEffect, useCallback } from "react";
import TopTabs from "./TopTabs";
import { useCookieStorage } from "./DailyPuzzle/useCookie";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { useFilterState } from "./DailyPuzzle/useFilterState";
import { useGameState, type DailyScore, type TodayRunSnapshot } from "./DailyPuzzle/useGameState";
import { CharacterGrid } from "./game/CharacterGrid";
import { CharacterSlot } from "./game/CharacterSlot";
import { ElementFilter } from "./game/ElementFilter";
import { GuessRow } from "./game/GuessRow";
import { HintSection } from "./game/HintSection";
import { GameResult } from "./game/GameResult";
import { StatsModal } from "./modals/StatsModal";
import { ShareModal } from "./modals/ShareModal";

type Props = { mode?: "daily" | "endless" };

const STATS_COOKIE = "gdg_daily_scores_v1";
const TODAY_RUN_COOKIE = "gdg_today_run_v1";

const todayUTC = () => new Date().toISOString().slice(0, 10);

export default function DailyPuzzle({ mode = "daily" }: Props) {
  const [scoresSnapshot, setScoresSnapshot] = useCookieStorage<Record<string, DailyScore>>(
    STATS_COOKIE,
    {},
  );
  const [todayRun, setTodayRun, clearTodayRun] = useCookieStorage<TodayRunSnapshot | null>(
    TODAY_RUN_COOKIE,
    null,
    7,
  );

  const { filterMode, activeElements, filteredCharacters, clickAll, toggleElement } =
    useFilterState();

  const {
    state,
    preview,
    loadError,
    selectedDate,
    isDateLoading,
    isGameOver,
    isEndless,
    puzzleImageUrl,
    prevDate,
    nextDate,
    nextEndlessPuzzle,
    removePreviewAt,
    addToPreview,
    removeLastPreview,
    submitGuess,
    revealHint,
    goToDate,
    getGridBg,
    canShare,
    displaySlots,
    buildShareText,
  } = useGameState({
    mode,
    scoresSnapshot,
    todayRun,
    setTodayRun,
    clearTodayRun,
  });

  const [showStats, setShowStats] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    if (!state.isOver || isEndless || selectedDate !== todayUTC()) return;
    if (scoresSnapshot[selectedDate]) return;

    const newScores = { ...scoresSnapshot };
    if (state.isWin) {
      const guessesTaken = Math.min(5, Math.max(1, state.guessesSoFar.length));
      newScores[selectedDate] = guessesTaken as 1 | 2 | 3 | 4 | 5;
    } else {
      newScores[selectedDate] = "FAIL";
    }
    setScoresSnapshot(newScores);
    setShowStats(true);
  }, [
    state.isOver,
    state.isWin,
    state.guessesSoFar.length,
    isEndless,
    selectedDate,
    scoresSnapshot,
    setScoresSnapshot,
  ]);

  const openShare = useCallback(() => {
    if (!canShare) return;
    setShareCopied(false);
    setShowShare(true);
  }, [canShare]);

  const copyShareText = useCallback(async () => {
    const text = buildShareText(state);
    await navigator.clipboard.writeText(text);
    setShareCopied(true);
  }, [buildShareText, state]);

  useKeyboardShortcuts({
    onBackspace: removeLastPreview,
    onEnter: submitGuess,
    enabled: !isGameOver,
  });

  return (
    <div className="min-h-screen">
      <TopTabs onShowScores={() => setShowStats(true)} />

      <StatsModal isOpen={showStats} onClose={() => setShowStats(false)} scores={scoresSnapshot} />

      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        shareText={buildShareText(state)}
        onCopy={copyShareText}
        copied={shareCopied}
      />

      <div className="p-4">
        <div className="flex gap-8 min-h-screen justify-start items-stretch">
          {/* LEFT SIDE */}
          <div className="flex-1 min-w-[760px] max-w-[760px]">
            {/* Preview Row */}
            <div className="flex gap-2 justify-center mb-4">
              {[0, 1, 2, 3].map((i) => (
                <CharacterSlot
                  key={i}
                  character={displaySlots[i]}
                  size="md"
                  bgColor="neutral"
                  onClick={() => displaySlots[i] && removePreviewAt(i)}
                  disabled={!displaySlots[i] || isGameOver}
                />
              ))}
            </div>

            {/* Controls */}
            <div className="text-center mb-4">
              <button
                onClick={submitGuess}
                disabled={preview.length !== 4 || isGameOver}
                className="mr-2"
              >
                Submit Guess
              </button>
              <button onClick={removeLastPreview} disabled={preview.length === 0 || isGameOver}>
                Backspace
              </button>
            </div>

            {/* Element Filter */}
            <ElementFilter
              filterMode={filterMode}
              activeElements={activeElements}
              onFilterChange={clickAll}
              onToggleElement={toggleElement}
            />

            {/* Character Grid */}
            <CharacterGrid
              characters={filteredCharacters}
              onSelect={addToPreview}
              disabled={isGameOver}
              getCharacterBg={getGridBg}
            />
          </div>

          {/* RIGHT SIDE */}
          <div className="w-[480px] shrink-0">
            {/* Endless mode notice */}
            {isEndless && (
              <div className="mt-4 mb-3 p-2.5 border border-[#444] rounded-lg bg-[#1f1f1f] opacity-95 text-[13px] leading-snug">
                Endless mode may show puzzles that could appear in a future Daily. There aren&apos;t
                enough entries to fully separate the pools.
              </div>
            )}

            {isEndless && (
              <div className="flex justify-center mb-3">
                <button type="button" onClick={nextEndlessPuzzle}>
                  Next Puzzle
                </button>
              </div>
            )}

            {/* Date navigation */}
            {!isEndless && (
              <div className="mt-4 mb-3 flex justify-center items-center gap-3">
                {!isDateLoading && prevDate ? (
                  <button
                    onClick={() => goToDate(prevDate)}
                    aria-label="Previous day"
                    title="Previous day"
                    className="w-7 h-8 p-0 border-none bg-transparent text-inherit opacity-90 cursor-pointer inline-flex items-center justify-center leading-none text-lg"
                  >
                    ◀
                  </button>
                ) : (
                  <div className="w-7 h-8" />
                )}

                <div className="border border-[#444] rounded-[10px] px-3.5 py-1.5 bg-[#1f1f1f] text-[13px] opacity-95 select-none min-w-[130px] h-8 flex items-center justify-center">
                  {selectedDate}
                </div>

                {!isDateLoading && nextDate ? (
                  <button
                    onClick={() => goToDate(nextDate)}
                    aria-label="Next day"
                    title="Next day"
                    className="w-7 h-8 p-0 border-none bg-transparent text-inherit opacity-90 cursor-pointer inline-flex items-center justify-center leading-none text-lg"
                  >
                    ▶
                  </button>
                ) : (
                  <div className="w-7 h-8" />
                )}
              </div>
            )}

            {/* Load error */}
            {loadError && (
              <div className="mt-4 mb-3 p-2.5 border border-[#444] rounded-lg bg-[#1f1f1f] opacity-95 text-[13px]">
                {loadError}
              </div>
            )}

            {/* Puzzle image */}
            {puzzleImageUrl && (
              <img
                src={puzzleImageUrl}
                alt="Puzzle"
                className="w-full border border-[#444] rounded-lg block mt-4 mb-3"
              />
            )}

            {/* UID link */}
            {state.puzzle.genshinUid && (
              <div className="mb-3 text-[13px] opacity-85">
                UID:{" "}
                <a
                  href={`https://enka.network/u/${state.puzzle.genshinUid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-inherit underline font-normal"
                >
                  {state.puzzle.genshinUid}
                </a>
              </div>
            )}

            {/* Hints */}
            <HintSection
              clueState={state.clueState}
              puzzle={state.puzzle}
              onRevealHint={revealHint}
            />

            {/* Guesses */}
            <h3 className="mt-6">Guesses</h3>
            <div className="text-xs opacity-80 mb-2.5 leading-normal">
              <span className="text-[#2f6f3a] font-semibold">Green</span> = Correct character{" "}
              {" | "}
              <span className="text-[#7a6a2b] font-semibold">Yellow</span> = Correct element {" | "}
              Order does not matter
            </div>

            {state.guessesSoFar.map((guess, i) => (
              <GuessRow key={i} guess={guess.characters} tileStates={state.gridTiles[i]} />
            ))}

            {/* Game result */}
            <GameResult
              isWin={state.isWin}
              isOver={isGameOver}
              canShare={canShare}
              onShowStats={() => setShowStats(true)}
              onShare={openShare}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
