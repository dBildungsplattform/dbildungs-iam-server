import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { EmailHealthController } from './email-health.controller.js';
import { LoggerModule } from '../../../core/logging/logger.module.js';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [TerminusModule, HttpModule, LoggerModule.register(EmailHealthModule.name)],
    controllers: [EmailHealthController],
})
export class EmailHealthModule {}
