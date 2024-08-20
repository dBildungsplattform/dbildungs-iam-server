import { Injectable } from '@nestjs/common';

import { ClassLogger } from '../../../core/logging/class-logger.js';

import {
    PersonenkontextUpdatedData,
    PersonenkontextUpdatedEvent,
} from '../../../shared/events/personenkontext-updated.event.js';
import { EventHandler } from '../../../core/eventbus/decorators/event-handler.decorator.js';

import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { RolleID } from '../../../shared/types/aggregate-ids.types.js';
import { RolleServiceProviderEntity } from '../../rolle/entity/rolle-service-provider.entity.js';

type KontextIdsAndDuplicationFlag = {
    hasDuplicateRolleIds: boolean;
    personenkontextIdSet: Set<string>;
};
@Injectable()
export class KCtest {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly serviceRepo: ServiceProviderRepo,
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

    public async fetchFilteredRolesDifference(personId: string, rolleId: string): Promise<(string | undefined)[]> {
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

        const allServiceProvidersNames: Set<string | undefined> = new Set(
            allRolleServiceProviders.map((element: RolleServiceProviderEntity) => element.serviceProvider.keycloakRole),
        );

        const specificServiceProvidersNames: Set<string | undefined> = new Set(
            specificRolleServiceProviders.map(
                (element: RolleServiceProviderEntity) => element.serviceProvider.keycloakRole,
            ),
        );

        const updateRole: (string | undefined)[] = Array.from(specificServiceProvidersNames).filter(
            (role: string | undefined) => !allServiceProvidersNames.has(role),
        );

        return updateRole;
    }

    public async firstOne(personId: string, rolleId: string): Promise<(string | undefined)[]> {
        const specificRolleServiceProviders: RolleServiceProviderEntity[] =
            await this.serviceRepo.fetchRolleServiceProviders({
                personId: personId,
                rolleId: rolleId,
            });

        const allServiceProvidersNames: Set<string | undefined> = new Set(
            specificRolleServiceProviders.map(
                (element: RolleServiceProviderEntity) => element.serviceProvider.keycloakRole,
            ),
        );

        return Array.from(allServiceProvidersNames);
    }

    @EventHandler(PersonenkontextUpdatedEvent)
    public async updatePersonenkontexteKCandSP(event: PersonenkontextUpdatedEvent): Promise<void> {
        this.logger.info(`Received PersonenkontextUpdatedEvent, ${event.person.id}`);
        const firstRolleId: RolleID | undefined = event.newKontexte?.[0]?.rolleId;

        if (event.currentKontexte?.length > 0 && firstRolleId !== undefined) {
            const { hasDuplicateRolleIds, personenkontextIdSet }: KontextIdsAndDuplicationFlag = this.processKontexte(
                event.currentKontexte,
            );

            if (!hasDuplicateRolleIds) {
                if (personenkontextIdSet.size <= 1) {
                    await this.firstOne(event.person.id, firstRolleId);
                } else {
                    await this.fetchFilteredRolesDifference(event.person.id, firstRolleId);
                }
            }
        }

        return undefined;
    }
}
