import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";

export type PuzzleData = {
  id: string;
  image_url: string | null;
  date?: string;
  prev_date?: string | null;
  next_date?: string | null;
  team: string[];
  elements: string[];
  strongest_hit: number;
  total_dps: number;
  constellations: string[];
  refinements: string[];
  genshin_uid: string | null;
};

export type UsePuzzleReturn = {
  data: PuzzleData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
};

export function usePuzzle(
  mode: "daily" | "endless",
  date: string,
  endlessNonce?: number,
): UsePuzzleReturn {
  const seenEndlessIds = useRef<Set<string>>(new Set());

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["puzzle", mode, mode === "endless" ? endlessNonce : date],
    queryFn: async (): Promise<PuzzleData> => {
      const tryLimit = mode === "endless" ? 6 : 1;
      let row: PuzzleData | null = null;

      for (let attempt = 0; attempt < tryLimit; attempt++) {
        const endpoint =
          mode === "endless"
            ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_random_puzzle`
            : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_daily_puzzle?date=${date}`;

        const res = await fetch(endpoint, {
          method: "GET",
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        });

        if (!res.ok) {
          const text = await res.text();

          if (
            mode === "daily" &&
            res.status === 404 &&
            text.includes("No unused submissions left")
          ) {
            throw new Error("No daily puzzles available right now. Please check back later.");
          }

          throw new Error(
            mode === "endless"
              ? "Failed to load endless puzzle. Please try again."
              : "Failed to load daily puzzle. Please refresh and try again.",
          );
        }

        const candidate: PuzzleData = await res.json();

        if (mode === "daily") {
          row = candidate;
          break;
        }

        // Endless mode: dedupe
        const idStr = String(candidate?.id ?? "");
        if (!idStr) {
          row = candidate;
          break;
        }

        if (!seenEndlessIds.current.has(idStr)) {
          seenEndlessIds.current.add(idStr);
          row = candidate;
          break;
        }
        // duplicate -> try again
      }

      if (!row) {
        throw new Error("No new endless puzzles found right now. Try again later.");
      }

      return row;
    },
    enabled: mode === "daily" ? !!date : true,
    retry: false,
  });

  return {
    data: data ?? null,
    isLoading,
    error: error?.message ?? null,
    refetch: () => {
      refetch();
    },
  };
}
