import { randomUUID } from 'crypto';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { defineConfig } from '@mikro-orm/postgresql';
import { Module } from '@nestjs/common';

@Module({
    imports: [
        MikroOrmModule.forRoot(
            defineConfig({
                clientUrl: 'postgres://admin:admin@127.0.0.1:5432',
                dbName: `test-${randomUUID()}`,
                entities: ['./dist/**/*.entity.js'],
                entitiesTs: ['./src/**/*.entity.ts'],
            }),
        ),
    ],
})
export class DatabaseTestModule {}
