import { Injectable } from '@nestjs/common';

import { ClassLogger } from '../../../core/logging/class-logger.js';

import {
    PersonenkontextUpdatedData,
    PersonenkontextUpdatedEvent,
} from '../../../shared/events/personenkontext-updated.event.js';
import { EventHandler } from '../../../core/eventbus/decorators/event-handler.decorator.js';

import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { RolleID } from '../../../shared/types/aggregate-ids.types.js';

@Injectable()
export class KCtest {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly serviceRepo: ServiceProviderRepo,
    ) {}

    public processKontexte(kontexte: PersonenkontextUpdatedData[]): {
        hasRolleIdDuplicates: boolean;
        personenkontextSet: Set<string>;
    } {
        const rolleIdSet: Set<string> = new Set<string>();
        const personenkontextSet: Set<string> = new Set<string>();
        let hasRolleIdDuplicates: boolean = false;

        for (const kontext of kontexte) {
            if (kontext.rolleId) {
                if (rolleIdSet.has(kontext.rolleId)) {
                    hasRolleIdDuplicates = true;
                    break;
                }
                rolleIdSet.add(kontext.rolleId);
            }
            if (kontext.id) {
                personenkontextSet.add(kontext.id);
            }
        }

        return { hasRolleIdDuplicates, personenkontextSet };
    }

    @EventHandler(PersonenkontextUpdatedEvent)
    public async updatePersonenkontexteKCandSP(event: PersonenkontextUpdatedEvent): Promise<void> {
        this.logger.info(`Received PersonenkontextUpdatedEvent, ${event.person.id}`);
        const firstRolleId: RolleID | undefined = event.newKontexte?.[0]?.rolleId;

        if (event.currentKontexte?.length > 0 && firstRolleId !== undefined) {
            const { hasRolleIdDuplicates, personenkontextSet } = this.processKontexte(event.currentKontexte);

            if (!hasRolleIdDuplicates) {
                if (personenkontextSet.size <= 1) {
                    await this.serviceRepo.firstOne(event.person.id, firstRolleId);
                } else {
                    await this.serviceRepo.fetchFilteredRolesDifference(event.person.id, firstRolleId);
                }
            }
        }

        return undefined;
    }
}
