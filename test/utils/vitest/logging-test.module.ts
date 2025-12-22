import { createMock } from '@golevelup/ts-vitest';
import { Global, Module } from '@nestjs/common';
import { ClassLogger } from '../../../src/core/logging/class-logger.js';

@Global()
@Module({
    providers: [
        {
            provide: ClassLogger,
            useValue: createMock<ClassLogger>(),
        },
    ],
    exports: [ClassLogger],
})
export class LoggingTestModule {}
