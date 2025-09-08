import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { RollenartRepo } from './repo/rollenart.repo.js';

@Module({
    imports: [LoggerModule.register(RollenartModule.name)],
    providers: [RollenartRepo],
    exports: [RollenartRepo],
})
export class RollenartModule {}
