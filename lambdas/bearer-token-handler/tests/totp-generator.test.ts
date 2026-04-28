import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateTotpCode } from "../src/totp-code-generator";

describe("totp-generator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates an expected TOTP for a given date and secret", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1622502000000);
    const result = await generateTotpCode("ABCDEFGHIJKLMNOP");
    expect(result).toStrictEqual({ totp: "87779282" });
  });

  it("should throw error when no secret present", async () => {
    await expect(() => generateTotpCode("")).rejects.toThrow(
      "No secret string present."
    );
  });

  it("should throw error when secret is not base32 encoded", async () => {
    await expect(() => generateTotpCode("$")).rejects.toThrow("Invalid secret");
  });
});
