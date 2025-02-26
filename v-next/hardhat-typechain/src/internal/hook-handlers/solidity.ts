import type { HookContext, SolidityHooks } from "hardhat/types/hooks";
import type { CompilationJob } from "hardhat/types/solidity";

import { generateTypes } from "../generate-types.js";

export default async (): Promise<Partial<SolidityHooks>> => {
  const handlers: Partial<SolidityHooks> = {
    async onAllArtifactsEmitted(
      context: HookContext,
      artifacts: Map<CompilationJob, ReadonlyMap<string, string[]>>,
      next: (
        nextContext: HookContext,
        artifacts: Map<CompilationJob, ReadonlyMap<string, string[]>>,
      ) => Promise<void>,
    ) {
      const artifactsPaths = Array.from(artifacts.values()).flatMap(
        (innerMap) => Array.from(innerMap.values()).flat(),
      );

      await generateTypes(
        context.config.paths.root,
        context.config.typechain,
        context.globalOptions.noTypechain,
        artifactsPaths,
      );

      return next(context, artifacts);
    },
  };

  return handlers;
};
