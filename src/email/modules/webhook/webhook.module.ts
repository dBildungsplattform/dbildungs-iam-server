import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { LoggerModule } from '../../../core/logging/logger.module.js';
import { WebhookService } from './domain/webhook.service.js';

@Module({
    imports: [LoggerModule.register(EmailWebhookModule.name), HttpModule],
    providers: [WebhookService],
    exports: [WebhookService],
})
export class EmailWebhookModule {}
