import { TestHandler } from "../src/test-handler";

describe("test-handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return the correct value", async () => {
    const handler = new TestHandler();
    const result = await handler.handler({}, {});
    expect(result).toEqual({});
  });
});
