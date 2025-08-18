import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { RollenMappingFactory } from './domain/rollenmapping.factory.js';
import { RollenMappingRepo } from './repo/rollenmapping.repo.js';

@Module({
    imports: [LoggerModule.register(RollenMappingModule.name)],
    providers: [RollenMappingRepo, RollenMappingFactory],
    exports: [RollenMappingRepo, RollenMappingFactory],
})
export class RollenMappingModule {}
