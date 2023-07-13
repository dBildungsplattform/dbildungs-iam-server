import 'reflect-metadata'; // some decorators use reflect-metadata in the background
import fs from 'fs';
import { EnvConfig, JsonConfig, NodeEnvType, loadConfig, validateConfig } from '../config/index.js';

describe('helpers', () => {
    describe('validateConfig', () => {
        describe('when config is valid', () => {
            it('should return validated EnvConfig', () => {
                const config: Record<string, unknown> = { NODE_ENV: NodeEnvType.DEV };
                const validatedConfig: EnvConfig = validateConfig(config);
                expect(validatedConfig).toBeInstanceOf(EnvConfig);
            });
        });

        describe('when config is invalid', () => {
            it('should throw', () => {
                const config: Record<string, unknown> = { NODE_ENV: '' };
                expect(() => validateConfig(config)).toThrow();
            });
        });
    });

    describe('loadConfig', () => {
        describe('when config is valid', () => {
            let readFileSyncSpy: jest.SpyInstance;

            const config: JsonConfig = {
                HOST: {
                    PORT: 8080,
                },
                DB: {
                    CLIENT_URL: 'postgres://localhost:5432',
                    DB_NAME: 'test-db',
                },
            };

            beforeAll(() => {
                readFileSyncSpy = jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(config));
            });

            afterAll(() => {
                jest.clearAllMocks();
            });

            it('should return validated JsonConfig', () => {
                const validatedConfig: JsonConfig = loadConfig();
                expect(validatedConfig).toBeInstanceOf(JsonConfig);
                expect(readFileSyncSpy).toBeCalledTimes(1);
            });
        });

        describe('when config is invalid', () => {
            let readFileSyncSpy: jest.SpyInstance;

            const config: JsonConfig = {
                HOST: {
                    PORT: 1,
                },
                DB: {
                    CLIENT_URL: '',
                    DB_NAME: '',
                },
            };

            beforeAll(() => {
                readFileSyncSpy = jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(config));
            });

            afterAll(() => {
                jest.clearAllMocks();
            });

            it('should throw', () => {
                expect(() => loadConfig()).toThrow();
                expect(readFileSyncSpy).toBeCalledTimes(1);
            });
        });
    });
});
