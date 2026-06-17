import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PlatformIcon } from "./PlatformIcon";
import { formatPlatformName, formatPlatformSelection, togglePlatformFilter } from "../utils/platforms";

type Props = {
  options: string[];
  selectedPlatforms: string[];
  onChange: (platforms: string[]) => void;
};

export function PlatformMultiSelect({ options, selectedPlatforms, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function closeMenu(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", closeMenu);

    return () => document.removeEventListener("mousedown", closeMenu);
  }, []);

  return (
    <div className="platform-select" ref={containerRef}>
      <button
        aria-expanded={isOpen}
        className="platform-select-trigger"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span>{formatPlatformSelection(selectedPlatforms)}</span>
        <ChevronDown size={16} />
      </button>
      {isOpen ? (
        <div className="platform-select-menu">
          {options.map((platform) => (
            <label className="platform-select-option" key={platform}>
              <input
                checked={selectedPlatforms.includes(platform)}
                onChange={() => onChange(togglePlatformFilter(selectedPlatforms, platform))}
                type="checkbox"
                value={platform}
              />
              <PlatformIcon platform={platform} />
              <span>{formatPlatformName(platform)}</span>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}
