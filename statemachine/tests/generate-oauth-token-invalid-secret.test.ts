import { HistoryEvent } from "@aws-sdk/client-sfn";
import { SfnContainerHelper } from "./sfn-container-helper";
import * as fs from "fs";
import path from "path";

const targetTestCase = "TotpSecretResourceNotFoundUnHappyTest";

// Read the originalConfig from the file
const originalConfigStr = fs.readFileSync(
  path.join(__dirname, "./MockConfigFile.json"),
  "utf-8"
);
const originalConfig = JSON.parse(originalConfigStr);

// Extract the subset for the target test case
const getMock = (targetTestCase: string) => {
  return JSON.stringify(
    {
      StateMachines: {
        pdpOtgStateMachine: {
          TestCases: {
            [targetTestCase]:
              originalConfig.StateMachines.pdpOtgStateMachine.TestCases[
                targetTestCase
              ],
          },
        },
      },
      MockedResponses: {
        SecretResourceNotFound:
          originalConfig.MockedResponses.SecretResourceNotFound,
      },
    },
    null,
    2
  );
};

//const totpSecretNotFoundConfig = getMock(targetTestCase);

jest.setTimeout(30_000);

describe("Generate Totp Code", () => {
  let stnContainerHelper: SfnContainerHelper;

  beforeAll(async () => {
    stnContainerHelper = new SfnContainerHelper(getMock(targetTestCase));
  });
  afterAll(() => stnContainerHelper.shutDown());
  it("should failed due to Invalid Secret", async () => {
    // GIVEN
    const input = JSON.stringify({ valid: "input" });
    const describeStepFunction = await stnContainerHelper.describeStepFunction();
    // WHEN
    const responseStepFunction =
      await stnContainerHelper.startStepFunctionExecution(
        "GenerateTotpCodeFailedDueToInValidSecret",
        input,
        describeStepFunction.stateMachineArn
      );
    const results = await stnContainerHelper.waitFor(
      (event: HistoryEvent) =>
        event?.type === "TaskStateExited" &&
        event?.stateExitedEventDetails?.name ===
          "Lambda Invoke Generate TOTP Code",
      responseStepFunction
    );
    // THEN
    expect(results).toBeDefined();
    expect(results?.length).toBe(1);
    expect(results[0].stateExitedEventDetails?.output).toBe(
      JSON.stringify({
        Error: "Invalid secret",
        Cause: "invalid secret length",
      })
    );
  });
});
