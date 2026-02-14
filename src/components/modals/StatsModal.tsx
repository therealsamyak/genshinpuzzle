import { Modal } from "../ui/Modal";

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  scores: Record<string, 1 | 2 | 3 | 4 | 5 | "FAIL">;
}

export function StatsModal({ isOpen, onClose, scores }: StatsModalProps) {
  const bins = [1, 2, 3, 4, 5, "FAIL"] as const;
  const counts: Record<(typeof bins)[number], number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    FAIL: 0,
  };

  for (const v of Object.values(scores)) {
    if (v === "FAIL") counts.FAIL++;
    else counts[v]++;
  }

  const max = Math.max(1, ...Object.values(counts));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Your Daily Results">
      <div className="mt-3 grid gap-2">
        {bins.map((b) => {
          const n = counts[b];
          const pct = (n / max) * 100;
          const label = b === "FAIL" ? "Fail" : String(b);

          return (
            <div key={label} className="grid grid-cols-[40px_1fr_40px] gap-2.5 items-center">
              <div className="opacity-85">{label}</div>
              <div className="h-3.5 border border-[#444] rounded-md overflow-hidden bg-[#2a2a2a]">
                <div className="h-full bg-[#555]" style={{ width: `${pct}%` }} />
              </div>
              <div className="opacity-85 text-right">{n}</div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
