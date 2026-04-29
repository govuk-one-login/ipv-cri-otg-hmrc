import { BearerTokenHandler } from "../src/bearer-token-handler";
import { Context } from "aws-lambda";
import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockClient } from "aws-sdk-client-mock";

const mockSM = mockClient(SecretsManagerClient);
const mockSecretsManagerClient = mockSM as typeof mockSM & SecretsManagerClient;

global.fetch = vi.fn();
const mockFetch = vi.mocked(global.fetch, { partial: true });

describe("bearer-token-handler", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    mockSecretsManagerClient.resolves({
      SecretString: "ABCDEFGHIJKLMNOP",
    });
  });

  it("should return a bearer token with the expected expiry date", async () => {
    const mockedExpiryInSeconds = 14400;
    const mockedAccessToken = 123456789;
    const firstJune2021Midnight = 1622502000000;
    vi.spyOn(Date, "now").mockReturnValue(firstJune2021Midnight);

    mockFetch.mockResolvedValueOnce({
      json: vi.fn().mockResolvedValueOnce({
        access_token: mockedAccessToken,
        expires_in: mockedExpiryInSeconds,
      }),
      ok: true,
    });

    const bearerTokenHandler = new BearerTokenHandler(mockSecretsManagerClient);
    const event = {
      stackName: "dummy",
      tokenType: "stub",
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
    mockFetch.mockResolvedValueOnce({
      json: vi.fn().mockResolvedValueOnce({}),
      ok: false,
      status: 400,
      statusText: "Forbidden",
    });

    const bearerTokenHandler = new BearerTokenHandler(mockSecretsManagerClient);
    const event = {
      stackName: "dummy",
      tokenType: "stub",
      oAuthURL: {
        value: "someUrl",
      },
    };
    await expect(() => bearerTokenHandler.handler(event, {})).rejects.toThrow(
      new Error("Error response received from HMRC 400 Forbidden")
    );
  });

  it("should throw when an secret is not found in SecretsManager", async () => {
    mockSecretsManagerClient.resolves({});
    const bearerTokenHandler = new BearerTokenHandler(mockSecretsManagerClient);
    const event = {
      stackName: "dummy",
      tokenType: "stub",
      oAuthURL: {
        value: "someUrl",
      },
    };
    await expect(() => bearerTokenHandler.handler(event, {})).rejects.toThrow(
      new Error("No secret found for HMRC/TOTPSecret/dummy/stub")
    );
  });
});
