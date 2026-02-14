import TopTabs from "./TopTabs";

export default function Roadmap() {
  return (
    <div className="min-h-screen">
      <TopTabs />

      <div className="p-4 max-w-[900px] mx-auto">
        <h3 className="mt-0">Planned Changes</h3>

        <div className="whitespace-pre-line leading-relaxed opacity-90">
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
