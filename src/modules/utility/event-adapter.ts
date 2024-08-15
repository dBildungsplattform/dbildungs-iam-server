import { Injectable } from '@nestjs/common';
import { EventHandler } from '../../core/eventbus/decorators/event-handler.decorator.js';
import { ClassLogger } from '../../core/logging/class-logger.js';
import { Organisation } from '../organisation/domain/organisation.js';
import { OrganisationRepository } from '../organisation/persistence/organisation.repository.js';
import { SimplePersonenkontextDeletedEvent } from '../../shared/events/simple-personenkontext-deleted.event.js';
import { RolleRepo } from '../rolle/repo/rolle.repo.js';
import { PersonRepository } from '../person/persistence/person.repository.js';
import { Person } from '../person/domain/person.js';
import { Rolle } from '../rolle/domain/rolle.js';
import { EventService } from '../../core/eventbus/services/event.service.js';
import { PersonenkontextDeletedEvent } from '../../shared/events/personenkontext-deleted.event.js';
import {
    PersonenkontextEventKontextData,
    PersonenkontextEventPersonData,
} from '../../shared/events/personenkontext-event.types.js';

@Injectable()
export class EventAdapter {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly eventService: EventService,
        private readonly personRepository: PersonRepository,
        private readonly organisationRepository: OrganisationRepository,
        private readonly rolleRepo: RolleRepo,
    ) {}

    @EventHandler(SimplePersonenkontextDeletedEvent)
    public async handlePersonenkontextDeletedEvent(event: SimplePersonenkontextDeletedEvent): Promise<void> {
        this.logger.info(
            `Received PersonenkontextDeletedEvent, personId:${event.personId}, orgaId:${event.organisationId}, rolleId:${event.rolleId}`,
        );

        const person: Option<Person<true>> = await this.personRepository.findById(event.personId);
        if (!person) {
            return this.logger.error(`Could not find person for personId:${event.personId}`);
        }
        const orga: Option<Organisation<true>> = await this.organisationRepository.findById(event.organisationId);
        if (!orga) {
            return this.logger.error(`Could not find organisation for orgaId:${event.organisationId}`);
        }
        const rolle: Option<Rolle<true>> = await this.rolleRepo.findById(event.rolleId);
        if (!rolle) {
            return this.logger.error(`Could not find rolle for rolleId:${event.rolleId}`);
        }
        const personData: PersonenkontextEventPersonData = {
            id: person.id,
            vorname: person.vorname,
            familienname: person.familienname,
            referrer: person.referrer,
        };
        const kontextData: PersonenkontextEventKontextData = {
            id: event.personenkontextID,
            rolleId: rolle.id,
            rolle: rolle.rollenart,
            orgaId: orga.id,
            orgaTyp: orga.typ,
            orgaKennung: orga.kennung,
        };

        const personenkontextDeletedEvent: PersonenkontextDeletedEvent = new PersonenkontextDeletedEvent(
            personData,
            kontextData,
        );

        this.eventService.publish(personenkontextDeletedEvent);
    }
}
