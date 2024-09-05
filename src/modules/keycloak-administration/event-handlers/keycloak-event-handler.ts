import { Injectable } from '@nestjs/common';

import { EventHandler } from '../../../core/eventbus/decorators/event-handler.decorator.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { OxUserCreatedEvent } from '../../../shared/events/ox-user-created.event.js';
import { KeycloakUserService } from '../domain/keycloak-user.service.js';

@Injectable()
export class KeycloakEventHandler {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly kcUserService: KeycloakUserService,
    ) {}

    @EventHandler(OxUserCreatedEvent)
    public async handleOxUserCreatedEvent(event: OxUserCreatedEvent): Promise<void> {
        this.logger.info(
            `Received OxUserCreatedEvent userId:${event.userId}, userName:${event.userName} contextId:${event.contextId}, contextName:${event.contextName}`,
        );

        await this.kcUserService.updateUser(event.keycloakUsername, event.userName, event.contextName);
    }
}
