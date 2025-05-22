import hre, { hooks } from "hardhat";
import { UserInterruptionHooks } from "hardhat/types/hooks";
import assert from "node:assert";

async function mockTaskAction() {
  let lines = 0;

  const userInterruptionsHandlers: UserInterruptionHooks = {
    async displayMessage(
      _context,
      interruptor,
      message,
      __next,
    ): Promise<void> {
      const formattedMessage = `[${interruptor}] ${message}`;

      console.log(formattedMessage);

      lines += formattedMessage.split("\n").length;
    },
    async requestInput(
      _context,
      interruptor,
      inputDescription,
      __next,
    ): Promise<string> {
      const formattedMessage = `[${interruptor}] ${inputDescription}`;

      // This one shouldn't just print, but also request the user input
      console.log(formattedMessage);

      // Maybe the math should be different here?
      lines += formattedMessage.split("\n").length;

      return "mock response";
    },
    async requestSecretInput(
      _context,
      interruptor,
      inputDescription,
      _next,
    ): Promise<string> {
      console.log("Hello from the task's implementation of requestSecretInput");

      return "same as above but the input should be displayed as ***";
    },
  };

  try {
    hooks.registerHandlers("userInterruptions", userInterruptionsHandlers);

    // Here you do what the action needs to do
    // In this case I'll just access a config variable.

    // Getting a config variable from the example config
    const opConfig = hre.config.networks.op;
    assert(opConfig.type === "http", "Invalid config type");
    assert(Array.isArray(opConfig.accounts), "Expecting array");
    const configVar = opConfig.accounts[0];

    // Now, when we do .get(), the user interruption system will be run.
    // It uses hooks to ask for the password of the keystore, so it will use
    // the implementation of requestSecretInput that we just registered.
    // It will lead to an error as I'm returning a hard-coded string.
    const account = await configVar.get();
    console.log(`Account: ${account}`);
  } finally {
    hooks.unregisterHandlers("userInterruptions", userInterruptionsHandlers);
  }
}

await mockTaskAction();
