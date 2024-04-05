import { HistoryEvent } from "@aws-sdk/client-sfn";
import { SfnContainerHelper } from "./sfn-container-helper";

jest.setTimeout(60_000);

describe("oauth-token-generator-happy.test", () => {
  let sfnContainer: SfnContainerHelper;

  beforeAll(async () => {
    sfnContainer = new SfnContainerHelper();
  });

  afterAll(async () => sfnContainer.shutDown());

  it("has a step-function docker container running", async () => {
    expect(sfnContainer.getContainer()).toBeDefined();
  });

  it("should successfully pass a happy path journey", async () => {
    const input = JSON.stringify({ tokenType: "stub" });
    const responseStepFunction = await sfnContainer.startStepFunctionExecution(
      "Happy",
      input
    );
    const results = await sfnContainer.waitFor(
      (event: HistoryEvent) =>
        event?.stateExitedEventDetails?.name === "Success",
      responseStepFunction
    );
    expect(results).toBeDefined();
    expect(results[0].stateExitedEventDetails?.output).toBe("[{}]");
  });

  it("should succeed on final attempt, after multiple lambda errors retries", async () => {
    const input = JSON.stringify({ tokenType: "stub" });
    const responseStepFunction = await sfnContainer.startStepFunctionExecution(
      "HappyOnLastTry",
      input
    );
    const lambdaError = await sfnContainer.waitFor(
      (event: HistoryEvent) =>
        event?.type === "TaskFailed" &&
        event?.taskFailedEventDetails?.resourceType == "lambda",
      responseStepFunction
    );
    const results = await sfnContainer.waitFor(
      (event: HistoryEvent) =>
        event?.stateExitedEventDetails?.name === "Success",
      responseStepFunction
    );

    expect(lambdaError).toHaveLength(3);
    expect(lambdaError[0]?.taskFailedEventDetails?.cause).toBe(
      "Lambda resource is not ready."
    );
    expect(lambdaError[1]?.taskFailedEventDetails?.cause).toBe(
      "Lambda timed out."
    );
    expect(lambdaError[2]?.taskFailedEventDetails?.cause).toBe(
      "Lambda timed out."
    );

    expect(results[0].stateExitedEventDetails?.output).toBe("[{}]");
  });
});
