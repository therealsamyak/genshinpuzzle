import { CHARACTER_DATA } from "../../game/characters";

interface CharacterSlotProps {
  character?: string;
  onClick?: () => void;
  disabled?: boolean;
  bgColor?: "neutral" | "correct" | "wrong";
  size?: "sm" | "md" | "lg";
}

export function CharacterSlot({
  character,
  onClick,
  disabled = false,
  bgColor = "neutral",
  size = "md",
}: CharacterSlotProps) {
  const sizeClasses = {
    sm: "w-16 h-16 p-1",
    md: "w-[72px] h-[72px] border-2",
    lg: "w-[72px] h-[72px] border-2",
  };

  const iconSizeClasses = {
    sm: "w-full h-full",
    md: "w-14 h-14",
    lg: "w-14 h-14",
  };

  const bgColorClasses = {
    neutral: "bg-[#2a2a2a]",
    correct: "bg-[#2f6f3a]",
    wrong: "bg-[#1f1f1f]",
  };

  const isClickable = character && !disabled && onClick;

  return (
    <button
      type="button"
      disabled={disabled || !isClickable}
      onClick={onClick}
      title={character ? `${character} (click to remove)` : undefined}
      className={`
        ${sizeClasses[size]}
        rounded-md
        border-[#444]
        flex
        items-center
        justify-center
        ${bgColorClasses[bgColor]}
        ${isClickable ? "cursor-pointer" : "cursor-default"}
        ${character ? "opacity-100" : "opacity-60"}
      `}
    >
      {character && (
        <img
          src={CHARACTER_DATA[character]?.iconUrl}
          alt={character}
          className={`${iconSizeClasses[size]} object-contain pointer-events-none`}
        />
      )}
    </button>
  );
}
