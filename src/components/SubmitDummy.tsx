import { useState, useEffect } from "react";
import TopTabs from "./TopTabs";
import type { Element } from "../game/types";
import { CHARACTER_DATA } from "../game/characters";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { ElementFilter } from "./game/ElementFilter";
import { CharacterGrid } from "./game/CharacterGrid";
import { CharacterSlot } from "./game/CharacterSlot";

type Constellation = "Hidden" | "C0" | "C1" | "C2" | "C3" | "C4" | "C5" | "C6";
type Refinement = "Hidden" | "R0" | "R1" | "R2" | "R3" | "R4" | "R5";
const ELEMENTS: Element[] = ["Pyro", "Hydro", "Electro", "Cryo", "Dendro", "Anemo", "Geo"];
const CONSTELLATION_OPTIONS: Constellation[] = ["Hidden", "C0", "C1", "C2", "C3", "C4", "C5", "C6"];
const REFINEMENT_OPTIONS: Refinement[] = ["Hidden", "R0", "R1", "R2", "R3", "R4", "R5"];
const DEFAULT_C: Constellation = "Hidden";
const DEFAULT_R: Refinement = "Hidden";
const INITIAL_ELEMENTS = ELEMENTS.reduce(
  (acc, el) => ({ ...acc, [el]: false }),
  {} as Record<Element, boolean>,
);

export default function SubmitDummy() {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [preview, setPreview] = useState<(string | null)[]>([null, null, null, null]);
  const [constellations, setConstellations] = useState<Constellation[]>([
    DEFAULT_C,
    DEFAULT_C,
    DEFAULT_C,
    DEFAULT_C,
  ]);
  const [refinements, setRefinements] = useState<Refinement[]>([
    DEFAULT_R,
    DEFAULT_R,
    DEFAULT_R,
    DEFAULT_R,
  ]);

  const addToPreview = (name: string) => {
    const idx = preview.findIndex((c) => c === name);
    if (idx !== -1) {
      removePreviewAt(idx);
      return;
    }
    const empty = preview.findIndex((c) => c == null);
    if (empty === -1) return;
    setPreview((p) => {
      const n = [...p];
      n[empty] = name;
      return n;
    });
  };
  const removePreviewAt = (index: number) => {
    setPreview((p) => {
      const n = [...p];
      n[index] = null;
      return n;
    });
    setConstellations((p) => {
      const n = [...p];
      n[index] = DEFAULT_C;
      return n;
    });
    setRefinements((p) => {
      const n = [...p];
      n[index] = DEFAULT_R;
      return n;
    });
  };
  const removeLastPreview = () => {
    const last = [...preview]
      .map((c, i) => (c ? i : -1))
      .filter((i) => i !== -1)
      .pop();
    if (last != null) removePreviewAt(last);
  };

  useKeyboardShortcuts({ onBackspace: removeLastPreview });

  const onPickFile = (f: File | null) => {
    setFile(null);
    setFileError(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
    if (!f) return;
    if (f.type !== "image/png") {
      setFileError("Only PNG files are allowed.");
      return;
    }
    if (f.size > 1_048_576) {
      setFileError("File must be 1MB or smaller.");
      return;
    }
    setFile(f);
    setImagePreviewUrl(URL.createObjectURL(f));
  };

  useEffect(
    () => () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    },
    [imagePreviewUrl],
  );

  const submitDummy = async () => {
    if (!isValid || !file) return;
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmissionId(null);
    try {
      const form = new FormData();
      form.append("image", file);
      [0, 1, 2, 3].forEach((i) => {
        form.append(`team${i}`, preview[i] ?? "");
        form.append(`c${i}`, constellations[i] ?? DEFAULT_C);
        form.append(`r${i}`, refinements[i] ?? DEFAULT_R);
      });
      form.append(
        "elements",
        JSON.stringify(preview.map((n) => (n ? CHARACTER_DATA[n].element : "None"))),
      );
      form.append("strongestHit", String(Number(strongestHit)));
      form.append("totalDps", String(Number(totalDps)));
      if (genshinUid.trim()) form.append("genshinUid", genshinUid.trim());
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create_dummy_submission`,
        {
          method: "POST",
          headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
          body: form,
        },
      );
      if (!res.ok) throw new Error((await res.text()) || `Request failed (${res.status})`);
      setSubmissionId(((await res.json()) as { submissionId: string }).submissionId);
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : "Submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [filterMode, setFilterMode] = useState<"all" | "elements">("all");
  const [activeElements, setActiveElements] = useState<Record<Element, boolean>>(INITIAL_ELEMENTS);
  const filteredCharacters = Object.entries(CHARACTER_DATA).filter(
    ([_, d]) => filterMode === "all" || activeElements[d.element as Element],
  );
  const handleFilterChange = (mode: "all" | "elements") => {
    setFilterMode(mode);
    if (mode === "all") setActiveElements(INITIAL_ELEMENTS);
  };
  const handleToggleElement = (el: Element) => {
    setFilterMode("elements");
    setActiveElements((prev) => {
      const next = { ...prev, [el]: !prev[el] };
      if (!ELEMENTS.some((e) => next[e])) setFilterMode("all");
      return next;
    });
  };
  const getCharacterBg = (name: string) => (preview.includes(name) ? "#3a3a3a" : "#2a2a2a");

  const HINT_MIN = 1_000,
    HINT_MAX = 10_000_000,
    HINT_MAX_DIGITS = 8;
  const sanitizeDigits = (s: string) => s.replace(/[^\d]/g, "");
  const sanitizeUid = (s: string) => s.replace(/[^\d]/g, "").slice(0, 10);
  const parseHint = (raw: string) => {
    if (!raw) return { ok: false as const, n: 0, err: "Required" };
    if (!/^\d+$/.test(raw)) return { ok: false as const, n: 0, err: "Numbers only" };
    const n = Number(raw);
    if (!Number.isSafeInteger(n)) return { ok: false as const, n: 0, err: "Too large" };
    if (n < HINT_MIN || n > HINT_MAX)
      return {
        ok: false as const,
        n,
        err: `Must be ${HINT_MIN.toLocaleString()}–${HINT_MAX.toLocaleString()}`,
      };
    return { ok: true as const, n, err: null };
  };

  const [strongestHit, setStrongestHit] = useState("");
  const [totalDps, setTotalDps] = useState("");
  const [genshinUid, setGenshinUid] = useState("");
  const strongest = parseHint(strongestHit);
  const dps = parseHint(totalDps);
  const isValid =
    !!file &&
    !fileError &&
    preview.every((c) => typeof c === "string" && c.length > 0) &&
    strongest.ok &&
    dps.ok;

  return (
    <div className="min-h-screen">
      <TopTabs />
      <div className="p-4">
        <div className="flex gap-8 items-start">
          {/* ============== LEFT SIDE ============== */}
          <div className="flex-1 min-w-[760px] max-w-[760px]">
            {/* Team */}
            <div className="flex flex-col items-center mb-4">
              <div className="font-bold mb-3 text-center">Team</div>
              <div className="flex gap-3 justify-center">
                {[0, 1, 2, 3].map((i) => {
                  const char = preview[i];
                  const hasChar = !!char;
                  return (
                    <div key={i} className="w-[72px] flex flex-col items-center gap-1.5">
                      <CharacterSlot
                        character={char || undefined}
                        onClick={() => removePreviewAt(i)}
                        disabled={!char}
                        bgColor="wrong"
                        size="md"
                      />
                      <select
                        disabled={!hasChar}
                        value={constellations[i] ?? DEFAULT_C}
                        onChange={(e) => {
                          const v = e.target.value as Constellation;
                          setConstellations((prev) => {
                            const next = [...prev];
                            next[i] = v;
                            return next;
                          });
                        }}
                        className="p-1.5 w-[72px] bg-[#1a1a1a] border border-[#444] rounded-md"
                        title="Constellation"
                      >
                        {CONSTELLATION_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                      <select
                        disabled={!hasChar}
                        value={refinements[i] ?? DEFAULT_R}
                        onChange={(e) => {
                          const v = e.target.value as Refinement;
                          setRefinements((prev) => {
                            const next = [...prev];
                            next[i] = v;
                            return next;
                          });
                        }}
                        className="p-1.5 w-[72px] bg-[#1a1a1a] border border-[#444] rounded-md"
                        title="Refinement"
                      >
                        {REFINEMENT_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={removeLastPreview}
                disabled={!preview.some((c) => c)}
                className="mt-3 px-4 py-2 bg-[#2a2a2a] border border-[#444] rounded-md disabled:opacity-50"
              >
                Backspace
              </button>
            </div>

            {/* Element Filter */}
            <ElementFilter
              filterMode={filterMode}
              activeElements={activeElements}
              onFilterChange={handleFilterChange}
              onToggleElement={handleToggleElement}
            />

            {/* Character Grid */}
            <CharacterGrid
              characters={filteredCharacters as [string, { element: string; iconUrl: string }][]}
              onSelect={addToPreview}
              getCharacterBg={getCharacterBg}
            />
          </div>

          {/* ============== RIGHT SIDE (HINTS) ============== */}
          <div className="w-[360px] flex-shrink-0">
            <h3 className="mt-0 font-bold text-lg mb-3">Submit a Dummy</h3>

            <div className="mb-3 opacity-90 text-sm">
              Upload a PNG screenshot (≤ 1MB) and select the 4-character team shown. Please edit the
              image to hide the DPS, characters and strongest hit as shown. For Constellations and
              Refinements, if the value is "Hidden" it will not be shown to the player, only include
              these if you think these values are abnormal and important for the player to guess the
              team.
              <div className="mt-2.5">
                <div className="text-xs opacity-80 mb-1.5">Example</div>
                <img
                  src="/genshinpuzzle/example-submission.png"
                  alt="Example submission"
                  className="w-full border border-dashed border-[#444] rounded-lg opacity-85"
                />
              </div>
            </div>

            {/* File picker */}
            <div className="mb-4">
              <div className="font-bold mb-1.5">Screenshot (PNG only)</div>
              <input
                type="file"
                accept="image/png"
                onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                className="text-sm"
              />
              {file && !fileError && (
                <div className="mt-1.5 text-sm">
                  {file.name} ({Math.round(file.size / 1024)} KB)
                </div>
              )}
              {fileError && <div className="mt-1.5 text-[#ff6b6b] text-sm">{fileError}</div>}
            </div>

            {imagePreviewUrl && !fileError && (
              <div className="mt-3">
                <div className="font-bold mb-1.5">Preview</div>
                <img
                  src={imagePreviewUrl}
                  alt="Upload preview"
                  className="w-full max-w-[520px] border border-[#444] rounded-lg"
                />
              </div>
            )}

            <h3 className="mt-0 font-bold text-lg mb-3">Hints</h3>

            <div className="grid grid-cols-2 gap-x-3 gap-y-3 items-center">
              <div className="font-bold">Strongest Hit</div>
              <input
                value={strongestHit}
                onChange={(e) =>
                  setStrongestHit(sanitizeDigits(e.target.value).slice(0, HINT_MAX_DIGITS))
                }
                inputMode="numeric"
                pattern="\d*"
                placeholder="e.g. 100000"
                aria-invalid={!strongest.ok}
                className={`p-2 w-full bg-[#1a1a1a] border rounded-md ${strongest.ok ? "border-[#444]" : "border-[#ff6b6b]"}`}
              />

              <div className="font-bold">Total DPS</div>
              <input
                value={totalDps}
                onChange={(e) =>
                  setTotalDps(sanitizeDigits(e.target.value).slice(0, HINT_MAX_DIGITS))
                }
                inputMode="numeric"
                pattern="\d*"
                placeholder="e.g. 100000"
                aria-invalid={!dps.ok}
                className={`p-2 w-full bg-[#1a1a1a] border rounded-md ${dps.ok ? "border-[#444]" : "border-[#ff6b6b]"}`}
              />

              <div className="font-bold">Genshin UID</div>
              <input
                value={genshinUid}
                onChange={(e) => setGenshinUid(sanitizeUid(e.target.value))}
                inputMode="numeric"
                pattern="\d*"
                placeholder="optional"
                className="p-2 w-full bg-[#1a1a1a] border border-[#444] rounded-md"
              />
            </div>

            {(!strongest.ok || !dps.ok) && (
              <div className="mt-2 text-[#ff6b6b] text-xs">
                {!strongest.ok && <div>Strongest Hit: {strongest.err}</div>}
                {!dps.ok && <div>Total DPS: {dps.err}</div>}
              </div>
            )}

            <div className="mt-4">
              <button
                disabled={!isValid || isSubmitting}
                onClick={submitDummy}
                className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#444] rounded-md disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit Dummy"}
              </button>

              {submitError && <div className="mt-2.5 text-[#ff6b6b]">{submitError}</div>}

              {submissionId && (
                <div className="mt-2.5">
                  Submission ID: <b>{submissionId}</b>
                </div>
              )}

              {!isValid && (
                <div className="mt-2 opacity-80 text-xs">
                  Required: PNG ≤ 1MB, select 4 unique characters, and enter both numbers.
                </div>
              )}

              <div className="mb-3 mt-4 opacity-90 text-sm">
                Currently there is no functionality to remove or edit entries you submit, but in the
                future you will be able to use the code provided after submission to do so.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
