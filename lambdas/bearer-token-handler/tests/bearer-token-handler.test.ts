import { BearerTokenHandler } from "../src/bearer-token-handler";
import { Context } from "aws-lambda";

describe("bearer-token-handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  it("should return a bearer token with the expected expiry date", async () => {
    const mockedExpiryInSeconds = 14400;
    const mockedAccessToken = 123456789;
    const firstJune2021Midnight = 1622502000000;
    jest.spyOn(Date, "now").mockReturnValue(firstJune2021Midnight);
    global.fetch = jest.fn();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: jest.fn().mockResolvedValueOnce({
        access_token: mockedAccessToken,
        expires_in: mockedExpiryInSeconds,
      }),
      ok: true,
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
    const halfOfExpiryInSeconds = mockedExpiryInSeconds / 2;
    const expectedTokenExpiry = (
      firstJune2021Midnight +
      halfOfExpiryInSeconds * 1000
    ).toString();
    const expectedTokenExpiryInMins = halfOfExpiryInSeconds / 60;
    expect(result).toStrictEqual({
      token: mockedAccessToken,
      tokenExpiry: expectedTokenExpiry,
      tokenExpiryInMinutes: expectedTokenExpiryInMins,
    });
  });

  it("should throw when an invalid response is returned from HMRC", async () => {
    const error = {
      error: "dummy-error",
    };
    global.fetch = jest.fn();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: jest.fn().mockResolvedValueOnce(error),
      ok: false,
      status: 400,
      statusText: "Forbidden",
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

    await expect(() => bearerTokenHandler.handler(event, {})).rejects.toThrow(
      new Error(
        "Error response received from HMRC 400 Forbidden: " +
          JSON.stringify(error)
      )
    );
  });
});
