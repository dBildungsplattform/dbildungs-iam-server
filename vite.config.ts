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
        // include: ['**/*.spec.ts'],
        include: ['**/meldung/**/*spec.ts'],
        coverage: {
            reporter: ['lcov', 'text'],
        },
        outputFile: 'coverage/sonar-report.xml',
    },
    resolve: {
        alias: {
            src: resolve(__dirname, './src'),
        },
    },
});
