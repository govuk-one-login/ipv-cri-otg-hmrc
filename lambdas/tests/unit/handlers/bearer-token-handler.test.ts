import { TotpHandler } from "../../../src/handlers/totp-handler";
import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { BearerTokenHandler } from "../../../src/handlers/bearer-token-handler";

describe("bearer-token-handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  it("should return a bearer token with the expected expiry date", async () => {
    jest.spyOn(Date, "now").mockReturnValue(1622502000000);
    global.fetch = jest.fn();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: jest.fn().mockResolvedValueOnce({
        access_token: 12345678,
        expires_in: 144000,
      }),
    });
    const bearerTokenHandler = new BearerTokenHandler();
    const event = {
      totp: "someTotpCode",
      clientSecret: {
        value: "someSecret",
      },
      clientId: {
        value: "someClientId",
      },
      oAuthURL: {
        value: "someUrl",
      },
    };
    const result = await bearerTokenHandler.handler(event, {} as Context);
    expect(result).toStrictEqual({
      token: 12345678,
      tokenExpiry: "1622646000000",
    });
  });
});
