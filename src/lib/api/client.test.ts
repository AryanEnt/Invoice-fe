import { describe, expect, it } from "vitest";
import { parseApiResponse } from "@/lib/api/client";
import { ApiError } from "@/lib/api/types";

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
});
