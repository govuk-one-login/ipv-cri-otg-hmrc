process.env.AWS_ACCOUNT_ID = "123456789012"; //pragma: allowlist secret
process.env.SFN_MOCK_CONFIG = "/home/stepfunctionslocal/MockConfigFile.json";
process.env.AWS_DEFAULT_REGION = "local";
process.env.AWS_ACCESS_KEY_ID = "local";
process.env.AWS_SECRET_ACCESS_KEY = "local"; //pragma: allowlist secret
process.env.AWS_SESSION_TOKEN = "local";

process.env.STATE_MACHINE_ARN =
  "arn:aws:states:eu-west-2:404250751813:stateMachine:oauth-token-generator";
process.env.STATE_MACHINE_ROLE =
  "arn:aws:iam::404250751813:role/oauth-token-generatorStateMachineRole-F6BSBWOOSN15";
