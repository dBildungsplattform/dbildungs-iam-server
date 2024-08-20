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

        if (event.currentKontexte && event.currentKontexte.length > 0) {
            const rolleIdSet: Set<string> = new Set<string>();
            let hasDuplicates: boolean = false;
            const personenkontextSet: Set<string> = new Set<string>();

            for (const kontext of event.currentKontexte) {
                if (kontext.rolleId) {
                    if (rolleIdSet.has(kontext.rolleId)) {
                        hasDuplicates = true;
                        break;
                    }
                    rolleIdSet.add(kontext.rolleId);
                }
            }

            for (const kontext of event.currentKontexte) {
                if (kontext.id) {
                    if (personenkontextSet.has(kontext.id)) {
                        break;
                    }
                    personenkontextSet.add(kontext.id);
                }
            }

            if (!hasDuplicates) {
                if (personenkontextSet.size <= 1) {
                    const firstRolleId: RolleID | undefined = event.newKontexte[0]?.rolleId;
                    if (firstRolleId !== undefined) {
                        await this.serviceRepo.FirstOne(event.person.id, firstRolleId);
                    }
                } else {
                    const firstRolleId: RolleID | undefined = event.newKontexte[0]?.rolleId;

                    if (firstRolleId !== undefined) {
                        await this.serviceRepo.fetchFilteredRolesDifference(event.person.id, firstRolleId);
                    }
                }
            }
        }

        await this.serviceRepo.fetchall(event.person.id);

        return undefined;
    }
}
