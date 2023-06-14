import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { defineConfig } from '@mikro-orm/postgresql';
import { DbConfig, ServerConfig } from '../../shared/index.js';

@Module({
    imports: [
        MikroOrmModule.forRootAsync({
            useFactory: (configService: ConfigService<ServerConfig, true>) => {
                return defineConfig({
                    clientUrl: configService.getOrThrow<DbConfig>('DB').CLIENT_URL,
                    dbName: configService.getOrThrow<DbConfig>('DB').DB_NAME,
                    entities: ['./dist/**/*.entity.js'],
                    entitiesTs: ['./src/**/*.entity.ts'],
                    allowGlobalContext: true,
                });
            },
            inject: [ConfigService],
        }),
    ],
})
export class DatabaseTestModule {}
