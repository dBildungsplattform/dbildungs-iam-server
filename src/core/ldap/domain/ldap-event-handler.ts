import { Injectable } from '@nestjs/common';
import { SchuleCreatedEvent } from '../../../shared/events/schule-created.event.js';
import { EventHandler } from '../../eventbus/decorators/event-handler.decorator.js';
import { LdapClientService } from './ldap-client.service.js';
import { ClassLogger } from '../../logging/class-logger.js';
import { OrganisationsTyp } from '../../../modules/organisation/domain/organisation.enums.js';
import { PersonenkontextCreatedEvent } from '../../../shared/events/personenkontext-created.event.js';
import { RolleRepo } from '../../../modules/rolle/repo/rolle.repo.js';
import { Rolle } from '../../../modules/rolle/domain/rolle.js';
import { RollenArt } from '../../../modules/rolle/domain/rolle.enums.js';
import { PersonRepository } from '../../../modules/person/persistence/person.repository.js';
import { Person } from '../../../modules/person/domain/person.js';
import { Organisation } from '../../../modules/organisation/domain/organisation.js';
import { SchuleDeletedEvent } from '../../../shared/events/schule-deleted.event.js';
import { PersonenkontextDeletedEvent } from '../../../shared/events/personenkontext-deleted.event.js';
import { Personenkontext } from '../../../modules/personenkontext/domain/personenkontext.js';
import { DBiamPersonenkontextRepo } from '../../../modules/personenkontext/persistence/dbiam-personenkontext.repo.js';
import { OrganisationRepository } from '../../../modules/organisation/persistence/organisation.repository.js';

@Injectable()
export class LdapEventHandler {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly ldapClientService: LdapClientService,
        private readonly rolleRepo: RolleRepo,
        private readonly personRepository: PersonRepository,
        private readonly dBiamPersonenkontextRepo: DBiamPersonenkontextRepo,
        private readonly organisationRepository: OrganisationRepository,
    ) {}

    @EventHandler(SchuleCreatedEvent)
    public async asyncSchuleCreatedEventHandler(event: SchuleCreatedEvent): Promise<void> {
        this.logger.info(`Received CreateSchuleEvent, organisationId:${event.organisationId}`);

        const organisation: Option<Organisation<true>> = await this.organisationRepository.findById(
            event.organisationId,
        );
        if (!organisation) {
            this.logger.error(`Organisation with id ${event.organisationId} could not be found!`);
            return;
        }
        this.logger.info(`Kennung of organisation is:${organisation.kennung}`);

        if (organisation.typ == OrganisationsTyp.SCHULE) {
            this.logger.info(`Call LdapClientService because ${organisation.name} type is SCHULE`);
            const creationResult: Result<Organisation<true>> =
                await this.ldapClientService.createOrganisation(organisation);
            if (!creationResult.ok) {
                this.logger.error(creationResult.error.message);
            }
        }
    }

    @EventHandler(SchuleDeletedEvent)
    public async asyncSchuleDeletedEventHandler(event: SchuleDeletedEvent): Promise<void> {
        this.logger.info(`Received DeleteSchuleEvent, organisationId:${event.organisationId}`);
        const organisation: Option<Organisation<true>> = await this.organisationRepository.findById(
            event.organisationId,
        );
        if (!organisation) {
            this.logger.error(`Organisation with id ${event.organisationId} could not be found!`);
            return;
        }
        this.logger.info(`Kennung of organisation is:${organisation.kennung}`);

        if (organisation.typ == OrganisationsTyp.SCHULE) {
            this.logger.info(`Call LdapClientService because ${organisation.name} type is SCHULE`);
            const creationResult: Result<Organisation<true>> =
                await this.ldapClientService.deleteOrganisation(organisation);
            if (!creationResult.ok) {
                this.logger.error(creationResult.error.message);
            }
        }
    }

    @EventHandler(PersonenkontextCreatedEvent)
    public async asyncPersonenkontextCreatedEventHandler(event: PersonenkontextCreatedEvent): Promise<void> {
        this.logger.info(
            `Received PersonenkontextCreatedEvent, personId:${event.personId}, orgaId:${event.organisationId}, rolleId:${event.rolleId}`,
        );

        const personenkontext: Option<Personenkontext<true>> = await this.dBiamPersonenkontextRepo.find(
            event.personId,
            event.organisationId,
            event.rolleId,
        );

        if (!personenkontext) {
            this.logger.error(
                `PK personId:${event.personId}, orgaId:${event.organisationId}, rolleId:${event.rolleId} could not be found!`,
            );
            return;
        }

        const rolle: Option<Rolle<true>> = await this.rolleRepo.findById(personenkontext.rolleId);
        const person: Option<Person<true>> = await this.personRepository.findById(personenkontext.personId);
        const orga: Option<Organisation<true>> = await this.organisationRepository.findById(
            personenkontext.organisationId,
        );

        if (!rolle) {
            this.logger.error(`Rolle with id ${personenkontext.rolleId} could not be found!`);
            return;
        }
        if (!person) {
            this.logger.error(`Person with id ${personenkontext.personId} could not be found!`);
            return;
        }
        if (!orga) {
            this.logger.error(`Organisation with id ${personenkontext.personId} could not be found!`);
            return;
        }

        if (rolle.rollenart === RollenArt.LEHR) {
            this.logger.info(`Call LdapClientService because rollenArt is LEHR`);
            const creationResult: Result<Person<true>> = await this.ldapClientService.createLehrer(person, orga);
            if (!creationResult.ok) {
                this.logger.error(creationResult.error.message);
            }
        }
    }

    @EventHandler(PersonenkontextDeletedEvent)
    public async asyncPersonenkontextDeletedEventHandler(event: PersonenkontextDeletedEvent): Promise<void> {
        this.logger.info(
            `Received PersonenkontextDeletedEvent, personId:${event.personId}, orgaId:${event.organisationId}, rolleId:${event.rolleId}`,
        );

        const personenkontext: Option<Personenkontext<true>> = await this.dBiamPersonenkontextRepo.find(
            event.personId,
            event.organisationId,
            event.rolleId,
        );

        if (!personenkontext) {
            this.logger.error(
                `PK personId:${event.personId}, orgaId:${event.organisationId}, rolleId:${event.rolleId} could not be found!`,
            );
            return;
        }

        const rolle: Option<Rolle<true>> = await this.rolleRepo.findById(personenkontext.rolleId);
        const person: Option<Person<true>> = await this.personRepository.findById(personenkontext.personId);
        const orga: Option<Organisation<true>> = await this.organisationRepository.findById(
            personenkontext.organisationId,
        );

        if (!rolle) {
            this.logger.error(`Rolle with id ${personenkontext.rolleId} could not be found!`);
            return;
        }
        if (!person) {
            this.logger.error(`Person with id ${personenkontext.personId} could not be found!`);
            return;
        }
        if (!orga) {
            this.logger.error(`Organisation with id ${personenkontext.personId} could not be found!`);
            return;
        }

        if (rolle.rollenart === RollenArt.LEHR) {
            this.logger.info(`Call LdapClientService because rollenArt is LEHR`);
            const creationResult: Result<Person<true>> = await this.ldapClientService.deleteLehrer(person, orga);
            if (!creationResult.ok) {
                this.logger.error(creationResult.error.message);
            }
        }
    }
}
