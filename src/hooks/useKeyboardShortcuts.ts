import { useEffect } from "react";

type KeyboardHandlers = {
  onBackspace?: () => void;
  onEnter?: () => void;
  enabled?: boolean;
};

export function useKeyboardShortcuts(handlers: KeyboardHandlers) {
  const { onBackspace, onEnter, enabled = true } = handlers;

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea/select
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      if (e.key === "Backspace" && onBackspace) {
        e.preventDefault();
        onBackspace();
      }

      if (e.key === "Enter" && onEnter) {
        e.preventDefault();
        onEnter();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onBackspace, onEnter, enabled]);
}
