import { Module } from "@nestjs/common";
import { PersonApiModule } from "./modules/person/person-api.module.js";
import { classes } from "@automapper/classes";
import { AutomapperModule } from "@automapper/nestjs";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { loadConfig, validateConfig } from "./server.config.js";
import { AppModule } from "./app.module.js";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { defineConfig } from "@mikro-orm/postgresql";
import { DbConfig } from "./shared/index.js";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [loadConfig],
            validate: validateConfig,
        }),
        AutomapperModule.forRoot({
            strategyInitializer: classes(),
        }),
        MikroOrmModule.forRootAsync({
            useFactory: (config: ConfigService<DbConfig, true>) => {
                console.log(config);
                return defineConfig({
                    clientUrl: config.getOrThrow("CLIENT_URL"),
                    dbName: config.getOrThrow("DB_NAME"),
                });
            },
            inject: [ConfigService],
        }),
        AppModule,
        PersonApiModule,
    ],
})
export class ServerModule {}
