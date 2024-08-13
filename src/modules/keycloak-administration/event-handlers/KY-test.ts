import { Injectable } from '@nestjs/common';

import { ClassLogger } from '../../../core/logging/class-logger.js';

import { PersonenkontextUpdatedEvent } from '../../../shared/events/personenkontext-updated.event.js';
import { EventHandler } from '../../../core/eventbus/decorators/event-handler.decorator.js';

import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';

@Injectable()
export class KCtest {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly serviceRepo: ServiceProviderRepo,
    ) {}

    @EventHandler(PersonenkontextUpdatedEvent)
    public async updatePersonenkontexteKCandSP(event: PersonenkontextUpdatedEvent): Promise<void> {
        this.logger.info(`Received PersonenkontextUpdatedEvent, ${event.person.id}`);
        if (event.newKontexte && event.newKontexte[0] && event.newKontexte[0].rolleId) {
            await this.serviceRepo.fetchfilteredroles(event.person.id, event.newKontexte[0].rolleId);
        }

        await this.serviceRepo.fetchall(event.person.id);

        return undefined;
    }
}
