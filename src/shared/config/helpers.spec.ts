import 'reflect-metadata'; // some decorators use reflect-metadata in the background
import fs from 'fs';
import { EnvConfig, JsonConfig, NodeEnvType, loadConfig, validateConfig } from '../config/index.js';

describe('helpers', () => {
    describe('validateConfig', () => {
        describe('when config is valid', () => {
            it('should return validated EnvConfig', () => {
                const config = { NODE_ENV: NodeEnvType.DEV };
                const validatedConfig = validateConfig(config);
                expect(validatedConfig).toBeInstanceOf(EnvConfig);
            });
        });

        describe('when config is invalid', () => {
            it('should throw', () => {
                const config = { NODE_ENV: '' };
                expect(() => validateConfig(config)).toThrow();
            });
        });
    });

    describe('loadConfig', () => {
        describe('when config is valid', () => {
            let readFileSyncSpy: jest.SpyInstance;

            const config = {
                HOST: {
                    PORT: 8080,
                },
                DB: {
                    CLIENT_URL: 'postgres://localhost:5432',
                    DB_NAME: 'test-db',
                },
            } as JsonConfig;

            beforeAll(() => {
                readFileSyncSpy = jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(config));
            });

            afterAll(() => {
                jest.clearAllMocks();
            });

            it('should return validated JsonConfig', () => {
                const validatedConfig = loadConfig();
                expect(validatedConfig).toBeInstanceOf(JsonConfig);
                expect(readFileSyncSpy).toBeCalledTimes(1);
            });
        });

        describe('when config is invalid', () => {
            let readFileSyncSpy: jest.SpyInstance;

            const config = { HOST: { PORT: 1 } } as JsonConfig;

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
