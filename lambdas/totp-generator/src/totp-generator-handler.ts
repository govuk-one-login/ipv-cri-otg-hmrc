import { APIGatewayProxyResult } from "aws-lambda";
import { LambdaInterface } from "@aws-lambda-powertools/commons";

import TOTP from "totp-generator";
import { Logger } from "@aws-lambda-powertools/logger";
const TOTP_TTL_IN_SECONDS = 30;
const TOTP_HASH = "SHA-512";
const TOTP_LENGTH = 8;

const logger = new Logger();

export class TotpGeneratorHandler implements LambdaInterface {
  public async handler(
    event: any,
    _context: unknown
  ): Promise<{ totp: string }> {
    try {
      if (!event.SecretString) {
        throw new Error("No secret string present.");
      }
      const totp_code = TOTP(event.SecretString, {
        algorithm: TOTP_HASH,
        period: TOTP_TTL_IN_SECONDS,
        timestamp: Date.now(),
        digits: TOTP_LENGTH,
      });
      return {
        totp: totp_code,
      };
    } catch (error: any) {
      logger.error("Error TOTP Generator: " + error.message);
      throw error;
    }
  }
}

const handlerClass = new TotpGeneratorHandler();
export const lambdaHandler = handlerClass.handler.bind(handlerClass);
