import { DbConfig } from './db.config.js';
import { KeycloakConfig } from './keycloak.config.js';
import { FrontendConfig } from './frontend.config.js';

export default (): { DB: Partial<DbConfig>; KEYCLOAK: Partial<KeycloakConfig>; FRONTEND: Partial<FrontendConfig> } => ({
    DB: {
        DB_NAME: process.env['DB_NAME'],
        SECRET: process.env['DB_SECRET'],
        CLIENT_URL: process.env['DB_CLIENT_URL'],
    },
    KEYCLOAK: {
        ADMIN_SECRET: process.env['KC_ADMIN_SECRET'],
        CLIENT_SECRET: process.env['KC_CLIENT_SECRET'],
    },
    FRONTEND: {
        SESSION_SECRET: process.env['FRONTEND_SESSION_SECRET'],
    },
});
