import { TotpHandler } from "../../../src/handlers/totp-handler";
import { Context } from "aws-lambda";

describe("totp-handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("TOTP code should be as expected for a given date and secret", async () => {
    const totpHandler = new TotpHandler();
    const token = await totpHandler.handler(undefined, {} as Context);
    expect(token).toBe("87779282");
  });
});
