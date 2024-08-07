import { redact } from "../src/redactor";

describe("redact", () => {
  it("should redact SecretString", async () => {
    const input = '\\"SecretString\\": \\"dummy\\"';
    const redacted = '\\"SecretString\\": \\"***\\"';
    expect(redact(input)).toStrictEqual(redacted);
  });

  it("should redact token", async () => {
    const input = '\\"token\\": \\"dummy\\"';
    const redacted = '\\"token\\": \\"***\\"';
    expect(redact(input)).toStrictEqual(redacted);
  });

  it("should redact totp", async () => {
    const input = '\\"totp\\": \\"dummy\\"';
    const redacted = '\\"totp\\": \\"***\\"';
    expect(redact(input)).toStrictEqual(redacted);
  });

  it("should redact totp-value block", async () => {
    const input = '\\"totpCode\\":{\\"value\\":\\"dummy\\"}';
    const redacted = '\\"totpCode\\":{\\"value\\":\\"***\\"}';
    expect(redact(input)).toStrictEqual(redacted);
  });

  it("should redact token", async () => {
    const input =
      '{"httpStatus":200,"body":"{\\"expiry\\":\\"1722957797939\\",\\"token\\":\\"goodToken\\"}"}';
    const redacted =
      '{"httpStatus":200,"body":"{\\"expiry\\":\\"1722957797939\\",\\"token\\": \\"***\\"}"}';
    expect(redact(input)).toStrictEqual(redacted);
  });
});
