import type {
  CoverageManager,
  CoverageReport,
} from "../../../../types/coverage.js";
import type { HardhatRuntimeEnvironmentHooks } from "../../../../types/hooks.js";

import { getEmptyTmpDir } from "@nomicfoundation/hardhat-utils/fs";

export class LazyCoverageManager implements CoverageManager {
  readonly #coveragePath: string;
  #coverageManager: CoverageManager | undefined;

  constructor(coveragePath: string) {
    this.#coverageManager = undefined;
    this.#coveragePath = coveragePath;
  }

  public async save(): Promise<void> {
    const coverageManager = await this.#getCoverageManager();
    return coverageManager.save();
  }

  public async load(): Promise<CoverageReport> {
    const coverageManager = await this.#getCoverageManager();
    return coverageManager.load();
  }

  async #getCoverageManager(): Promise<CoverageManager> {
    if (this.#coverageManager === undefined) {
      const {
        CoverageManagerImplementation: PublicCoverageManagerImplementation,
      } = await import("../coverage-manager.js");
      const {
        CoverageManagerImplementation: InternalCoverageManagerImplementation,
      } = await import("../internal/coverage-manager.js");
      const internalCoverageManager =
        InternalCoverageManagerImplementation.getOrCreate();
      const publicCoverageManager = new PublicCoverageManagerImplementation(
        internalCoverageManager,
        this.#coveragePath,
      );
      this.#coverageManager = publicCoverageManager;
    }

    return this.#coverageManager;
  }
}

export default async (): Promise<Partial<HardhatRuntimeEnvironmentHooks>> => {
  const handlers: Partial<HardhatRuntimeEnvironmentHooks> = {
    created: async (_context, hre): Promise<void> => {
      const coveragePath =
        process.env.HARDHAT_COVERAGE_PATH ??
        (await getEmptyTmpDir("hardhat-coverage"));
      // NOTE: Saving the environment variable so that any subprocesses that
      // inherit the env will operate within the same coverage path
      process.env.HARDHAT_COVERAGE_PATH = coveragePath;
      hre.coverage = new LazyCoverageManager(coveragePath);
    },
  };

  return handlers;
};
