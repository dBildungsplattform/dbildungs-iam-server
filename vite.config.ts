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
        coverage: {
            reporter: ['lcov', 'text'],
        },
        outputFile: 'coverage/sonar-report.xml',
        testTimeout: 1000000,
        // include: ['**/*spec.ts'],
        include: [
            '**/authentication/**/*spec.ts',
            '**/cron/**/*spec.ts',
            '**/email/**/*spec.ts',
            '**/health/**/*spec.ts',
            '**/import/**/*spec.ts',
            '**/itslearning/**/*spec.ts',
            '**/meldung/**/*spec.ts',
            '**/organisation/**/*spec.ts',
            '**/person/**/*spec.ts',
            '**/personenkontext/**/*spec.ts',
            '**/rolle/**/*spec.ts',
            '**/eventbus/**/*spec.ts',
            '**/ldap/**/*spec.ts',
            '**/logging/**/*spec.ts',
            '**/vidis/**/*spec.ts',
        ],
        // projects: [
        //     {
        //         test: {
        //             name: 'unit',
        //             // include: ['**/*.spec.ts'],
        //             include: [
        //                 '**/authentication/**/*.spec.ts',
        //                 '**/cron/**/*.spec.ts',
        //                 '**/email/**/*.spec.ts',
        //                 '**/health/**/*.spec.ts',
        //                 '**/import/**/*.spec.ts',
        //                 '**/itslearning/**/*.spec.ts',
        //                 '**/meldung/**/*.spec.ts',
        //                 '**/organisation/**/*.spec.ts',
        //                 '**/person/**/*.spec.ts',
        //                 '**/personenkontext/**/*.spec.ts',
        //                 '**/rolle/**/*.spec.ts',
        //                 '**/eventbus/**/*.spec.ts',
        //                 '**/ldap/**/*.spec.ts',
        //                 '**/logging/**/*.spec.ts',
        //             ],
        //         },
        //     },
        //     {
        //         test: {
        //             name: 'integration',
        //             include: [
        //                 '**/authentication/**/*.integration-spec.ts',
        //                 '**/cron/**/*.integration-spec.ts',
        //                 '**/email/**/*.integration-spec.ts',
        //                 '**/health/**/*.integration-spec.ts',
        //                 '**/import/**/*.integration-spec.ts',
        //                 '**/itslearning/**/*.integration-spec.ts',
        //                 '**/meldung/**/*.integration-spec.ts',
        //                 '**/organisation/**/*.integration-spec.ts',
        //                 '**/person/**/*.integration-spec.ts',
        //                 '**/personenkontext/**/*.integration-spec.ts',
        //                 '**/rolle/**/*.integration-spec.ts',
        //                 '**/eventbus/**/*.integration-spec.ts',
        //                 '**/ldap/**/*.integration-spec.ts',
        //                 '**/logging/**/*.integration-spec.ts',
        //             ],
        //         },
        //     },
        // ],
    },
    resolve: {
        alias: {
            src: resolve(__dirname, './src'),
        },
    },
});
