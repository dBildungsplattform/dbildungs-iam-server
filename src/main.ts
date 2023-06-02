import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";

async function bootstrap(): Promise<void> {
    try {
        const app = await NestFactory.create(AppModule);
        await app.listen(3000);
        console.log("Server started successfully!");
    } catch (error) {
        console.error("Failed to start server:", error);
    }
}

bootstrap().catch((error) => {
    console.error("An unhandled error occurred:", error);
    process.exit(1);
});
