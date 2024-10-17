import { HistoryEvent } from "@aws-sdk/client-sfn";
import { SfnContainerHelper } from "./sfn-container-helper";
import { StateMachineDefinition } from "./oauth-token-asl-types";
import { StepFunctionConstants } from "./sfn-constants";

jest.setTimeout(60_000);

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

    const newStateMachineDefinition = setRefreshTokenRetryMaxAttemptsToZero();
    const responseStepFunction = await sfnContainer.startStepFunctionExecution(
      "hmrcAPIFail",
      input,
      newStateMachineDefinition
    );

    const failedStateEvent = (e: HistoryEvent) =>
      e?.stateEnteredEventDetails?.name === "Fail";

    const results = await sfnContainer.waitFor(
      (event: HistoryEvent) =>
        (event?.type === "TaskFailed" &&
          event?.taskFailedEventDetails?.resourceType == "lambda") ||
        failedStateEvent(event),
      responseStepFunction
    );

    const parsedResults = JSON.parse(
      results[4]?.stateEnteredEventDetails?.input ?? "{}"
    );

    expect(results).toHaveLength(5);
    results
      .filter((event) => !failedStateEvent(event))
      .forEach((lambdaErr) => {
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

const setRefreshTokenRetryMaxAttemptsToZero = () => {
  const oauthTokenAsl = StepFunctionConstants.STATE_MACHINE_ASL;
  const sfnDefinition = JSON.parse(oauthTokenAsl) as StateMachineDefinition;

  sfnDefinition.States["Refresh Token"].Retry[0].MaxAttempts = 0;
  return JSON.stringify(sfnDefinition);
};
