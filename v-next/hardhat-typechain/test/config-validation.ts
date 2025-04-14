import { describe, it } from "node:test";

import { HardhatError } from "@nomicfoundation/hardhat-errors";
import { assertRejectsWithHardhatError } from "@nomicfoundation/hardhat-test-utils";
import { createHardhatRuntimeEnvironment } from "hardhat/hre";

import hardhatTypechain from "../src/index.js";

describe("config validation", () => {
  it("should not throw because all the config properties are valid", async () => {
    await createHardhatRuntimeEnvironment({
      typechain: {
        outDir: `${process.cwd()}/types`,
        alwaysGenerateOverloads: false,
        dontOverrideCompile: false,
        discriminateTypes: false,
        tsNocheck: false,
      },
      plugins: [hardhatTypechain],
    });
  });

  it("should not throw when the typechain config is not present", async () => {
    await createHardhatRuntimeEnvironment({
      plugins: [hardhatTypechain],
    });
  });

  it("should throw when the properties are invalid", async () => {
    await assertRejectsWithHardhatError(
      createHardhatRuntimeEnvironment({
        typechain: {
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- force type error
          outDir: 1 as any,
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- force type error
          alwaysGenerateOverloads: 1 as any,
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- force type error
          dontOverrideCompile: 1 as any,
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- force type error
          discriminateTypes: 1 as any,
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- force type error
          tsNocheck: 1 as any,
        },
        plugins: [hardhatTypechain],
      }),
      HardhatError.ERRORS.CORE.GENERAL.INVALID_CONFIG,
      {
        errors: [
          "\t* Config error in config.outDir: It should be an absolute path specifying where to store the generated types",
          "\t* Config error in config.alwaysGenerateOverloads: Expected boolean, received number",
          "\t* Config error in config.dontOverrideCompile: Expected boolean, received number",
          "\t* Config error in config.discriminateTypes: Expected boolean, received number",
          "\t* Config error in config.tsNocheck: Expected boolean, received number",
        ].join("\n"),
      },
    );
  });
});
