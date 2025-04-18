import type { CoverageManager as InternalCoverageManager } from "./internal/types.js";
import type {
  CoverageManager as PublicCoverageManager,
  CoverageHits,
} from "../../../types/coverage.js";

import { randomUUID } from "node:crypto";
import path from "node:path";

import {
  getAllFilesMatching,
  readJsonFile,
  remove,
  writeJsonFile,
} from "@nomicfoundation/hardhat-utils/fs";

export class CoverageManagerImplementation implements PublicCoverageManager {
  readonly #coverageManager: InternalCoverageManager;
  readonly #coveragePath: string;

  constructor(coverageManager: InternalCoverageManager, coveragePath: string) {
    this.#coverageManager = coverageManager;
    this.#coveragePath = coveragePath;
  }

  public async saveProviderHits(): Promise<void> {
    const hits = await this.#coverageManager.getProviderHits();
    const hitsPath = path.join(this.#coveragePath, `${randomUUID()}.json`);
    await writeJsonFile(hitsPath, hits);

    // NOTE: After we dump the provider hits to disk, we remove them from the internal
    // coverage manager; this allows collecting coverage from succesive tasks
    await this.#coverageManager.clearProviderHits();
  }

  public async loadProviderHits(): Promise<CoverageHits> {
    const hitsPaths = await getAllFilesMatching(
      this.#coveragePath,
      (filePath) => path.extname(filePath) === ".json",
    );
    const hits: CoverageHits = {};
    for (const hitsPath of hitsPaths) {
      const intermediateHits = await readJsonFile<CoverageHits>(hitsPath);
      for (const [k, v] of Object.entries(intermediateHits)) {
        hits[k] = (hits[k] ?? 0) + v;
      }
    }

    // NOTE: After we load all the provider hits from disk, we remove them from
    // the disk; this allows collecting coverage from succesive tasks
    await this.#clearProviderHits(hitsPaths);

    return hits;
  }

  async #clearProviderHits(hitsPaths: string[]): Promise<void> {
    for (const hitsPath of hitsPaths) {
      await remove(hitsPath);
    }
  }
}
