import { HistoryEvent } from "@aws-sdk/client-sfn";
import { SfnContainerHelper } from "./sfn-container-helper";

jest.setTimeout(40_000);

describe("generate-totp-happy", () => {
  let sfnContainer: SfnContainerHelper;

  beforeAll(async () => {
    sfnContainer = new SfnContainerHelper();
  });

  afterAll(async () => sfnContainer.shutDown());

  it("has a step-function docker container running", async () => {
    expect(sfnContainer.getContainer()).toBeDefined();
  });

  it("should return OAuthAccessToken", async () => {
    const input = JSON.stringify({ valid: "input" });
    const responseStepFunction = await sfnContainer.startStepFunctionExecution(
      "HappyPathTest",
      input
    );
    const results = await sfnContainer.waitFor(
      (event: HistoryEvent) =>
        event?.type === "TaskStateExited" &&
        event?.stateExitedEventDetails?.name === "Put OAuthAccessToken",
      responseStepFunction
    );
    expect(results).toBeDefined();
    expect(results?.length).toBe(1);
    expect(results[0].stateExitedEventDetails?.output).toBe(
      JSON.stringify({
        StatusCode: 200,
        Payload: {
          token: "body.access_token",
          tokenExpiry: 866868768688,
        },
      })
    );
  });
});
