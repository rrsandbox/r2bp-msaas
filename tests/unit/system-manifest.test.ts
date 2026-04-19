import { systemManifest } from "@/contracts/system-manifest";

describe("systemManifest", () => {
  it("exposes the architecture contract", () => {
    expect(systemManifest.architecture).toBe("clean-architecture-pragmatica");
    expect(systemManifest.organization).toBe("bounded-context-by-module");
  });
});