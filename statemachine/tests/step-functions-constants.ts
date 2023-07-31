import fs from "fs";
import path from "path";
const EVENT_FILE = path.join(__dirname, "../../events/sfn_invalid_input.json");

export const StepFunctionConstants = {
  mockFileHostPath: path.join(
    __dirname,
    "../../statemachine/tests/MockConfigFile.json"
  ),
  mockFileContainerPath: "/home/stepfunctionslocal/MockConfigFile.json",
  DUMMY_ROLE: "arn:aws:iam::123456789012:role/DummyRole",
  EVENT_FILE,
  STATE_MACHINE_ASL: fs
    .readFileSync(
      path.join(__dirname, "../pdpOtgStateMachine.json")
    )
    .toString(),
  EVENT_JSON_STRING: fs.readFileSync(EVENT_FILE).toString(),
  STATE_MACHINE_NAME: "pdpOtgStateMachine",
  AWS_DEFAULT_REGION: "local",
  AWS_ACCESS_KEY_ID: "12345678912",
  AWS_SECRET_KEY: "some-secret-key",
  AWS_SESSION_TOKEN: "some-session-token"
};
