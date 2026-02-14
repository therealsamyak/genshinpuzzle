interface GameResultProps {
  isWin: boolean;
  isOver: boolean;
  canShare: boolean;
  onShowStats: () => void;
  onShare: () => void;
}

export function GameResult({ isWin, isOver, canShare, onShowStats, onShare }: GameResultProps) {
  if (!isOver) return null;

  return (
    <div className={`mt-4 text-xl font-bold ${isWin ? "text-green-400" : "text-[#ff6b6b]"}`}>
      {isWin ? "You solved the puzzle" : "Game Over"}
      {canShare && (
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onShowStats}>
            Scores
          </button>
          <button type="button" onClick={onShare}>
            Share
          </button>
        </div>
      )}
    </div>
  );
}
