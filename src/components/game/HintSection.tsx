import type { ClueState, Puzzle } from "../../game/types";

interface HintSectionProps {
  clueState: ClueState;
  puzzle: Puzzle;
  onRevealHint: (
    hint: "strongestHit" | "totalDps" | "elements" | "constellationsRefinements",
  ) => void;
}

export function HintSection({ clueState, puzzle, onRevealHint }: HintSectionProps) {
  return (
    <>
      <h3 className="mt-6">Hints</h3>
      <div className="grid grid-cols-[1fr_2fr] gap-x-3 gap-y-3 items-center">
        <button
          className="w-full"
          disabled={
            !clueState.constellationsRefinementsUnlocked ||
            clueState.constellationsRefinementsRevealed
          }
          onClick={() => onRevealHint("constellationsRefinements")}
        >
          Constellations & Refinements
        </button>

        <div className="min-h-[22px] opacity-90">
          {clueState.constellationsRefinementsRevealed
            ? [0, 1, 2, 3]
                .map((i) => {
                  const c = puzzle.constellations?.[i] ?? "Hidden";
                  const r = puzzle.refinements?.[i] ?? "Hidden";

                  const cShown = c !== "Hidden" ? c : "";
                  const rShown = r !== "Hidden" ? r : "";

                  if (!cShown && !rShown) return "Hidden";
                  return `${cShown}${rShown}`;
                })
                .join(" | ")
            : ""}
        </div>

        <button
          className="w-full"
          disabled={!clueState.strongestHitUnlocked || clueState.strongestHitRevealed}
          onClick={() => onRevealHint("strongestHit")}
        >
          Strongest Hit
        </button>

        <div className="min-h-[22px] opacity-90">
          {clueState.strongestHitRevealed ? puzzle.strongestHit : ""}
        </div>

        <button
          className="w-full"
          disabled={!clueState.totalDpsUnlocked || clueState.totalDpsRevealed}
          onClick={() => onRevealHint("totalDps")}
        >
          Total DPS
        </button>

        <div className="min-h-[22px] opacity-90">
          {clueState.totalDpsRevealed ? puzzle.totalDps : ""}
        </div>

        <button
          className="w-full"
          disabled={!clueState.elementsUnlocked || clueState.elementsRevealed}
          onClick={() => onRevealHint("elements")}
        >
          Elements
        </button>

        <div className="min-h-[22px] opacity-90 flex gap-1.5 items-center flex-wrap">
          {clueState.elementsRevealed
            ? puzzle.team.map((c, idx) => (
                <img
                  key={`${c.element}-${idx}`}
                  src={`${import.meta.env.BASE_URL}icons/elements/${c.element}_Icon.png`}
                  alt={c.element}
                  title={c.element}
                  className="w-[22px] h-[22px] object-contain block"
                />
              ))
            : ""}
        </div>
      </div>
    </>
  );
}
