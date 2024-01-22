import 'reflect-metadata'; // some decorators use reflect-metadata in the background
import fs from 'fs';
import { JsonConfig, loadConfigFiles } from './index.js';
import { DeepPartial } from '../../../test/utils/index.js';
import { PathLike } from 'node:fs';

describe('configloader', () => {
    describe('loadConfigFiles', () => {
        describe('when config is valid', () => {
            let readFileSyncSpy: jest.SpyInstance;
            let existsSyncSpy: jest.SpyInstance;

            const config: DeepPartial<JsonConfig> = {
                HOST: {
                    PORT: 8080,
                },
                FRONTEND: {
                    PORT: 8081,
                    TRUST_PROXY: false,
                    BACKEND_ADDRESS: 'http://localhost:8080',
                    SECURE_COOKIE: false,
                    SESSION_SECRET: 'SessionSecretForDevelopment',
                    SESSION_TTL_MS: 1000,
                    OIDC_CALLBACK_URL: 'http://localhost:9091/api/frontend/login',
                    DEFAULT_LOGIN_REDIRECT: '/login?done',
                    LOGOUT_REDIRECT: '/logout',
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
                LOGGING: {
                    DEFAULT_LOG_LEVEL: 'debug',
                },
            };

            const secrets: DeepPartial<JsonConfig> = {
                DB: { SECRET: 'SuperSecretSecret' },
                KEYCLOAK: { ADMIN_SECRET: 'AdminClientSecret', CLIENT_SECRET: 'ClientSecret' },
                FRONTEND: { SESSION_SECRET: 'SessionSecret' },
                REDIS: { PASSWORD: 'password' },
            };

            beforeEach(() => {
                readFileSyncSpy = jest.spyOn(fs, 'readFileSync').mockReturnValueOnce(JSON.stringify(config));
                readFileSyncSpy = jest.spyOn(fs, 'readFileSync').mockReturnValueOnce(JSON.stringify(secrets));
                existsSyncSpy = jest.spyOn(fs, 'existsSync').mockImplementation((name: PathLike): boolean => {
                    if (name == './config/secrets.json') {
                        return false;
                    } else if (name == './secrets/secrets.json') {
                        return true;
                    }
                    fail(`Unknown file ${name.toString()}`);
                });
            });

            afterEach(() => {
                jest.clearAllMocks();
            });

            it('should check both positions for the secrets file', () => {
                loadConfigFiles();
                expect(existsSyncSpy).toHaveBeenCalledTimes(2);
            });

            it('should return validated JsonConfig', () => {
                const validatedConfig: JsonConfig = loadConfigFiles();
                expect(validatedConfig).toBeInstanceOf(JsonConfig);
                expect(readFileSyncSpy).toHaveBeenCalledTimes(2);
            });
        });

        describe('When there is no secrets config', () => {
            const config: DeepPartial<JsonConfig> = {
                HOST: {
                    PORT: 8080,
                },
                FRONTEND: {
                    PORT: 8081,
                    TRUST_PROXY: false,
                    BACKEND_ADDRESS: 'http://localhost:8080',
                    SECURE_COOKIE: false,
                    SESSION_SECRET: 'SessionSecretForDevelopment',
                    SESSION_TTL_MS: 1000,
                    OIDC_CALLBACK_URL: 'http://localhost:9091/api/frontend/login',
                    DEFAULT_LOGIN_REDIRECT: '/login?done',
                    LOGOUT_REDIRECT: '/logout',
                },
                DB: {
                    CLIENT_URL: 'postgres://localhost:5432',
                    DB_NAME: 'test-db',
                    USE_SSL: false,
                    SECRET: 'gehaim',
                },
                KEYCLOAK: {
                    BASE_URL: 'localhost:8080',
                    ADMIN_CLIENT_ID: 'admin-cli',
                    ADMIN_REALM_NAME: 'master',
                    REALM_NAME: 'schulportal',
                    CLIENT_ID: 'schulportal',
                    ADMIN_SECRET: 'geheimer Admin',
                    CLIENT_SECRET: 'geheimer client',
                },
                REDIS: {
                    HOST: 'localhost',
                    PORT: 6379,
                    USERNAME: 'default',
                    USE_TLS: false,
                    PASSWORD: 'topsecret',
                },
                LOGGING: {
                    DEFAULT_LOG_LEVEL: 'debug',
                },
            };

            it("should not load the secrets file if it can't find it", () => {
                const existsSyncSpy: jest.SpyInstance = jest
                    .spyOn(fs, 'existsSync')
                    .mockImplementation((name: PathLike): boolean => {
                        if (name == './config/secrets.json') {
                            return false;
                        } else if (name == './secrets/secrets.json') {
                            return false;
                        }
                        fail(`Unknown file ${name.toString()}`);
                    });
                jest.spyOn(fs, 'readFileSync').mockReturnValueOnce(JSON.stringify(config));
                loadConfigFiles();
                expect(existsSyncSpy).toHaveBeenCalledTimes(2);
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

            beforeEach(() => {
                readFileSyncSpy = jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(config));
            });

            afterEach(() => {
                jest.clearAllMocks();
            });

            it('should throw', () => {
                expect(() => loadConfigFiles()).toThrow();
                expect(readFileSyncSpy).toHaveBeenCalled();
            });
        });
    });
});
