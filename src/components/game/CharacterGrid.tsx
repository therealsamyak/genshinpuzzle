import { CharacterSlot } from "./CharacterSlot";

interface CharacterGridProps {
  characters: [string, { element: string; iconUrl: string }][];
  onSelect: (name: string) => void;
  disabled?: boolean;
  getCharacterBg?: (name: string) => string;
}

const mapColorToBgColor = (color: string): "neutral" | "correct" | "wrong" => {
  if (color === "#2f6f3a") return "correct";
  if (color === "#1f1f1f") return "wrong";
  return "neutral";
};

export function CharacterGrid({
  characters,
  onSelect,
  disabled = false,
  getCharacterBg,
}: CharacterGridProps) {
  return (
    <div className="grid grid-cols-10 gap-2 w-full">
      {characters.map(([name]) => (
        <CharacterSlot
          key={name}
          character={name}
          size="sm"
          bgColor={getCharacterBg ? mapColorToBgColor(getCharacterBg(name)) : "neutral"}
          onClick={() => onSelect(name)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
