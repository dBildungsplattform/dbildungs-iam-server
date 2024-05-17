import { Injectable } from '@nestjs/common';
import { CreateSchuleEvent } from '../../../shared/events/create-schule.event.js';
import { EventHandler } from '../../eventbus/decorators/event-handler.decorator.js';
import { LdapClientService } from './ldap-client.service.js';
import { ClassLogger } from '../../logging/class-logger.js';
import { CreatedOrganisationDto } from '../../../modules/organisation/api/created-organisation.dto.js';
import { OrganisationsTyp } from '../../../modules/organisation/domain/organisation.enums.js';
import { CreatePersonenkontextEvent } from '../../../shared/events/create-personenkontext.event.js';
import { RolleRepo } from '../../../modules/rolle/repo/rolle.repo.js';
import { Rolle } from '../../../modules/rolle/domain/rolle.js';
import { RollenArt } from '../../../modules/rolle/domain/rolle.enums.js';
import { PersonRepository } from '../../../modules/person/persistence/person.repository.js';
import { Person } from '../../../modules/person/domain/person.js';
import { OrganisationRepo } from '../../../modules/organisation/persistence/organisation.repo.js';
import { Organisation } from '../../../modules/organisation/domain/organisation.js';

@Injectable()
export class LdapEventHandler {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly ldapClientService: LdapClientService,
        private readonly rolleRepo: RolleRepo,
        private readonly personRepository: PersonRepository,
        private readonly organisationRepo: OrganisationRepo,
    ) {}

    @EventHandler(CreateSchuleEvent)
    public async asyncCreateSchuleEventHandler(event: CreateSchuleEvent): Promise<void> {
        this.logger.info(`Received CreateSchuleEvent, name is ${event.organisation.name}`);
        if (event.organisation.typ == OrganisationsTyp.SCHULE) {
            this.logger.info(`Call LdapClientService because ${event.organisation.name} type is SCHULE`);
            const creationResult: Result<CreatedOrganisationDto> = await this.ldapClientService.createOrganisation(
                event.organisation,
            );
            if (!creationResult.ok) {
                this.logger.error(creationResult.error.message);
            }
        }
    }

    @EventHandler(CreatePersonenkontextEvent)
    public async asyncCreatePersonenkontextEventHandler(event: CreatePersonenkontextEvent): Promise<void> {
        this.logger.info(`Received CreatePersonenkontextEvent, rolleId is ${event.personenkontext.rolleId}`);
        const rolle: Option<Rolle<true>> = await this.rolleRepo.findById(event.personenkontext.rolleId);
        const person: Option<Person<true>> = await this.personRepository.findById(event.personenkontext.personId);
        const orga: Option<Organisation<true>> = await this.organisationRepo.findById(
            event.personenkontext.organisationId,
        );

        if (!rolle) {
            this.logger.error(`Rolle with id ${event.personenkontext.rolleId} could not be found!`);
            return;
        }
        if (!person) {
            this.logger.error(`Person with id ${event.personenkontext.personId} could not be found!`);
            return;
        }
        if (!orga) {
            this.logger.error(`Organisation with id ${event.personenkontext.personId} could not be found!`);
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
}
