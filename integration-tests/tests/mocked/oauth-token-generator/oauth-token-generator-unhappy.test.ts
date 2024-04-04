import { HistoryEvent, StateEnteredEventDetails } from "@aws-sdk/client-sfn";
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

  it("should fail when HMRC responds with an error", async () => {
    const input = JSON.stringify({ tokenType: "stub" });
    const responseStepFunction = await sfnContainer.startStepFunctionExecution(
      "hmrcAPIFail",
      input
    );
    const results = await sfnContainer.waitFor(
      (event: HistoryEvent) => event?.stateEnteredEventDetails?.name === "Fail",
      responseStepFunction
    );

    const result: StateEnteredEventDetails = JSON.parse(
      results[0]?.stateEnteredEventDetails?.input as string
    );

    expect(result).toEqual(
      expect.objectContaining({
        fail: expect.objectContaining({
          Error: expect.any(String),
          Cause: expect.any(String),
        }),
      })
    );
  });
});
