import { readFileSync } from 'fs';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            ignoreEnvFile: true,
            ignoreEnvVars: true,
            load: [
                (): Record<string, unknown> => {
                    return JSON.parse(readFileSync('./config/config.json', { encoding: 'utf-8' })) as Record<
                        string,
                        unknown
                    >;
                },
            ],
        }),
    ],
})
export class ConfigTestModule {}
