import { describe, expect, it } from "vitest";
import { parseApiResponse } from "@/lib/api/client";
import { ApiError, formatApiErrorMessage } from "@/lib/api/types";

describe("parseApiResponse", () => {
  it("returns data from a successful envelope", () => {
    const data = parseApiResponse<{ status: string }>(200, {
      success: true,
      data: { status: "ok" },
    });

    expect(data).toEqual({ status: "ok" });
  });

  it("throws ApiError for a structured failure", () => {
    expect(() =>
      parseApiResponse(404, {
        success: false,
        error: { code: "RESOURCE_NOT_FOUND", message: "Invoice not found" },
      }),
    ).toThrow(ApiError);
  });

  it("throws ApiError for an unexpected payload", () => {
    expect(() => parseApiResponse(500, { unexpected: true })).toThrow(ApiError);
  });

  it("maps 429 and 413 without a JSON body shape to safe ApiErrors", () => {
    expect(() => parseApiResponse(429, null, { retryAfterSeconds: 12 })).toThrow(ApiError);
    try {
      parseApiResponse(413, { unexpected: true });
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).isPayloadTooLarge).toBe(true);
    }
  });
});

describe("formatApiErrorMessage", () => {
  it("explains rate limits and oversized payloads", () => {
    expect(
      formatApiErrorMessage(
        new ApiError(429, "TOO_MANY_REQUESTS", "Too many", undefined, 15),
        "fallback",
      ),
    ).toContain("15 seconds");
    expect(
      formatApiErrorMessage(new ApiError(413, "PAYLOAD_TOO_LARGE", "big"), "fallback"),
    ).toContain("too large");
  });
});
