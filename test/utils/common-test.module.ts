import { Module } from '@nestjs/common';
import { ConfigTestModule } from './config-test.module.js';
import { PermissionTestModule } from './permission-test.module.js';
import { LoggingTestModule } from './logging-test.module.js';

@Module({
    imports: [ConfigTestModule, LoggingTestModule, PermissionTestModule],
    providers: [],
    exports: [],
})
export class CommonTestModule {}
