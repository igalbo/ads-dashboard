import { PlatformIcon } from "./PlatformIcon";
import { formatPlatformName } from "../utils/platforms";

type Props = {
  platforms: string[];
};

export function PlatformList({ platforms }: Props) {
  if (platforms.length === 0) {
    return <span className="muted">-</span>;
  }

  return (
    <div className="platform-list">
      {platforms.map((platform) => (
        <span className="platform-item" key={platform}>
          <PlatformIcon platform={platform} />
          {formatPlatformName(platform)}
        </span>
      ))}
    </div>
  );
}
