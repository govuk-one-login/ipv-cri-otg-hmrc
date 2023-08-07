import { LambdaInterface } from "@aws-lambda-powertools/commons";
import { generateConfig, Totp } from "time2fa";
import { Logger } from "@aws-lambda-powertools/logger";

const TOTP_TTL_IN_SECONDS = 30;
const TOTP_HASH = "sha512";
const TOTP_LENGTH = 8;

const logger = new Logger();

export class TotpGeneratorHandler implements LambdaInterface {
  public async handler(
    event: { SecretString: string },
    _context: unknown
  ): Promise<{ totp: string }> {
    try {
      if (!event.SecretString) {
        throw new Error("No secret string present.");
      }
      const totp_config = generateConfig({
        digits: TOTP_LENGTH,
        period: TOTP_TTL_IN_SECONDS,
        algo: TOTP_HASH,
      });
      const totp_code = Totp.generatePasscodes(
        { secret: event.SecretString },
        totp_config
      )[0];
      return {
        totp: totp_code,
      };
    } catch (error: unknown) {
      let message = 'Unknown Error'
      if (error instanceof Error) message = error.message
      logger.error("Error TOTP Generator: " + message);
      throw error;
    }
  }
}

const handlerClass = new TotpGeneratorHandler();
export const lambdaHandler = handlerClass.handler.bind(handlerClass);
