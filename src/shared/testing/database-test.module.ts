import { randomUUID } from 'crypto';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from 'testcontainers';
import { DynamicModule, Module, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { defineConfig } from '@mikro-orm/postgresql';
import { DbConfig, ServerConfig } from '../../shared/index.js';
import { MikroORM } from '@mikro-orm/core';

let postgres: Option<StartedPostgreSqlContainer>;

type DatabaseTestModuleOptions = { isDatabaseRequired: boolean };

@Module({})
export class DatabaseTestModule implements OnModuleDestroy {
    public static register(options?: DatabaseTestModuleOptions): DynamicModule {
        return {
            module: DatabaseTestModule,
            imports: [
                MikroOrmModule.forRootAsync({
                    useFactory: async (configService: ConfigService<ServerConfig, true>) => {
                        const dbName = `${configService.getOrThrow<DbConfig>('DB').DB_NAME}-${randomUUID()}`;
                        if (options?.isDatabaseRequired) {
                            console.debug('n\n STARTING A NEW POSTGRES CONTAINER!');
                            postgres = await new PostgreSqlContainer('docker.io/postgres:15.3-alpine')
                                .withDatabase(dbName)
                                .start();
                        }
                        return defineConfig({
                            clientUrl:
                                postgres?.getConnectionUri() || configService.getOrThrow<DbConfig>('DB').CLIENT_URL,
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

    public async onModuleDestroy(): Promise<void> {
        await postgres?.stop({ remove: true, removeVolumes: true });
    }
}

export async function setupDatabase(orm: MikroORM): Promise<void> {
    await orm.getSchemaGenerator().createSchema();
}

export async function clearDatabase(orm: MikroORM): Promise<void> {
    await orm.getSchemaGenerator().clearDatabase();
}
