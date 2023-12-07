import { readFileSync } from 'fs';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KeycloakConfig } from '../../src/shared/config/keycloak.config.js';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            ignoreEnvFile: true,
            ignoreEnvVars: true,
            load: [
                (): Record<string, unknown> => {
                    return JSON.parse(readFileSync('./config/config.test.json', { encoding: 'utf-8' })) as Record<
                        string,
                        unknown
                    >;
                },
            ],
        }),
    ],
})
export class ConfigTestModule {
    public static forRoot(keycloakBaseUrl: string): DynamicModule {
        return {
            module: ConfigTestModule,
            imports: [
                ConfigModule.forRoot({
                    isGlobal: true,
                    ignoreEnvFile: true,
                    ignoreEnvVars: true,
                    load: [
                        (): Record<string, unknown> => {
                            const record: Record<string, unknown> = JSON.parse(
                                readFileSync('./config/config.test.json', { encoding: 'utf-8' }),
                            ) as Record<string, unknown>;
                            const kcConfig: KeycloakConfig = record['KEYCLOAK'] as KeycloakConfig;
                            record['KEYCLOAK'] = {
                                BASE_URL: keycloakBaseUrl,
                                ADMIN_REALM_NAME: kcConfig.ADMIN_REALM_NAME,
                                ADMIN_CLIENT_ID: kcConfig.ADMIN_CLIENT_ID,
                                ADMIN_SECRET: kcConfig.ADMIN_SECRET,
                                REALM_NAME: kcConfig.REALM_NAME,
                                CLIENT_ID: kcConfig.CLIENT_ID,
                                CLIENT_SECRET: kcConfig.CLIENT_SECRET,
                            };
                            return record;
                        },
                    ],
                }),
            ],
        };
    }
}
