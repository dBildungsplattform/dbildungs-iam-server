import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { EmailHealthController } from './email-health.controller.js';
import { LoggerModule } from '../../../core/logging/logger.module.js';
import { EmailHealthIndicator } from './email-health-indicator.js';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [TerminusModule, HttpModule, LoggerModule.register(EmailHealthModule.name)],
    providers: [EmailHealthIndicator],
    controllers: [EmailHealthController],
})
export class EmailHealthModule {}
