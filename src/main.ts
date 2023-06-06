import { NestFactory } from "@nestjs/core";
import { ServerModule } from "./server.module.js";
import { ConfigService } from "@nestjs/config";

try {
    const app = await NestFactory.create(ServerModule);
    const configService = app.get(ConfigService);
    await app.listen(configService.getOrThrow<number>("HOST.PORT"));
    console.log("Server started successfully!");
} catch (error) {
    console.error("Failed to start server:", error);
}
