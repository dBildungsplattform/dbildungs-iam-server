import { randomUUID } from 'crypto';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { defineConfig } from '@mikro-orm/postgresql';
import { Module } from '@nestjs/common';

@Module({
    imports: [
        MikroOrmModule.forRoot(
            defineConfig({
                clientUrl: 'postgres://127.0.0.1:5432',
                dbName: `test-db-${randomUUID()}`,
                entities: ['./dist/**/*.entity.js'],
                entitiesTs: ['./src/**/*.entity.ts'],
                allowGlobalContext: true,
            }),
        ),
    ],
})
export class DatabaseTestModule {}
