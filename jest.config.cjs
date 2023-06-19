/** @type {import('ts-jest').JestConfigWithTsJest} */
const commonConfig = {
    testEnvironment: 'node',
    rootDir: './src',
    preset: 'ts-jest/presets/default-esm',
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                useESM: true,
            },
        ],
    },
};

/** @type {import('jest').Config} */
module.exports = {
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
    collectCoverageFrom: ['**/*.ts', '!**/*.d.ts', '!**/*.integration-spec.ts', '!**/*.spec.ts', '!main.ts'],
    coverageDirectory: '../coverage',
    coverageProvider: 'v8',
};
