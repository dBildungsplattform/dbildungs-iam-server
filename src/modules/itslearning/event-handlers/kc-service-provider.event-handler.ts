import { Injectable } from '@nestjs/common';

import { EventHandler } from '../../../core/eventbus/decorators/event-handler.decorator.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';

import {
    PersonenkontextUpdatedData,
    PersonenkontextUpdatedEvent,
} from '../../../shared/events/personenkontext-updated.event.js';

import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { RolleID } from '../../../shared/types/aggregate-ids.types.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { ServiceProvider } from '../../service-provider/domain/service-provider.js';

@Injectable()
export class KeyclockServiceProviderEventHandler {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly rolleRepo: RolleRepo,
    ) {}

    public kontextToString(kontext: PersonenkontextUpdatedData): string {
        return `rolleId: ${kontext.rolleId}, rolle: ${kontext.rolle}, orgaId: ${kontext.orgaId}, orgaTyp: ${kontext.orgaTyp}, orgaKennung: ${kontext.orgaKennung}`;
    }

    @EventHandler(PersonenkontextUpdatedEvent)
    public async updatePersonenkontexteKCandSP(event: PersonenkontextUpdatedEvent): Promise<void> {
        this.logger.info(`Received PersonenkontextUpdatedEvent, ${event.person.id}`);
        const kontexteStrings: string = event.currentKontexte
            .map((kontext: PersonenkontextUpdatedData) => this.kontextToString(kontext))
            .join('; ');
        this.logger.info(`Received PersonenkontextUpdatedEvent, ${kontexteStrings}`);
        const rolleId: RolleID | undefined = event.currentKontexte[0]?.rolleId;
        if (rolleId) {
            const rolle: Option<Rolle<true>> = await this.rolleRepo.findById(rolleId);
            this.logger.info(
                `Received PersonenkontextUpdatedEvent, rolleId: ${rolleId}, serviceproviderID: ${JSON.stringify(rolle?.serviceProviderIds)}`,
            );
            const serviceProvidersMap: Map<string, ServiceProvider<true>> | undefined =
                await rolle?.serviceProviderRepo.findByIds(rolle?.serviceProviderIds);
            if (serviceProvidersMap) {
                const serviceProviders: ServiceProvider<true>[] = Array.from(
                    serviceProvidersMap.values(),
                    (value: ServiceProvider<true>) => {
                        return value;
                    },
                );
                serviceProviders.forEach((serviceProvider: ServiceProvider<true>) => {
                    this.logger.info(`ServiceProvider: ${JSON.stringify(serviceProvider.name)}`);
                });
            }
        }
    }
}
