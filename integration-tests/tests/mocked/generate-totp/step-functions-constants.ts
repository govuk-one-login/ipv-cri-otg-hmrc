import fs from "fs";
import path from "path";

const EVENT_FILE = path.join(__dirname, "../events/sfn_valid_input.json");
const STATE_MACHINE_FILE = path.join(
  __dirname,
  "../../step-functions/oauth-token-generator.asl.json"
);
path.join(__dirname, "./MockConfigFile.json");
fs.readFileSync(STATE_MACHINE_FILE).toString();
fs.readFileSync(EVENT_FILE).toString();
