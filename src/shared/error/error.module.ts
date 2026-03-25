import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { GlobalExceptionFilter } from './global-exception.filter.js';
import { SharedExceptionFilter } from '../filter/shared-exception-filter.js';
import { ValidationExceptionFilter } from '../filter/validation-exception-filter.js';
import { AuthenticationExceptionFilter } from '../../modules/authentication/api/authentication-exception-filter.js';

/**
 * Overrides the default global Exception Filter of NestJS provided by @APP_FILTER
 */
@Module({
    imports: [LoggerModule.register(ErrorModule.name)],
    providers: [
        {
            provide: APP_FILTER,
            useClass: GlobalExceptionFilter,
        },
        { provide: APP_FILTER, useClass: ValidationExceptionFilter },
        { provide: APP_FILTER, useClass: AuthenticationExceptionFilter },
        { provide: APP_FILTER, useClass: SharedExceptionFilter },
    ],
})
export class ErrorModule {}
