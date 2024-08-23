import { Logger } from "@aws-lambda-powertools/logger";
import {
  CloudWatchLogsClient,
  CreateLogStreamCommand,
  PutLogEventsCommand,
  PutLogEventsCommandOutput,
} from "@aws-sdk/client-cloudwatch-logs";
import { LambdaInterface } from "@aws-lambda-powertools/commons";
import { CloudWatchLogsDecodedData, CloudWatchLogsEvent } from "aws-lambda";
import zlib from "zlib";
import { redact } from "./redactor";

const logger = new Logger();
const cloudwatch = new CloudWatchLogsClient();

export class RedactHandler implements LambdaInterface {
  public async handler(
    event: CloudWatchLogsEvent,
    _context: unknown
  ): Promise<object> {
    try {
      logger.info("Received " + JSON.stringify(event));

      const logDataBase64 = event.awslogs.data;
      const logDataBuffer = Buffer.from(logDataBase64, "base64");
      const decompressedData = zlib.unzipSync(logDataBuffer).toString("utf-8");
      const logEvents: CloudWatchLogsDecodedData = JSON.parse(decompressedData);
      const redactLogGroup = logEvents.logGroup + "-redacted";
      const logStream = logEvents.logStream;

      try {
        await cloudwatch.send(
          new CreateLogStreamCommand({
            logGroupName: redactLogGroup,
            logStreamName: logStream,
          })
        );
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        if (!message.includes("The specified log stream already exists")) {
          throw error;
        }
        logger.info(logStream + " already exists");
      }

      for (const logEvent of logEvents.logEvents) {
        const original = logEvent.message;
        logEvent.message = redact(logEvent.message);
        logger.info("Updated message: " + original + " to " + logEvent.message);
      }

      logger.info("Putting redacted logs into " + redactLogGroup);

      try {
        const response: PutLogEventsCommandOutput = await cloudwatch.send(
          new PutLogEventsCommand({
            logGroupName: redactLogGroup,
            logStreamName: logStream,
            logEvents: logEvents.logEvents.map((event) => ({
              id: event.id,
              message: this.formatMessage(event.message),
              timestamp: event.timestamp,
              extractedFields: event.extractedFields,
            })),
          })
        );
        logger.info(JSON.stringify(response));
      } catch (error) {
        logger.error(
          `Error putting log events into ${redactLogGroup}: ${error}`
        );
        throw error;
      }

      return {};
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Error in RedactHandler: ${message}`);
      throw error;
    }
  }

  private formatMessage(message: string) {
    try {
      return JSON.stringify(JSON.parse(message), null, 2);
    } catch (error) {
      return message;
    }
  }
}

const handlerClass = new RedactHandler();
export const lambdaHandler = handlerClass.handler.bind(handlerClass);
