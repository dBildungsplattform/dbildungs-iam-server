import winston, { format, Logger } from 'winston';
import { ConfigService } from '@nestjs/config';
import { Inject } from '@nestjs/common';
import util from 'util';
import { ServerConfig } from '../../shared/config/index.js';
import { LoggingConfig } from '../../shared/config/logging.config.js';

const MODULE_NAME: string = 'MODULE_NAME';

export const localFormatter: (info: winston.Logform.TransformableInfo) => string = (
    info: winston.Logform.TransformableInfo,
) => {
    const message: string = typeof info.message === 'string' ? info.message : util.inspect(info.message);
    let context: string = 'Nest';
    let trace: string = '';
    let timestamp: string = '';
    let ms: string = '';

    if (typeof info['context'] === 'string') {
        context = info['context'];
    }

    if (typeof info['timestamp'] === 'string') {
        timestamp = info['timestamp'];
    }

    if (typeof info['ms'] === 'string') {
        ms = info['ms'];
    }

    if (typeof info['trace'] === 'string') {
        trace = `\n    ${info['trace']}`;
    }

    return `${info.level}\t ${timestamp} (${ms})\t \x1b[33m[${context}]\x1b[39m - ${message}${trace}`;
};

export class ModuleLogger {
    private logger: Logger;

    private moduleNameInternal: string;

    public constructor(@Inject(MODULE_NAME) moduleName: string, configService: ConfigService<ServerConfig, true>) {
        this.moduleNameInternal = moduleName;

        const loggerConfig: LoggingConfig = configService.getOrThrow<LoggingConfig>('LOGGING');
        const configKey: keyof LoggingConfig = `${moduleName.toUpperCase()}_LOG_LEVEL` as keyof LoggingConfig;
        const level: Option<string> = loggerConfig[configKey] ?? loggerConfig.DEFAULT_LOG_LEVEL;
        const loggerFormat: winston.Logform.Format = format.combine(
            format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
            winston.format.ms(),
            format.colorize(),
            format.printf(localFormatter),
        );

        this.logger = winston.createLogger({
            level,
            format: loggerFormat,
            levels: winston.config.syslog.levels,
            exitOnError: false,
            handleExceptions: true,
            handleRejections: true,
            transports: [new winston.transports.Console()], // transport needs to be newly created here to not share log level with other loggers
        });

        this.logger.info(`Logger for module ${moduleName} initialized with log level ${level}`);
    }

    public getLogger(): Logger {
        return this.logger;
    }

    public get moduleName(): string {
        return this.moduleNameInternal;
    }
}
