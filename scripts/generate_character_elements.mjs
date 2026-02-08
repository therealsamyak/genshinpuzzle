import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve("src/game/characters.ts");
const OUT = path.resolve(
  "supabase/functions/create_dummy_submission/character_elements.ts",
);

const txt = fs.readFileSync(SRC, "utf8");

// crude but works for your generated file format:
// extracts keys + element: "X"
const re =
  /(^|\n)\s*["']?([^"'\n]+)["']?\s*:\s*{\s*[\s\S]*?element:\s*"([^"]+)"/g;

const map = {};
let m;
while ((m = re.exec(txt))) {
  const name = m[2];
  const element = m[3];
  if (element && element !== "None") map[name] = element;
}

const out = `// AUTO-GENERATED. DO NOT EDIT.
// Generated from src/game/characters.ts
export const CHARACTER_ELEMENT: Record<string, string> = ${JSON.stringify(
  map,
  null,
  2,
)};
`;

fs.writeFileSync(OUT, out);
console.log(`Wrote ${Object.keys(map).length} entries to ${OUT}`);
