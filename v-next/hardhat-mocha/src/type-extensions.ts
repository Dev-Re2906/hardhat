import "@ignored/hardhat-vnext/types/config";

import type { MochaOptions } from "mocha";

declare module "@ignored/hardhat-vnext/types/config" {
  export interface HardhatUserConfig {
    mocha?: MochaOptions;
  }

  export interface TestPathsUserConfig {
    mocha?: string;
  }

  export interface HardhatConfig {
    mocha: MochaOptions;
  }

  export interface TestPathsConfig {
    mocha: string;
  }
}
