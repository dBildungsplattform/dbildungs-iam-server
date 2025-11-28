/** @jest-config-loader ts-node */
import type { Config } from 'jest';
// import { createDefaultPreset } from 'ts-jest';
// import { createJsWithTsEsmPreset, type JestConfigWithTsJest } from 'ts-jest';

const commonConfig: Partial<Config> = {
    testEnvironment: 'node',
    rootDir: './src',
    preset: 'ts-jest/presets/default-esm',
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
        '^lodash-es$': 'lodash',
    },
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                useESM: true,
            },
        ],
    },
    transformIgnorePatterns: ['node_modules'],
};

const config: Config = {
    // ...createDefaultPreset(),
    projects: [
        {
            displayName: 'unit',
            testRegex: '.*\\.spec\\.ts$',
            ...commonConfig,
        },
        {
            displayName: 'integration',
            testRegex: '/.*\\.integration-spec\\.ts$',
            ...commonConfig,
        },
    ],
    coverageDirectory: './coverage',
    coverageProvider: 'babel',
    collectCoverageFrom: [
        '**/*.ts',
        '!**/*.d.ts',
        '!**/*.spec.ts',
        '!**/*.integration-spec.ts',
        '!**/index.ts',
        '!**/main.ts',
        '!**/*.types.ts',
    ],
    coverageThreshold: {
        global: {
            statements: 100,
            branches: 100,
            functions: 100,
            lines: 100,
        },
    },
    testTimeout: 1000000,
};

export default config;
