import { siFacebook, siInstagram, siMessenger, siMeta, siWhatsapp } from "simple-icons";

export const PLATFORM_ICONS = {
  AUDIENCE_NETWORK: siMeta,
  FACEBOOK: siFacebook,
  INSTAGRAM: siInstagram,
  MESSENGER: siMessenger,
  WHATSAPP: siWhatsapp,
};

export function formatPlatformName(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatPlatformSelection(platforms: string[]) {
  if (platforms.length === 0) {
    return "All";
  }

  if (platforms.length === 1) {
    return formatPlatformName(platforms[0]);
  }

  return `${platforms.length} platforms`;
}

export function sortPlatformOptions(platforms: string[]) {
  return [...platforms].sort((firstPlatform, secondPlatform) => {
    if (firstPlatform === "AUDIENCE_NETWORK") {
      return 1;
    }

    if (secondPlatform === "AUDIENCE_NETWORK") {
      return -1;
    }

    return formatPlatformName(firstPlatform).localeCompare(formatPlatformName(secondPlatform));
  });
}

export function togglePlatformFilter(currentPlatforms: string[], platform: string) {
  if (currentPlatforms.includes(platform)) {
    return currentPlatforms.filter((currentPlatform) => currentPlatform !== platform);
  }

  return [...currentPlatforms, platform];
}
