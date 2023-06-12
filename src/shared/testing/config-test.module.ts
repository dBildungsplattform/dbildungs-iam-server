import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import TestConfig from '../../../config/config.test.json';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            ignoreEnvFile: true,
            ignoreEnvVars: true,
            load: [
                (): Record<string, unknown> => {
                    return TestConfig as Record<string, unknown>;
                },
            ],
        }),
    ],
})
export class ConfigTestModule {}
