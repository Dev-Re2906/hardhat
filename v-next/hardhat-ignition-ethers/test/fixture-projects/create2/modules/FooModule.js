import { buildModule } from "@nomicfoundation/ignition-core";

export default buildModule("FooModule", (m) => {
  const foo = m.contract("Foo");

  return { foo };
});
