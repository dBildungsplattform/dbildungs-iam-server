import { EmailConfig, getEmailConfig } from './email-config.env.js';

describe('Config Loader For Email App', () => {
    beforeEach(() => {
        jest.resetModules();
        process.env = {};
    });

    describe('Email App Config', () => {
        it('should load System configuration with parsed integer values', () => {
            process.env['LOGGING_DEFAULT_LOG_LEVEL'] = 'debug';
            const config: EmailConfig = getEmailConfig();
            expect(config).toEqual(
                expect.objectContaining({
                    LOGGING: {
                        DEFAULT_LOG_LEVEL: 'debug',
                    },
                    HOST: {},
                }),
            );
        });
    });
});
