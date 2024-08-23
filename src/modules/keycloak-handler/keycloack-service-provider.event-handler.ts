import { Injectable } from '@nestjs/common';
import { ServiceProviderRepo } from '../service-provider/repo/service-provider.repo.js';

//import { RolleServiceProviderEntity } from '../rolle/entity/rolle-service-provider.entity.js';
import {
    PersonenkontextUpdatedData,
    PersonenkontextUpdatedEvent,
} from '../../shared/events/personenkontext-updated.event.js';
import { EventHandler } from '../../core/eventbus/decorators/event-handler.decorator.js';
import { KeycloakUserService } from '../keycloak-administration/index.js';
import { RolleID } from '../../shared/types/aggregate-ids.types.js';
import { ServiceProvider } from '../service-provider/domain/service-provider.js';

//import { ClassLogger } from '../../../core/logging/class-logger.js';

export type KontextIdsAndDuplicationFlag = {
    hasDuplicateRolleIds: boolean;
    personenkontextIdSet: Set<string>;
};
export type KeycloakRole = string;
@Injectable()
export class KeycloackServiceProviderHandler {
    public constructor(
        //private readonly logger: ClassLogger,
        private readonly serviceRepo: ServiceProviderRepo,
        private readonly KeycloackService: KeycloakUserService,
    ) {}

    public async fetchFilteredRolesDifference(
        currentRoles: RolleID | string[],
        changingRole: RolleID | string[],
    ): Promise<(KeycloakRole | undefined)[]> {
        const allRolleServiceProviders: ServiceProvider<true>[] =
            await this.serviceRepo.fetchRolleServiceProvidersWithoutPersonSS(changingRole);

        const specificRolleServiceProviders: ServiceProvider<true>[] =
            await this.serviceRepo.fetchRolleServiceProvidersWithoutPersonSS(currentRoles);

        const allServiceProvidersNames: Set<KeycloakRole | undefined> = new Set(
            allRolleServiceProviders.map((element: ServiceProvider<true>) => element.keycloakRole),
        );

        const specificServiceProvidersNames: Set<KeycloakRole | undefined> = new Set(
            specificRolleServiceProviders.map((element: ServiceProvider<true>) => element.keycloakRole),
        );

        const updateRole: (KeycloakRole | undefined)[] = Array.from(allServiceProvidersNames).filter(
            (role: KeycloakRole | undefined) => !specificServiceProvidersNames.has(role),
        );

        return updateRole;
    }

    @EventHandler(PersonenkontextUpdatedEvent)
    public async handlePersonenkontextUpdatedEvent(event: PersonenkontextUpdatedEvent): Promise<void> {
        const { newKontexte, currentKontexte, removedKontexte, person }: PersonenkontextUpdatedEvent = event;
        const newRolle: RolleID | undefined = newKontexte?.[0]?.rolleId;
        const deleteRolle: RolleID | undefined = removedKontexte?.[0]?.rolleId;
        const currentRolleIDs: RolleID[] = currentKontexte
            .map((kontext: PersonenkontextUpdatedData) => kontext.rolleId)
            .filter((id: RolleID) => id && id !== newRolle);

        if (person.keycloakUserId) {
            if (newRolle !== undefined && currentKontexte?.length) {
                await this.updateUserRoles(person.keycloakUserId, currentRolleIDs, newRolle);
            }

            if (deleteRolle !== undefined && removedKontexte?.length) {
                await this.updateUserRoles(person.keycloakUserId, currentRolleIDs, deleteRolle, true);
            }
        }
    }

    public async updateUserRoles(
        userId: string,
        currentRolleIDs: RolleID[],
        rolle: RolleID,
        remove: boolean = false,
    ): Promise<void> {
        const roleNames: (string | undefined)[] = await this.fetchFilteredRolesDifference(currentRolleIDs, rolle);
        if (roleNames) {
            const filteredRoleNames: string[] = roleNames.filter(
                (role: KeycloakRole | undefined): role is KeycloakRole => role !== undefined,
            );
            if (remove) {
                await this.KeycloackService.removeRealmRolesFromUser(userId, filteredRoleNames);
            } else {
                await this.KeycloackService.assignRealmRolesToUser(userId, filteredRoleNames);
            }
        }
    }
}
