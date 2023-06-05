import { NestFactory } from "@nestjs/core";
import { ServerModule } from "./server.module.js";
import { ConfigService } from "@nestjs/config";

async function bootstrap(): Promise<void> {
    try {
        const app = await NestFactory.create(ServerModule);
        const config = app.get(ConfigService);
        const host = config.getOrThrow<number>("HOST");
        await app.listen(host);
        console.log("Server started successfully!");
    } catch (error) {
        console.error("Failed to start server:", error);
    }
}

bootstrap().catch((error) => {
    console.error("An unhandled error occurred:", error);
    process.exit(1);
});
