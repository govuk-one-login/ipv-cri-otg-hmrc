import { TotpService } from "../../../src/services/totp-service";

describe("totp-service", () => {
  it("TOTP code should be as expected for a given date and secret", async () => {
    const totpService = new TotpService();
    const totp = await totpService.generateTOTP(
      "ABCDEFGHIJKLMNOP",
      "SHA-512",
      30,
      1622502000000,
      8
    );
    expect(totp).toBe("87779282");
  });
});
