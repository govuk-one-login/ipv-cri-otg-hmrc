import {
  CreateStateMachineCommand,
  GetExecutionHistoryCommand,
  GetExecutionHistoryCommandOutput,
  HistoryEvent,
  SFNClient,
  StartExecutionCommand,
  StartExecutionCommandOutput,
} from "@aws-sdk/client-sfn";
import {
  StartedDockerComposeEnvironment,
  DockerComposeEnvironment,
  Wait,
} from "testcontainers";
import { StepFunctionConstants } from "./step-functions-constants";

export class StnContainerHelper {
  private sfnClient: Promise<SFNClient>;
  private composeEnvironment: Promise<StartedDockerComposeEnvironment>;

  public constructor() {
    this.composeEnvironment = Promise.resolve(this.createTestContainer());
    this.sfnClient = Promise.resolve(this.createSfnClient());
  }

  public getContainer = async () => {
    return (await this.composeEnvironment)?.getContainer("stepfunction_local");
  };
  public shutDown = async () => await (await this.composeEnvironment)?.down();
  public startStepFunctionExecution = async (
    testName: string,
    stepFunctionInput: string
  ): Promise<StartExecutionCommandOutput> => {
    const testUrl = `${
      (await this.createStateMachine()).stateMachineArn as string
    }#${testName}`;
    return await (
      await this.sfnClient
    ).send(
      new StartExecutionCommand({
        stateMachineArn: testUrl,
        input: stepFunctionInput,
      })
    );
  };
  public waitFor = async (
    criteria: (event: HistoryEvent) => boolean,
    executionResponse: StartExecutionCommandOutput
  ): Promise<HistoryEvent[]> => {
    const executionHistoryResult = await this.untilExecutionCompletes(
      executionResponse
    );
    return executionHistoryResult?.events?.filter(criteria) as HistoryEvent[];
  };
  sleep = (milliseconds: number) =>
    Promise.resolve((resolve: (arg: string) => unknown) =>
      setTimeout(() => {
        resolve(""), milliseconds;
      })
    );

  createSfnClient = async (): Promise<SFNClient> => {
    const container = await this.getContainer();
    return new SFNClient({
      endpoint: `http://${container.getHost()}:${container.getMappedPort(
        8083
      )}`,
      credentials: {
        accessKeyId: StepFunctionConstants.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: StepFunctionConstants.AWS_SECRET_ACCESS_KEY as string,
      },
      region: StepFunctionConstants.AWS_DEFAULT_REGION,
    });
  };

  createTestContainer = async (): Promise<StartedDockerComposeEnvironment> => {
    const environment = await new DockerComposeEnvironment(
      "./",
      "docker-compose.yaml"
    )
      .withWaitStrategy("Starting server on port 8083", Wait.forHealthCheck())
      .up(["step_function_local"]);
    return environment;
  };

  createStateMachine = async () => {
    const createStateMachineResponse = await (
      await this.sfnClient
    ).send(
      new CreateStateMachineCommand({
        name: StepFunctionConstants.STATE_MACHINE_NAME,
        definition: StepFunctionConstants.STATE_MACHINE_ASL,
        roleArn: StepFunctionConstants.DUMMY_ROLE,
      })
    );
    return createStateMachineResponse;
  };

  untilExecutionCompletes = async (
    executionResponse: StartExecutionCommandOutput
  ): Promise<GetExecutionHistoryCommandOutput> => {
    let historyResponse: GetExecutionHistoryCommandOutput;
    try {
      do {
        historyResponse = await this.getExecutionHistory(
          executionResponse.executionArn
        );
      } while (!this.executionState(historyResponse, "ExecutionSucceeded"));
      return historyResponse;
    } catch (error) {
      this.untilExecutionCompletes(executionResponse);
    }
    return this.untilExecutionCompletes(executionResponse);
  };
  getExecutionHistory = async (
    executionArn?: string
  ): Promise<GetExecutionHistoryCommandOutput> => {
    return await (
      await this.sfnClient
    ).send(
      new GetExecutionHistoryCommand({
        executionArn,
      })
    );
  };
  executionState = (
    history: GetExecutionHistoryCommandOutput,
    state: string
  ): boolean => {
    return (
      history?.events?.filter((event) => event.type === state).length === 1
    );
  };
}
