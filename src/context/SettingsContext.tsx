import { createContext, useContext, useEffect, useState } from "react";

type CharacterOrder = "name" | "release";

type Settings = {
  autoRevealHints: boolean;
  characterOrder: CharacterOrder;
  setAutoRevealHints: (v: boolean) => void;
  setCharacterOrder: (v: CharacterOrder) => void;
};

const SettingsContext = createContext<Settings | null>(null);

const COOKIE = "gdg_settings_v1";

function getCookie(): Partial<Settings> {
  const match = document.cookie
    .split("; ")
    .find((r) => r.startsWith(`${COOKIE}=`));

  if (!match) return {};

  try {
    return JSON.parse(decodeURIComponent(match.split("=")[1]));
  } catch {
    return {};
  }
}

function setCookie(data: Partial<Settings>) {
  document.cookie = `${COOKIE}=${encodeURIComponent(
    JSON.stringify(data),
  )}; Max-Age=${60 * 60 * 24 * 365}; Path=/; SameSite=Lax`;
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const saved = getCookie();

  const [autoRevealHints, setAutoRevealHints] = useState<boolean>(
    saved.autoRevealHints ?? false,
  );

  const [characterOrder, setCharacterOrder] = useState<CharacterOrder>(
    saved.characterOrder ?? "name",
  );

  useEffect(() => {
    setCookie({ autoRevealHints, characterOrder });
  }, [autoRevealHints, characterOrder]);

  return (
    <SettingsContext.Provider
      value={{
        autoRevealHints,
        characterOrder,
        setAutoRevealHints,
        setCharacterOrder,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}
