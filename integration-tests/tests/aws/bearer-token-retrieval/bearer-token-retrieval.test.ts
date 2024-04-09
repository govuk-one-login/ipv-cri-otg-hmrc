import { stackOutputs } from "../resources/cloudformation-helper";
import { executeExpressStepFunction } from "../resources/stepfunction-helper";

jest.setTimeout(60_000);

describe("bearer-token-retrieval", () => {
  const input = {
    tokenType: "stub",
  };

  let output: Partial<{
    BearerTokenRetrievalStateMachineArn: string;
  }>;

  beforeEach(async () => {
    output = await stackOutputs(process.env.STACK_NAME);
  });

  it("should fetch a bearer token", async () => {
    const startExecutionResult = await executeExpressStepFunction(
      output.BearerTokenRetrievalStateMachineArn as string,
      input
    );
    const result = JSON.parse(startExecutionResult.output || "");
    const body = JSON.parse(result.body || "");

    expect(result.httpStatus).toBe(200);
    expect(body.token).toBe("goodToken");
    expect(body.expiry).toBeDefined();
  });

  it("should error when tokenType is invalid", async () => {
    const startExecutionResult = await executeExpressStepFunction(
      output.BearerTokenRetrievalStateMachineArn as string,
      {
        tokenType: "dummy",
      }
    );
    const result = JSON.parse(startExecutionResult.output || "");

    expect(result.httpStatus).toBe(400);
    expect(result.body).toBeUndefined();
  });
});
