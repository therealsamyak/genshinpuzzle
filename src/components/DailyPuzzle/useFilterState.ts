import { useState } from "react";
import type { Element } from "../../game/types";
import { CHARACTER_DATA } from "../../game/characters";

const ELEMENTS: Element[] = ["Pyro", "Hydro", "Electro", "Cryo", "Dendro", "Anemo", "Geo"];

interface UseFilterStateReturn {
  filterMode: "all" | "elements";
  activeElements: Record<Element, boolean>;
  filteredCharacters: [string, { element: string; iconUrl: string }][];
  clickAll: () => void;
  toggleElement: (el: Element) => void;
  ELEMENTS: Element[];
}

export function useFilterState(): UseFilterStateReturn {
  const [filterMode, setFilterMode] = useState<"all" | "elements">("all");

  const [activeElements, setActiveElements] = useState<Record<Element, boolean>>(() =>
    ELEMENTS.reduce(
      (acc, el) => {
        acc[el] = false;
        return acc;
      },
      {} as Record<Element, boolean>,
    ),
  );

  const filteredCharacters = Object.entries(CHARACTER_DATA).filter(
    ([_, data]) => filterMode === "all" || activeElements[data.element as Element],
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
      if (!anyOn) setFilterMode("all");

      return next;
    });
  };

  return {
    filterMode,
    activeElements,
    filteredCharacters,
    clickAll,
    toggleElement,
    ELEMENTS,
  };
}
