import { Injectable } from '@nestjs/common';

import { ClassLogger } from '../../../core/logging/class-logger.js';

import { PersonenkontextUpdatedEvent } from '../../../shared/events/personenkontext-updated.event.js';
import { EventHandler } from '../../../core/eventbus/decorators/event-handler.decorator.js';

import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { RolleID } from '../../../shared/types/aggregate-ids.types.js';

@Injectable()
export class KCtest {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly serviceRepo: ServiceProviderRepo,
    ) {}

    @EventHandler(PersonenkontextUpdatedEvent)
    public async updatePersonenkontexteKCandSP(event: PersonenkontextUpdatedEvent): Promise<void> {
        this.logger.info(`Received PersonenkontextUpdatedEvent, ${event.person.id}`);
        //console.log(event.newKontexte);
        //console.log(event.currentKontexte.);
        const firstRolleId: RolleID | undefined = event.newKontexte?.[0]?.rolleId;

        if (event.currentKontexte?.length > 0 && firstRolleId !== undefined) {
            const rolleIdSet = new Set<string>();
            const personenkontextSet = new Set<string>();
            let hasDuplicates = false;

            for (const kontext of event.currentKontexte) {
                if (kontext.rolleId) {
                    if (rolleIdSet.has(kontext.rolleId)) {
                        hasDuplicates = true;
                        break;
                    }
                    rolleIdSet.add(kontext.rolleId);
                }
            }

            if (!hasDuplicates) {
                for (const kontext of event.currentKontexte) {
                    if (kontext.id) {
                        personenkontextSet.add(kontext.id);
                    }
                }

                //const firstRolleId: RolleID | undefined = event.newKontexte[0]?.rolleId;
                //if (firstRolleId !== undefined) {
                if (personenkontextSet.size <= 1) {
                    await this.serviceRepo.firstOne(event.person.id, firstRolleId);
                } else {
                    await this.serviceRepo.fetchFilteredRolesDifference(event.person.id, firstRolleId);
                }
                //}
            }
        }

        //await this.serviceRepo.fetchall(event.person.id);

        return undefined;
    }
}
