import { Injectable } from '@nestjs/common';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { EventHandler } from '../../../core/eventbus/decorators/event-handler.decorator.js';
import { EmailProviderAttachedEvent } from '../../../shared/events/email-provider-attached-event.js';
import { EmailProviderDetachedEvent } from '../../../shared/events/email-provider-detached-event.js';

@Injectable()
export class EmailEventHandler {
    public constructor(private readonly logger: ClassLogger) {}

    @EventHandler(EmailProviderAttachedEvent)
    public async asyncEmailProviderAttachedEventHandler(event: EmailProviderAttachedEvent): Promise<void> {
        this.logger.info(event.personId);
    }

    @EventHandler(EmailProviderDetachedEvent)
    public async asyncEmailProviderDetachedEventHandler(event: EmailProviderDetachedEvent): Promise<void> {
        this.logger.info(event.personId);
    }
}
