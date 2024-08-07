export const secretsPattern = [
  {
    regex: /\\"token\\":\s*\\"([^"]*)\\"/g,
    replacement: '\\"token\\": \\"***\\"',
  },
  {
    regex: /\\\\"token\\\\":\s*\\\\"([^"]*)\\\\"/g,
    replacement: '\\\\"token\\\\":\\\\"***\\\\"',
  },
  {
    regex: /\\\\\\"token\\\\\\":\s*\\\\\\"([^"]*)\\\\\\"/g,
    replacement: '\\\\\\"token\\\\\\":\\\\\\"***\\\\\\"',
  },
  {
    regex: /\\"SecretString\\":\s*\\"([^"]*)\\"/g,
    replacement: '\\"SecretString\\": \\"***\\"',
  },
  {
    regex: /\\"totp\\":\s*\\"([^"]*)\\"/g,
    replacement: '\\"totp\\": \\"***\\"',
  },
  {
    regex: /\\"totpCode\\"\s*:\s*{\s*\\"value\\"\s*:\s*\\"([^"]*)\\"/g,
    replacement: '\\"totpCode\\":{\\"value\\":\\"***\\"',
  },
];
