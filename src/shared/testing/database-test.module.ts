import { randomUUID } from 'crypto';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from 'testcontainers';
import { DynamicModule, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MikroORM } from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { defineConfig } from '@mikro-orm/postgresql';
import { DbConfig, ServerConfig } from '../../shared/config/index.js';

type DatabaseTestModuleOptions = { isDatabaseRequired: boolean; databaseName?: string };

export class DatabaseTestModule implements OnModuleDestroy {
    private static postgres: Option<StartedPostgreSqlContainer>;

    public static register(options?: DatabaseTestModuleOptions): DynamicModule {
        return {
            module: DatabaseTestModule,
            imports: [
                MikroOrmModule.forRootAsync({
                    useFactory: async (configService: ConfigService<ServerConfig, true>) => {
                        const dbName =
                            options?.databaseName ||
                            `${configService.getOrThrow<DbConfig>('DB').DB_NAME}-${randomUUID()}`;
                        if (options?.isDatabaseRequired) {
                            this.postgres = await new PostgreSqlContainer('docker.io/postgres:15.3-alpine')
                                .withDatabase(dbName)
                                .withReuse()
                                .start();
                        }
                        return defineConfig({
                            clientUrl:
                                this.postgres?.getConnectionUri() ||
                                configService.getOrThrow<DbConfig>('DB').CLIENT_URL,
                            dbName,
                            entities: ['./dist/**/*.entity.js'],
                            entitiesTs: ['./src/**/*.entity.ts'],
                            allowGlobalContext: true,
                        });
                    },
                    inject: [ConfigService],
                }),
            ],
        };
    }

    public static async setupDatabase(orm: MikroORM): Promise<void> {
        await orm.getSchemaGenerator().createSchema();
    }

    public static async clearDatabase(orm: MikroORM): Promise<void> {
        await orm.getSchemaGenerator().clearDatabase();
    }

    public async onModuleDestroy(): Promise<void> {
        await DatabaseTestModule.postgres?.stop();
    }
}
