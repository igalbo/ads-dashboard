import { describe, expect, it } from "vitest";
import {
  formatPlatformName,
  formatPlatformSelection,
  sortPlatformOptions,
  togglePlatformFilter,
} from "./platforms";

describe("platform utilities", () => {
  it("formats platform constants for display", () => {
    expect(formatPlatformName("AUDIENCE_NETWORK")).toBe("Audience Network");
  });

  it("keeps Audience Network last when sorting options", () => {
    expect(sortPlatformOptions(["AUDIENCE_NETWORK", "WHATSAPP", "FACEBOOK"])).toEqual([
      "FACEBOOK",
      "WHATSAPP",
      "AUDIENCE_NETWORK",
    ]);
  });

  it("summarizes selected platforms", () => {
    expect(formatPlatformSelection([])).toBe("All");
    expect(formatPlatformSelection(["FACEBOOK"])).toBe("Facebook");
    expect(formatPlatformSelection(["FACEBOOK", "INSTAGRAM"])).toBe("2 platforms");
  });

  it("toggles platforms in a multiselect filter", () => {
    expect(togglePlatformFilter(["FACEBOOK"], "INSTAGRAM")).toEqual(["FACEBOOK", "INSTAGRAM"]);
    expect(togglePlatformFilter(["FACEBOOK", "INSTAGRAM"], "FACEBOOK")).toEqual(["INSTAGRAM"]);
  });
});
