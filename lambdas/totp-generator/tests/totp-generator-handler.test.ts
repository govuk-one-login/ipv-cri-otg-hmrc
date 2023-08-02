import { Context } from "aws-lambda";
import { TotpGeneratorHandler } from "../src/totp-generator-handler";

describe("totp-generator-handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("generates an expected TOTP for a given date and secret", async () => {
    jest.spyOn(Date, "now").mockReturnValue(1622502000000);
    const totpHandler = new TotpGeneratorHandler();
    const event = { SecretString: "ABCDEFGHIJKLMNOP" };
    const result = await totpHandler.handler(event, {} as Context);
    expect(result).toStrictEqual({ totp: "87779282" });
  });

  it("should throw error when no secret present", async () => {
    const totpHandler = new TotpGeneratorHandler();
    const event = { SecretString: "" };
    expect(
      async () => await totpHandler.handler(event, {} as Context)
    ).rejects.toThrowError("No secret string present.");
  });

  it("should throw error when secret is not base32 encoded", async () => {
    const totpHandler = new TotpGeneratorHandler();
    const event = { SecretString: "$" };
    expect(
      async () => await totpHandler.handler(event, {} as Context)
    ).rejects.toThrowError("Invalid secret");
  });
});
