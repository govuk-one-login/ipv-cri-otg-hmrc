import * as zlib from "node:zlib";
import { RedactHandler } from "../src/redact-handler";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import mocked = jest.mocked;

let cloudwatchShouldMockThrowError = false;

jest.mock("@aws-sdk/client-cloudwatch-logs", () => {
  const actual = jest.requireActual("@aws-sdk/client-cloudwatch-logs");
  return {
    ...actual,
    CloudWatchLogsClient: jest.fn(() => ({
      send: jest.fn().mockImplementation((command) => {
        if (
          cloudwatchShouldMockThrowError &&
          command instanceof actual.CreateLogStreamCommand
        ) {
          throw new Error("Error creating log stream");
        }
        return {
          message: "",
        };
      }),
    })),
  };
});

describe("redact-handler", () => {
  async function encode(payload: string) {
    return await new Promise<string>((resolve, reject) => {
      zlib.deflate(payload, (_, compressedData) => {
        if (compressedData) {
          const compressedString =
            Buffer.from(compressedData).toString("binary");
          const base64CompressedEvent = Buffer.from(
            compressedString,
            "binary"
          ).toString("base64");
          resolve(base64CompressedEvent);
        } else {
          reject(new Error("Failed to compress data"));
        }
      });
    });
  }

  it("should create log stream when does not exist", async () => {
    const mockDynamoDbClient = mocked(DynamoDBClient);
    mockDynamoDbClient.prototype.send = jest.fn().mockReturnValue({
      Count: 0,
    });

    const piiData = {
      owner: undefined,
      logGroup: "dummy-log-group",
      logStream: "dummy-log-stream",
      subscriptionFilters: undefined,
      messageType: undefined,
      logEvents: [
        {
          id: undefined,
          timestamp: undefined,
          message: "{}",
          extractedFields: undefined,
        },
      ],
    };
    const compressedData = await encode(JSON.stringify(piiData));
    const event = {
      awslogs: {
        data: compressedData,
      },
    };
    const handler = new RedactHandler(mockDynamoDbClient.prototype);
    const result = await handler.handler(event, {});

    expect(result).toStrictEqual({});
  });

  it("should try not create log stream when it already exists", async () => {
    const mockDynamoDbClient = mocked(DynamoDBClient);
    mockDynamoDbClient.prototype.send = jest.fn().mockReturnValue({
      Count: 1,
    });

    const piiData = {
      owner: undefined,
      logGroup: "dummy-log-group",
      logStream: "dummy-log-stream",
      subscriptionFilters: undefined,
      messageType: undefined,
      logEvents: [
        {
          id: undefined,
          timestamp: undefined,
          message: "{}",
          extractedFields: undefined,
        },
      ],
    };
    const compressedData = await encode(JSON.stringify(piiData));
    const event = {
      awslogs: {
        data: compressedData,
      },
    };
    const handler = new RedactHandler(mockDynamoDbClient.prototype);
    const result = await handler.handler(event, {});

    expect(result).toStrictEqual({});
  });

  it("should not fail when running the handler", async () => {
    const piiData = {
      owner: undefined,
      logGroup: "dummy-log-group",
      logStream: "dummy-log-stream",
      subscriptionFilters: undefined,
      messageType: undefined,
      logEvents: [
        {
          id: undefined,
          timestamp: undefined,
          message: "{}",
          extractedFields: undefined,
        },
      ],
    };
    const compressedData = await encode(JSON.stringify(piiData));
    const event = {
      awslogs: {
        data: compressedData,
      },
    };
    const handler = new RedactHandler();
    const result = await handler.handler(event, {});
    expect(result).toStrictEqual({});
  });

  it("should throw when an error occurs creating a log stream", async () => {
    const mockDynamoDbClient = mocked(DynamoDBClient);
    mockDynamoDbClient.prototype.send = jest.fn().mockReturnValue({
      Count: 0,
    });

    cloudwatchShouldMockThrowError = true;
    const piiData = {
      owner: undefined,
      logGroup: "dummy-log-group",
      logStream: "dummy-log-stream",
      subscriptionFilters: undefined,
      messageType: undefined,
      logEvents: [
        {
          id: undefined,
          timestamp: undefined,
          message: "{}",
          extractedFields: undefined,
        },
      ],
    };
    const compressedData = await encode(JSON.stringify(piiData));
    const event = {
      awslogs: {
        data: compressedData,
      },
    };
    const handler = new RedactHandler(mockDynamoDbClient.prototype);

    await expect(handler.handler(event, {})).rejects.toThrow(
      new Error("Error creating log stream")
    );
    cloudwatchShouldMockThrowError = false;
  });
});
