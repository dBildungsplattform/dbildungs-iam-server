import { createParamDecorator, ExecutionContext, PipeTransform, Type } from '@nestjs/common';
import { Request } from 'express';
import { PassportUser } from '../types/user.js';
import { PersonPermissions } from '../domain/person-permissions.js';
import winston, { format, Logger } from 'winston';
import { localFormatter } from '../../../core/logging/module-logger.js';
import { inspect } from 'util';

const loggerFormat: winston.Logform.Format = format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.ms(),
    format.colorize(),
    format.printf(localFormatter),
);

const logger: Logger = winston.createLogger({
    format: loggerFormat,
    levels: winston.config.syslog.levels,
    exitOnError: false,
    handleExceptions: true,
    handleRejections: true,
    transports: [new winston.transports.Console()], // transport needs to be newly created here to not share log level with other loggers
});

export const Permissions: (
    ...dataOrPipes: (Type<PipeTransform> | PipeTransform<unknown, unknown> | unknown[])[]
) => ParameterDecorator = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): Promise<PersonPermissions | undefined> => {
        const request: Request = ctx.switchToHttp().getRequest();
        const passportUser: PassportUser | undefined = request.passportUser;

        if (!passportUser) {
            return Promise.reject();
        } else {
            if (!passportUser.personPermissions || typeof passportUser.personPermissions !== 'function') {
                logger.error(
                    `PassportUser does not have personPermissions function. passportUser: ${inspect(passportUser)}`,
                );
                return Promise.reject();
            }
            return passportUser.personPermissions();
        }
    },
);
