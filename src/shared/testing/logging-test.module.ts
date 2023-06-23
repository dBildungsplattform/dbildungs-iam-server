import { createMock } from '@golevelup/ts-jest';
import { Global, Module } from '@nestjs/common';
import { LoggerService } from '../index.js';

@Global()
@Module({
    providers: [
        {
            provide: LoggerService,
            useValue: createMock<LoggerService>(),
        },
    ],
    exports: [LoggerService],
})
export class LoggingTestModule {}
