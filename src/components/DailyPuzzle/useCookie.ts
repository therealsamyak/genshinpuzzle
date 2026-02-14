import { useState, useCallback } from "react";

/**
 * React hook for managing cookie-based storage with JSON serialization.
 * Handles client-side cookie operations with SSR safety.
 *
 * @template T - Type of the stored value
 * @param key - Cookie name
 * @param defaultValue - Default value if cookie doesn't exist or is invalid
 * @param maxAgeDays - Cookie expiration in days (default: 365)
 * @returns Tuple of [value, setValue, removeValue]
 */
export function useCookieStorage<T>(
  key: string,
  defaultValue: T,
  maxAgeDays: number = 365,
): readonly [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [value, setValueState] = useState<T>(() => {
    if (typeof document === "undefined") return defaultValue;

    try {
      const parts = document.cookie.split("; ").map((p) => p.split("="));
      const hit = parts.find(([k]) => k === key);
      if (!hit) return defaultValue;

      const raw = decodeURIComponent(hit[1] ?? "");
      if (!raw) return defaultValue;

      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  });

  const setValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValueState((prev) => {
        const resolved =
          typeof newValue === "function" ? (newValue as (p: T) => T)(prev) : newValue;
        const maxAge = maxAgeDays * 24 * 60 * 60;
        document.cookie = `${key}=${encodeURIComponent(
          JSON.stringify(resolved),
        )}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
        return resolved;
      });
    },
    [key, maxAgeDays],
  );

  const removeValue = useCallback(() => {
    document.cookie = `${key}=; Max-Age=0; Path=/; SameSite=Lax`;
    setValueState(defaultValue);
  }, [key, defaultValue]);

  return [value, setValue, removeValue] as const;
}
