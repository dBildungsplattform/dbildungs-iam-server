import { Injectable } from '@nestjs/common';
import { CreatedSchuleEvent } from '../../../shared/events/created-schule.event.js';
import { EventHandler } from '../../eventbus/decorators/event-handler.decorator.js';
import { LdapClientService } from './ldap-client.service.js';
import { ClassLogger } from '../../logging/class-logger.js';
import { OrganisationsTyp } from '../../../modules/organisation/domain/organisation.enums.js';
import { CreatedPersonenkontextEvent } from '../../../shared/events/created-personenkontext.event.js';
import { RolleRepo } from '../../../modules/rolle/repo/rolle.repo.js';
import { Rolle } from '../../../modules/rolle/domain/rolle.js';
import { RollenArt } from '../../../modules/rolle/domain/rolle.enums.js';
import { PersonRepository } from '../../../modules/person/persistence/person.repository.js';
import { Person } from '../../../modules/person/domain/person.js';
import { Organisation } from '../../../modules/organisation/domain/organisation.js';
import { DeletedSchuleEvent } from '../../../shared/events/deleted-schule.event.js';
import { DeletedPersonenkontextEvent } from '../../../shared/events/deleted-personenkontext.event.js';
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

    @EventHandler(CreatedSchuleEvent)
    public async asyncCreateSchuleEventHandler(event: CreatedSchuleEvent): Promise<void> {
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

    @EventHandler(DeletedSchuleEvent)
    public async asyncDeleteSchuleEventHandler(event: DeletedSchuleEvent): Promise<void> {
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

    @EventHandler(CreatedPersonenkontextEvent)
    public async asyncCreatePersonenkontextEventHandler(event: CreatedPersonenkontextEvent): Promise<void> {
        this.logger.info(`Received CreatePersonenkontextEvent, personenKontextId is ${event.personenkontextId}`);

        const personenkontext: Option<Personenkontext<true>> = await this.dBiamPersonenkontextRepo.findById(
            event.personenkontextId,
        );

        if (!personenkontext) {
            this.logger.error(`Personenkontext with id ${event.personenkontextId} could not be found!`);
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

    @EventHandler(DeletedPersonenkontextEvent)
    public async asyncDeletePersonenkontextEventHandler(event: DeletedPersonenkontextEvent): Promise<void> {
        this.logger.info(`Received DeletePersonenkontextEvent, personenKontextId is ${event.personenkontextId}`);

        const personenkontext: Option<Personenkontext<true>> = await this.dBiamPersonenkontextRepo.findById(
            event.personenkontextId,
        );

        if (!personenkontext) {
            this.logger.error(`Personenkontext with id ${event.personenkontextId} could not be found!`);
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
