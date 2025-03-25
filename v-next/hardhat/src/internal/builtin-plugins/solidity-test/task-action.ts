import type { RunOptions } from "./runner.js";
import type { TestEvent } from "./types.js";
import type { BuildOptions } from "../../../types/solidity/build-system.js";
import type { NewTaskActionFunction } from "../../../types/tasks.js";
import type {
  SolidityTestRunnerConfigArgs,
  TracingConfigWithBuffers,
} from "@ignored/edr";

import { finished } from "node:stream/promises";

import { getAllFilesMatching } from "@nomicfoundation/hardhat-utils/fs";
import { resolveFromRoot } from "@nomicfoundation/hardhat-utils/path";
import { createNonClosingWriter } from "@nomicfoundation/hardhat-utils/stream";
import chalk from "chalk";

import {
  getArtifacts,
  getBuildInfos,
  throwIfSolidityBuildFailed,
} from "../solidity/build-results.js";

import {
  isTestSuiteArtifact,
  solidityTestConfigToRunOptions,
  solidityTestConfigToSolidityTestRunnerConfigArgs,
} from "./helpers.js";
import { testReporter } from "./reporter.js";
import { run } from "./runner.js";
import { npmModuleToNpmRootPath } from "../solidity/build-system/root-paths-utils.js";

interface TestActionArguments {
  testFiles: string[];
  chainType: string;
}

const runSolidityTests: NewTaskActionFunction<TestActionArguments> = async (
  { testFiles, chainType },
  hre,
) => {
  if (chainType !== "l1") {
    console.log(
      chalk.yellow(
        `Chain type selection for tests will be implemented soon. Please check our communication channels for updates. For now, please run the task without the --chain-type option.`,
      ),
    );
    process.exitCode = 1;
    return;
  }

  let localFilesToCompile: string[];
  if (testFiles.length > 0) {
    localFilesToCompile = testFiles.map((f) =>
      resolveFromRoot(hre.config.paths.root, f),
    );
  } else {
    // NOTE: A test file is either a file with a `.sol` extension in the `tests.solidity`
    // directory or a file with a `.t.sol` extension in the `sources.solidity` directory
    localFilesToCompile = (
      await Promise.all([
        getAllFilesMatching(hre.config.paths.tests.solidity, (f) =>
          f.endsWith(".sol"),
        ),
        ...hre.config.paths.sources.solidity.map(async (dir) => {
          return getAllFilesMatching(dir, (f) => f.endsWith(".t.sol"));
        }),
      ])
    ).flat(1);
  }
  // NOTE: We remove duplicates in case there is an intersection between
  // the tests.solidity paths and the sources paths
  localFilesToCompile = Array.from(new Set(localFilesToCompile));

  const dependenciesToCompile = hre.config.solidity.dependenciesToCompile.map(
    npmModuleToNpmRootPath,
  );

  const rootFilePaths = [...localFilesToCompile, ...dependenciesToCompile];

  const buildOptions: BuildOptions = {
    force: false,
    buildProfile: hre.globalOptions.buildProfile,
    quiet: true,
  };

  const results = await hre.solidity.build(rootFilePaths, buildOptions);

  throwIfSolidityBuildFailed(results);

  const buildInfos = await getBuildInfos(results, hre.artifacts);
  const artifacts = await getArtifacts(results);
  const testSuiteIds = artifacts
    .filter(isTestSuiteArtifact)
    .map((artifact) => artifact.id);

  console.log("Running Solidity tests");
  console.log();

  let includesFailures = false;
  let includesErrors = false;

  const solidityTestConfig = hre.config.solidityTest;

  const config: SolidityTestRunnerConfigArgs =
    solidityTestConfigToSolidityTestRunnerConfigArgs(
      hre.config.paths.root,
      solidityTestConfig,
    );
  const tracingConfig: TracingConfigWithBuffers = {
    buildInfos,
    ignoreContracts: false,
  };
  const options: RunOptions =
    solidityTestConfigToRunOptions(solidityTestConfig);

  const runStream = run(
    artifacts,
    testSuiteIds,
    config,
    tracingConfig,
    options,
  );

  const testReporterStream = runStream
    .on("data", (event: TestEvent) => {
      if (event.type === "suite:result") {
        if (event.data.testResults.some(({ status }) => status === "Failure")) {
          includesFailures = true;
        }
      }
    })
    .compose(testReporter);

  const outputStream = testReporterStream.pipe(
    createNonClosingWriter(process.stdout),
  );

  try {
    // NOTE: We're awaiting the original run stream to finish to catch any
    // errors produced by the runner.
    await finished(runStream);

    // We also await the output stream to finish, as we want to wait for it
    // to avoid returning before the whole output was generated.
    await finished(outputStream);
  } catch (error) {
    console.error(error);
    includesErrors = true;
  }

  if (includesFailures || includesErrors) {
    process.exitCode = 1;
  }

  console.log();
};

export default runSolidityTests;
