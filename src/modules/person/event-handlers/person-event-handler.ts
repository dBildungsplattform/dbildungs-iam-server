import { Injectable } from '@nestjs/common';

import { EventHandler } from '../../../core/eventbus/decorators/event-handler.decorator.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { Person } from '../../person/domain/person.js';
import { DomainError } from '../../../shared/error/index.js';
import { OxUserAttributesCreatedEvent } from '../../../shared/events/ox-user-attributes-created.event.js';

@Injectable()
export class PersonEventHandler {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly personRepository: PersonRepository,
    ) {}

    @EventHandler(OxUserAttributesCreatedEvent)
    public async handleOxUserAttributesCreatedEvent(event: OxUserAttributesCreatedEvent): Promise<void> {
        this.logger.info(
            `Received OxUserAttributesCreatedEvent personId:${event.personId}, keycloakUsername: ${event.keycloakUsername}, userName:${event.userName}, contextName:${event.contextName}, email:${event.emailAddress}`,
        );

        const person: Option<Person<true>> = await this.personRepository.findById(event.personId);

        if (!person) {
            return this.logger.error(`Cannot find person with personId:${event.personId} to persist new email-address`);
        }

        person.email = event.emailAddress;
        const updateResult: Person<true> | DomainError = await this.personRepository.update(person);

        if (updateResult instanceof DomainError) {
            return this.logger.error(`Could not update email-address for person with personId:${event.personId}`);
        }

        return this.logger.info(`Successfully updated email-address for person with personId:${event.personId}`);
    }
}
