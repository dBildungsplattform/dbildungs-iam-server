import { DbConfig } from './db.config.js';

export default (): { DB: Partial<DbConfig> } => ({
    DB: {
        DB_NAME: process.env['DB_NAME'],
        SECRET: process.env['DB_SECRET'],
    },
});
