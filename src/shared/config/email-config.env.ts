import { KeycloakConfig } from './keycloak.config.js';
import { HostConfig } from './host.config.js';
import { LoggingConfig } from './logging.config.js';

export type EmailConfig = {
    KEYCLOAK: Partial<KeycloakConfig>;
    HOST: Partial<HostConfig>;
    LOGGING: Partial<LoggingConfig>;
};

export function getEmailConfig(): EmailConfig {
    return {
        KEYCLOAK: {
            ADMIN_SECRET: process.env['KC_ADMIN_SECRET'],
            CLIENT_SECRET: process.env['KC_CLIENT_SECRET'],
            SERVICE_CLIENT_PRIVATE_JWKS: process.env['KC_SERVICE_CLIENT_PRIVATE_JWKS'],
            BASE_URL: process.env['KC_BASE_URL'],
            EXTERNAL_BASE_URL: process.env['KC_EXTERNAL_BASE_URL'],
        },
        HOST: {},
        LOGGING: {
            DEFAULT_LOG_LEVEL: process.env['LOGGING_DEFAULT_LOG_LEVEL'],
        },
    };
}
