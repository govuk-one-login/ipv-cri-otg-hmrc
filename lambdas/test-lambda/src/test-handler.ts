import { LambdaInterface } from "@aws-lambda-powertools/commons";
import { Logger } from "@aws-lambda-powertools/logger";

const logger = new Logger();

export class TestHandler implements LambdaInterface {
  public async handler(_event: unknown, _context: unknown): Promise<unknown> {
    const result = await fetch(
      "https://test-api.service.hmrc.gov.uk/oauth/token",
      {
        method: "POST",
        body: JSON.stringify({}),
      }
    );

    const body = await result.text();

    logger.info("Received status code: " + result.status);
    logger.info("Body: " + body);
    return {};
  }
}

const handlerClass = new TestHandler();
export const lambdaHandler = handlerClass.handler.bind(handlerClass);
