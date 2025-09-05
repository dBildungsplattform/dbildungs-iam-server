import { HostConfig } from './host.config.js';
import { LoggingConfig } from './logging.config.js';

export type EmailConfig = {
    HOST: Partial<HostConfig>;
    LOGGING: Partial<LoggingConfig>;
};

export function getEmailConfig(): EmailConfig {
    return {
        HOST: {},
        LOGGING: {
            DEFAULT_LOG_LEVEL: process.env['LOGGING_DEFAULT_LOG_LEVEL'],
        },
    };
}
