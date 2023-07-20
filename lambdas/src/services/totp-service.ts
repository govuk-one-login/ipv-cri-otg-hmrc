export class TotpService {
  public async generateTOTP(
    secret: string,
    algorithm: string,
    period: number,
    timestamp: number,
    digits: number
  ) {
    const totp = require("totp-generator");
    return totp(secret, {
      digits: digits,
      algorithm: algorithm,
      period: period,
      timestamp: timestamp,
    });
  }
}
