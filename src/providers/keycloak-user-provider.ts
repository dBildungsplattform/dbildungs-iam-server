import { Injectable } from '@nestjs/common';
import { KeycloakUserService } from '../modules/keycloak-administration/domain/keycloak-user.service.js';
import { EventHandler } from '../core/eventbus/decorators/event-handler.decorator.js';
import { DeleteUserEvent } from '../shared/events/DeleteUserEvent.js';

@Injectable()
export class KeycloakUserProvider {
    public constructor(private readonly kcUserService: KeycloakUserService) {}

    @EventHandler(DeleteUserEvent)
    public async handleDeleteKeycloakUserEvent(event: DeleteUserEvent): Promise<void> {
        const keycloakUserId: string = event.keycloakUserId;
        await this.kcUserService.delete(keycloakUserId);
    }
}
