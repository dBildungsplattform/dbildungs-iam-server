import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EventHandler } from '../../../core/eventbus/decorators/event-handler.decorator.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { ServerConfig } from '../../../shared/config/server.config.js';
import { DomainError } from '../../../shared/error/index.js';
import { OxConfig } from '../../../shared/config/ox.config.js';
import { OxService } from './ox.service.js';
import { CreateUserAction, CreateUserParams, CreateUserResponse } from '../actions/create-user.action.js';
import { PersonenkontextCreatedEventHandler } from '../../../shared/events/personenkontext-created-event-handler.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { DBiamPersonenkontextRepo } from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { PersonID } from '../../../shared/types/index.js';
import { Person } from '../../person/domain/person.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { EmailAddressGeneratedEvent } from '../../../shared/events/email-address-generated.event.js';

@Injectable()
export class OxEventHandler extends PersonenkontextCreatedEventHandler {
    public ENABLED: boolean;

    private readonly authUser: string;

    private readonly authPassword: string;

    public constructor(
        protected override readonly logger: ClassLogger,
        protected override readonly rolleRepo: RolleRepo,
        protected override readonly serviceProviderRepo: ServiceProviderRepo,
        protected override readonly dbiamPersonenkontextRepo: DBiamPersonenkontextRepo,
        private readonly oxService: OxService,
        private readonly personRepository: PersonRepository,
        configService: ConfigService<ServerConfig>,
    ) {
        super(logger, rolleRepo, serviceProviderRepo, dbiamPersonenkontextRepo);
        const oxConfig: OxConfig = configService.getOrThrow<OxConfig>('OX');

        this.ENABLED = oxConfig.ENABLED === 'true';
        this.authUser = oxConfig.USERNAME;
        this.authPassword = oxConfig.PASSWORD;
    }

    @EventHandler(EmailAddressGeneratedEvent)
    public async handlePersonenkontextCreatedEvent(event: EmailAddressGeneratedEvent): Promise<void> {
        this.logger.info(
            `Received EmailAddressGeneratedEvent, personId:${event.personId}, emailAddressId:${event.emailAddressId}, address:${event.address}`,
        );

        if (!this.ENABLED) {
            this.logger.info('Not enabled, ignoring event');
            return;
        }

        await this.handlePerson(event.personId);
    }

    protected async onNeedsEmail(personId: PersonID): Promise<void> {
        const person: Option<Person<true>> = await this.personRepository.findById(personId);

        if (!person) {
            this.logger.error(`Person not found for personId:${personId}`);
            return;
        }
        if (!person.email) {
            this.logger.error(`Person with personId:${personId} has no email-address`);
            return;
        }
        const params: CreateUserParams = {
            contextId: '1',
            displayName: person.vorname + person.familienname,
            email1: person.email,
            firstname: person.vorname,
            givenName: person.vorname,
            mailEnabled: true,
            lastname: person.familienname,
            primaryEmail: person.email,
            userPassword: 'TestPassword1',
            login: this.authUser,
            password: this.authPassword,
        };

        //maybe check if user already exists in OX?

        const action: CreateUserAction = new CreateUserAction(params);

        const result: Result<CreateUserResponse, DomainError> = await this.oxService.send(action);

        if (!result.ok) {
            this.logger.error(`Could not create user in OX, error: ${result.error.message}`);
            return;
        }

        this.logger.info(`User created in OX`);
    }
}
