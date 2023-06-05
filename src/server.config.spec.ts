import { loadConfig } from "./server.config";

describe("ServerConfig", () => {
    it("should load config", async () => {
        await expect(loadConfig()).resolves.toBeDefined();
    });
});
