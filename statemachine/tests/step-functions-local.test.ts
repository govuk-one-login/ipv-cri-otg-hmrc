import {
  CreateStateMachineCommand,
  GetExecutionHistoryCommand,
  GetExecutionHistoryCommandOutput,
  HistoryEvent,
  SFNClient,
  StartExecutionCommand,
  StartExecutionCommandOutput,
} from "@aws-sdk/client-sfn";
import { StepFunctionConstants } from "./step-functions-constants";
import {
  DockerComposeEnvironment,
  StartedDockerComposeEnvironment,
  Wait,
} from "testcontainers";

jest.setTimeout(30_000);

describe("step-function-local", () => {
  describe("OAuth Access token", () => {
    let composeEnvironment: StartedDockerComposeEnvironment;
    let sfnClient: SFNClient;

    describe("successfully generated", () => {
      beforeAll(async () => {
        composeEnvironment = await createTestContainer();
        sfnClient = createSfnClient();

        await sleep(20_000); // Additional delay to ensure container readiness
      });
      afterAll(async () => await composeEnvironment?.down());
      it("checks container is running", () => {
        expect(
          composeEnvironment?.getContainer("stepfunction_local")?.getId()
        ).toBeDefined();
      });
      const happyCaseScenarioData: stateData = {
        scenario: "HappyPathTest",
        totp_secret: {
          input: { valid: "input" },
          output: {
            Name: "TOTP_SECRET",
            SecretString: "IWRERERWERWR",
          },
        },
        totp_code: {
          input: {
            Name: "TOTP_SECRET",
            SecretString: "IWRERERWERWR",
          },
          output: {
            totp: "35635930",
          },
        },
        clientId: {
          input: { totp: "35635930" },
          output: {
            totp: "35635930",
            clientId: {
              value: "afkuhjsfasffsdfjknjj",
            },
          },
        },
        client_secret: {
          input: {
            totp: "35635930",
            clientId: {
              value: "afkuhjsfasffsdfjknjj",
            },
          },
          output: {
            totp: "35635930",
            clientId: {
              value: "afkuhjsfasffsdfjknjj",
            },
            clientSecret: {
              value: "12c0cff2-eacc-4d9b-840b-ebc1e0e15686",
            },
          },
        },
        oauth_url: {
          input: {
            totp: "35635930",
            clientId: {
              value: "afkuhjsfasffsdfjknjj",
            },
            clientSecret: {
              value: "12c0cff2-eacc-4d9b-840b-ebc1e0e15686",
            },
          },
          output: {
            totp: "35635930",
            clientId: {
              value: "afkuhjsfasffsdfjknjj",
            },
            clientSecret: {
              value: "12c0cff2-eacc-4d9b-840b-ebc1e0e15686",
            },
            oAuthURL: {
              value: "test-oauth-token-url",
            },
          },
        },
        oauth_token: {
          input: {
            totp: "35635930",
            clientId: {
              value: "afkuhjsfasffsdfjknjj",
            },
            clientSecret: {
              value: "12c0cff2-eacc-4d9b-840b-ebc1e0e15686",
            },
            oAuthURL: {
              value: "test-oauth-token-url",
            },
          },
          output: {
            StatusCode: 200,
            Payload: {
              token: "body.access_token",
              tokenExpiry: 866868768688,
            },
          },
        },
        put_access_token_expiry: {
          input: {
            StatusCode: 200,
            Payload: {
              token: "body.access_token",
              tokenExpiry: 866868768688,
            },
          },
          output: {
            StatusCode: 200,
          },
        },
        put_access_token: {
          input: {
            StatusCode: 200,
            Payload: {
              token: "body.access_token",
              tokenExpiry: 866868768688,
            },
          },
          output: {
            StatusCode: 200,
            Payload: {
              token: "body.access_token",
              tokenExpiry: 866868768688,
            },
          },
        },
      };

      describe.each(mapToTestParams(happyCaseScenarioData))(
        "$mockTestCase",
        ({
          mockTestCaseExecution,
          mockTestCase,
          sfnInput,
          sfnExpectedOutput,
        }) => {
          it(`should return ${JSON.stringify(
            sfnExpectedOutput
          )} when supplied ${JSON.stringify(sfnInput)}`, async () => {
            // GIVEN
            const input = JSON.stringify(sfnInput);
            // WHEN
            const responseStepFunction = await startStepFunctionExecution(
              mockTestCaseExecution,
              input
            );
            const results = await waitFor(
              (event) =>
                event?.type === "TaskStateExited" &&
                event?.stateExitedEventDetails?.name === mockTestCase,
              responseStepFunction
            );
            // THEN
            expect(results).toBeDefined();
            expect(results?.length).toBe(1);
            expect(results[0].stateExitedEventDetails?.output).toBe(
              JSON.stringify(sfnExpectedOutput)
            );
          });
        }
      );
    });

    describe("TOTP_SECRET identifier not found", () => {
      beforeAll(async () => {
        composeEnvironment = await createTestContainer();
        sfnClient = createSfnClient();

        await sleep(20_000); // Additional delay to ensure container readiness
      });
      afterAll(async () => await composeEnvironment?.down());

      const totpSecretIdentifierNotFoundScenario: stateData = {
        scenario: "TotpSecretResourceNotFoundUnHappyTest",
        totp_secret: {
          input: { valid: "input" },
          output: JSON.stringify({
            Error: "SecretsManager.ResourceNotFoundException",
            Cause:
              "Secrets Manager can't find the specified secret. (Service: SecretsManager, Status Code: 400, Request ID: 02d1a25c-ef11-4d4b-92f7-323330a9a3c2)",
          }),
        },
      };

      describe.each(mapToTestParams(totpSecretIdentifierNotFoundScenario))(
        "$mockTestCase",
        ({
          mockTestCaseExecution,
          mockTestCase,
          sfnInput,
          sfnExpectedOutput,
        }) => {
          it(`should return ${sfnExpectedOutput} when supplied ${sfnInput}`, async () => {
            // GIVEN
            const input = JSON.stringify(sfnInput);
            // WHEN
            const responseStepFunction = await startStepFunctionExecution(
              mockTestCaseExecution,
              input
            );
            const resultsStateEntered = await waitFor(
              (event) =>
                event.type == "TaskStateEntered" &&
                event.stateEnteredEventDetails?.name == mockTestCase,
              responseStepFunction
            );
            const resultsTaskSucceeded = await waitFor(
              (event) => event.type === "TaskSucceeded",
              responseStepFunction
            );
            const resultsTaskFailed = await waitFor(
              (event) =>
                event.type === "TaskFailed" &&
                event.taskFailedEventDetails?.resource ===
                  "secretsmanager:getSecretValue",
              responseStepFunction
            );
            const resultsTaskExited = await waitFor(
              (event) => event.type == "PassStateEntered",
              responseStepFunction
            );
            const resultsExecutedFinished = await waitFor(
              (event) => event.type == "ExecutionSucceeded",
              responseStepFunction
            );
            // THEN
            expect(resultsStateEntered).toBeDefined();
            expect(resultsStateEntered?.length).toBe(1);
            expect(resultsStateEntered[0].stateEnteredEventDetails?.input).toBe(
              JSON.stringify(sfnInput)
            );
            expect(resultsTaskSucceeded).toBeDefined();
            expect(resultsTaskSucceeded?.length).toBe(0);

            expect(resultsTaskFailed).toBeDefined();
            expect(resultsTaskFailed?.length).toBe(1);
            expect(
              resultsTaskFailed[0]?.taskFailedEventDetails?.cause
            ).toContain("Secrets Manager can't find the specified secret.");
            expect(resultsTaskExited[0].stateEnteredEventDetails?.name).toBe(
              "Handle GetTOTPSecret error"
            );
            expect(
              resultsExecutedFinished[0].executionSucceededEventDetails?.output
            ).toEqual(sfnExpectedOutput);
          });
        }
      );
    });

    describe("TOTP_SECRET permission not configured", () => {
      beforeAll(async () => {
        composeEnvironment = await createTestContainer();
        sfnClient = createSfnClient();

        await sleep(20_000); // Additional delay to ensure container readiness
      });
      afterAll(async () => await composeEnvironment?.down());

      const totpSecretPermissionsNotConfigured: stateData = {
        scenario: "TotpSecretPermissionsErrorUnHappyTest",
        totp_secret: {
          input: { valid: "input" },
          output: JSON.stringify({
            Error: "SecretsManager.SecretsManagerException",
            Cause:
              "User: arn:aws:sts::local:assumed-role/stack-StateMachineRole-1SXH7VTMU9WPV/AMSjcZhDHLcUfcUlFEjldMZElLNaIMwq is not authorized to perform: secretsmanager:GetSecretValue on resource: TOT_SECRET because no identity-based policy allows the secretsmanager:GetSecretValue action (Service: SecretsManager, Status Code: 400, Request ID: 585907ec-ee9b-4e4d-a889-2ce3f0bce1cf)",
          }),
        },
      };

      describe.each(mapToTestParams(totpSecretPermissionsNotConfigured))(
        "$mockTestCase",
        ({
          mockTestCaseExecution,
          mockTestCase,
          sfnInput,
          sfnExpectedOutput,
        }) => {
          it(`should return ${sfnExpectedOutput} when supplied ${sfnInput}`, async () => {
            // GIVEN
            const input = JSON.stringify(sfnInput);
            // WHEN
            const responseStepFunction = await startStepFunctionExecution(
              mockTestCaseExecution,
              input
            );
            const resultsStateEntered = await waitFor(
              (event) =>
                event.type == "TaskStateEntered" &&
                event.stateEnteredEventDetails?.name == mockTestCase,
              responseStepFunction
            );
            const resultsTaskExited = await waitFor(
              (event) => event.type == "PassStateEntered",
              responseStepFunction
            );
            const resultsExecutedFinished = await waitFor(
              (event) => event.type == "ExecutionSucceeded",
              responseStepFunction
            );
            // THEN
            expect(resultsStateEntered).toBeDefined();
            expect(resultsStateEntered?.length).toBe(1);
            expect(resultsStateEntered[0].stateEnteredEventDetails?.input).toBe(
              JSON.stringify(sfnInput)
            );
            expect(resultsTaskExited).toBeDefined();
            expect(resultsTaskExited?.length).toBe(1);
            expect(resultsTaskExited[0].stateEnteredEventDetails?.name).toBe(
              "Handle GetTOTPSecret error"
            );
            expect(
              resultsExecutedFinished[0].executionSucceededEventDetails?.output
            ).toEqual(sfnExpectedOutput);
          });
        }
      );
    });

    describe("CLIENT_SECRET identifier not found", () => {
      beforeAll(async () => {
        composeEnvironment = await createTestContainer();
        sfnClient = createSfnClient();

        await sleep(20_000); // Additional delay to ensure container readiness
      });
      afterAll(async () => await composeEnvironment?.down());

      const clientSecretNotFoundData: stateData = {
        scenario: "ClientSecretResourceNotFoundUnHappyTest",
        totp_secret: {
          input: { valid: "input" },
          output: {
            Name: "TOTP_SECRET",
            SecretString: "IWRERERWERWR",
          },
        },
        totp_code: {
          input: {
            Name: "TOTP_SECRET",
            SecretString: "IWRERERWERWR",
          },
          output: {
            totp: "35635930",
          },
        },
        clientId: {
          input: { totp: "35635930" },
          output: {
            totp: "35635930",
            clientId: {
              value: "afkuhjsfasffsdfjknjj",
            },
          },
        },
        client_secret: {
          input: {
            totp: "35635930",
            clientId: {
              value: "afkuhjsfasffsdfjknjj",
            },
          },
          output: {
            Error: "SecretsManager.ResourceNotFoundException",
            Cause:
              "Secrets Manager can't find the specified secret. (Service: SecretsManager, Status Code: 400, Request ID: 02d1a25c-ef11-4d4b-92f7-323330a9a3c2)",
          },
        },
      };

      describe.each(mapToTestParams(clientSecretNotFoundData))(
        "$mockTestCase",
        ({
          mockTestCaseExecution,
          mockTestCase,
          sfnInput,
          sfnExpectedOutput,
        }) => {
          const output = JSON.stringify(sfnExpectedOutput);
          const input = JSON.stringify(sfnInput);
          it(`should return ${output} when supplied ${input}`, async () => {
            // GIVEN
            const input = JSON.stringify(sfnInput);
            // WHEN
            const responseStepFunction = await startStepFunctionExecution(
              mockTestCaseExecution,
              input
            );
            const resultsStateEntered = await waitFor(
              (event) =>
                event.type == "TaskStateEntered" &&
                event.stateEnteredEventDetails?.name == mockTestCase,
              responseStepFunction
            );
            const resultsTaskSucceeded = await waitFor(
              (event) => event.type === "TaskSucceeded",
              responseStepFunction
            );

            const resultsTaskFailed = await waitFor(
              (event) =>
                event.type === "TaskFailed" &&
                event.taskFailedEventDetails?.resource ===
                  "secretsmanager:getSecretValue",
              responseStepFunction
            );
            const resultsTaskExited = await waitFor(
              (event) => event.type == "PassStateEntered",
              responseStepFunction
            );
            // THEN
            expect(resultsStateEntered).toBeDefined();
            expect(resultsStateEntered?.length).toBe(1);
            expect(resultsStateEntered[0].stateEnteredEventDetails?.input).toBe(
              JSON.stringify(sfnInput)
            );
            expect(resultsTaskSucceeded).toBeDefined();
            expect(resultsTaskSucceeded?.length).toBe(3);

            expect(resultsTaskFailed).toBeDefined();
            expect(resultsTaskFailed?.length).toBe(1);
            expect(
              resultsTaskFailed[0]?.taskFailedEventDetails?.cause
            ).toContain("Secrets Manager can't find the specified secret.");
            expect(resultsTaskExited[0].stateEnteredEventDetails?.name).toBe(
              "Handle Get Client_Secret Error"
            );
          });
        }
      );
    });

    describe("CLIENT_SECRET permission not configured", () => {
      beforeAll(async () => {
        composeEnvironment = await createTestContainer();
        sfnClient = createSfnClient();

        await sleep(20_000); // Additional delay to ensure container readiness
      });
      afterAll(async () => await composeEnvironment?.down());

      const clientSecretPermissionsErrorData: stateData = {
        scenario: "ClientSecretPermissionsErrorUnHappyTest",
        totp_secret: {
          input: { valid: "input" },
          output: {
            Name: "TOTP_SECRET",
            SecretString: "IWRERERWERWR",
          },
        },
        totp_code: {
          input: {
            Name: "TOTP_SECRET",
            SecretString: "IWRERERWERWR",
          },
          output: {
            totp: "35635930",
          },
        },
        clientId: {
          input: { totp: "35635930" },
          output: {
            totp: "35635930",
            clientId: {
              value: "afkuhjsfasffsdfjknjj",
            },
          },
        },
        client_secret: {
          input: {
            totp: "35635930",
            clientId: {
              value: "afkuhjsfasffsdfjknjj",
            },
          },
          output: {
            Error: "SecretsManager.SecretsManagerException",
            Cause:
              "User: arn:aws:sts::local:assumed-role/stack-StateMachineRole-1SXH7VTMU9WPV/AMSjcZhDHLcUfcUlFEjldMZElLNaIMwq is not authorized to perform: secretsmanager:GetSecretValue on resource: CLIENT_SECRET because no identity-based policy allows the secretsmanager:GetSecretValue action (Service: SecretsManager, Status Code: 400, Request ID: 585907ec-ee9b-4e4d-a889-2ce3f0bce1cf)",
          },
        },
      };

      describe.each(mapToTestParams(clientSecretPermissionsErrorData))(
        "$mockTestCase",
        ({
          mockTestCaseExecution,
          mockTestCase,
          sfnInput,
          sfnExpectedOutput,
        }) => {
          it(`should return ${JSON.stringify(
            sfnExpectedOutput
          )} when supplied ${JSON.stringify(sfnInput)}`, async () => {
            // GIVEN
            const input = JSON.stringify(sfnInput);
            // WHEN
            const responseStepFunction = await startStepFunctionExecution(
              mockTestCaseExecution,
              input
            );
            const resultsStateEntered = await waitFor(
              (event) =>
                event.type == "TaskStateEntered" &&
                event.stateEnteredEventDetails?.name === mockTestCase,
              responseStepFunction
            );
            const resultsTaskExited = await waitFor(
              (event) =>
                event.type === "TaskStateExited" &&
                event.stateExitedEventDetails?.name === mockTestCase,
              responseStepFunction
            );
            // THEN
            expect(resultsStateEntered).toBeDefined();
            expect(resultsStateEntered?.length).toBe(1);
            expect(resultsStateEntered[0].stateEnteredEventDetails?.input).toBe(
              JSON.stringify(sfnInput)
            );
            expect(resultsTaskExited).toBeDefined();
            expect(resultsTaskExited?.length).toBe(1);
            expect(resultsTaskExited[0].stateExitedEventDetails?.output).toBe(
              JSON.stringify(sfnExpectedOutput)
            );
          });
        }
      );
    });

    describe("CLIENT_ID parameter permission not configured", () => {
      beforeAll(async () => {
        composeEnvironment = await createTestContainer();
        sfnClient = createSfnClient();

        await sleep(20_000); // Additional delay to ensure container readiness
      });
      afterAll(async () => await composeEnvironment?.down());

      const clientIdParameterPermissionErrorData: stateData = {
        scenario: "ClientIdParameterResourcePermissionUnHappyTest",
        totp_secret: {
          input: { valid: "input" },
          output: {
            Name: "TOTP_SECRET",
            SecretString: "IWRERERWERWR",
          },
        },
        totp_code: {
          input: {
            Name: "TOTP_SECRET",
            SecretString: "IWRERERWERWR",
          },
          output: {
            totp: "35635930",
          },
        },
        clientId: {
          input: { totp: "35635930" },
          output: {
            Error: "Ssm.SsmException",
            Cause:
              "User: arn:aws:sts::local:assumed-role/ola-otg-stack-OtgStateMachineRole-1SXH7VTMU9WPV/ZeBoNPTSdIWUSRAihAcjObezbCdqiHCT is not authorized to perform: ssm:GetParameters on resource: arn:aws:ssm:eu-west-2:local:parameter/hmrc_client_id because no identity-based policy allows the ssm:GetParameters action (Service: Ssm, Status Code: 400, Request ID: eaa53baf-9933-4e15-afe7-539a6ef75ca2)",
          },
        },
      };

      describe.each(mapToTestParams(clientIdParameterPermissionErrorData))(
        "$mockTestCase",
        ({
          mockTestCaseExecution,
          mockTestCase,
          sfnInput,
          sfnExpectedOutput,
        }) => {
          const output = JSON.stringify(sfnExpectedOutput);
          const input = JSON.stringify(sfnInput);
          it(`should return ${output} when supplied ${input}`, async () => {
            // GIVEN
            const input = JSON.stringify(sfnInput);
            // WHEN
            const responseStepFunction = await startStepFunctionExecution(
              mockTestCaseExecution,
              input
            );
            const resultsStateEntered = await waitFor(
              (event) =>
                event.type === "TaskStateEntered" &&
                event.stateEnteredEventDetails?.name == mockTestCase,
              responseStepFunction
            );
            const resultsTaskExited = await waitFor(
              (event) =>
                event.type === "TaskStateExited" &&
                event.stateExitedEventDetails?.name === mockTestCase,
              responseStepFunction
            );
            // THEN
            expect(resultsStateEntered).toBeDefined();
            expect(resultsStateEntered?.length).toBe(1);
            expect(resultsStateEntered[0].stateEnteredEventDetails?.input).toBe(
              JSON.stringify(sfnInput)
            );
            expect(resultsTaskExited).toBeDefined();
            expect(resultsTaskExited?.length).toBe(1);
            expect(resultsTaskExited[0].stateExitedEventDetails?.output).toBe(
              JSON.stringify(sfnExpectedOutput)
            );
          });
        }
      );
    });
    describe("OAuth Url parameter not found", () => {
      beforeAll(async () => {
        composeEnvironment = await createTestContainer();
        sfnClient = createSfnClient();

        await sleep(20_000); // Additional delay to ensure container readiness
      });
      afterAll(async () => await composeEnvironment?.down());

      const oauthUrlParameterNotFoundData: stateData = {
        scenario: "OAuthURLParameterResourceNotFoundUnHappyTest",
        totp_secret: {
          input: { valid: "input" },
          output: {
            Name: "TOTP_SECRET",
            SecretString: "IWRERERWERWR",
          },
        },
        totp_code: {
          input: {
            Name: "TOTP_SECRET",
            SecretString: "IWRERERWERWR",
          },
          output: {
            totp: "35635930",
          },
        },
        clientId: {
          input: { totp: "35635930" },
          output: {
            totp: "35635930",
            clientId: {
              value: "afkuhjsfasffsdfjknjj",
            },
          },
        },
        client_secret: {
          input: {
            totp: "35635930",
            clientId: {
              value: "afkuhjsfasffsdfjknjj",
            },
          },
          output: {
            totp: "35635930",
            clientId: {
              value: "afkuhjsfasffsdfjknjj",
            },
            clientSecret: {
              value: "12c0cff2-eacc-4d9b-840b-ebc1e0e15686",
            },
          },
        },
        oauth_url: {
          input: {
            totp: "35635930",
            clientId: {
              value: "afkuhjsfasffsdfjknjj",
            },
            clientSecret: {
              value: "12c0cff2-eacc-4d9b-840b-ebc1e0e15686",
            },
          },
          output: {
            Error: "Ssm.ParameterNotFoundException",
            Cause:
              "Service returned error code ParameterNotFound (Service: Ssm, Status Code: 400, Request ID: 4dc5822a-c05b-4f7d-a454-13b19c464876)",
          },
        },
      };

      describe.each(mapToTestParams(oauthUrlParameterNotFoundData))(
        "$mockTestCase",
        ({
          mockTestCaseExecution,
          mockTestCase,
          sfnInput,
          sfnExpectedOutput,
        }) => {
          const output = JSON.stringify(sfnExpectedOutput);
          const input = JSON.stringify(sfnInput);
          it(`should return ${output} when supplied ${input}`, async () => {
            // GIVEN
            const input = JSON.stringify(sfnInput);
            // WHEN
            const responseStepFunction = await startStepFunctionExecution(
              mockTestCaseExecution,
              input
            );
            const resultsStateEntered = await waitFor(
              (event) =>
                event.type === "TaskStateEntered" &&
                event.stateEnteredEventDetails?.name === mockTestCase,
              responseStepFunction
            );
            const resultsTaskExited = await waitFor(
              (event) =>
                event.type === "TaskStateExited" &&
                event.stateExitedEventDetails?.name === mockTestCase,
              responseStepFunction
            );
            // THEN
            expect(resultsStateEntered).toBeDefined();
            expect(resultsStateEntered?.length).toBe(1);
            expect(resultsStateEntered[0].stateEnteredEventDetails?.input).toBe(
              JSON.stringify(sfnInput)
            );
            expect(resultsTaskExited).toBeDefined();
            expect(resultsTaskExited?.length).toBe(1);
            expect(resultsTaskExited[0].stateExitedEventDetails?.output).toBe(
              JSON.stringify(sfnExpectedOutput)
            );
          });
        }
      );
    });
    describe("OAuth Url parameter permission not configured", () => {
      beforeAll(async () => {
        composeEnvironment = await createTestContainer();
        sfnClient = createSfnClient();

        await sleep(20_000); // Additional delay to ensure container readiness
      });
      afterAll(async () => await composeEnvironment?.down());

      const oauthUrlParameterPermissionErrorData: stateData = {
        scenario: "OAuthURLParameterResourcePermissionUnHappyTest",
        totp_secret: {
          input: { valid: "input" },
          output: {
            Name: "TOTP_SECRET",
            SecretString: "IWRERERWERWR",
          },
        },
        totp_code: {
          input: {
            Name: "TOTP_SECRET",
            SecretString: "IWRERERWERWR",
          },
          output: {
            totp: "35635930",
          },
        },
        clientId: {
          input: { totp: "35635930" },
          output: {
            totp: "35635930",
            clientId: {
              value: "afkuhjsfasffsdfjknjj",
            },
          },
        },
        client_secret: {
          input: {
            totp: "35635930",
            clientId: {
              value: "afkuhjsfasffsdfjknjj",
            },
          },
          output: {
            totp: "35635930",
            clientId: {
              value: "afkuhjsfasffsdfjknjj",
            },
            clientSecret: {
              value: "12c0cff2-eacc-4d9b-840b-ebc1e0e15686",
            },
          },
        },
        oauth_url: {
          input: {
            totp: "35635930",
            clientId: {
              value: "afkuhjsfasffsdfjknjj",
            },
            clientSecret: {
              value: "12c0cff2-eacc-4d9b-840b-ebc1e0e15686",
            },
          },
          output: {
            Error: "Ssm.SsmException",
            Cause:
              "User: arn:aws:sts::local:assumed-role/ola-otg-stack-OtgStateMachineRole-1SXH7VTMU9WPV/giJpYtNQeUFZRDAVegxozxZKXSxsRAoM is not authorized to perform: ssm:GetParameter on resource: arn:aws:ssm:eu-west-2:local:parameter/hmrc_oauth_url because no identity-based policy allows the ssm:GetParameter action (Service: Ssm, Status Code: 400, Request ID: 7ee4e39f-3fed-4b8f-afab-7b43c8c897bc)",
          },
        },
      };

      describe.each(mapToTestParams(oauthUrlParameterPermissionErrorData))(
        "$mockTestCase",
        ({
          mockTestCaseExecution,
          mockTestCase,
          sfnInput,
          sfnExpectedOutput,
        }) => {
          const output = JSON.stringify(sfnExpectedOutput);
          const input = JSON.stringify(sfnInput);
          it(`should return ${output} when supplied ${input}`, async () => {
            // GIVEN
            const input = JSON.stringify(sfnInput);
            // WHEN
            const responseStepFunction = await startStepFunctionExecution(
              mockTestCaseExecution,
              input
            );
            const resultsStateEntered = await waitFor(
              (event) =>
                event.type === "TaskStateEntered" &&
                event.stateEnteredEventDetails?.name === mockTestCase,
              responseStepFunction
            );
            const resultsTaskExited = await waitFor(
              (event) =>
                event.type === "TaskStateExited" &&
                event.stateExitedEventDetails?.name === mockTestCase,
              responseStepFunction
            );
            // THEN
            expect(resultsStateEntered).toBeDefined();
            expect(resultsStateEntered?.length).toBe(1);
            expect(resultsStateEntered[0].stateEnteredEventDetails?.input).toBe(
              JSON.stringify(sfnInput)
            );
            expect(resultsTaskExited).toBeDefined();
            expect(resultsTaskExited?.length).toBe(1);
            expect(resultsTaskExited[0].stateExitedEventDetails?.output).toBe(
              JSON.stringify(sfnExpectedOutput)
            );
          });
        }
      );
    });
    describe("Put OAuth access token expiry parameter permission not configured", () => {
      beforeAll(async () => {
        composeEnvironment = await createTestContainer();
        sfnClient = createSfnClient();

        await sleep(20_000); // Additional delay to ensure container readiness
      });
      afterAll(async () => await composeEnvironment?.down());

      const putOAuthAccessTokenExpiryParameterPermissionErrorData: stateData = {
        scenario: "PutOAuthAccessTokenExpiryPermissionUnHappyTest",
        totp_secret: {
          input: { valid: "input" },
          output: {
            Name: "TOTP_SECRET",
            SecretString: "IWRERERWERWR",
          },
        },
        totp_code: {
          input: {
            Name: "TOTP_SECRET",
            SecretString: "IWRERERWERWR",
          },
          output: {
            totp: "35635930",
          },
        },
        clientId: {
          input: { totp: "35635930" },
          output: {
            totp: "35635930",
            clientId: {
              value: "afkuhjsfasffsdfjknjj",
            },
          },
        },
        client_secret: {
          input: {
            totp: "35635930",
            clientId: {
              value: "afkuhjsfasffsdfjknjj",
            },
          },
          output: {
            totp: "35635930",
            clientId: {
              value: "afkuhjsfasffsdfjknjj",
            },
            clientSecret: {
              value: "12c0cff2-eacc-4d9b-840b-ebc1e0e15686",
            },
          },
        },
        oauth_url: {
          input: {
            totp: "35635930",
            clientId: {
              value: "afkuhjsfasffsdfjknjj",
            },
            clientSecret: {
              value: "12c0cff2-eacc-4d9b-840b-ebc1e0e15686",
            },
          },
          output: {
            totp: "35635930",
            clientId: {
              value: "afkuhjsfasffsdfjknjj",
            },
            clientSecret: {
              value: "12c0cff2-eacc-4d9b-840b-ebc1e0e15686",
            },
            oAuthURL: {
              value: "test-oauth-token-url",
            },
          },
        },
        oauth_token: {
          input: {
            totp: "35635930",
            clientId: {
              value: "afkuhjsfasffsdfjknjj",
            },
            clientSecret: {
              value: "12c0cff2-eacc-4d9b-840b-ebc1e0e15686",
            },
            oAuthURL: {
              value: "test-oauth-token-url",
            },
          },
          output: {
            StatusCode: 200,
            Payload: {
              token: "body.access_token",
              tokenExpiry: 866868768688,
            },
          },
        },
        put_access_token_expiry: {
          input: {
            StatusCode: 200,
            Payload: {
              token: "body.access_token",
              tokenExpiry: 866868768688,
            },
          },
          output: {
            Error: "Ssm.SsmException",
            Cause:
              "User: arn:aws:sts::local:assumed-role/ola-otg-stack-OtgStateMachineRole-1SXH7VTMU9WPV/opeMbZdaKgpxHjImgSCIKmpFPCYyiSfz is not authorized to perform: ssm:PutParameter on resource: arn:aws:ssm:eu-west-2:local:parameter/hmrc-bearer-token-expiry because no identity-based policy allows the ssm:PutParameter action (Service: Ssm, Status Code: 400, Request ID: 77f708ac-d698-44d1-b99e-34ec6a680edc)",
          },
        },
      };

      describe.each(mapToTestParams(putOAuthAccessTokenExpiryParameterPermissionErrorData))(
        "$mockTestCase",
        ({
          mockTestCaseExecution,
          mockTestCase,
          sfnInput,
          sfnExpectedOutput,
        }) => {
          const output = JSON.stringify(sfnExpectedOutput);
          const input = JSON.stringify(sfnInput);
          it(`should return ${output} when supplied ${input}`, async () => {
            // GIVEN
            const input = JSON.stringify(sfnInput);
            // WHEN
            const responseStepFunction = await startStepFunctionExecution(
              mockTestCaseExecution,
              input
            );
            const resultsStateEntered = await waitFor(
              (event) =>
                event.type === "TaskStateEntered" &&
                event.stateEnteredEventDetails?.name === mockTestCase,
              responseStepFunction
            );
            const resultsTaskExited = await waitFor(
              (event) =>
                (event.type?.endsWith("StateExited") as boolean) &&
                event.stateExitedEventDetails?.name ===
                  (mockTestCase === "Put OauthAccessTokenExpiry"
                    ? "Parallel"
                    : mockTestCase),
              responseStepFunction
            );
            // THEN
            expect(resultsStateEntered).toBeDefined();
            expect(resultsStateEntered?.length).toBe(1);
            expect(resultsStateEntered[0].stateEnteredEventDetails?.input).toBe(
              JSON.stringify(sfnInput)
            );
            expect(resultsTaskExited).toBeDefined();
            expect(resultsTaskExited?.length).toBe(1);
            expect(resultsTaskExited[0].stateExitedEventDetails?.output).toBe(
              JSON.stringify(sfnExpectedOutput)
            );
          });
        }
      );
      
    });
    describe("Put OAuth access token secret permission not configured", () => {
      beforeAll(async () => {
        composeEnvironment = await createTestContainer();
        sfnClient = createSfnClient();

        await sleep(20_000); // Additional delay to ensure container readiness
      });
      afterAll(async () => await composeEnvironment?.down());

      const putOAuthAccessTokenSecretPermissionErrorData: stateData = {
        scenario: "PutOAuthAccessTokenSecretPermissionUnHappyTest",
        totp_secret: {
          input: { valid: "input" },
          output: {
            Name: "TOTP_SECRET",
            SecretString: "IWRERERWERWR",
          },
        },
        totp_code: {
          input: {
            Name: "TOTP_SECRET",
            SecretString: "IWRERERWERWR",
          },
          output: {
            totp: "35635930",
          },
        },
        clientId: {
          input: { totp: "35635930" },
          output: {
            totp: "35635930",
            clientId: {
              value: "afkuhjsfasffsdfjknjj",
            },
          },
        },
        client_secret: {
          input: {
            totp: "35635930",
            clientId: {
              value: "afkuhjsfasffsdfjknjj",
            },
          },
          output: {
            totp: "35635930",
            clientId: {
              value: "afkuhjsfasffsdfjknjj",
            },
            clientSecret: {
              value: "12c0cff2-eacc-4d9b-840b-ebc1e0e15686",
            },
          },
        },
        oauth_url: {
          input: {
            totp: "35635930",
            clientId: {
              value: "afkuhjsfasffsdfjknjj",
            },
            clientSecret: {
              value: "12c0cff2-eacc-4d9b-840b-ebc1e0e15686",
            },
          },
          output: {
            totp: "35635930",
            clientId: {
              value: "afkuhjsfasffsdfjknjj",
            },
            clientSecret: {
              value: "12c0cff2-eacc-4d9b-840b-ebc1e0e15686",
            },
            oAuthURL: {
              value: "test-oauth-token-url",
            },
          },
        },
        oauth_token: {
          input: {
            totp: "35635930",
            clientId: {
              value: "afkuhjsfasffsdfjknjj",
            },
            clientSecret: {
              value: "12c0cff2-eacc-4d9b-840b-ebc1e0e15686",
            },
            oAuthURL: {
              value: "test-oauth-token-url",
            },
          },
          output: {
            StatusCode: 200,
            Payload: {
              token: "body.access_token",
              tokenExpiry: 866868768688,
            },
          },
        },
        put_access_token_expiry: {
          input: {
            StatusCode: 200,
            Payload: {
              token: "body.access_token",
              tokenExpiry: 866868768688,
            },
          },
          output: {
            StatusCode: 200,
          },
        },
        put_access_token: {
          input: {
            StatusCode: 200,
            Payload: {
              token: "body.access_token",
              tokenExpiry: 866868768688,
            },
          },
          output: {
            Error: "SecretsManager.SecretsManagerException",
            Cause: "User: arn:aws:sts::local:assumed-role/ola-otg-stack-OtgStateMachineRole-1SXH7VTMU9WPV/oBBIiAoqlxurTyhMKpQPbezGVkvPfNLb is not authorized to perform: secretsmanager:PutSecretValue on resource: demo_BearerToken because no identity-based policy allows the secretsmanager:PutSecretValue action (Service: SecretsManager, Status Code: 400, Request ID: 7ef591b1-cf97-4019-8a51-0bb4e862f81b)"
          },
        },
      };

      describe.each(mapToTestParams(putOAuthAccessTokenSecretPermissionErrorData))(
        "$mockTestCase",
        ({
          mockTestCaseExecution,
          mockTestCase,
          sfnInput,
          sfnExpectedOutput,
        }) => {
          const output = JSON.stringify(sfnExpectedOutput);
          const input = JSON.stringify(sfnInput);
          it(`should return ${output} when supplied ${input}`, async () => {
            // GIVEN
            const input = JSON.stringify(sfnInput);
            // WHEN
            const responseStepFunction = await startStepFunctionExecution(
              mockTestCaseExecution,
              input
            );
            const resultsStateEntered = await waitFor(
              (event) =>
                event.type === "TaskStateEntered" &&
                event.stateEnteredEventDetails?.name === mockTestCase,
              responseStepFunction
            );
            const resultsTaskExited = await waitFor(
              (event) =>
                (event.type?.endsWith("StateExited") as boolean) &&
                event.stateExitedEventDetails?.name ===
                  (mockTestCase === "Put OAuthAccessToken"
                    ? "Parallel"
                    : mockTestCase),
              responseStepFunction
            );
            // THEN
            expect(resultsStateEntered).toBeDefined();
            expect(resultsStateEntered?.length).toBe(1);
            expect(resultsStateEntered[0].stateEnteredEventDetails?.input).toBe(
              JSON.stringify(sfnInput)
            );
            expect(resultsTaskExited).toBeDefined();
            expect(resultsTaskExited?.length).toBe(1);
            expect(resultsTaskExited[0].stateExitedEventDetails?.output).toBe(
              JSON.stringify(sfnExpectedOutput)
            );
          });
        }
      );
    });
    describe("Generate Totp Code failed due to Invalid Secret", () => {
      beforeAll(async () => {
        composeEnvironment = await createTestContainer();
        sfnClient = createSfnClient();

        await sleep(20_000); // Additional delay to ensure container readiness
      });
      afterAll(async () => await composeEnvironment?.down());

      const totpInValidSecretData: stateData = {
        scenario: "GenerateTotpCodeFailedDueToInValidSecret",
        totp_secret: {
          input: { valid: "input" },
          output: {
            Name: "TOTP_SECRET",
            SecretString: "IWRERERWERWR",
          },
        },
        totp_code: {
          input: {
            Name: "TOTP_SECRET",
            SecretString: "IWRERERWERWR",
          },
          output:{
            Error: "Invalid secret",
            Cause: "invalid secret length"
          }
        }
      };

      describe.each(mapToTestParams(totpInValidSecretData))(
        "$mockTestCase",
        ({
          mockTestCaseExecution,
          mockTestCase,
          sfnInput,
          sfnExpectedOutput,
        }) => {
          const output = JSON.stringify(sfnExpectedOutput);
          const input = JSON.stringify(sfnInput);
          it(`should return ${output} when supplied ${input}`, async () => {
            // GIVEN
            const input = JSON.stringify(sfnInput);
            // WHEN
            const responseStepFunction = await startStepFunctionExecution(
              mockTestCaseExecution,
              input
            );
            const resultsStateEntered = await waitFor(
              (event) =>
                event.type === "TaskStateEntered" &&
                event.stateEnteredEventDetails?.name == mockTestCase,
              responseStepFunction
            );
            const resultsTaskExited = await waitFor(
              (event) =>
                event.type === "TaskStateExited" &&
                event.stateExitedEventDetails?.name === mockTestCase,
              responseStepFunction
            );
            // THEN
            expect(resultsStateEntered).toBeDefined();
            expect(resultsStateEntered?.length).toBe(1);
            expect(resultsStateEntered[0].stateEnteredEventDetails?.input).toBe(
              JSON.stringify(sfnInput)
            );
            expect(resultsTaskExited).toBeDefined();
            expect(resultsTaskExited?.length).toBe(1);
            expect(resultsTaskExited[0].stateExitedEventDetails?.output).toBe(
              JSON.stringify(sfnExpectedOutput)
            );
          });
        }
      );
    });
    describe("Generate Totp Code failed due to Absent Secret", () => {
      beforeAll(async () => {
        composeEnvironment = await createTestContainer();
        sfnClient = createSfnClient();

        await sleep(20_000); // Additional delay to ensure container readiness
      });
      afterAll(async () => await composeEnvironment?.down());

      const totpSecretAbsentData: stateData = {
        scenario: "GenerateTotpCodeFailedDueToSecretAbsentTest",
        totp_secret: {
          input: { valid: "input" },
          output: {
            Name: "TOTP_SECRET",
            SecretString: "IWRERERWERWR",
          },
        },
        totp_code: {
          input: {
            Name: "TOTP_SECRET",
            SecretString: "IWRERERWERWR",
          },
          output:{
            Error: "No secret string present.",
            Cause: ""
          }
        }
      };

      describe.each(mapToTestParams(totpSecretAbsentData))(
        "$mockTestCase",
        ({
          mockTestCaseExecution,
          mockTestCase,
          sfnInput,
          sfnExpectedOutput,
        }) => {
          const output = JSON.stringify(sfnExpectedOutput);
          const input = JSON.stringify(sfnInput);
          it(`should return ${output} when supplied ${input}`, async () => {
            // GIVEN
            const input = JSON.stringify(sfnInput);
            // WHEN
            const responseStepFunction = await startStepFunctionExecution(
              mockTestCaseExecution,
              input
            );
            const resultsStateEntered = await waitFor(
              (event) =>
                event.type === "TaskStateEntered" &&
                event.stateEnteredEventDetails?.name == mockTestCase,
              responseStepFunction
            );
            const resultsTaskExited = await waitFor(
              (event) =>
                event.type === "TaskStateExited" &&
                event.stateExitedEventDetails?.name === mockTestCase,
              responseStepFunction
            );
            // THEN
            expect(resultsStateEntered).toBeDefined();
            expect(resultsStateEntered?.length).toBe(1);
            expect(resultsStateEntered[0].stateEnteredEventDetails?.input).toBe(
              JSON.stringify(sfnInput)
            );
            expect(resultsTaskExited).toBeDefined();
            expect(resultsTaskExited?.length).toBe(1);
            expect(resultsTaskExited[0].stateExitedEventDetails?.output).toBe(
              JSON.stringify(sfnExpectedOutput)
            );
          });
        }
      );
    });
    describe("Generate OAuth Token Failed Due To Server Error", () => {
      beforeAll(async () => {
        composeEnvironment = await createTestContainer();
        sfnClient = createSfnClient();

        await sleep(20_000); // Additional delay to ensure container readiness
      });
      afterAll(async () => await composeEnvironment?.down());

      const oauthGenerationServerData: stateData = {
        scenario: "GenerateOAuthTokenFailedDueToServerErrorTest",
        totp_secret: {
          input: { valid: "input" },
          output: {
            Name: "TOTP_SECRET",
            SecretString: "IWRERERWERWR",
          },
        },
        totp_code: {
          input: {
            Name: "TOTP_SECRET",
            SecretString: "IWRERERWERWR",
          },
          output: {
            totp: "35635930",
          },
        },
        clientId: {
          input: { totp: "35635930" },
          output: {
            totp: "35635930",
            clientId: {
              value: "afkuhjsfasffsdfjknjj",
            },
          },
        },
        client_secret: {
          input: {
            totp: "35635930",
            clientId: {
              value: "afkuhjsfasffsdfjknjj",
            },
          },
          output: {
            totp: "35635930",
            clientId: {
              value: "afkuhjsfasffsdfjknjj",
            },
            clientSecret: {
              value: "12c0cff2-eacc-4d9b-840b-ebc1e0e15686",
            },
          },
        },
        oauth_url: {
          input: {
            totp: "35635930",
            clientId: {
              value: "afkuhjsfasffsdfjknjj",
            },
            clientSecret: {
              value: "12c0cff2-eacc-4d9b-840b-ebc1e0e15686",
            },
          },
          output: {
            totp: "35635930",
            clientId: {
              value: "afkuhjsfasffsdfjknjj",
            },
            clientSecret: {
              value: "12c0cff2-eacc-4d9b-840b-ebc1e0e15686",
            },
            oAuthURL: {
              value: "test-oauth-token-url",
            },
          },
        },
        oauth_token: {
          input: {
            totp: "35635930",
            clientId: {
              value: "afkuhjsfasffsdfjknjj",
            },
            clientSecret: {
              value: "12c0cff2-eacc-4d9b-840b-ebc1e0e15686",
            },
            oAuthURL: {
              value: "test-oauth-token-url",
            },
          },
          output: {
            Error: "Error in BearerTokenHandler: server error",
            Cause: "Internal Server Error"
          },
        },
      };

      describe.each(mapToTestParams(oauthGenerationServerData))(
        "$mockTestCase",
        ({
          mockTestCaseExecution,
          mockTestCase,
          sfnInput,
          sfnExpectedOutput,
        }) => {
          const output = JSON.stringify(sfnExpectedOutput);
          const input = JSON.stringify(sfnInput);
          it(`should return ${output} when supplied ${input}`, async () => {
            // GIVEN
            const input = JSON.stringify(sfnInput);
            // WHEN
            const responseStepFunction = await startStepFunctionExecution(
              mockTestCaseExecution,
              input
            );
            const resultsStateEntered = await waitFor(
              (event) =>
                event.type === "TaskStateEntered" &&
                event.stateEnteredEventDetails?.name == mockTestCase,
              responseStepFunction
            );
            const resultsTaskExited = await waitFor(
              (event) =>
                event.type === "TaskStateExited" &&
                event.stateExitedEventDetails?.name === mockTestCase,
              responseStepFunction
            );
            // THEN
            expect(resultsStateEntered).toBeDefined();
            expect(resultsStateEntered?.length).toBe(1);
            expect(resultsStateEntered[0].stateEnteredEventDetails?.input).toBe(
              JSON.stringify(sfnInput)
            );
            expect(resultsTaskExited).toBeDefined();
            expect(resultsTaskExited?.length).toBe(1);
            expect(resultsTaskExited[0].stateExitedEventDetails?.output).toBe(
              JSON.stringify(sfnExpectedOutput)
            );
          });
        }
      );
    });

    type stateData = {
      scenario: string;
      totp_secret: { input: string | object; output: string | object };
      totp_code?: { input: string | object; output: string | object };
      clientId?: { input: string | object; output: string | object };
      client_secret?: { input: string | object; output: string | object };
      oauth_url?: { input: string | object; output: string | object };
      oauth_token?: { input: string | object; output: string | object };
      put_access_token_expiry?: {
        input: string | object;
        output: string | object;
      };
      put_access_token?: { input: string | object; output: string | object };
    };
    function mapToTestParams(state: stateData) {
      const stateEntries = [
        {
          mockTestCaseExecution: state.scenario,
          mockTestCase: "Get TOTP_SECRET",
          sfnInput: state.totp_secret.input,
          sfnExpectedOutput: state.totp_secret.output,
        },
        {
          mockTestCaseExecution: state.scenario,
          mockTestCase: "Lambda Invoke Generate TOTP Code",
          sfnInput: state?.totp_code?.input,
          sfnExpectedOutput: state?.totp_code?.output,
        },
        {
          mockTestCaseExecution: state.scenario,
          mockTestCase: "Get CLIENT_ID",
          sfnInput: state?.clientId?.input,
          sfnExpectedOutput: state?.clientId?.output,
        },
        {
          mockTestCaseExecution: state.scenario,
          mockTestCase: "Get CLIENT_SECRET",
          sfnInput: state?.client_secret?.input,
          sfnExpectedOutput: state?.client_secret?.output,
        },
        {
          mockTestCaseExecution: state.scenario,
          mockTestCase: "Get OAuth URL",
          sfnInput: state?.oauth_url?.input,
          sfnExpectedOutput: state?.oauth_url?.output,
        },
        {
          mockTestCaseExecution: state.scenario,
          mockTestCase: "Lambda Invoke Generate OAuth Access Token",
          sfnInput: state?.oauth_token?.input,
          sfnExpectedOutput: state?.oauth_token?.output,
        },
        {
          mockTestCaseExecution: state.scenario,
          mockTestCase: "Put OauthAccessTokenExpiry",
          sfnInput: state?.put_access_token_expiry?.input,
          sfnExpectedOutput: state?.put_access_token_expiry?.output,
        },
        {
          mockTestCaseExecution: state.scenario,
          mockTestCase: "Put OAuthAccessToken",
          sfnInput: state?.put_access_token?.input,
          sfnExpectedOutput: state?.put_access_token?.output,
        },
      ];
      return stateEntries.filter(
        (entry) => entry.sfnInput && entry.sfnExpectedOutput
      );
    }
    const startStepFunctionExecution = async (
      testName: string,
      stepFunctionInput: string
    ): Promise<StartExecutionCommandOutput> => {
      const testUrl = `${
        (await createStateMachine()).stateMachineArn as string
      }#${testName}`;
      return await sfnClient.send(
        new StartExecutionCommand({
          stateMachineArn: testUrl,
          input: stepFunctionInput,
        })
      );
    };
    const createSfnClient = (): SFNClient => {
      const container = composeEnvironment.getContainer("stepfunction_local");
      return new SFNClient({
        endpoint: `http://${container.getHost()}:${container.getMappedPort(
          8083
        )}`,
        credentials: {
          accessKeyId: StepFunctionConstants.AWS_ACCESS_KEY_ID,
          secretAccessKey: StepFunctionConstants.AWS_SECRET_KEY,
        },
        region: StepFunctionConstants.AWS_DEFAULT_REGION,
      });
    };
    const createStateMachine = async () => {
      const createStateMachineResponse = await sfnClient.send(
        new CreateStateMachineCommand({
          name: StepFunctionConstants.STATE_MACHINE_NAME,
          definition: StepFunctionConstants.STATE_MACHINE_ASL,
          roleArn: StepFunctionConstants.DUMMY_ROLE,
        })
      );
      return createStateMachineResponse;
    };
    const waitFor = async (
      criteria: (event: HistoryEvent) => boolean,
      executionResponse: StartExecutionCommandOutput
    ): Promise<HistoryEvent[]> => {
      const executionHistoryResult = await untilExecutionCompletes(
        executionResponse
      );
      return executionHistoryResult?.events?.filter(criteria) as HistoryEvent[];
    };
    const createTestContainer =
      async (): Promise<StartedDockerComposeEnvironment> => {
        const environment = await new DockerComposeEnvironment(
          "./",
          "docker-compose.yaml"
        )
          .withWaitStrategy(
            "Starting server on port 8083",
            Wait.forHealthCheck()
          )
          .up(["step_function_local"]);
        return environment;
      };
    const untilExecutionCompletes = async (
      executionResponse: StartExecutionCommandOutput
    ): Promise<GetExecutionHistoryCommandOutput> => {
      let historyResponse: GetExecutionHistoryCommandOutput;
      try {
        do {
          historyResponse = await getExecutionHistory(
            executionResponse.executionArn
          );
        } while (!executionState(historyResponse, "ExecutionSucceeded"));
        return historyResponse;
      } catch (error) {
        untilExecutionCompletes(executionResponse);
      }
      return untilExecutionCompletes(executionResponse);
    };
    const getExecutionHistory = async (
      executionArn?: string
    ): Promise<GetExecutionHistoryCommandOutput> => {
      return await sfnClient.send(
        new GetExecutionHistoryCommand({
          executionArn,
        })
      );
    };
    const executionState = (
      history: GetExecutionHistoryCommandOutput,
      state: string
    ): boolean => {
      return (
        history?.events?.filter((event) => event.type === state).length === 1
      );
    };
    const sleep = (milliseconds: number) =>
      Promise.resolve((resolve: (arg: string) => unknown) =>
        setTimeout(() => {
          resolve(""), milliseconds;
        })
      );
  });
});
