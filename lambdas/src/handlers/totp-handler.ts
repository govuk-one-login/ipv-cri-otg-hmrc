import { Context } from "aws-lambda";
import { LambdaInterface } from "@aws-lambda-powertools/commons";
import { TotpService } from "../services/totp-service";

export class TotpHandler implements LambdaInterface {
  public async handler(event: any, _context: Context): Promise<any> {
    return await new TotpService().generateTOTP(
      "ABCDEFGHIJKLMNOP",
      "SHA-512",
      30,
      1622502000000,
      8
    );
  }
}
