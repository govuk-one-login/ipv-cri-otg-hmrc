import { mergeConfig } from "vitest/config";
import baseConfig from "../../vitest.config.base";

export default mergeConfig(baseConfig, {
  test: {
    name: "bearer-token-handler",
    root: __dirname,
  },
});
