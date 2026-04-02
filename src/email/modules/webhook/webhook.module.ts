import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { LoggerModule } from '../../../core/logging/logger.module';
import { WebhookService } from './domain/webhook.service';

@Module({
    imports: [LoggerModule.register(EmailWebhookModule.name), HttpModule],
    providers: [WebhookService],
    exports: [WebhookService],
})
export class EmailWebhookModule {}
