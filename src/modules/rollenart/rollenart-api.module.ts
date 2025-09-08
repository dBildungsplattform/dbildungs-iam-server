import { Module } from '@nestjs/common';
import { RollenartController } from './api/rollenart.controller.js';
import { RollenartModule } from './rollenart.module.js';
import { LoggerModule } from '../../core/logging/logger.module.js';

@Module({
    imports: [RollenartModule, LoggerModule.register(RollenartApiModule.name)],
    providers: [],
    controllers: [RollenartController],
})
export class RollenartApiModule {}
