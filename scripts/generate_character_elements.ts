export {};

const SRC = "src/game/characters.ts";
const OUT = "supabase/functions/_shared/character_elements.ts";

async function main() {
  const txt = await Deno.readTextFile(SRC);

  // Extracts key + element: "X" from your generated characters.ts format
  const re = /(^|\n)\s*["']?([^"'\n]+)["']?\s*:\s*{\s*[\s\S]*?element:\s*"([^"]+)"/g;

  const map: Record<string, string> = {};
  let m: RegExpExecArray | null;
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
// Generated from src/game/characters.ts via scripts/generate_character_elements.ts

export type Element = ${elementUnion};

export const CHARACTER_ELEMENTS: Record<string, Element> = ${JSON.stringify(map, null, 2)};

export function getElementForCharacter(name: string): Element {
  return CHARACTER_ELEMENTS[name] ?? "None";
}
`;

  await Deno.mkdir(OUT.split("/").slice(0, -1).join("/"), { recursive: true });
  await Deno.writeTextFile(OUT, out);
  console.log("Wrote " + Object.keys(map).length + " entries to " + OUT);
}

await main();
