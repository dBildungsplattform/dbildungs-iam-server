import 'reflect-metadata'; // some decorators use reflect-metadata in the background
import fs from 'fs';
import { DeployStage, EnvConfig, JsonConfig, loadConfigFiles, loadEnvConfig } from './index.js';
import { DeepPartial } from '../../../test/utils/index.js';

describe('configloader', () => {
    describe('loadEnvConfig', () => {
        describe('when config is valid', () => {
            it('should return validated EnvConfig', () => {
                const config: Record<string, unknown> = { DEPLOY_STAGE: DeployStage.DEV };
                const validatedConfig: EnvConfig = loadEnvConfig(config);
                expect(validatedConfig).toBeInstanceOf(EnvConfig);
            });
        });

        describe('when config is invalid', () => {
            it('should throw', () => {
                const config: Record<string, unknown> = { DEPLOY_STAGE: '' };
                expect(() => loadEnvConfig(config)).toThrow();
            });
        });
    });

    describe('loadConfigFiles', () => {
        describe('when config is valid', () => {
            let readFileSyncSpy: jest.SpyInstance;

            const config: DeepPartial<JsonConfig> = {
                HOST: {
                    PORT: 8080,
                },
                FRONTEND: {
                    HOST: 'http://localhost:9091',
                    PORT: 8081,
                    BACKEND_ADDRESS: 'http://localhost:8080',
                    SECURE_COOKIE: false,
                    SESSION_TTL_MS: 1000,
                },
                DB: {
                    CLIENT_URL: 'postgres://localhost:5432',
                    DB_NAME: 'test-db',
                    USE_SSL: false,
                },
                KEYCLOAK: {
                    BASE_URL: 'localhost:8080',
                    ADMIN_CLIENT_ID: 'admin-cli',
                    ADMIN_REALM_NAME: 'master',
                    REALM_NAME: 'schulportal',
                    CLIENT_ID: 'schulportal',
                },
                REDIS: {
                    HOST: 'localhost',
                    PORT: 6379,
                    USERNAME: 'default',
                    USE_TLS: false,
                },
            };

            const secrets: DeepPartial<JsonConfig> = {
                DB: { SECRET: 'SuperSecretSecret' },
                KEYCLOAK: { ADMIN_SECRET: 'AdminClientSecret', CLIENT_SECRET: 'ClientSecret' },
                FRONTEND: { SESSION_SECRET: 'SessionSecret' },
                REDIS: { PASSWORD: 'password' },
            };

            beforeAll(() => {
                readFileSyncSpy = jest.spyOn(fs, 'readFileSync').mockReturnValueOnce(JSON.stringify(config));
                readFileSyncSpy = jest.spyOn(fs, 'readFileSync').mockReturnValueOnce(JSON.stringify(secrets));
            });

            afterAll(() => {
                jest.clearAllMocks();
            });

            it('should return validated JsonConfig', () => {
                const validatedConfig: JsonConfig = loadConfigFiles();
                expect(validatedConfig).toBeInstanceOf(JsonConfig);
                expect(readFileSyncSpy).toBeCalledTimes(2);
            });
        });

        describe('when config is invalid', () => {
            let readFileSyncSpy: jest.SpyInstance;

            const config: DeepPartial<JsonConfig> = {
                HOST: {
                    PORT: 1,
                },
                FRONTEND: {
                    PORT: 2,
                },
                DB: {
                    CLIENT_URL: '',
                    DB_NAME: '',
                },
                KEYCLOAK: {
                    BASE_URL: '',
                    ADMIN_CLIENT_ID: '',
                    ADMIN_REALM_NAME: '',
                    REALM_NAME: '',
                    CLIENT_ID: '',
                },
            };

            beforeAll(() => {
                readFileSyncSpy = jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(config));
            });

            afterAll(() => {
                jest.clearAllMocks();
            });

            it('should throw', () => {
                expect(() => loadConfigFiles()).toThrow();
                expect(readFileSyncSpy).toBeCalledTimes(2);
            });
        });
    });
});
