import type { Element } from "../../game/types";

const ELEMENTS: Element[] = ["Pyro", "Hydro", "Electro", "Cryo", "Dendro", "Anemo", "Geo"];

interface ElementFilterProps {
  filterMode: "all" | "elements";
  activeElements: Record<Element, boolean>;
  onFilterChange: (mode: "all" | "elements") => void;
  onToggleElement: (el: Element) => void;
}

export function ElementFilter({
  filterMode,
  activeElements,
  onFilterChange,
  onToggleElement,
}: ElementFilterProps) {
  return (
    <div className="flex justify-center items-center gap-2 mb-4 flex-wrap">
      <button
        type="button"
        onClick={() => onFilterChange("all")}
        className={`w-10 h-10 rounded-md border border-[#444] flex items-center justify-center cursor-pointer ${
          filterMode === "all" ? "bg-[#3a3a3a] opacity-100" : "bg-[#1a1a1a] opacity-60"
        }`}
        title="All"
        aria-pressed={filterMode === "all"}
      >
        <span className="text-xs font-bold">ALL</span>
      </button>

      {ELEMENTS.map((el) => {
        const isOn = filterMode === "elements" && activeElements[el];
        const buttonOpacity = filterMode === "all" ? "opacity-60" : "opacity-100";

        return (
          <button
            key={el}
            type="button"
            onClick={() => onToggleElement(el)}
            className={`w-10 h-10 rounded-md border border-[#444] flex items-center justify-center cursor-pointer ${buttonOpacity} ${
              isOn ? "bg-[#3a3a3a]" : "bg-[#1a1a1a]"
            }`}
            title={el}
            aria-pressed={isOn}
          >
            <img
              src={`${import.meta.env.BASE_URL}icons/elements/${el}_Icon.png`}
              alt={el}
              className={`w-[30px] h-[30px] object-contain block mx-auto pointer-events-none ${
                isOn ? "opacity-100" : "opacity-35"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
