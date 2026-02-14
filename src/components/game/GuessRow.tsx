import type { TileState } from "../../game/types";
import { CHARACTER_DATA } from "../../game/characters";

interface GuessRowProps {
  guess: string[];
  tileStates: TileState[];
}

function getTileColor(state: TileState): string {
  switch (state) {
    case "GREEN":
      return "bg-[#2f6f3a]";
    case "YELLOW":
      return "bg-[#7a6a2b]";
    case "GRAY":
      return "bg-[#555]";
  }
}

export function GuessRow({ guess, tileStates }: GuessRowProps) {
  return (
    <div className="flex gap-2 mb-2 flex-nowrap">
      {guess.map((char, j) => (
        <div
          key={j}
          title={char}
          className={`w-16 h-16 rounded-md border border-[#444] flex items-center justify-center shrink-0 ${getTileColor(tileStates[j])}`}
        >
          <img
            src={CHARACTER_DATA[char].iconUrl}
            alt={char}
            className="w-14 h-14 object-contain block mx-auto pointer-events-none"
          />
        </div>
      ))}
    </div>
  );
}
