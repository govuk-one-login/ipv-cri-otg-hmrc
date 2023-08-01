import { TotpHandler } from "../../../src/handlers/totp-handler";

describe("totp-handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("generates an expected TOTP for a given date and secret", async () => {
    jest.spyOn(Date, "now").mockReturnValue(1622502000000);
    const totpHandler = new TotpHandler();
    const event = {
      SecretString: "somesecret",
    };

    const result = await totpHandler.handler(event);
    expect(result).toEqual({ totp: "41324122" });
  });
});
