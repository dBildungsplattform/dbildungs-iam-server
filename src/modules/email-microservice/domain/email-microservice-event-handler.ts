import { EnsureRequestContext, EntityManager } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { EventHandler } from '../../../core/eventbus/decorators/event-handler.decorator.js';
import { KafkaEventHandler } from '../../../core/eventbus/decorators/kafka-event-handler.decorator.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { KafkaPersonenkontextUpdatedEvent } from '../../../shared/events/kafka-personenkontext-updated.event.js';
import { PersonenkontextUpdatedEvent } from '../../../shared/events/personenkontext-updated.event.js';
import { EmailResolverService } from './email-resolver.service.js';
import { PersonenkontextEventKontextData } from '../../../shared/events/personenkontext-event.types.js';
import { ServiceProviderSystem } from '../../service-provider/domain/service-provider.enum.js';
import { ServiceProvider } from '../../service-provider/domain/service-provider.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { KafkaPersonRenamedEvent } from '../../../shared/events/kafka-person-renamed-event.js';
import { PersonRenamedEvent } from '../../../shared/events/person-renamed-event.js';
import {
    DBiamPersonenkontextRepo,
    KontextWithOrgaAndRolle,
} from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { RolleID } from '../../../shared/types/aggregate-ids.types.js';

@Injectable()
export class EmailMicroserviceEventHandler {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly rolleRepo: RolleRepo,
        private readonly emailResolverService: EmailResolverService,
        private readonly personenkontextRepo: DBiamPersonenkontextRepo,
        // @ts-expect-error used by EnsureRequestContext decorator
        // Although not accessed directly, MikroORM's @EnsureRequestContext() uses this.em internally
        // to create the request-bound EntityManager context. Removing it would break context creation.
        private readonly em: EntityManager,
    ) {}

    @KafkaEventHandler(KafkaPersonenkontextUpdatedEvent)
    @EventHandler(PersonenkontextUpdatedEvent)
    @EnsureRequestContext()
    public async handlePersonenkontextUpdatedEvent(
        event: PersonenkontextUpdatedEvent | KafkaPersonenkontextUpdatedEvent,
    ): Promise<void> {
        this.logger.info(
            `Received PersonenkontextUpdatedEvent, personId:${event.person.id}, username:${event.person.username}, newPKs:${event.newKontexte.length}, removedPKs:${event.removedKontexte.length}`,
        );

        if (!this.emailResolverService.shouldUseEmailMicroservice()) {
            this.logger.info(`Ignoring Event for personId:${event.person.id} because email microservice is disabled`);
            return;
        }
        if (!event.person.username) {
            throw new Error(`Person with id:${event.person.id} has no username, cannot resolve email.`);
        }

        //Current Kontexte can be used here because it includes also the new Kontexte
        let allKontexteForPerson: PersonenkontextEventKontextData[] = event.currentKontexte;
        const kennungen: string[] = allKontexteForPerson
            .map((kontext: PersonenkontextEventKontextData) => kontext.orgaKennung)
            .filter((kennung: string | undefined): kennung is string => !!kennung);
        const uniqueKennungen: string[] = Array.from(new Set(kennungen));

        if (event.removedKontexte) {
            allKontexteForPerson = allKontexteForPerson.filter((pk: PersonenkontextEventKontextData) =>
                event.removedKontexte.every((removedPK: PersonenkontextEventKontextData) => removedPK.id !== pk.id),
            );
        }

        const emailServiceProviderId: string | undefined = await this.getEmailServiceProviderId(
            allKontexteForPerson.map((k: PersonenkontextEventKontextData) => k.rolleId),
        );

        if (!emailServiceProviderId) {
            this.logger.info(
                `No email service provider found for personId:${event.person.id}, skipping email resolution.`,
            );
            return;
        }

        await this.emailResolverService.setEmailForSpshPerson({
            spshPersonId: event.person.id,
            spshUsername: event.person.username,
            kennungen: uniqueKennungen,
            firstName: event.person.vorname,
            lastName: event.person.familienname,
            spshServiceProviderId: emailServiceProviderId,
        });
    }

    @KafkaEventHandler(KafkaPersonRenamedEvent)
    @EventHandler(PersonRenamedEvent)
    @EnsureRequestContext()
    public async handlePersonRenamedEvent(event: PersonRenamedEvent | KafkaPersonRenamedEvent): Promise<void> {
        this.logger.info(
            `Received PersonRenamedEvent, personId:${event.personId}, username:${event.username}, oldUsername:${event.oldUsername}`,
        );

        if (!this.emailResolverService.shouldUseEmailMicroservice()) {
            this.logger.info(`Ignoring Event for personId:${event.personId} because email microservice is disabled`);
            return;
        }
        if (!event.username) {
            throw new Error(`Person with id:${event.personId} has no username, cannot resolve email.`);
        }

        const allKontexteForPerson: KontextWithOrgaAndRolle[] =
            await this.personenkontextRepo.findByPersonWithOrgaAndRolle(event.personId);

        const kennungen: string[] = allKontexteForPerson
            .map((kontext: KontextWithOrgaAndRolle) => kontext.organisation.kennung)
            .filter((kennung: string | undefined): kennung is string => !!kennung);
        const uniqueKennungen: string[] = Array.from(new Set(kennungen));

        const emailServiceProviderId: string | undefined = await this.getEmailServiceProviderId(
            allKontexteForPerson.map((k: KontextWithOrgaAndRolle) => k.rolle.id),
        );

        if (!emailServiceProviderId) {
            this.logger.info(
                `No email service provider found for personId:${event.personId}, skipping email resolution.`,
            );
            return;
        }

        await this.emailResolverService.setEmailForSpshPerson({
            spshPersonId: event.personId,
            spshUsername: event.username,
            kennungen: uniqueKennungen,
            firstName: event.vorname,
            lastName: event.familienname,
            spshServiceProviderId: emailServiceProviderId,
        });
    }

    private async getEmailServiceProviderId(rollenIds: RolleID[]): Promise<string | undefined> {
        // Retrieve role details based on the role IDs
        const rollenMap: Map<string, Rolle<true>> = await this.rolleRepo.findByIds(rollenIds);
        const rollen: Rolle<true>[] = Array.from(rollenMap.values());

        const spshServiceProviderId: string | undefined = rollen
            .flatMap((rolle: Rolle<true>) => rolle.serviceProviderData)
            .find(
                (serviceProvider: ServiceProvider<true>) =>
                    serviceProvider.externalSystem === ServiceProviderSystem.EMAIL,
            )?.id;

        return spshServiceProviderId;
    }
}
