import winston, { format, Logger } from 'winston';
import { ConfigService } from '@nestjs/config';
import { Inject } from '@nestjs/common';
import util from 'util';
import { LoggingConfig } from '../../shared/config/logging.config.js';
import { MODULE_NAME } from './module-name.symbol.js';

export const localFormatter: (info: winston.Logform.TransformableInfo) => string = (
    info: winston.Logform.TransformableInfo,
) => {
    let context: string = 'Nest';
    if (typeof info['context'] === 'string') {
        context = info['context'];
    }
    const message: string = typeof info.message === 'string' ? info.message : util.inspect(info.message);

    let timestamp: string = '';
    if (typeof info['timestamp'] === 'string') {
        timestamp = info['timestamp'];
    }
    let ms: string = '';
    if (typeof info['ms'] === 'string') {
        ms = info['ms'];
    }

    let trace: string = '';
    if (typeof info['trace'] === 'string') {
        trace = `\n    ${info['trace']}`;
    }
    return `${info.level}\t ${timestamp} (${ms})\t \x1b[33m[${context}]\x1b[39m - ${message}${trace}`;
};

export class ModuleLogger {
    private logger: Logger;

    private moduleNameInternal: string;

    public constructor(@Inject(MODULE_NAME) moduleName: string, configService: ConfigService<LoggingConfig>) {
        this.moduleNameInternal = moduleName;
        let level: Option<string> = configService.get<string>(`${moduleName}_LOG_LEVEL` as keyof LoggingConfig);

        if (!level) {
            level = configService.get<string>('DEFAULT_LOG_LEVEL', 'info');
        }

        const loggerFormat = format.combine(
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
    }

    public getLogger(): Logger {
        return this.logger;
    }

    public get moduleName(): string {
        return this.moduleNameInternal;
    }
}
