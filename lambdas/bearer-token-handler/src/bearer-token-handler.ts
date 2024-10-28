import { LambdaInterface } from "@aws-lambda-powertools/commons";
import { Logger } from "@aws-lambda-powertools/logger";
import { OAuthEvent } from "./OAuthEvent";
import { OAuthResponse } from "./OAuthResponse";
import { generateTotpCode } from "./totp-code-generator";
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";

const logger = new Logger();

const clientSecretName = "HMRC/ClientSecret/%s/%s";
const clientIdName = "HMRC/ClientId/%s/%s";
const totpSecretName = "HMRC/TOTPSecret/%s/%s";

export class BearerTokenHandler implements LambdaInterface {
  secretsManager: SecretsManagerClient;

  constructor(secretsManagerClient: SecretsManagerClient) {
    this.secretsManager = secretsManagerClient;
  }

  public async handler(event: OAuthEvent, _context: unknown): Promise<unknown> {
    try {
      const [totpSecret, clientId, clientSecret] = await this.getSecrets(
        event.stackName,
        event.tokenType
      );
      const totpCode = await generateTotpCode(totpSecret);
      const response = await fetch(event.oAuthURL.value, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: this.createRequestBody(totpCode.totp, clientSecret, clientId),
      });

      return await this.handleResponse(response);
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error("Error in BearerTokenHandler: " + error.message);
      }
      throw error;
    }
  }

  private async getSecrets(
    stackName: string,
    tokenType: string
  ): Promise<[string, string, string]> {
    const totpSecret = await this.getSecret(
      format(totpSecretName, stackName, tokenType)
    );
    const clientId = await this.getSecret(
      format(clientIdName, stackName, tokenType)
    );
    const clientSecret = await this.getSecret(
      format(clientSecretName, stackName, tokenType)
    );
    return [totpSecret, clientId, clientSecret];
  }

  private createRequestBody(
    totpCode: string,
    clientSecret: string,
    clientId: string
  ): string {
    const data = {
      client_secret: totpCode + clientSecret,
      client_id: clientId,
      grant_type: "client_credentials",
    } as Record<string, string>;
    return Object.keys(data)
      .map(
        (key) => encodeURIComponent(key) + "=" + encodeURIComponent(data[key])
      )
      .join("&");
  }

  private async handleResponse(response: Response): Promise<unknown> {
    if (response.ok) {
      const body = (await response.json()) as OAuthResponse;
      const expiry = body.expires_in / 2;
      return {
        token: body.access_token,
        tokenExpiry: (Date.now() + expiry * 1000).toString(),
        tokenExpiryInMinutes: expiry / 60,
      };
    }
    throw new Error(
      `Error response received from HMRC ${response.status} ${response.statusText}`
    );
  }

  private async getSecret(secretName: string) {
    try {
      const data = await this.secretsManager.send(
        new GetSecretValueCommand({
          SecretId: secretName,
        })
      );
      if (!data.SecretString) {
        throw new Error("No secret found for " + secretName);
      }
      return data.SecretString;
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error(
          "Failed to retrieve secret " + secretName + ":" + error.message
        );
      }
      throw error;
    }
  }
}

function format(str: string, ...args: string[]): string {
  return str.replace(/%s/g, () => args.shift() ?? "");
}

const secretsManager = new SecretsManagerClient();
const handlerClass = new BearerTokenHandler(secretsManager);
export const lambdaHandler = handlerClass.handler.bind(handlerClass);
