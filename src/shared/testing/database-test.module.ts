import { randomUUID } from 'crypto';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from 'testcontainers';
import { DynamicModule, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { defineConfig } from '@mikro-orm/postgresql';
import { DbConfig, ServerConfig } from '../../shared/index.js';
import { MikroORM } from '@mikro-orm/core';
import { LazyModuleLoader } from '@nestjs/core';

type DatabaseTestModuleOptions = { isDbRequired: boolean; dbName?: string };

@Module({})
export class DatabaseTestModule implements OnModuleInit, OnModuleDestroy {
    private static postgres: Option<StartedPostgreSqlContainer>;

    private static dbName: Option<string>;

    private static orm: Option<MikroORM>;

    public constructor(private readonly lazyLoader: LazyModuleLoader) {}

    public static register(options?: DatabaseTestModuleOptions): DynamicModule {
        return {
            module: DatabaseTestModule,
            imports: [
                MikroOrmModule.forRootAsync({
                    useFactory: async (configService: ConfigService<ServerConfig, true>) => {
                        this.dbName =
                            options?.dbName || `${configService.getOrThrow<DbConfig>('DB').DB_NAME}-${randomUUID()}`;
                        if (options?.isDbRequired) {
                            this.postgres = await new PostgreSqlContainer('docker.io/postgres:15.3-alpine').start();
                        }
                        return defineConfig({
                            clientUrl:
                                this.postgres?.getConnectionUri() ||
                                configService.getOrThrow<DbConfig>('DB').CLIENT_URL,
                            dbName: this.dbName,
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

    public static async clearDatabase(): Promise<void> {
        await this.orm?.getSchemaGenerator().clearDatabase();
    }

    public async onModuleInit(): Promise<void> {
        const moduleRef = await this.lazyLoader.load(() => MikroORM);
        DatabaseTestModule.orm = moduleRef.get(MikroORM);
        await DatabaseTestModule.orm?.getSchemaGenerator().createSchema();
    }

    public async onModuleDestroy(): Promise<void> {
        await DatabaseTestModule.postgres?.stop({ remove: true, removeVolumes: true });
    }
}
