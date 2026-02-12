import swc from 'unplugin-swc';
import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [
        // This is required to build the test files with SWC
        swc.vite({
            // Explicitly set the module type to avoid inheriting this value from a `.swcrc` config file
            module: { type: 'es6' },
        }),
    ],
    test: {
        globals: true,
        environment: 'node',
        hookTimeout: 60000, // 1 minute for setup/teardown
        testTimeout: 30000, // 30 seconds default timeout
        coverage: {
            provider: 'v8',
            reporter: [['text', { maxCols: 150 }], 'html', 'lcov'],
            reportsDirectory: 'coverage',
            reportOnFailure: true,
            include: ['src/**/*.ts'],
            exclude: [
                '**/main.ts',
                '**/index.ts',
                '**/*.module.ts',
                '**/*.spec.ts',
                '**/*.integration-spec.ts',
                '**/test/**',
                '**/*.d.ts',
                '**/*.types.ts',
                'vite.config.ts',
            ],
            thresholds: {
                statements: 99.7,
                branches: 97.6,
                functions: 99.9,
                lines: 99.7,
            },
        },
        projects: [
            {
                test: {
                    name: 'unit',
                    include: ['**/*.spec.ts'],
                    maxWorkers: '90%',
                    hookTimeout: 20000, // 20 seconds for setup/teardown
                    testTimeout: 20000, // 20 seconds for unit tests
                    sequence: {
                        groupOrder: 0,
                    },
                },
                extends: true,
            },
            {
                test: {
                    name: 'integration',
                    include: ['**/*.integration-spec.ts'],
                    maxWorkers: '50%', // limit the workers to leave CPU threads for test containers
                    hookTimeout: 300000, // 5 minutes for setup/teardown
                    testTimeout: 90000, // 1.5 minutes for integration tests
                    sequence: {
                        groupOrder: 1,
                    },
                },
                extends: true,
            },
        ],
    },
    resolve: {
        alias: {
            src: resolve(__dirname, './src'),
        },
    },
});
