import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve("src/game/characters.ts");
const OUT = path.resolve("supabase/functions/_shared/character_elements.ts");

const txt = fs.readFileSync(SRC, "utf8");

// Extracts key + element: "X" from your generated characters.ts format
const re =
  /(^|\n)\s*["']?([^"'\n]+)["']?\s*:\s*{\s*[\s\S]*?element:\s*"([^"]+)"/g;

const map = {};
let m;
while ((m = re.exec(txt))) {
  const name = m[2];
  const element = m[3];
  if (typeof name === "string" && typeof element === "string") {
    map[name] = element;
  }
}

// keep this aligned with your app's Element type
const elementUnion = `"Pyro" | "Hydro" | "Electro" | "Cryo" | "Dendro" | "Anemo" | "Geo" | "None"`;

const out = `// AUTO-GENERATED. DO NOT EDIT.
// Generated from src/game/characters.ts

export type Element = ${elementUnion};

export const CHARACTER_ELEMENTS: Record<string, Element> = ${JSON.stringify(
  map,
  null,
  2,
)};

export function getElementForCharacter(name: string): Element {
  return CHARACTER_ELEMENTS[name] ?? "None";
}
`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, out);
console.log("Wrote " + Object.keys(map).length + " entries to " + OUT);
