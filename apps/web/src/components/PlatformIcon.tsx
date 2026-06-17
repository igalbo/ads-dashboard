import { PLATFORM_ICONS } from "../utils/platforms";

type Props = {
  platform: string;
};

export function PlatformIcon({ platform }: Props) {
  const icon = PLATFORM_ICONS[platform as keyof typeof PLATFORM_ICONS];

  if (!icon) {
    return <span className="platform-icon platform-icon-fallback">{platform.slice(0, 1)}</span>;
  }

  return (
    <svg aria-hidden="true" className="platform-icon" fill={`#${icon.hex}`} viewBox="0 0 24 24">
      <path d={icon.path} />
    </svg>
  );
}
