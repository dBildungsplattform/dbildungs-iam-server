import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { GlobalExceptionFilter } from './global-exception.filter.js';

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
    ],
})
export class ErrorModule {}
