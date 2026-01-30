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
        testTimeout: 1000000,
        // include: ['**/*spec.ts'],
        include: [
            '**/authentication/**/*spec.ts',
            '**/cron/**/*spec.ts',
            '**/email/**/*spec.ts',
            '**/email-microservice/**/*spec.ts',
            '**/health/**/*spec.ts',
            '**/import/**/*spec.ts',
            '**/itslearning/**/*spec.ts',
            '**/kc-db-health/**/*spec.ts',
            '**/keycloak-administration/**/*spec.ts',
            '**/keycloak-handler/**/*spec.ts',
            '**/landesbediensteter/**/*spec.ts',
            '**/meldung/**/*spec.ts',
            '**/metrics/**/*spec.ts',
            '**/organisation/**/*spec.ts',
            '**/person/**/*spec.ts',
            '**/personenkontext/**/*spec.ts',
            '**/rolle/**/*spec.ts',
            '**/eventbus/**/*spec.ts',
            '**/ldap/**/*spec.ts',
            '**/logging/**/*spec.ts',
            '**/ox/**/*spec.ts',
            '**/privacy-idea-administration/**/*spec.ts',
            '**/schulconnex/**/*spec.ts',
            '**/service-provider/**/*spec.ts',
            '**/specification/**/*spec.ts',
            '**/spshconfig/**/*spec.ts',
            '**/status/**/*spec.ts',
            '**/vidis/**/*spec.ts',
            '**/shared/**/*spec.ts',
        ],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            reportsDirectory: 'coverage',
            include: ['src/**/*.ts'],
            exclude: ['**/*.spec.ts', '**/test/**', '**/*.d.ts', 'vite.config.ts'],
        },
    },
    resolve: {
        alias: {
            src: resolve(__dirname, './src'),
        },
    },
});
