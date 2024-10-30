import { generateConfig, Totp } from "time2fa";
import { Logger } from "@aws-lambda-powertools/logger";

const TOTP_TTL_IN_SECONDS = 30;
const TOTP_HASH = "sha512";
const TOTP_LENGTH = 8;

const logger = new Logger();

export async function generateTotpCode(
  SecretString: string
): Promise<{ totp: string }> {
  try {
    if (!SecretString) {
      throw new Error("No secret string present.");
    }
    const totpConfig = generateConfig({
      digits: TOTP_LENGTH,
      period: TOTP_TTL_IN_SECONDS,
      algo: TOTP_HASH,
    });
    const totpCode = Totp.generatePasscodes(
      { secret: SecretString },
      totpConfig
    )[0];
    return {
      totp: totpCode,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown Error";
    logger.error("Error TOTP Generator: " + message);
    throw error;
  }
}
