import { Injectable } from '@nestjs/common';
import { EventHandler } from '../../eventbus/decorators/event-handler.decorator.js';
import { ClassLogger } from '../../logging/class-logger.js';
import { Organisation } from '../../../modules/organisation/domain/organisation.js';
import { OrganisationRepository } from '../../../modules/organisation/persistence/organisation.repository.js';
import { PersonenkontextDeletedEvent } from '../../../shared/events/personenkontext-deleted.event.js';
import { RolleRepo } from '../../../modules/rolle/repo/rolle.repo.js';
import { PersonRepository } from '../../../modules/person/persistence/person.repository.js';
import { Person } from '../../../modules/person/domain/person.js';
import { Rolle } from '../../../modules/rolle/domain/rolle.js';
import { EventService } from '../../eventbus/services/event.service.js';
import { PersonenkontextDeleted2Event } from '../../../shared/events/personenkontext-deleted2.event.js';
import {
    PersonenkontextEventKontextData,
    PersonenkontextEventPersonData,
} from '../../../shared/events/personenkontext-event.types.js';

@Injectable()
export class LdapEventAdapter {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly eventService: EventService,
        private readonly personRepository: PersonRepository,
        private readonly organisationRepository: OrganisationRepository,
        private readonly rolleRepo: RolleRepo,
    ) {}

    @EventHandler(PersonenkontextDeletedEvent)
    public async handlePersonenkontextDeletedEvent(event: PersonenkontextDeletedEvent): Promise<void> {
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
            rolleId: rolle.id,
            rolle: rolle.rollenart,
            orgaId: orga.id,
            orgaTyp: orga.typ,
            orgaKennung: orga.kennung,
        };

        const personenkontextDeleted2Event: PersonenkontextDeleted2Event = new PersonenkontextDeleted2Event(
            personData,
            kontextData,
        );

        this.eventService.publish(personenkontextDeleted2Event);
    }
}
