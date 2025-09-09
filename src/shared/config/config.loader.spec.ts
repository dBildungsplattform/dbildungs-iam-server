import 'reflect-metadata'; // some decorators use reflect-metadata in the background

import fs from 'fs';
import { PathLike } from 'node:fs';

import { DeepPartial } from '../../../test/utils/index.js';
import { EmailAppConfig } from './email-app.config.js';
import { JsonConfig, loadConfigFiles, loadEmailAppConfigFiles } from './index.js';

describe('configloader', () => {
    describe('loadConfigFiles', () => {
        describe('when config is valid', () => {
            let readFileSyncSpy: jest.SpyInstance;

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
                    ERROR_PAGE_REDIRECT: '/error',
                    STATUS_REDIRECT_URL: '/',
                },
                FEATUREFLAG: {
                    FEATURE_FLAG_ROLLE_BEARBEITEN: true,
                    FEATURE_FLAG_BEFRISTUNG_BEARBEITEN: true,
                    FEATURE_FLAG_ROLLE_ERWEITERN: true,
                },
                DB: {
                    CLIENT_URL: 'postgres://localhost:5432',
                    USERNAME: 'admin',
                    DB_NAME: 'test-db',
                    USE_SSL: false,
                },
                KEYCLOAK: {
                    BASE_URL: 'localhost:8080',
                    EXTERNAL_BASE_URL: 'localhost:8080',
                    ADMIN_CLIENT_ID: 'admin-cli',
                    ADMIN_REALM_NAME: 'master',
                    REALM_NAME: 'schulportal',
                    CLIENT_ID: 'schulportal',
                    TEST_CLIENT_ID: 'schulportal-test',
                    SERVICE_CLIENT_ID: 'spsh-service',
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
                LDAP: {
                    URL: 'ldap://localhost',
                    BIND_DN: 'cn=admin,dc=schule-sh,dc=de',
                    BASE_DN: 'dc=schule-sh,dc=de',
                },
                ITSLEARNING: {
                    ENABLED: true,
                    ENDPOINT: 'http://itslearning',
                    USERNAME: 'username',
                    ROOT: 'sh',
                    ROOT_OEFFENTLICH: 'oeffentlich',
                    ROOT_ERSATZ: 'ersatz',
                    MAX_ATTEMPTS: 5,
                    MAX_BATCH_SIZE: 100,
                    RETRY_DELAY_MS: 15000,
                },
                PRIVACYIDEA: {
                    ENDPOINT: 'http://localhost:5000',
                    USERNAME: 'admin',
                    PASSWORD: 'admin',
                    USER_RESOLVER: 'mariadb_resolver',
                    REALM: 'defrealm',
                },
                VIDIS: {
                    BASE_URL: 'dummy-url',
                    USERNAME: 'dummy-username',
                    PASSWORD: 'dummy-password',
                    REGION_NAME: 'dummy-region',
                    KEYCLOAK_GROUP: 'VIDIS-service',
                    KEYCLOAK_ROLE: 'VIDIS-user',
                },
                OX: {
                    ENABLED: true,
                    ENDPOINT: 'https://ox_ip:ox_port/webservices/OXUserService',
                    CONTEXT_ID: '1337',
                    CONTEXT_NAME: 'context1',
                    USERNAME: 'username',
                    USER_PASSWORD_DEFAULT: 'password',
                },
                EMAIL: {
                    NON_ENABLED_EMAIL_ADDRESSES_DEADLINE_IN_DAYS: 180,
                },
                IMPORT: {
                    CSV_FILE_MAX_SIZE_IN_MB: 10,
                    CSV_MAX_NUMBER_OF_USERS: 2001,
                    PASSPHRASE_SECRET: '44abDqJk2qgwRbpGfO0VZx7DpXeFsm7R',
                    PASSPHRASE_SALT: 'YDp6fYkbUcj4ZkyAOnbAHGQ9O72htc5M',
                },
                SYSTEM: {
                    RENAME_WAITING_TIME_IN_SECONDS: 2,
                    STEP_UP_TIMEOUT_ENABLED: 'true',
                    STEP_UP_TIMEOUT_IN_SECONDS: 10,
                },
                HEADER_API_KEY: {
                    INTERNAL_COMMUNICATION_API_KEY: 'test123',
                },
                KAFKA: {
                    BROKER: 'localhost:9094',
                    TOPIC_PREFIX: 'local.',
                    USER_TOPIC: 'spsh-user-topic',
                    USER_DLQ_TOPIC: 'spsh-user-dlq-topic',
                    GROUP_ID: 'nestjs-kafka',
                    SESSION_TIMEOUT: 300000,
                    HEARTBEAT_INTERVAL: 10000,
                    ENABLED: true,
                    SSL_ENABLED: true,
                    SSL_CA_PATH: '/tls/ca.pem',
                    SSL_CERT_PATH: '/tls/client-cert.pem',
                    SSL_KEY_PATH: '/tls/client-key.pem',
                },
                PORTAL: {
                    LIMITED_ROLLENART_ALLOWLIST: ['LERN', 'EXTERN'],
                },
                CRON: {
                    PERSON_WITHOUT_ORG_LIMIT: 30,
                },
            };

            const secrets: DeepPartial<JsonConfig> = {
                DB: { SECRET: 'SuperSecretSecret' },
                KEYCLOAK: {
                    ADMIN_SECRET: 'AdminClientSecret',
                    CLIENT_SECRET: 'ClientSecret',
                    SERVICE_CLIENT_PRIVATE_JWKS: '{"keys":[]}',
                },
                LDAP: { ADMIN_PASSWORD: 'password' },
                FRONTEND: { SESSION_SECRET: 'SessionSecret' },
                FEATUREFLAG: {},
                REDIS: { PASSWORD: 'password' },
                ITSLEARNING: {
                    PASSWORD: 'password',
                },
                OX: {
                    PASSWORD: 'password',
                },
            };

            beforeEach(() => {
                readFileSyncSpy = jest.spyOn(fs, 'readFileSync').mockReturnValueOnce(JSON.stringify(config));
                readFileSyncSpy = jest.spyOn(fs, 'readFileSync').mockReturnValueOnce(JSON.stringify(secrets));
            });

            afterEach(() => {
                jest.clearAllMocks();
            });

            it('should return validated JsonConfig', () => {
                jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true);
                const validatedConfig: JsonConfig = loadConfigFiles();
                expect(validatedConfig).toBeInstanceOf(JsonConfig);
                expect(readFileSyncSpy).toHaveBeenCalledTimes(2);
            });
        });

        describe('When there is no secrets config', () => {
            beforeAll(() => {
                jest.clearAllMocks();
            });

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
                    ERROR_PAGE_REDIRECT: '/error',
                    STATUS_REDIRECT_URL: '/',
                },
                FEATUREFLAG: {
                    FEATURE_FLAG_ROLLE_BEARBEITEN: true,
                    FEATURE_FLAG_BEFRISTUNG_BEARBEITEN: true,
                    FEATURE_FLAG_ROLLE_ERWEITERN: true,
                },
                DB: {
                    CLIENT_URL: 'postgres://localhost:5432',
                    USERNAME: 'admin',
                    DB_NAME: 'test-db',
                    USE_SSL: false,
                    SECRET: 'gehaim',
                },
                KEYCLOAK: {
                    BASE_URL: 'localhost:8080',
                    EXTERNAL_BASE_URL: 'localhost:8080',
                    ADMIN_CLIENT_ID: 'admin-cli',
                    ADMIN_REALM_NAME: 'master',
                    REALM_NAME: 'schulportal',
                    CLIENT_ID: 'schulportal',
                    ADMIN_SECRET: 'geheimer Admin',
                    CLIENT_SECRET: 'geheimer client',
                    TEST_CLIENT_ID: 'schulportal-test',
                    SERVICE_CLIENT_ID: 'spsh-service',
                    SERVICE_CLIENT_PRIVATE_JWKS: '{"keys":[]}',
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
                LDAP: {
                    URL: 'ldap://localhost',
                    BIND_DN: 'cn=admin,dc=schule-sh,dc=de',
                    ADMIN_PASSWORD: 'password',
                    BASE_DN: 'dc=schule-sh,dc=de',
                },
                ITSLEARNING: {
                    ENABLED: true,
                    ENDPOINT: 'http://itslearning',
                    USERNAME: 'username',
                    PASSWORD: 'password',
                    ROOT: 'sh',
                    ROOT_OEFFENTLICH: 'oeffentlich',
                    ROOT_ERSATZ: 'ersatz',
                    MAX_ATTEMPTS: 5,
                    MAX_BATCH_SIZE: 100,
                    RETRY_DELAY_MS: 15000,
                },
                PRIVACYIDEA: {
                    ENDPOINT: 'http://localhost:5000',
                    USERNAME: 'admin',
                    PASSWORD: 'admin',
                    USER_RESOLVER: 'mariadb_resolver',
                    REALM: 'defrealm',
                },
                VIDIS: {
                    BASE_URL: 'dummy-url',
                    USERNAME: 'dummy-username',
                    PASSWORD: 'dummy-password',
                    REGION_NAME: 'dummy-region',
                    KEYCLOAK_GROUP: 'VIDIS-service',
                    KEYCLOAK_ROLE: 'VIDIS-user',
                },
                OX: {
                    ENABLED: true,
                    ENDPOINT: 'https://ox_ip:ox_port/webservices/OXUserService',
                    CONTEXT_ID: '1337',
                    CONTEXT_NAME: 'context1',
                    USERNAME: 'username',
                    PASSWORD: 'password',
                    USER_PASSWORD_DEFAULT: 'password',
                },
                EMAIL: {
                    NON_ENABLED_EMAIL_ADDRESSES_DEADLINE_IN_DAYS: 180,
                },
                IMPORT: {
                    CSV_FILE_MAX_SIZE_IN_MB: 10,
                    CSV_MAX_NUMBER_OF_USERS: 2001,
                    PASSPHRASE_SECRET: '44abDqJk2qgwRbpGfO0VZx7DpXeFsm7R',
                    PASSPHRASE_SALT: 'YDp6fYkbUcj4ZkyAOnbAHGQ9O72htc5M',
                },
                SYSTEM: {
                    RENAME_WAITING_TIME_IN_SECONDS: 2,
                    STEP_UP_TIMEOUT_ENABLED: 'true',
                    STEP_UP_TIMEOUT_IN_SECONDS: 10,
                },
                HEADER_API_KEY: {
                    INTERNAL_COMMUNICATION_API_KEY: 'test123',
                },
                KAFKA: {
                    BROKER: 'localhost',
                    TOPIC_PREFIX: 'local.',
                    USER_TOPIC: 'spsh-user-topic',
                    USER_DLQ_TOPIC: 'spsh-user-dlq-topic',
                    GROUP_ID: 'nestjs-kafka',
                    SESSION_TIMEOUT: 300000,
                    HEARTBEAT_INTERVAL: 10000,
                    ENABLED: true,
                    SSL_ENABLED: false,
                    SSL_CA_PATH: undefined,
                    SSL_CERT_PATH: undefined,
                    SSL_KEY_PATH: undefined,
                },
                PORTAL: {
                    LIMITED_ROLLENART_ALLOWLIST: ['LERN', 'EXTERN'],
                },
                CRON: {
                    PERSON_WITHOUT_ORG_LIMIT: 30,
                },
            };

            it("should not load the secrets file if it can't find it", () => {
                const existsSyncSpy: jest.SpyInstance = jest
                    .spyOn(fs, 'existsSync')
                    .mockImplementation((name: PathLike): boolean => {
                        if (name == './config/secrets.json') {
                            return false;
                        }
                        fail(`Unknown file ${name.toString()}`);
                    });
                jest.spyOn(fs, 'readFileSync').mockReturnValueOnce(JSON.stringify(config));
                loadConfigFiles();
                expect(existsSyncSpy).toHaveBeenCalledTimes(1);
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
                    TEST_CLIENT_ID: '',
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

    describe('loadEmailAppConfigFiles', () => {
        describe('when config is valid', () => {
            let readFileSyncSpy: jest.SpyInstance;

            const config: DeepPartial<EmailAppConfig> = {
                HOST: {
                    PORT: 8080,
                },
                LOGGING: {
                    DEFAULT_LOG_LEVEL: 'debug',
                },
            };

            const secrets: DeepPartial<EmailAppConfig> = {};

            beforeEach(() => {
                readFileSyncSpy = jest.spyOn(fs, 'readFileSync').mockReturnValueOnce(JSON.stringify(config));
                readFileSyncSpy = jest.spyOn(fs, 'readFileSync').mockReturnValueOnce(JSON.stringify(secrets));
            });

            afterEach(() => {
                jest.clearAllMocks();
            });

            it('should return validated JsonConfig', () => {
                jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true);
                const validatedConfig: EmailAppConfig = loadEmailAppConfigFiles();
                expect(validatedConfig).toBeInstanceOf(EmailAppConfig);
                expect(readFileSyncSpy).toHaveBeenCalledTimes(2);
            });
        });

        describe('When there is no secrets config', () => {
            beforeAll(() => {
                jest.clearAllMocks();
            });

            const config: DeepPartial<EmailAppConfig> = {
                HOST: {
                    PORT: 8080,
                },
                LOGGING: {
                    DEFAULT_LOG_LEVEL: 'debug',
                },
            };

            it("should not load the secrets file if it can't find it", () => {
                const existsSyncSpy: jest.SpyInstance = jest
                    .spyOn(fs, 'existsSync')
                    .mockImplementation((name: PathLike): boolean => {
                        if (name == './config/email-secrets.json') {
                            return false;
                        }
                        fail(`Unknown file ${name.toString()}`);
                    });
                jest.spyOn(fs, 'readFileSync').mockReturnValueOnce(JSON.stringify(config));
                loadEmailAppConfigFiles();
                expect(existsSyncSpy).toHaveBeenCalledTimes(1);
            });
        });

        describe('when config is invalid', () => {
            let readFileSyncSpy: jest.SpyInstance;

            const config: DeepPartial<EmailAppConfig> = {
                HOST: {
                    PORT: 1,
                },
            };

            beforeEach(() => {
                readFileSyncSpy = jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(config));
            });

            afterEach(() => {
                jest.clearAllMocks();
            });

            it('should throw', () => {
                expect(() => loadEmailAppConfigFiles()).toThrow();
                expect(readFileSyncSpy).toHaveBeenCalled();
            });
        });
    });
});
