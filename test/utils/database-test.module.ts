import { MikroORM } from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { defineConfig } from '@mikro-orm/postgresql';
import { DynamicModule, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { randomUUID } from 'crypto';
import { PullPolicy } from 'testcontainers';
import { DbConfig, ServerConfig } from '../../src/shared/config/index.js';

type DatabaseTestModuleOptions = { isDatabaseRequired: boolean; databaseName?: string };

export class DatabaseTestModule implements OnModuleDestroy {
    private static postgres: Option<StartedPostgreSqlContainer>;

    public static forRoot(options?: DatabaseTestModuleOptions): DynamicModule {
        return {
            module: DatabaseTestModule,
            imports: [
                MikroOrmModule.forRootAsync({
                    useFactory: async (configService: ConfigService<ServerConfig, true>) => {
                        const dbName: string =
                            options?.databaseName ||
                            `${configService.getOrThrow<DbConfig>('DB').DB_NAME}-${randomUUID()}`;

                        if (options?.isDatabaseRequired) {
                            this.postgres = await new PostgreSqlContainer('docker.io/postgres:15.3-alpine')
                                .withDatabase(dbName)
                                .withPullPolicy(PullPolicy.defaultPolicy())
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
                            connect: options?.isDatabaseRequired ?? false,
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

    public constructor(private orm?: MikroORM) {}

    public async onModuleDestroy(): Promise<void> {
        if (this.orm) {
            await this.orm.close();
        }
        await DatabaseTestModule.postgres?.stop();
    }
}
