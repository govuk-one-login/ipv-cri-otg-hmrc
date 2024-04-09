import { SecretsManagerHandler } from "../src/secrets-manager-handler";
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import { mockClient } from "aws-sdk-client-mock";

describe("secrets-manager-handler", () => {
  const mockSecretName = "dummy-secret"; //pragma: allowlist secret

  describe("happy", () => {
    const mockSecretString = '{ "key": "dummy-key", "value": "dummy-value" }';
    const mockSecretsManagerClient = mockClient(SecretsManagerClient);

    const mockSecretsManager = (): void => {
      mockSecretsManagerClient
        .on(GetSecretValueCommand, { SecretId: mockSecretName })
        .resolvesOnce({
          SecretString: mockSecretString,
        });
    };

    beforeEach(() => {
      mockSecretsManagerClient.reset();
    });

    it("should return the secret value from Secrets Manager", async () => {
      mockSecretsManager();

      const result = await new SecretsManagerHandler().handler(
        { secretName: mockSecretName },
        {}
      );
      expect(result.value).toEqual(mockSecretString);
    });
  });

  describe("unhappy", () => {
    const mockedErrorMessage =
      "Secrets Manager can't find the specified secret.";

    const mockSecretsManagerClient = mockClient(SecretsManagerClient);

    const mockSecretsManager = (): void => {
      mockSecretsManagerClient
        .on(GetSecretValueCommand, { SecretId: mockSecretName })
        .resolvesOnce(Promise.reject(new Error(mockedErrorMessage)));
    };

    beforeEach(() => {
      mockSecretsManagerClient.reset();
    });

    it("should throw when secret does not exist", async () => {
      mockSecretsManager();

      await expect(async () =>
        new SecretsManagerHandler().handler(
          {
            secretName: mockSecretName,
          },
          {}
        )
      ).rejects.toThrow(new Error(mockedErrorMessage));
    });
  });
});
