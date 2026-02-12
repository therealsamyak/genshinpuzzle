import TopTabs from "./TopTabs";

export default function Roadmap() {
  return (
    <div style={{ minHeight: "100vh" }}>
      <TopTabs />

      <div style={{ padding: "1rem", maxWidth: 900, margin: "0 auto" }}>
        <h3 style={{ marginTop: 0 }}>Planned Changes</h3>

        <div style={{ whiteSpace: "pre-line", lineHeight: 1.6, opacity: 0.9 }}>
          {`High Priority (Next Work)

Gameplay / UX

- Allow deletion of past submissions (by submission ID).

Low Priority

- Making it look nicer! (Background?)

Future (Explicitly Deferred)

- Refactor hint to be more relevant, as at the moment you can work out DPS,
maybe simply having the damage % shown and not the damage numbers,
and have them revealed alongside DPS? (need ideas)

- Weekly Cleanup images unused.
- OCR number extraction from images.
- Automatic answer censoring/blur in images.`}
        </div>
      </div>
    </div>
  );
}
