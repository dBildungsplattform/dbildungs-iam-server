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
                    PORT: 8081,
                },
                DB: {
                    CLIENT_URL: 'postgres://localhost:5432',
                    DB_NAME: 'test-db',
                    USE_SSL: false,
                },
                KEYCLOAK: {
                    BASE_URL: 'localhost:8080',
                    CLIENT_ID: 'admin-cli',
                    REALM_NAME: 'master',
                },
            };

            const secrets: DeepPartial<JsonConfig> = {
                DB: { SECRET: 'SuperSecretSecret' },
                KEYCLOAK: { SECRET: 'ClientSecret' },
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
                    CLIENT_ID: '',
                    REALM_NAME: '',
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
