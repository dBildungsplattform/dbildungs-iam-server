import configEnv, { Config } from './config.env.js';

describe('Config Loader', () => {
    beforeEach(() => {
        jest.resetModules();
        process.env = {};
    });

    describe('System Config', () => {
        it('should load System configuration with parsed integer values', () => {
            process.env['SYSTEM_RENAME_WAITING_TIME_IN_SECONDS'] = '60';
            process.env['SYSTEM_STEP_UP_TIMEOUT_IN_SECONDS'] = '120';
            process.env['SYSTEM_STEP_UP_TIMEOUT_ENABLED'] = 'true';

            const config: Config = configEnv();
            expect(config.SYSTEM).toEqual({
                RENAME_WAITING_TIME_IN_SECONDS: 60,
                STEP_UP_TIMEOUT_IN_SECONDS: 120,
                STEP_UP_TIMEOUT_ENABLED: true,
            });
        });

        it('should set undefined for System integer values if not provided', () => {
            const config: Config = configEnv();
            expect(config.SYSTEM).toEqual({
                RENAME_WAITING_TIME_IN_SECONDS: undefined,
                STEP_UP_TIMEOUT_IN_SECONDS: undefined,
                STEP_UP_TIMEOUT_ENABLED: false,
            });
        });
    });
});
