import { describe, expect, it } from "vitest";
import { clampPageSize, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/pagination";

describe("clampPageSize", () => {
  it("defaults and clamps to the backend maximum", () => {
    expect(clampPageSize(undefined)).toBe(DEFAULT_PAGE_SIZE);
    expect(clampPageSize(10)).toBe(10);
    expect(clampPageSize(50)).toBe(50);
    expect(clampPageSize(51)).toBe(MAX_PAGE_SIZE);
    expect(clampPageSize(100)).toBe(MAX_PAGE_SIZE);
    expect(clampPageSize(0)).toBe(1);
  });
});
