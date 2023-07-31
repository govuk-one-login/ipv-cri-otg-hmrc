import {
  CreateStateMachineCommand,
  CreateStateMachineCommandOutput,
  GetExecutionHistoryCommand,
  GetExecutionHistoryCommandOutput,
  SFNClient,
  StartExecutionCommand,
  StartExecutionCommandOutput,
} from "@aws-sdk/client-sfn";
import { StepFunctionConstants } from "./step-functions-constants";
import { DockerComposeEnvironment, StartedDockerComposeEnvironment, Wait } from "testcontainers";

jest.setTimeout(20_000);

describe("OAuth Access token generation", () => {
  describe("step-function-local", () => {
    let container: StartedDockerComposeEnvironment;
    let sfnClient: SFNClient;
    let stateMachineArn: string;

    beforeAll(async () => {
      container = await createTestContainer();
      sfnClient = createSfnClient(container);
      await sleep(2_000); // Additional delay to ensure container readiness

      stateMachineArn = await createStateMachine(sfnClient);
    });
    afterAll(async () => {
      await container?.down();
    });
    it("checks container is running", () => {
      expect(container?.getContainer("stepfunction_local")?.getId()).toBeDefined();
    });

    describe("Happy Path Scenario", () => {
      xit("should generate OAuth Access token successfully ", async () => {
        const historyResponse: GetExecutionHistoryCommandOutput =
          await manageExecution(
            sfnClient,
            stateMachineArn,
            "happyPathExecution",
            "HappyPathTest"
          );
        
        expect(historyResponse).toBeDefined();

        const results = historyResponse.events?.filter((event) => {
          return (
            event.type === "TaskStateExited" &&
            event.stateExitedEventDetails?.name === "Put OauthAccessTokenExpiry"
          );
        });
        expect(results?.length).toBe(1);
      });
      it("should generate OAuth Access token successfully ", async () => {
        const historyResponse =
          await startStepFunctionExecution(
            sfnClient,
            stateMachineArn,
            "happyPathExecution",
            "HappyPathTest",
            StepFunctionConstants.EVENT_JSON_STRING
          );
        
        expect(historyResponse).toBeDefined();
      });
    });
  });
});

const createSfnClient = (container: StartedDockerComposeEnvironment): SFNClient => {
  return new SFNClient({
    endpoint: `http://${container.getContainer("stepfunction_local").getHost()}:${container.getContainer("stepfunction_local").getMappedPort(8083)}`,
    credentials: {
      accessKeyId: StepFunctionConstants.AWS_ACCESS_KEY_ID,
      secretAccessKey: StepFunctionConstants.AWS_SECRET_KEY,
    },
    region: StepFunctionConstants.AWS_DEFAULT_REGION,
  });
};

const createStateMachine = async (sfnClient: SFNClient): Promise<string> => {
  const createStateMachineResponse: CreateStateMachineCommandOutput = await sfnClient.send(
    new CreateStateMachineCommand({
      name: StepFunctionConstants.STATE_MACHINE_NAME,
      definition: StepFunctionConstants.STATE_MACHINE_ASL,
      roleArn: StepFunctionConstants.DUMMY_ROLE,
    })
  );

  return createStateMachineResponse.stateMachineArn as string;
};

//const setupStepFunctionsLocal = async (): Promise<{
//   container: StartedDockerComposeEnvironment;
//   sfnClient: SFNClient;
//   stateMachineArn: string;
// }> => {
//   const container: StartedDockerComposeEnvironment = await createTestContainer();
//   const sfnClient: SFNClient =  new SFNClient({
//     endpoint: `http://${container.getContainer("stepfunction_local").getHost()}:${container.getContainer("stepfunction_local").getMappedPort(8083)}`,
//     credentials: {
//       accessKeyId: "local",
//       secretAccessKey: "local",
//     },
//     region: "local",
//   });

//   const createStateMachineResponse: CreateStateMachineCommandOutput =
//     await sfnClient.send(
//       new CreateStateMachineCommand({
//         name: StepFunctionConstants.STATE_MACHINE_NAME,
//         definition: StepFunctionConstants.STATE_MACHINE_ASL,
//         roleArn: StepFunctionConstants.DUMMY_ROLE,
//       })
//     );

//   const stateMachineArn = createStateMachineResponse.stateMachineArn as string;

//   return { container, sfnClient, stateMachineArn };
// };
async function startStepFunctionExecution(
  sfnClient: SFNClient,
  stateMachineArn: string,
  executionName: string,
  test: string,
  stepFunctionInput: string): Promise<StartExecutionCommandOutput> {
  return await sfnClient.send(
    new StartExecutionCommand({
      name: executionName,
      stateMachineArn: `${stateMachineArn}#${test}`,
      input: JSON.stringify(stepFunctionInput),
    })
  );
}
const manageExecution = async (
  sfnClient: SFNClient,
  stateMachineArn: string,
  executionName: string,
  test: string
): Promise<GetExecutionHistoryCommandOutput> => {
  const executionResponse = await startStepFunctionExecution(
    sfnClient,
    stateMachineArn,
    executionName,
    test,
    JSON.stringify(StepFunctionConstants.EVENT_JSON_STRING),
  );

  return await untilExecutionCompletes(sfnClient, executionResponse);
};

const createTestContainer = async (): Promise<StartedDockerComposeEnvironment> => {
  // const container: StartedTestContainer = await new GenericContainer(
  //   "amazon/aws-stepfunctions-local"
  // )
  //   .withExposedPorts(8083)
  //   .withCopyFilesToContainer([
  //     {
  //       source: StepFunctionConstants.mockFileHostPath,
  //       target: StepFunctionConstants.mockFileContainerPath,
  //     },
  //   ])
    // .withEnvironment({
    //   SFN_MOCK_CONFIG: StepFunctionConstants.mockFileContainerPath,
    //   AWS_ACCESS_KEY_ID: StepFunctionConstants.AWS_ACCESS_KEY_ID,
    //   AWS_SECRET_KEY: StepFunctionConstants.AWS_SECRET_KEY,
    //   AWS_SESSION_TOKEN: StepFunctionConstants.AWS_SESSION_TOKEN,
    //   AWS_DEFAULT_REGION: StepFunctionConstants.AWS_DEFAULT_REGION
    // })
    // .withDefaultLogDriver()
    // .withWaitStrategy(Wait.forLogMessage("Starting server on port 8083"))
    // .start();
  const environment = await new DockerComposeEnvironment("./", "docker-compose.yaml")
  .withWaitStrategy("Starting server on port 8083", Wait.forHealthCheck())
  .up();
  return environment;
};
const untilExecutionCompletes = async (
  sfnClient: SFNClient,
  executionResponse: StartExecutionCommandOutput
): Promise<GetExecutionHistoryCommandOutput> => {
  let historyResponse: GetExecutionHistoryCommandOutput;
  do {
    await sleep(20_500);
    historyResponse = await sfnClient.send(
      new GetExecutionHistoryCommand({
        executionArn: executionResponse.executionArn,
      })
    );
  } while (!executionSucceeded(historyResponse));

  return historyResponse;
};
const executionSucceeded = (
  historyResponse: GetExecutionHistoryCommandOutput
): boolean => {
  const succeeded = historyResponse?.events?.filter(
    (event) => event.type === "ExecutionSucceeded"
  );
  return succeeded?.length === 1;
};

const sleep = (milliseconds: number) =>
  Promise.resolve((resolve: (arg: string) => unknown) =>
    setTimeout(() => {
      resolve(""), milliseconds;
    })
  );
