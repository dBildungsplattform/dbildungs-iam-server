import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EventHandler } from '../../../core/eventbus/decorators/event-handler.decorator.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { ServerConfig } from '../../../shared/config/server.config.js';
import { DomainError } from '../../../shared/error/index.js';
import { OxConfig } from '../../../shared/config/ox.config.js';
import { OxService } from './ox.service.js';
import { CreateUserAction, CreateUserParams, CreateUserResponse } from '../actions/user/create-user.action.js';
import { PersonenkontextCreatedEventHandler } from '../../../shared/events/personenkontext-created-event-handler.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { DBiamPersonenkontextRepo } from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { PersonID } from '../../../shared/types/index.js';
import { Person } from '../../person/domain/person.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { EmailAddressGeneratedEvent } from '../../../shared/events/email-address-generated.event.js';
import { ExistsUserAction, ExistsUserResponse } from '../actions/user/exists-user.action.js';
import { EventService } from '../../../core/eventbus/services/event.service.js';
import { OxUserCreatedEvent } from '../../../shared/events/ox-user-created.event.js';
import { OXContextID, OXContextName } from '../../../shared/types/ox-ids.types.js';
import { EmailAddressChangedEvent } from '../../../shared/events/email-address-changed.event.js';
import { ChangeUserAction, ChangeUserParams, ChangeUserResponse } from '../actions/user/change-user.action.js';
import { OxUserChangedEvent } from '../../../shared/events/ox-user-changed.event.js';
import { GetDataForUserAction, GetDataForUserResponse } from '../actions/user/get-data-user.action.js';
import { UserNameParams } from '../actions/user/ox-user.types.js';

@Injectable()
export class OxEventHandler extends PersonenkontextCreatedEventHandler {
    public ENABLED: boolean;

    private readonly authUser: string;

    private readonly authPassword: string;

    private readonly contextID: OXContextID;

    private readonly contextName: OXContextName;

    public constructor(
        protected override readonly logger: ClassLogger,
        protected override readonly rolleRepo: RolleRepo,
        protected override readonly serviceProviderRepo: ServiceProviderRepo,
        protected override readonly dbiamPersonenkontextRepo: DBiamPersonenkontextRepo,
        private readonly oxService: OxService,
        private readonly personRepository: PersonRepository,
        private readonly eventService: EventService,
        configService: ConfigService<ServerConfig>,
    ) {
        super(logger, rolleRepo, serviceProviderRepo, dbiamPersonenkontextRepo);
        const oxConfig: OxConfig = configService.getOrThrow<OxConfig>('OX');

        this.ENABLED = oxConfig.ENABLED === 'true';
        this.authUser = oxConfig.USERNAME;
        this.authPassword = oxConfig.PASSWORD;
        this.contextID = oxConfig.CONTEXT_ID;
        this.contextName = oxConfig.CONTEXT_NAME;
    }

    @EventHandler(EmailAddressChangedEvent)
    public async handleEmailAddressChangedEvent(event: EmailAddressChangedEvent): Promise<void> {
        this.logger.info(
            `Received EmailAddressChangedEvent, personId:${event.personId}, oldEmailAddressId:${event.oldEmailAddressId}, oldAddress:${event.oldAddress}, newEmailAddressId:${event.newEmailAddressId}, newAddress:${event.newAddress}`,
        );

        if (!this.ENABLED) {
            this.logger.info('Not enabled, ignoring event');
            return;
        }

        await this.handlePerson(event.personId);
    }

    @EventHandler(EmailAddressGeneratedEvent)
    public async handleEmailAddressGeneratedEvent(event: EmailAddressGeneratedEvent): Promise<void> {
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
        if (!person.referrer) {
            this.logger.error(
                `Person with personId:${personId} has no keycloakUsername/referrer: cannot create OXUserCreatedEvent`,
            );
            return;
        }

        const existsParams: UserNameParams = {
            contextId: this.contextID,
            userName: person.vorname,
            login: this.authUser,
            password: this.authPassword,
        };

        const existsAction: ExistsUserAction = new ExistsUserAction(existsParams);

        const existsResult: Result<ExistsUserResponse, DomainError> = await this.oxService.send(existsAction);

        if (existsResult.ok && existsResult.value.exists) {
            this.logger.error(`Cannot create user in OX, user with name:${person.vorname} already exists`);
            return;
        }

        const params: CreateUserParams = {
            contextId: this.contextID,
            displayName: person.vorname + person.familienname,
            email1: person.email,
            username: person.referrer,
            firstname: person.vorname,
            givenname: person.vorname,
            mailEnabled: true,
            lastname: person.familienname,
            primaryEmail: person.email,
            userPassword: 'TestPassword1',
            login: this.authUser,
            password: this.authPassword,
        };

        const action: CreateUserAction = new CreateUserAction(params);

        const result: Result<CreateUserResponse, DomainError> = await this.oxService.send(action);

        if (!result.ok) {
            this.logger.error(`Could not create user in OX, error: ${result.error.message}`);
            return;
        }

        this.logger.info(`User created in OX, userId:${result.value.id}, email:${result.value.primaryEmail}`);

        this.eventService.publish(
            new OxUserCreatedEvent(
                personId,
                person.referrer,
                result.value.id,
                result.value.username,
                this.contextID,
                this.contextName,
                result.value.primaryEmail,
            ),
        );
    }

    protected async onNeedsChangedEmail(personId: PersonID): Promise<void> {
        const person: Option<Person<true>> = await this.personRepository.findById(personId);

        if (!person) {
            this.logger.error(`Person not found for personId:${personId}`);
            return;
        }
        if (!person.email) {
            this.logger.error(`Person with personId:${personId} has no email-address`);
            return;
        }

        const getDataParams: UserNameParams = {
            contextId: this.contextID,
            userName: person.vorname,
            login: this.authUser,
            password: this.authPassword,
        };

        const getDataAction: GetDataForUserAction = new GetDataForUserAction(getDataParams);

        const getDataResult: Result<GetDataForUserResponse, DomainError> = await this.oxService.send(getDataAction);

        if (!getDataResult.ok) {
            this.logger.error(
                `Cannot get data for user with name:${person.vorname} from OX, Aborting Email-Address Change`,
            );
            return;
        }
        const newAliasesArray: string[] = getDataResult.value.aliases;
        newAliasesArray.push(person.email);

        const params: ChangeUserParams = {
            contextId: this.contextID,
            username: getDataResult.value.username,
            defaultSenderAddress: person.email,
            email1: person.email,
            aliases: newAliasesArray,
            primaryEmail: person.email,
            login: this.authUser,
            password: this.authPassword,
        };

        const action: ChangeUserAction = new ChangeUserAction(params);

        const result: Result<ChangeUserResponse, DomainError> = await this.oxService.send(action);

        if (!result.ok) {
            this.logger.error(`Could not change email-address for user in OX, error: ${result.error.message}`);
            return;
        }

        this.logger.info(
            `Changed primary email-address in OX for user, userId:${result.value.id}, email:${result.value.primaryEmail}`,
        );

        if (!person.referrer) {
            this.logger.error(
                `Person with personId:${personId} has no keycloakUsername/referrer: cannot create OXUserCreatedEvent`,
            );
            return;
        }
        this.eventService.publish(
            new OxUserChangedEvent(
                personId,
                person.referrer,
                result.value.id,
                result.value.username,
                this.contextID,
                this.contextName,
                result.value.primaryEmail,
            ),
        );
    }
}
