import { generateTotpCode } from "../src/totp-code-generator";

describe("totp-generator", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("generates an expected TOTP for a given date and secret", async () => {
    jest.spyOn(Date, "now").mockReturnValue(1622502000000);
    const result = await generateTotpCode("ABCDEFGHIJKLMNOP");
    expect(result).toStrictEqual({ totp: "87779282" });
  });

  it("should throw error when no secret present", async () => {
    expect(async () => await generateTotpCode("")).rejects.toThrowError(
      "No secret string present."
    );
  });

  it("should throw error when secret is not base32 encoded", async () => {
    expect(async () => await generateTotpCode("$")).rejects.toThrowError(
      "Invalid secret"
    );
  });
});
