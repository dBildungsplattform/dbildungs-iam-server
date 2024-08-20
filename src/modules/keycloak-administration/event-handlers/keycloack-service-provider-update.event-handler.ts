import { Injectable } from '@nestjs/common';
//import { ClassLogger } from '../../../core/logging/class-logger.js';
import {
    PersonenkontextUpdatedData,
    PersonenkontextUpdatedEvent,
} from '../../../shared/events/personenkontext-updated.event.js';
import { EventHandler } from '../../../core/eventbus/decorators/event-handler.decorator.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { RolleID } from '../../../shared/types/aggregate-ids.types.js';
import { RolleServiceProviderEntity } from '../../rolle/entity/rolle-service-provider.entity.js';
import { KeycloakUserService } from '../domain/keycloak-user.service.js';

export type KontextIdsAndDuplicationFlag = {
    hasDuplicateRolleIds: boolean;
    personenkontextIdSet: Set<string>;
};
export type KeycloakRole = string;
@Injectable()
export class KCtest {
    public constructor(
        //private readonly logger: ClassLogger,
        private readonly serviceRepo: ServiceProviderRepo,
        private readonly KeycloackService: KeycloakUserService,
    ) {}

    public async fetchFilteredRolesDifference(
        currentRoles: string | string[],
        changingRole: string | string[],
    ): Promise<(KeycloakRole | undefined)[]> {
        const allRolleServiceProviders: RolleServiceProviderEntity[] =
            await this.serviceRepo.fetchRolleServiceProvidersWithoutPerson(changingRole);

        const specificRolleServiceProviders: RolleServiceProviderEntity[] =
            await this.serviceRepo.fetchRolleServiceProvidersWithoutPerson(currentRoles);

        const allServiceProvidersNames: Set<KeycloakRole | undefined> = new Set(
            allRolleServiceProviders.map((element: RolleServiceProviderEntity) => element.serviceProvider.keycloakRole),
        );

        const specificServiceProvidersNames: Set<KeycloakRole | undefined> = new Set(
            specificRolleServiceProviders.map(
                (element: RolleServiceProviderEntity) => element.serviceProvider.keycloakRole,
            ),
        );

        const updateRole: (string | undefined)[] = Array.from(allServiceProvidersNames).filter(
            (role: KeycloakRole | undefined) => !specificServiceProvidersNames.has(role),
        );

        return updateRole;
    }

    @EventHandler(PersonenkontextUpdatedEvent)
    public async updatePersonenkontexteKCandSP(event: PersonenkontextUpdatedEvent): Promise<void> {
        //this.logger.info(`Received PersonenkontextUpdatedEvent, ${event.person.id}`);
        const newRolle: RolleID | undefined = event.newKontexte?.[0]?.rolleId;
        let KeycloackRoleNames: (KeycloakRole | undefined)[];
        const currentRolleIDs: RolleID[] =
            event.currentKontexte
                ?.map((kontext: PersonenkontextUpdatedData) => kontext.rolleId)
                .filter((id: RolleID) => id !== undefined && id !== newRolle) || [];
        const deleteRolle: RolleID | undefined = event.removedKontexte?.[0]?.rolleId;

        if (event.currentKontexte?.length && newRolle !== undefined) {
            KeycloackRoleNames = await this.fetchFilteredRolesDifference(currentRolleIDs, newRolle);

            if (KeycloackRoleNames && event.person.keycloakUserId) {
                const filteredKeycloackRoleNames: KeycloakRole[] = KeycloackRoleNames.filter(
                    (role: string | undefined): role is string => role !== undefined,
                );
                await this.KeycloackService.assignRealmRolesToUser(
                    event.person.keycloakUserId,
                    filteredKeycloackRoleNames,
                );
            }
        }

        if (event.removedKontexte?.length && deleteRolle !== undefined) {
            KeycloackRoleNames = await this.fetchFilteredRolesDifference(currentRolleIDs, deleteRolle);

            if (KeycloackRoleNames && event.person.keycloakUserId) {
                const filteredKeycloackRoleNames: KeycloakRole[] = KeycloackRoleNames.filter(
                    (role: string | undefined): role is string => role !== undefined,
                );
                await this.KeycloackService.removeRealmRolesFromUser(
                    event.person.keycloakUserId,
                    filteredKeycloackRoleNames,
                );
            }
        }

        return undefined;
    }
}
