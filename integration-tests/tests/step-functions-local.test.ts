import { HistoryEvent } from "@aws-sdk/client-sfn";
import { SfnContainerHelper } from "./sfn-container-helper";

jest.setTimeout(30_000);

describe("step-function-local", () => {
  describe("OAuth Access token", () => {
    let stnContainerHelper: SfnContainerHelper;
    describe("successfully generated", () => {
      beforeAll(async () => {
        stnContainerHelper = new SfnContainerHelper();
      }, 15_000);
      afterAll(() => stnContainerHelper.shutDown());
      it("checks container is running", () => {
        expect(stnContainerHelper.getContainer()).toBeDefined();
      });

      describe("happy Case Scenario", () => {
        it("should return OAuthAccessToken", async () => {
          // GIVEN
          const input = JSON.stringify({ valid: "input" });
          // WHEN
          const responseStepFunction =
            await stnContainerHelper.startStepFunctionExecution(
              "HappyPathTest",
              input
            );
          const results = await stnContainerHelper.waitFor(
            (event: HistoryEvent) =>
              event?.type === "TaskStateExited" &&
              event?.stateExitedEventDetails?.name === "Put OAuthAccessToken",
            responseStepFunction
          );
          // THEN
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
    });

    describe("TOTP_SECRET identifier", () => {
      let stnContainerHelper: SfnContainerHelper;
      beforeAll(async () => {
        stnContainerHelper = new SfnContainerHelper();
      });
      afterAll(() => stnContainerHelper.shutDown());
      it("should return Secrets Manager can't find the specified secret", async () => {
        // GIVEN
        const input = JSON.stringify({ valid: "input" });
        // WHEN
        const responseStepFunction =
          await stnContainerHelper.startStepFunctionExecution(
            "TotpSecretResourceNotFoundUnHappyTest",
            input
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
            Error: "SecretsManager.ResourceNotFoundException",
            Cause:
              "Secrets Manager can't find the specified secret. (Service: SecretsManager, Status Code: 400, Request ID: 02d1a25c-ef11-4d4b-92f7-323330a9a3c2)",
          })
        );
      });
      it("should return Secrets Manager permission not configured", async () => {
        // GIVEN
        const input = JSON.stringify({ valid: "input" });
        // WHEN
        const responseStepFunction =
          await stnContainerHelper.startStepFunctionExecution(
            "TotpSecretPermissionsErrorUnHappyTest",
            input
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

    describe("CLIENT_SECRET identifier", () => {
      let stnContainerHelper: SfnContainerHelper;
      beforeAll(async () => {
        stnContainerHelper = new SfnContainerHelper();
      });
      afterAll(() => stnContainerHelper.shutDown());

      it("should return Secrets Manager can't find the specified secret", async () => {
        // GIVEN
        const input = JSON.stringify({ valid: "input" });
        // WHEN
        const responseStepFunction =
          await stnContainerHelper.startStepFunctionExecution(
            "ClientSecretResourceNotFoundUnHappyTest",
            input
          );
        const results = await stnContainerHelper.waitFor(
          (event: HistoryEvent) =>
            event?.type === "TaskStateExited" &&
            event?.stateExitedEventDetails?.name === "Get Client Secret",
          responseStepFunction
        );
        // THEN
        expect(results).toBeDefined();
        expect(results?.length).toBe(1);
        expect(results[0].stateExitedEventDetails?.output).toBe(
          JSON.stringify({
            Error: "SecretsManager.ResourceNotFoundException",
            Cause:
              "Secrets Manager can't find the specified secret. (Service: SecretsManager, Status Code: 400, Request ID: 02d1a25c-ef11-4d4b-92f7-323330a9a3c2)",
          })
        );
      });
      it("should return Secrets Manager permission not configured", async () => {
        // GIVEN
        const input = JSON.stringify({ valid: "input" });
        // WHEN
        const responseStepFunction =
          await stnContainerHelper.startStepFunctionExecution(
            "ClientSecretPermissionsErrorUnHappyTest",
            input
          );
        const results = await stnContainerHelper.waitFor(
          (event: HistoryEvent) =>
            event?.type === "TaskStateExited" &&
            event?.stateExitedEventDetails?.name === "Get Client Secret",
          responseStepFunction
        );
        // THEN
        expect(results).toBeDefined();
        expect(results?.length).toBe(1);
        expect(results[0].stateExitedEventDetails?.output).toBe(
          JSON.stringify({
            Error: "SecretsManager.SecretsManagerException",
            Cause:
              "User: arn:aws:sts::local:assumed-role/stack-StateMachineRole-1SXH7VTMU9WPV/AMSjcZhDHLcUfcUlFEjldMZElLNaIMwq is not authorized to perform: secretsmanager:GetSecretValue on resource: CLIENT_SECRET because no identity-based policy allows the secretsmanager:GetSecretValue action (Service: SecretsManager, Status Code: 400, Request ID: 585907ec-ee9b-4e4d-a889-2ce3f0bce1cf)",
          })
        );
      });
    });

    describe("OAuth Url parameter not found", () => {
      let stnContainerHelper: SfnContainerHelper;

      beforeAll(async () => {
        stnContainerHelper = new SfnContainerHelper();
      });
      afterAll(() => stnContainerHelper.shutDown());
      it("should return OAuth Url parameter not Found", async () => {
        // GIVEN
        const input = JSON.stringify({ valid: "input" });
        // WHEN
        const responseStepFunction =
          await stnContainerHelper.startStepFunctionExecution(
            "OAuthURLParameterResourceNotFoundUnHappyTest",
            input
          );
        const results = await stnContainerHelper.waitFor(
          (event: HistoryEvent) =>
            event?.type === "TaskStateExited" &&
            event?.stateExitedEventDetails?.name === "Get OAuth URL",
          responseStepFunction
        );
        // THEN
        expect(results).toBeDefined();
        expect(results?.length).toBe(1);
        expect(results[0].stateExitedEventDetails?.output).toBe(
          JSON.stringify({
            Error: "Ssm.ParameterNotFoundException",
            Cause:
              "Service returned error code ParameterNotFound (Service: Ssm, Status Code: 400, Request ID: 4dc5822a-c05b-4f7d-a454-13b19c464876)",
          })
        );
      });
      it("should return OAuth Url parameter permission not configured", async () => {
        // GIVEN
        const input = JSON.stringify({ valid: "input" });
        // WHEN
        const responseStepFunction =
          await stnContainerHelper.startStepFunctionExecution(
            "OAuthURLParameterResourcePermissionUnHappyTest",
            input
          );
        const results = await stnContainerHelper.waitFor(
          (event: HistoryEvent) =>
            event?.type === "TaskStateExited" &&
            event?.stateExitedEventDetails?.name === "Get OAuth URL",
          responseStepFunction
        );
        // THEN
        expect(results).toBeDefined();
        expect(results?.length).toBe(1);
        expect(results[0].stateExitedEventDetails?.output).toBe(
          JSON.stringify({
            Error: "Ssm.SsmException",
            Cause:
              "User: arn:aws:sts::local:assumed-role/ola-otg-stack-OtgStateMachineRole-1SXH7VTMU9WPV/giJpYtNQeUFZRDAVegxozxZKXSxsRAoM is not authorized to perform: ssm:GetParameter on resource: arn:aws:ssm:eu-west-2:local:parameter/hmrc_oauth_url because no identity-based policy allows the ssm:GetParameter action (Service: Ssm, Status Code: 400, Request ID: 7ee4e39f-3fed-4b8f-afab-7b43c8c897bc)",
          })
        );
      });
    });

    describe("Put OAuth access token expiry", () => {
      let stnContainerHelper: SfnContainerHelper;

      beforeAll(async () => {
        stnContainerHelper = new SfnContainerHelper();
      });
      afterAll(() => stnContainerHelper.shutDown());
      it("should return OAuth access token expiry parameter permission not configured", async () => {
        // GIVEN
        const input = JSON.stringify({ valid: "input" });
        // WHEN
        const responseStepFunction =
          await stnContainerHelper.startStepFunctionExecution(
            "PutOAuthAccessTokenExpiryPermissionUnHappyTest",
            input
          );
        const results = await stnContainerHelper.waitFor(
          (event: HistoryEvent) =>
            event?.type === "TaskStateExited" &&
            event?.stateExitedEventDetails?.name === "Parallel",
          responseStepFunction
        );
        // THEN
        expect(results).toBeDefined();
        expect(results?.length).toBe(1);
        expect(results[0].stateExitedEventDetails?.output).toBe(
          JSON.stringify({
            Error: "Ssm.SsmException",
            Cause:
              "User: arn:aws:sts::local:assumed-role/ola-otg-stack-OtgStateMachineRole-1SXH7VTMU9WPV/opeMbZdaKgpxHjImgSCIKmpFPCYyiSfz is not authorized to perform: ssm:PutParameter on resource: arn:aws:ssm:eu-west-2:local:parameter/hmrc-bearer-token-expiry because no identity-based policy allows the ssm:PutParameter action (Service: Ssm, Status Code: 400, Request ID: 77f708ac-d698-44d1-b99e-34ec6a680edc)",
          })
        );
      });
    });
    describe("Put OAuth access token", () => {
      let stnContainerHelper: SfnContainerHelper;

      beforeAll(async () => {
        stnContainerHelper = new SfnContainerHelper();
      });
      afterAll(() => stnContainerHelper.shutDown());

      it("should return Put OAuth access token secret permission not configured", async () => {
        // GIVEN
        const input = JSON.stringify({ valid: "input" });
        // WHEN
        const responseStepFunction =
          await stnContainerHelper.startStepFunctionExecution(
            "PutOAuthAccessTokenSecretPermissionUnHappyTest",
            input
          );
        const results = await stnContainerHelper.waitFor(
          (event: HistoryEvent) =>
            event?.type === "TaskStateExited" &&
            event?.stateExitedEventDetails?.name === "Parallel",
          responseStepFunction
        );
        // THEN
        expect(results).toBeDefined();
        expect(results?.length).toBe(1);
        expect(results[0].stateExitedEventDetails?.output).toBe(
          JSON.stringify({
            Error: "SecretsManager.SecretsManagerException",
            Cause:
              "User: arn:aws:sts::local:assumed-role/ola-otg-stack-OtgStateMachineRole-1SXH7VTMU9WPV/oBBIiAoqlxurTyhMKpQPbezGVkvPfNLb is not authorized to perform: secretsmanager:PutSecretValue on resource: demo_BearerToken because no identity-based policy allows the secretsmanager:PutSecretValue action (Service: SecretsManager, Status Code: 400, Request ID: 7ef591b1-cf97-4019-8a51-0bb4e862f81b)",
          })
        );
      });
    });
    describe("Generate Totp Code", () => {
      let stnContainerHelper: SfnContainerHelper;

      beforeAll(async () => {
        stnContainerHelper = new SfnContainerHelper();
      });
      afterAll(() => stnContainerHelper.shutDown());
      it("should failed due to Invalid Secret", async () => {
        // GIVEN
        const input = JSON.stringify({ valid: "input" });
        // WHEN
        const responseStepFunction =
          await stnContainerHelper.startStepFunctionExecution(
            "GenerateTotpCodeFailedDueToInValidSecret",
            input
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
      it("should failed due to Absent Secret", async () => {
        // GIVEN
        const input = JSON.stringify({ valid: "input" });
        // WHEN
        const responseStepFunction =
          await stnContainerHelper.startStepFunctionExecution(
            "GenerateTotpCodeFailedDueToSecretAbsentTest",
            input
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
            Error: "No secret string present.",
            Cause: "",
          })
        );
      });
    });
    describe("Generate OAuth Token", () => {
      let stnContainerHelper: SfnContainerHelper;

      beforeAll(async () => {
        stnContainerHelper = new SfnContainerHelper();
      });
      afterAll(() => stnContainerHelper.shutDown());
      it("should failed Due To Server Error", async () => {
        // GIVEN
        const input = JSON.stringify({ valid: "input" });
        // WHEN
        const responseStepFunction =
          await stnContainerHelper.startStepFunctionExecution(
            "GenerateOAuthTokenFailedDueToServerErrorTest",
            input
          );
        const results = await stnContainerHelper.waitFor(
          (event: HistoryEvent) =>
            event?.type === "TaskStateExited" &&
            event?.stateExitedEventDetails?.name ===
              "Lambda Invoke Generate OAuth Access Token",
          responseStepFunction
        );
        // THEN
        expect(results).toBeDefined();
        expect(results?.length).toBe(1);
        expect(results[0].stateExitedEventDetails?.output).toBe(
          JSON.stringify({
            Error: "Error in BearerTokenHandler: server error",
            Cause: "Internal Server Error",
          })
        );
      });
    });
  });
});
