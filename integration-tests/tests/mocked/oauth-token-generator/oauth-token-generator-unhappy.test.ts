import { SfnContainerHelper } from "./sfn-container-helper";
import { HistoryEvent } from "@aws-sdk/client-sfn";

jest.setTimeout(120_000);

describe("oauth-token-generator-unhappy", () => {
  let sfnContainer: SfnContainerHelper;

  beforeAll(async () => {
    sfnContainer = new SfnContainerHelper();
  });

  afterAll(async () => sfnContainer.shutDown());

  xit("has a step-function docker container running", async () => {
    expect(sfnContainer.getContainer()).toBeDefined();
  });

  xit("should fail when HMRC responds with an error", async () => {
    const input = JSON.stringify({ tokenType: "stub" });
    const responseStepFunction = await sfnContainer.startStepFunctionExecution(
      "hmrcAPIFail",
      input
    );
    const results = await sfnContainer.waitFor(
      (event: HistoryEvent) => event?.stateExitedEventDetails?.name === "Fail",
      responseStepFunction
    );
    expect(results[results.length].type).toBe("ParallelStateFailed");
  });
});
