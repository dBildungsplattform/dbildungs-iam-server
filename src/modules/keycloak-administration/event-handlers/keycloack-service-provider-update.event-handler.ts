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

    public processKontexte(kontexte: PersonenkontextUpdatedData[]): KontextIdsAndDuplicationFlag {
        const rolleIdSet: Set<string> = new Set<string>();
        const personenkontextIdSet: Set<string> = new Set<string>();
        let hasDuplicateRolleIds: boolean = false;

        for (const kontext of kontexte) {
            if (kontext.rolleId) {
                if (rolleIdSet.has(kontext.rolleId)) {
                    hasDuplicateRolleIds = true;
                    break;
                }
                rolleIdSet.add(kontext.rolleId);
            }
            if (kontext.id) {
                personenkontextIdSet.add(kontext.id);
            }
        }

        return { hasDuplicateRolleIds, personenkontextIdSet };
    }

    public async fetchFilteredRolesDifference(
        personId: string,
        rolleId: string,
    ): Promise<(KeycloakRole | undefined)[]> {
        const allRolleServiceProviders: RolleServiceProviderEntity[] =
            await this.serviceRepo.fetchRolleServiceProviders({
                personId: personId,
                rolleId: rolleId,
                excludeRolleId: true,
            });

        const specificRolleServiceProviders: RolleServiceProviderEntity[] =
            await this.serviceRepo.fetchRolleServiceProviders({
                personId: personId,
                rolleId: rolleId,
            });

        const allServiceProvidersNames: Set<KeycloakRole | undefined> = new Set(
            allRolleServiceProviders.map((element: RolleServiceProviderEntity) => element.serviceProvider.keycloakRole),
        );

        const specificServiceProvidersNames: Set<KeycloakRole | undefined> = new Set(
            specificRolleServiceProviders.map(
                (element: RolleServiceProviderEntity) => element.serviceProvider.keycloakRole,
            ),
        );

        const updateRole: (string | undefined)[] = Array.from(specificServiceProvidersNames).filter(
            (role: KeycloakRole | undefined) => !allServiceProvidersNames.has(role),
        );

        return updateRole;
    }

    public async fetchFilteredRoles(personId: string, rolleId: string): Promise<(KeycloakRole | undefined)[]> {
        const specificRolleServiceProviders: RolleServiceProviderEntity[] =
            await this.serviceRepo.fetchRolleServiceProviders({
                personId: personId,
                rolleId: rolleId,
            });

        const allServiceProvidersNames: Set<KeycloakRole | undefined> = new Set(
            specificRolleServiceProviders.map(
                (element: RolleServiceProviderEntity) => element.serviceProvider.keycloakRole,
            ),
        );

        return Array.from(allServiceProvidersNames);
    }

    public async fetchFilteredRolesDifferenceDelete(
        NewrolleId: string | string[],
        DeleteRolle: string | string[],
    ): Promise<(KeycloakRole | undefined)[]> {
        const allRolleServiceProviders: RolleServiceProviderEntity[] =
            await this.serviceRepo.fetchRolleServiceProvidersWithoutPerson({
                rolleId: DeleteRolle,
            });

        const specificRolleServiceProviders: RolleServiceProviderEntity[] =
            await this.serviceRepo.fetchRolleServiceProvidersWithoutPerson({
                rolleId: NewrolleId,
            });

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

    public async fetchFilteredRolesDelete(rolleId: string): Promise<(KeycloakRole | undefined)[]> {
        const specificRolleServiceProviders: RolleServiceProviderEntity[] =
            await this.serviceRepo.fetchRolleServiceProvidersWithoutPerson({
                rolleId: rolleId,
            });

        const allServiceProvidersNames: Set<KeycloakRole | undefined> = new Set(
            specificRolleServiceProviders.map(
                (element: RolleServiceProviderEntity) => element.serviceProvider.keycloakRole,
            ),
        );

        return Array.from(allServiceProvidersNames);
    }

    @EventHandler(PersonenkontextUpdatedEvent)
    public async updatePersonenkontexteKCandSP(event: PersonenkontextUpdatedEvent): Promise<void> {
        //this.logger.info(`Received PersonenkontextUpdatedEvent, ${event.person.id}`);
        const newRolle: RolleID | undefined = event.newKontexte?.[0]?.rolleId;
        let KeycloackRoleNames: (KeycloakRole | undefined)[];
        const currentRolleIDs: RolleID[] =
            event.currentKontexte?.map((kontext) => kontext.rolleId).filter((id) => id !== undefined) || [];
        const deleteRolle: RolleID | undefined = event.removedKontexte?.[0]?.rolleId;

        if (event.currentKontexte?.length && newRolle !== undefined) {
            const { hasDuplicateRolleIds, personenkontextIdSet }: KontextIdsAndDuplicationFlag = this.processKontexte(
                event.currentKontexte,
            );

            if (!hasDuplicateRolleIds) {
                if (personenkontextIdSet.size <= 1) {
                    KeycloackRoleNames = await this.fetchFilteredRoles(event.person.id, newRolle);
                } else {
                    KeycloackRoleNames = await this.fetchFilteredRolesDifference(event.person.id, newRolle);
                }
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
        }

        if (event.removedKontexte?.length && deleteRolle !== undefined) {
            KeycloackRoleNames = await this.fetchFilteredRolesDifferenceDelete(currentRolleIDs, deleteRolle);

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
