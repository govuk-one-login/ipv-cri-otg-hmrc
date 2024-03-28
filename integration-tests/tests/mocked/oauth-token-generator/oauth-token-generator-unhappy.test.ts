import { SfnContainerHelper } from "./sfn-container-helper";

jest.setTimeout(120_000);

describe("generate-totp-unhappy", () => {
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
      (_) => true,
      responseStepFunction
    );
    expect(results[results.length - 2].type).toBe("TaskFailed");
  });
});
