import { HistoryEvent } from "@aws-sdk/client-sfn";
import { SfnContainerHelper } from "./sfn-container-helper";

jest.setTimeout(200_000);

describe("oauth-token-generator-unhappy", () => {
  let sfnContainer: SfnContainerHelper;

  beforeAll(async () => {
    sfnContainer = new SfnContainerHelper();
  });

  afterAll(async () => sfnContainer.shutDown());

  it("has a step-function docker container running", async () => {
    expect(sfnContainer.getContainer()).toBeDefined();
  });

  it("should fail when HMRC lambda responds with errors", async () => {
    const input = JSON.stringify({ tokenType: "stub" });
    const responseStepFunction = await sfnContainer.startStepFunctionExecution(
      "hmrcAPIFail",
      input
    );
    const lambdaError = await sfnContainer.waitFor(
      (event: HistoryEvent) =>
        event?.type === "TaskFailed" &&
        event?.taskFailedEventDetails?.resourceType == "lambda",
      responseStepFunction
    );
    const results = await sfnContainer.waitFor(
      (event: HistoryEvent) => event?.stateEnteredEventDetails?.name === "Fail",
      responseStepFunction
    );

    const parsedResults = JSON.parse(
      results[0]?.stateEnteredEventDetails?.input ?? "{}"
    );

    expect(lambdaError).toHaveLength(4);
    lambdaError.forEach((lambdaErr) => {
      expect(lambdaErr?.taskFailedEventDetails?.cause).toBe(
        "Internal Server Exception"
      );
    });

    expect(parsedResults).toEqual(
      expect.objectContaining({
        fail: expect.objectContaining({
          Error: expect.any(String),
          Cause: expect.any(String),
        }),
      })
    );
  });
});
