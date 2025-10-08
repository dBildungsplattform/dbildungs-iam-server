import { DbConfig } from './db.config.js';
import { HostConfig } from './host.config.js';
import { LoggingConfig } from './logging.config.js';

export type EmailConfig = {
    HOST: Partial<HostConfig>;
    LOGGING: Partial<LoggingConfig>;
    DB: Partial<DbConfig>;
};

export function getEmailConfig(): EmailConfig {
    return {
        HOST: {},
        LOGGING: {
            DEFAULT_LOG_LEVEL: process.env['LOGGING_DEFAULT_LOG_LEVEL'],
        },
        DB: {
            DB_NAME: process.env['DB_NAME'],
            USERNAME: process.env['DB_USERNAME'],
            SECRET: process.env['DB_SECRET'],
            CLIENT_URL: process.env['DB_CLIENT_URL'],
        },
    };
}
