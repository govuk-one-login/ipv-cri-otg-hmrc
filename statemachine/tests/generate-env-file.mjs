import { writeFileSync } from "fs";
import { join } from "path";
import * as prettier from "prettier";
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from "@aws-sdk/client-cloudformation";

const cfnClient = new CloudFormationClient();

const main = async () => {
  const stackName = process.argv[2];
  if (!stackName) {
    throw new Error("Stack name is required");
  }

  const rootPath = join(new URL(import.meta.url).pathname, "../../");
  const stackOutputs = await cfnClient.send(
    new DescribeStacksCommand({
      StackName: stackName,
    })
  );

  const outputs = stackOutputs.Stacks?.[0].Outputs ?? [];
  await Promise.all([
    createEnvFile(outputs, rootPath),
    createTypingsFile(outputs, rootPath),
  ]);
};

main();

const createEnvFile = async (stackOutputs, rootPath) => {
  const envFileContents = stackOutputs.reduce((envFileContents, output) => {
    const envOutputKey = output.OutputKey.toUpperCase();
    const envOutputValue = output.OutputValue;

    envFileContents += `${envOutputKey}=${envOutputValue}\n`;
    return envFileContents;
  }, "");

  const envFilePath = join(rootPath, ".env");
  writeFileSync(envFilePath, envFileContents);
};

const createTypingsFile = async (stackOutputs, rootPath) => {
  const typingsFileContents = stackOutputs.reduce(
    (typingsFileContents, output) => {
      const envOutputKey = output.OutputKey.toUpperCase();
      const envOutputValue = output.OutputValue;

      typingsFileContents += `${envOutputKey}:"${envOutputValue}";\n`;
      return typingsFileContents;
    },
    ""
  );

  const typingsFile = await prettier.format(
    `
    declare namespace NodeJS {
      export interface ProcessEnv {
        ${typingsFileContents}
      }
    }
  `,
    { parser: "typescript" }
  );
  const typingsFilePath = join(rootPath, "env.d.ts");
  writeFileSync(typingsFilePath, typingsFile);
};
