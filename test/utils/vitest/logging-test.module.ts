import { Global, Module } from '@nestjs/common';
import { ClassLogger } from '../../../src/core/logging/class-logger.js';
import { createMock } from '../createMock.js';

@Global()
@Module({
    providers: [
        {
            provide: ClassLogger,
            useValue: createMock<ClassLogger>(ClassLogger),
        },
    ],
    exports: [ClassLogger],
})
export class LoggingTestModule {}
