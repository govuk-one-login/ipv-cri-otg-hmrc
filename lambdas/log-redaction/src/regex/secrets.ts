export const secretsPattern = [
  {
    regex: /\\"token\\":\s*\\"([^"]*)\\"/g,
    replacement: String.raw`\"token\": \"***\"`,
  },
  {
    regex: /\\\\"token\\\\":\s*\\\\"([^"]*)\\\\"/g,
    replacement: String.raw`\\"token\\":\\"***\\"`,
  },
  {
    regex: /\\\\\\"token\\\\\\":\s*\\\\\\"([^"]*)\\\\\\"/g,
    replacement: String.raw`\\\"token\\\":\\\"***\\\"`,
  },
  {
    regex: /\\"SecretString\\":\s*\\"([^"]*)\\"/g,
    replacement: String.raw`\"SecretString\": \"***\"`,
  },
  {
    regex: /\\"totp\\":\s*\\"([^"]*)\\"/g,
    replacement: String.raw`\"totp\": \"***\"`,
  },
  {
    regex: /\\"totpCode\\"\s*:\s*{\s*\\"value\\"\s*:\s*\\"([^"]*)\\"/g,
    replacement: String.raw`\"totpCode\":{\"value\":\"***\"`,
  },
];
