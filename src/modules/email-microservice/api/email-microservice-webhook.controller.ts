import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiInternalServerErrorResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { EventRoutingLegacyKafkaService } from '../../../core/eventbus/services/event-routing-legacy-kafka.service.js';
import { EmailMicroserviceAddressChangedEvent } from '../../../shared/events/email-microservice/email-microservice-address-changed.event.js';
import { KafkaEmailMicroserviceAddressChangedEvent } from '../../../shared/events/email-microservice/kafka-email-microservice-address-changed.event.js';
import { EmailChangedBodyParams } from './changed.body.params.js';

@Controller({ path: 'email-webhook' })
@ApiTags('email-webhook')
@UseGuards(AuthGuard('api-key'))
export class EmailWebhookController {
    public constructor(private readonly eventService: EventRoutingLegacyKafkaService) {}

    @Post('changed')
    @HttpCode(HttpStatus.OK)
    @ApiCreatedResponse({ description: 'Event received' })
    @ApiUnauthorizedResponse({ description: 'Insufficient permissions to call webhook' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to call webhook' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while processing webhook' })
    public emailChangedWebhook(@Body() body: EmailChangedBodyParams): void {
        // Controller just publishes the event
        this.eventService.publish(
            new EmailMicroserviceAddressChangedEvent(
                body.spshPersonId,
                body.newPrimaryEmail,
                body.newAlternativeEmail,
                body.previousPrimaryEmail,
                body.previousAlternativeEmail,
            ),
            new KafkaEmailMicroserviceAddressChangedEvent(
                body.spshPersonId,
                body.newPrimaryEmail,
                body.newAlternativeEmail,
                body.previousPrimaryEmail,
                body.previousAlternativeEmail,
            ),
        );
    }
}
