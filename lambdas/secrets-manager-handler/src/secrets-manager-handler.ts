import { LambdaInterface } from "@aws-lambda-powertools/commons";
import { Logger } from "@aws-lambda-powertools/logger";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const logger = new Logger();

const secretsManager = new SecretsManagerClient({
  region: process.env.AWS_REGION,
});

export class SecretsManagerHandler implements LambdaInterface {
  public async handler(
    event: { secretName: string },
    _context: unknown
  ): Promise<{ value: string }> {
    try {
      logger.info(`Fetching ${event.secretName} from secrets manager`);
      const result = await secretsManager.send(
        new GetSecretValueCommand({
          SecretId: event.secretName,
        })
      );
      if (result?.SecretString) {
        return {
          value: result.SecretString,
        };
      }
      throw new Error(`${event.secretName} not found`);
    } catch (error: unknown) {
      let message;
      if (error instanceof Error) message = error.message;
      else message = String(error);
      logger.error("Error in SecretsManager " + message);
      throw error;
    }
  }
}

const handlerClass = new SecretsManagerHandler();
export const lambdaHandler = handlerClass.handler.bind(handlerClass);
