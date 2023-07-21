import { TotpHandler } from "../../../src/handlers/totp-handler";
import { APIGatewayProxyEvent, Context } from "aws-lambda";

describe("totp-handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("generates an expected TOTP for a given date and secret", async () => {
    jest.spyOn(Date, "now").mockReturnValue(1622502000000);
    const totpHandler = new TotpHandler();
    const event = {
      body: "ABCDEFGHIJKLMNOP",
    } as APIGatewayProxyEvent;

    const result = await totpHandler.handler(event, {} as Context);
    expect(result).toBe("87779282");
  });
});
