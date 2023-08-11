import fs from "fs";
import path from "path";

const EVENT_FILE = path.join(__dirname, "../events/sfn_valid_input.json");
const STATE_MACHINE_FILE = path.join(__dirname, "../pdpOtgStateMachine.json");

export const StepFunctionConstants = {
  mockFileHostPath: path.join(__dirname, "./MockConfigFile.json"),
  mockFileContainerPath: "/home/stepfunctionslocal/MockConfigFile.json",
  DUMMY_ROLE: "arn:aws:iam::123456789012:role/DummyRole",
  EVENT_FILE,
  STATE_MACHINE_ASL: fs.readFileSync(STATE_MACHINE_FILE).toString(),
  EVENT_JSON_STRING: fs.readFileSync(EVENT_FILE).toString(),
  STATE_MACHINE_NAME: "pdpOtgStateMachine",
  AWS_DEFAULT_REGION: "local",
  AWS_ACCESS_KEY_ID: "local",
  AWS_SECRET_ACCESS_KEY: "local",
};
