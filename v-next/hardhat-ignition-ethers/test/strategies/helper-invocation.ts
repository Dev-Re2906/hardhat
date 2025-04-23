import { HardhatError } from "@nomicfoundation/hardhat-errors";
import { assertRejectsWithHardhatError } from "@nomicfoundation/hardhat-test-utils";
import { buildModule } from "@nomicfoundation/ignition-core";
import { assert } from "chai";

import { useIgnitionProject } from "../test-helpers/use-ignition-project.js";

describe("strategies - invocation via helper", () => {
  const example32ByteSalt =
    "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

  describe("no Hardhat config setup", () => {
    useIgnitionProject("minimal");

    it("should execute create2 when passed config programmatically via helper", async function () {
      const moduleDefinition = buildModule("Module", (m) => {
        const foo = m.contract("Foo");

        return { foo };
      });

      const result = await this.connection.ignition.deploy(moduleDefinition, {
        strategy: "create2",
        strategyConfig: {
          salt: example32ByteSalt,
        },
      });

      assert.equal(
        await result.foo.getAddress(),
        "0x647fB9ef6cd97537C553f6cC3c7f60395f81b410",
      );
    });

    it("should error on create2 when passed bad config", async function () {
      const moduleDefinition = buildModule("Module", (m) => {
        const foo = m.contract("Foo");

        return { foo };
      });

      await assertRejectsWithHardhatError(
        this.connection.ignition.deploy(moduleDefinition, {
          strategy: "create2",
          strategyConfig: {
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- we're testing a bad config
            salt: undefined as any,
          },
        }),
        HardhatError.ERRORS.IGNITION.STRATEGIES.MISSING_CONFIG_PARAM,
        {
          strategyName: "create2",
          requiredParam: "salt",
        },
      );
    });
  });

  describe("Hardhat config setup with create2 config", () => {
    useIgnitionProject("create2");

    it("should execute create2 with the helper loading the Hardhat config", async function () {
      const moduleDefinition = buildModule("Module", (m) => {
        const foo = m.contract("Foo");

        return { foo };
      });

      const result = await this.connection.ignition.deploy(moduleDefinition, {
        strategy: "create2",
      });

      assert.equal(
        await result.foo.getAddress(),
        "0x8C1c4E6Fd637C7aa7165F19beFeAEab5E53095Bf",
      );
    });
  });
});
