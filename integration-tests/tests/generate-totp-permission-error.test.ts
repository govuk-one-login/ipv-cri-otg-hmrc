import { HistoryEvent } from "@aws-sdk/client-sfn";
import { SfnContainerHelper } from "./sfn-container-helper";
import * as fs from "fs";
import path from "path";
jest.setTimeout(30_000);

describe("Generate Totp Code", () => {
  let stnContainerHelper: SfnContainerHelper;
  const targetTestCase = "TotpSecretPermissionsErrorUnHappyTest";
  const originalConfigStr = fs.readFileSync(
    path.join(__dirname, "./MockConfigFile.json"),
    "utf-8"
  );
  const originalConfig = JSON.parse(originalConfigStr); // Extract the subset for the target test case
  const getMock = (targetTestCase: string) => {
    return JSON.stringify(
      {
        StateMachines: {
          ["oauth-token-generator"]: {
            TestCases: {
              [targetTestCase]:
                originalConfig.StateMachines["oauth-token-generator"].TestCases[
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
  beforeAll(async () => {
    console.log(`MockConfigFile:${getMock(targetTestCase)}`);
    stnContainerHelper = new SfnContainerHelper(getMock(targetTestCase));
  }, 15_000);
  afterAll(() => stnContainerHelper.shutDown());
  it("should failed due to Invalid Secret", async () => {
    // GIVEN
    const input = JSON.stringify({ valid: "input" });
    // const describeStepFunction =
    //   await stnContainerHelper.describeStepFunction();
    // WHEN
    const responseStepFunction =
      await stnContainerHelper.startStepFunctionExecution(
        "TotpSecretPermissionsErrorUnHappyTest",
        input
        //describeStepFunction.stateMachineArn
      );
    const results = await stnContainerHelper.waitFor(
      (event: HistoryEvent) =>
        event?.type === "TaskStateExited" &&
        event?.stateExitedEventDetails?.name === "Get Totp Secret",
      responseStepFunction
    );
    // THEN
    expect(results).toBeDefined();
    expect(results?.length).toBe(1);
    expect(results[0].stateExitedEventDetails?.output).toBe(
      JSON.stringify({
        Error: "SecretsManager.SecretsManagerException",
        Cause:
          "User: arn:aws:sts::local:assumed-role/stack-StateMachineRole-1SXH7VTMU9WPV/AMSjcZhDHLcUfcUlFEjldMZElLNaIMwq is not authorized to perform: secretsmanager:GetSecretValue on resource: TOT_SECRET because no identity-based policy allows the secretsmanager:GetSecretValue action (Service: SecretsManager, Status Code: 400, Request ID: 585907ec-ee9b-4e4d-a889-2ce3f0bce1cf)",
      })
    );
  });
});
