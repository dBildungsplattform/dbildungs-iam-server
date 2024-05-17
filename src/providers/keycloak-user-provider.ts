import { Injectable } from '@nestjs/common';
import { KeycloakUserService } from '../modules/keycloak-administration/domain/keycloak-user.service.js';
import { EventHandler } from '../core/eventbus/decorators/event-handler.decorator.js';
import { DeleteKeycloakUserEvent } from '../shared/events/DeleteKeycloakUserEvent.js';

@Injectable()
export class KeycloakUserProvider {
    public constructor(private readonly kcUserService: KeycloakUserService) {}

    @EventHandler(DeleteKeycloakUserEvent)
    public async handleDeleteKeycloakUserEvent(event: DeleteKeycloakUserEvent): Promise<void> {
        const userId: string = event.userId;
        await this.kcUserService.delete(userId);
    }
}
