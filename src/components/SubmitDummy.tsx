import { useState, useEffect } from "react";
import TopTabs from "./TopTabs";
import type { Element } from "../game/types";
import { CHARACTER_DATA } from "../game/characters";

export default function SubmitDummy() {
  const ELEMENTS: Element[] = [
    "Pyro",
    "Hydro",
    "Electro",
    "Cryo",
    "Dendro",
    "Anemo",
    "Geo",
  ];

  /* ================= FILE ================= */

  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  /* ================= TEAM SELECTION ================= */

  const [preview, setPreview] = useState<string[]>([]);

  const addToPreview = (name: string) => {
    if (preview.length >= 4) return;
    if (preview.includes(name)) return;
    setPreview((prev) => [...prev, name]);
  };

  const removePreviewAt = (index: number) => {
    setPreview((prev) => prev.filter((_, i) => i !== index));
  };

  const removeLastPreview = () => {
    setPreview((prev) => prev.slice(0, -1));
  };

  /* ================= File Picking ================= */

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

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  /* SERVER */
  const submitDummy = async () => {
    if (!isValid || !file) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmissionId(null);

    try {
      const form = new FormData();
      form.append("image", file);

      form.append("team0", preview[0] ?? "");
      form.append("team1", preview[1] ?? "");
      form.append("team2", preview[2] ?? "");
      form.append("team3", preview[3] ?? "");

      const elements = preview.map((name) => CHARACTER_DATA[name].element);
      form.append("elements", JSON.stringify(elements));

      form.append("strongestHit", String(Number(strongestHit)));
      form.append("totalDps", String(Number(totalDps)));

      if (genshinUid.trim()) {
        form.append("genshinUid", genshinUid.trim());
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create_dummy_submission`,
        {
          method: "POST",
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            Accept: "application/json",
          },
          body: form,
        },
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed (${res.status})`);
      }

      const data = (await res.json()) as { submissionId: string };
      setSubmissionId(data.submissionId);
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : "Submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ================= ELEMENT FILTER (MATCH DAILY) ================= */

  const [filterMode, setFilterMode] = useState<"all" | "elements">("all");

  const [activeElements, setActiveElements] = useState<
    Record<Element, boolean>
  >(() =>
    ELEMENTS.reduce(
      (acc, el) => {
        acc[el] = false; // all element buttons off by default; "All" mode shows everything
        return acc;
      },
      {} as Record<Element, boolean>,
    ),
  );

  const clickAll = () => {
    setFilterMode("all");
    setActiveElements(
      ELEMENTS.reduce(
        (acc, el) => {
          acc[el] = false;
          return acc;
        },
        {} as Record<Element, boolean>,
      ),
    );
  };

  const toggleElement = (el: Element) => {
    setFilterMode("elements");
    setActiveElements((prev) => {
      const next = { ...prev, [el]: !prev[el] };

      const anyOn = ELEMENTS.some((e) => next[e]);
      if (!anyOn) {
        setFilterMode("all");
      }

      return next;
    });
  };

  /* ================= INPUTS ================= */

  const [strongestHit, setStrongestHit] = useState("");
  const [totalDps, setTotalDps] = useState("");
  const [genshinUid, setGenshinUid] = useState("");

  const strongestHitNum = Number(strongestHit);
  const totalDpsNum = Number(totalDps);

  const isValid =
    !!file &&
    !fileError &&
    preview.length === 4 &&
    Number.isFinite(strongestHitNum) &&
    strongestHitNum > 0 &&
    Number.isFinite(totalDpsNum) &&
    totalDpsNum > 0;

  return (
    <div style={{ minHeight: "100vh" }}>
      <TopTabs />

      <div style={{ padding: "1rem" }}>
        <div
          style={{
            display: "flex",
            gap: "2rem",
            alignItems: "flex-start",
          }}
        >
          {/* ============== LEFT SIDE ============== */}
          <div style={{ flex: 1, minWidth: 760, maxWidth: 760 }}>
            {/* Preview Row */}
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Team</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {[0, 1, 2, 3].map((i) => {
                const char = preview[i];

                return (
                  <div
                    key={i}
                    onClick={() => char && removePreviewAt(i)}
                    style={{
                      width: 72,
                      height: 72,
                      border: "2px solid #444",
                      borderRadius: 6,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#1f1f1f",
                      cursor: char ? "pointer" : "default",
                      opacity: char ? 1 : 0.6,
                    }}
                    title={char ? `${char} (click to remove)` : undefined}
                  >
                    {char && (
                      <img
                        src={CHARACTER_DATA[char].iconUrl}
                        alt={char}
                        style={{ width: 56, height: 56, pointerEvents: "none" }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <button onClick={removeLastPreview} disabled={!preview.length}>
              Backspace
            </button>

            {/* Element Filters (MATCH DAILY) */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "8px",
                margin: "16px 0",
                flexWrap: "wrap",
              }}
            >
              {/* All button */}
              <button
                onClick={clickAll}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 6,
                  border: "1px solid #444",
                  background: filterMode === "all" ? "#3a3a3a" : "#1a1a1a",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  opacity: filterMode === "all" ? 1 : 0.6,
                }}
                title="All"
                aria-pressed={filterMode === "all"}
              >
                <span style={{ fontSize: 12, fontWeight: 700 }}>ALL</span>
              </button>

              {/* Element buttons */}
              {ELEMENTS.map((el) => {
                const isOn = filterMode === "elements" && activeElements[el];

                return (
                  <button
                    key={el}
                    onClick={() => toggleElement(el)}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 6,
                      border: "1px solid #444",
                      background: isOn ? "#3a3a3a" : "#1a1a1a",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                      opacity: filterMode === "all" ? 0.6 : 1,
                    }}
                    title={el}
                    aria-pressed={isOn}
                  >
                    <img
                      src={`/genshinpuzzle/icons/elements/${el}_Icon.png`}
                      alt={el}
                      style={{
                        width: 30,
                        height: 30,
                        objectFit: "contain",
                        display: "block",
                        margin: "0 auto",
                        opacity: isOn ? 1 : 0.35,
                        pointerEvents: "none",
                      }}
                    />
                  </button>
                );
              })}
            </div>

            {/* Character Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(10, 1fr)",
                gap: "8px",
                width: "100%",
              }}
            >
              {Object.entries(CHARACTER_DATA)
                .filter((entry) => {
                  const data = entry[1];
                  if (filterMode === "all") return true;
                  return activeElements[data.element as Element];
                })
                .map(([name]) => (
                  <button
                    key={name}
                    onClick={() => addToPreview(name)}
                    title={name}
                    style={{
                      width: 64,
                      height: 64,
                      padding: 4,
                      borderRadius: 6,
                      border: "1px solid #444",
                      background: preview.includes(name)
                        ? "#3a3a3a"
                        : "#2a2a2a",
                      cursor: "pointer",
                    }}
                  >
                    <img
                      src={CHARACTER_DATA[name].iconUrl}
                      alt={name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        pointerEvents: "none",
                      }}
                    />
                  </button>
                ))}
            </div>
          </div>

          {/* ============== RIGHT SIDE (HINTS) ============== */}
          <div style={{ width: 360, flexShrink: 0 }}>
            <h3 style={{ marginTop: 0 }}>Submit a Dummy</h3>

            <div style={{ marginBottom: 12, opacity: 0.9 }}>
              Upload a PNG screenshot (≤ 1MB) and select the 4-character team
              shown. Please edit the image to hide the DPS, characters and
              strongest hit as shown.
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>
                  Example
                </div>
                <img
                  src="/genshinpuzzle/example-submission.png"
                  alt="Example submission"
                  style={{
                    width: "100%",
                    border: "1px dashed #444",
                    borderRadius: 8,
                    opacity: 0.85,
                    display: "block",
                  }}
                />
              </div>
            </div>

            {/* File picker */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>
                Screenshot (PNG only)
              </div>
              <input
                type="file"
                accept="image/png"
                onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
              />
              {file && !fileError && (
                <div style={{ marginTop: 6 }}>
                  {file.name} ({Math.round(file.size / 1024)} KB)
                </div>
              )}
              {fileError && (
                <div style={{ marginTop: 6, color: "#ff6b6b" }}>
                  {fileError}
                </div>
              )}
            </div>

            {imagePreviewUrl && !fileError && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Preview</div>
                <img
                  src={imagePreviewUrl}
                  alt="Upload preview"
                  style={{
                    width: "100%",
                    maxWidth: 520,
                    border: "1px solid #444",
                    borderRadius: 8,
                    display: "block",
                  }}
                />
              </div>
            )}
            <h3 style={{ marginTop: 0 }}>Hints</h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                columnGap: 12,
                rowGap: 12,
                alignItems: "center",
              }}
            >
              <div style={{ fontWeight: 700 }}>Strongest Hit</div>
              <input
                value={strongestHit}
                onChange={(e) => setStrongestHit(e.target.value)}
                inputMode="numeric"
                placeholder="e.g. 5000"
                style={{ padding: 8, width: "100%" }}
              />

              <div style={{ fontWeight: 700 }}>Total DPS</div>
              <input
                value={totalDps}
                onChange={(e) => setTotalDps(e.target.value)}
                inputMode="numeric"
                placeholder="e.g. 20000"
                style={{ padding: 8, width: "100%" }}
              />

              <div style={{ fontWeight: 700 }}>Genshin UID</div>
              <input
                value={genshinUid}
                onChange={(e) => setGenshinUid(e.target.value)}
                placeholder="optional"
                style={{ padding: 8, width: "100%" }}
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <button
                disabled={!isValid || isSubmitting}
                style={{ width: "100%" }}
                onClick={submitDummy}
              >
                {isSubmitting ? "Submitting..." : "Submit Dummy"}
              </button>

              {submitError && (
                <div style={{ marginTop: 10, color: "#ff6b6b" }}>
                  {submitError}
                </div>
              )}

              {submissionId && (
                <div style={{ marginTop: 10 }}>
                  Submission ID: <b>{submissionId}</b>
                </div>
              )}

              {!isValid && (
                <div style={{ marginTop: 8, opacity: 0.8, fontSize: 12 }}>
                  Required: PNG ≤ 1MB, select 4 unique characters, and enter
                  both numbers.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
