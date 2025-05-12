import { Injectable } from '@nestjs/common';
import { EventHandler } from '../../../core/eventbus/decorators/event-handler.decorator.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { GroupAndRoleCreatedEvent } from '../../../shared/events/kc-group-and-role-event.js';
import { KeycloakGroupRoleService } from '../../keycloak-administration/domain/keycloak-group-role.service.js';
import { KafkaEventHandler } from '../../../core/eventbus/decorators/kafka-event-handler.decorator.js';
import { KafkaGroupAndRoleCreatedEvent } from '../../../shared/events/kafka-kc-group-and-role-event.js';

@Injectable()
export class CreateGroupAndRoleHandler {
    public constructor(
        private readonly keycloakGroupRoleService: KeycloakGroupRoleService,
        private readonly logger: ClassLogger,
    ) {}

    @KafkaEventHandler(KafkaGroupAndRoleCreatedEvent)
    @EventHandler(GroupAndRoleCreatedEvent)
    public async handleCreateGroupAndRoleEvent(event: GroupAndRoleCreatedEvent): Promise<void> {
        this.logger.info(`Received GroupAndRoleCreatedEvent, groupName: ${event.groupName}`);

        const group: Result<string, DomainError> = await this.keycloakGroupRoleService.createGroup(event.groupName);
        if (!group.ok) {
            this.logger.error(`Could not create group, error: ${group.error.message}`);
            return;
        }
        const groupId: string = group.value;

        const role: Result<string, DomainError> = await this.keycloakGroupRoleService.createRole(event.roleName);
        if (!role.ok) {
            this.logger.error(`Could not create role, error: ${role.error.message}`);
            return;
        }
        const roleName: string = decodeURIComponent(role.value);

        const addRoleToGroup: Result<boolean, DomainError> = await this.keycloakGroupRoleService.addRoleToGroup(
            groupId,
            roleName,
        );
        if (!addRoleToGroup.ok) {
            this.logger.error(`Could not add role to group, message: ${addRoleToGroup.error.message}`);
        }
    }
}
