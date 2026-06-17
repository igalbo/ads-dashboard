import { describe, expect, it } from "vitest";
import type { Ad } from "../api/client";
import { formatEndDate } from "./dates";

describe("date utilities", () => {
  it("shows active ads as still running even when an end date exists", () => {
    const ad = {
      status: "ACTIVE",
      endDate: "2024-01-01T00:00:00.000Z",
    } as Ad;

    expect(formatEndDate(ad)).toBe("Still running");
  });
});
