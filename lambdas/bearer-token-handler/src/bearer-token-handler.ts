import { LambdaInterface } from "@aws-lambda-powertools/commons";
import { Logger } from "@aws-lambda-powertools/logger";
import { OAuthEvent } from "./OAuthEvent";
import { OAuthResponse } from "./OAuthResponse";

const logger = new Logger();

export class BearerTokenHandler implements LambdaInterface {
  public async handler(event: OAuthEvent, _context: unknown): Promise<unknown> {
    try {
      const url = event.oAuthURL.value;
      const data = {
        client_secret: event.totp + event.clientSecret.value,
        client_id: event.clientId.value,
        grant_type: "client_credentials",
      } as Record<string, string>;

      const formBody = Object.keys(data)
        .map(
          (key) => encodeURIComponent(key) + "=" + encodeURIComponent(data[key])
        )
        .join("&");

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: formBody,
      });

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
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error("Error in BearerTokenHandler: " + error.message);
      }
      throw error;
    }
  }
}

const handlerClass = new BearerTokenHandler();
export const lambdaHandler = handlerClass.handler.bind(handlerClass);
