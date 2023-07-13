import { EnvConfig } from './env.config.js';
import { JsonConfig } from './json.config.js';

export type ServerConfig = EnvConfig & JsonConfig;
