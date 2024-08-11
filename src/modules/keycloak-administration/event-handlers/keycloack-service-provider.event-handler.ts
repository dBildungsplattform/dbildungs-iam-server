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
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { KeycloakUserService } from '../domain/keycloak-user.service.js';
import { Person } from '../../person/domain/person.js';
import { PersonenkontextDeletedEvent } from '../../../shared/events/personenkontext-deleted.event.js';

@Injectable()
export class KeyclockServiceProviderEventHandler {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly rolleRepo: RolleRepo,
        private readonly personRepo: PersonRepository,
        private readonly keycloackUserService: KeycloakUserService,
    ) {}

    public kontextToString(kontext: PersonenkontextUpdatedData): string {
        return `rolleId: ${kontext.rolleId}, rolle: ${kontext.rolle}, orgaId: ${kontext.orgaId}, orgaTyp: ${kontext.orgaTyp}, orgaKennung: ${kontext.orgaKennung}`;
    }

    private async getServiceProviderNames(event: PersonenkontextUpdatedEvent): Promise<string[]> {
        const kontexteStrings: string = event.currentKontexte
            .map((kontext: PersonenkontextUpdatedData) => this.kontextToString(kontext))
            .join('; ');
        this.logger.info(`Received PersonenkontextUpdatedEvent, ${kontexteStrings}`);

        const serviceProviderNames: string[] = [];

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
                    (value: ServiceProvider<true>) => value,
                );
                serviceProviders.forEach((serviceProvider: ServiceProvider<true>) => {
                    this.logger.info(`ServiceProvider: ${JSON.stringify(serviceProvider.name)}`);
                    serviceProviderNames.push(serviceProvider.name);
                });
            }
        }

        return serviceProviderNames;
    }

    @EventHandler(PersonenkontextUpdatedEvent)
    public async updatePersonenkontexteKCandSP(event: PersonenkontextUpdatedEvent): Promise<void> {
        this.logger.info(`Received PersonenkontextUpdatedEvent, ${event.person.id}`);
        const serviceProviders: string[] = await this.getServiceProviderNames(event);

        const person: Option<Person<true>> = await this.personRepo.findById(event.person.id);
        if (person && person.keycloakUserId) {
            await this.keycloackUserService.assignRealmRolesToUser(person.keycloakUserId, serviceProviders);
        }
    }

    @EventHandler(PersonenkontextDeletedEvent)
    public async deletePersonenkontexteKCandSP(event: PersonenkontextDeletedEvent): Promise<void> {
        this.logger.info(`Received PersonenkontextUpdatedEvent for deletion, ${event.personId}`);

        const serviceProviderNames: string[] = [];

        const rolle: Option<Rolle<true>> = await this.rolleRepo.findById(event.rolleId);
        this.logger.info(
            `Received PersonenkontextDeletedEvent, rolleId: ${event.rolleId}, serviceproviderID: ${JSON.stringify(rolle?.serviceProviderIds)}`,
        );

        const serviceProvidersMap: Map<string, ServiceProvider<true>> | undefined =
            await rolle?.serviceProviderRepo.findByIds(rolle?.serviceProviderIds);

        if (serviceProvidersMap) {
            const serviceProviders: ServiceProvider<true>[] = Array.from(
                serviceProvidersMap.values(),
                (value: ServiceProvider<true>) => value,
            );
            serviceProviders.forEach((serviceProvider: ServiceProvider<true>) => {
                this.logger.info(`ServiceProvider to delete: ${JSON.stringify(serviceProvider.name)}`);
                serviceProviderNames.push(serviceProvider.name);
            });
        }

        const person: Option<Person<true>> = await this.personRepo.findById(event.personId);
        if (person && person.keycloakUserId) {
            this.logger.info(`here we get the kC user ${person.keycloakUserId}`);

            await this.keycloackUserService.removeRealmRolesFromUser(person.keycloakUserId, serviceProviderNames);
        }
    }
}
