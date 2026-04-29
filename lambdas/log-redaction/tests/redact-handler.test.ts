import * as zlib from "node:zlib";
import { RedactHandler } from "../src/redact-handler";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  CloudWatchLogsClient,
  CreateLogStreamCommand,
  PutLogEventsCommand,
  ResourceAlreadyExistsException,
} from "@aws-sdk/client-cloudwatch-logs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockClient } from "aws-sdk-client-mock";

const mockCloudwatchClient = mockClient(CloudWatchLogsClient);
mockCloudwatchClient.on(PutLogEventsCommand).resolves({});

const mockDDB = mockClient(DynamoDBClient);
const mockDynamoDbClient = mockDDB as typeof mockDDB & DynamoDBClient; // Ensure that mockDynamoDbClient satisfies the DynamoDBClient class prototype

describe("redact-handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
    mockDynamoDbClient.resolves({
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
    const handler = new RedactHandler(mockDynamoDbClient);
    const result = await handler.handler(event, {});

    expect(result).toStrictEqual({});
  });

  it("should try not create log stream when it already exists", async () => {
    mockDynamoDbClient.resolves({
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
    const handler = new RedactHandler(mockDynamoDbClient);
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
    mockDynamoDbClient.resolves({
      Count: 0,
    });

    mockCloudwatchClient
      .on(CreateLogStreamCommand)
      .rejects(new Error("Error creating log stream"));

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
    const handler = new RedactHandler(mockDynamoDbClient);

    await expect(handler.handler(event, {})).rejects.toThrow(
      new Error("Error creating log stream")
    );
  });

  it("should not throw when a ResourceAlreadyExistsException error occurs creating a log stream", async () => {
    mockDynamoDbClient.resolves({
      Count: 0,
    });

    mockCloudwatchClient.on(CreateLogStreamCommand).rejectsOnce(
      new ResourceAlreadyExistsException({
        $metadata: {},
        message: "Resource already exists!",
      })
    );

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
    const handler = new RedactHandler(mockDynamoDbClient);

    const result = await handler.handler(event, {});
    expect(result).toStrictEqual({});
  });
});
