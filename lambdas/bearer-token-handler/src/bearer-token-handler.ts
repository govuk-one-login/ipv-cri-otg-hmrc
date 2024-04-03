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

      const body = (await response.json()) as OAuthResponse;

      return {
        token: body.access_token,
        tokenExpiry: (Date.now() + body.expires_in * 1000).toString(),
        tokenExpiryInMinutes: body.expires_in / 60,
      };
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
