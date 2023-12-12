import { readFileSync } from 'fs';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { merge } from 'lodash-es';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            ignoreEnvFile: true,
            ignoreEnvVars: true,
            load: [
                (): Record<string, unknown> => {
                    const config: Record<string, unknown> = JSON.parse(
                        readFileSync('./config/config.json', { encoding: 'utf-8' }),
                    ) as Record<string, unknown>;
                    const secrets: Record<string, unknown> = JSON.parse(
                        readFileSync('./config/secrets.json', { encoding: 'utf-8' }),
                    ) as Record<string, unknown>;

                    return merge(config, secrets);
                },
            ],
        }),
    ],
})
export class ConfigTestModule {}
