import {
  SFNClient,
  StartExecutionCommand,
  StartSyncExecutionCommand,
} from "@aws-sdk/client-sfn";
import { createSendCommand } from "./aws-helper";

const sendCommand = createSendCommand(
  () =>
    new SFNClient({
      region: process.env.AWS_REGION,
    })
);

export const executeStepFunction = async (
  stateMachineArn: string,
  input: Record<string, unknown> = {}
) =>
  sendCommand(StartExecutionCommand, {
    stateMachineArn,
    input: JSON.stringify(input),
  });

export const executeExpressStepFunction = async (
  stateMachineArn: string,
  input: Record<string, unknown> = {}
) =>
  sendCommand(StartSyncExecutionCommand, {
    stateMachineArn,
    input: JSON.stringify(input),
  });
