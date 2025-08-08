import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EventHandler } from '../../../core/eventbus/decorators/event-handler.decorator.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { ServerConfig } from '../../../shared/config/server.config.js';
import { DomainError } from '../../../shared/error/index.js';
import { OxService } from './ox.service.js';
import { CreateUserAction, CreateUserParams, CreateUserResponse } from '../actions/user/create-user.action.js';
import { OrganisationKennung, PersonID, PersonReferrer } from '../../../shared/types/index.js';
import { Person } from '../../person/domain/person.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { EmailAddressGeneratedEvent } from '../../../shared/events/email/email-address-generated.event.js';
import { ExistsUserAction, ExistsUserResponse } from '../actions/user/exists-user.action.js';
import { EventRoutingLegacyKafkaService } from '../../../core/eventbus/services/event-routing-legacy-kafka.service.js';
import { OXGroupID, OXUserID } from '../../../shared/types/ox-ids.types.js';
import { EmailAddressChangedEvent } from '../../../shared/events/email/email-address-changed.event.js';
import { ChangeUserAction, ChangeUserParams } from '../actions/user/change-user.action.js';
import { OxUserChangedEvent } from '../../../shared/events/ox/ox-user-changed.event.js';
import { GetDataForUserAction, GetDataForUserResponse } from '../actions/user/get-data-user.action.js';
import { UserIdParams, UserNameParams } from '../actions/user/ox-user.types.js';
import { EmailRepo } from '../../email/persistence/email.repo.js';
import { EmailAddress, EmailAddressStatus } from '../../email/domain/email-address.js';
import { AddMemberToGroupAction, AddMemberToGroupResponse } from '../actions/group/add-member-to-group.action.js';
import { GroupMemberParams, OXGroup } from '../actions/group/ox-group.types.js';
import {
    ChangeByModuleAccessAction,
    ChangeByModuleAccessParams,
} from '../actions/user/change-by-module-access.action.js';
import { EmailAddressAlreadyExistsEvent } from '../../../shared/events/email/email-address-already-exists.event.js';
import { PersonDeletedEvent } from '../../../shared/events/person-deleted.event.js';
import {
    ListGroupsForUserAction,
    ListGroupsForUserParams,
    ListGroupsForUserResponse,
} from '../actions/group/list-groups-for-user.action.js';
import { EmailAddressDisabledEvent } from '../../../shared/events/email/email-address-disabled.event.js';
import {
    RemoveMemberFromGroupAction,
    RemoveMemberFromGroupResponse,
} from '../actions/group/remove-member-from-group.action.js';
import { PersonenkontextUpdatedEvent } from '../../../shared/events/personenkontext-updated.event.js';
import { PersonenkontextEventKontextData } from '../../../shared/events/personenkontext-event.types.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';
import { KafkaEventHandler } from '../../../core/eventbus/decorators/kafka-event-handler.decorator.js';
import { KafkaPersonDeletedEvent } from '../../../shared/events/kafka-person-deleted.event.js';
import { EnsureRequestContext, EntityManager } from '@mikro-orm/core';
import { DisabledEmailAddressGeneratedEvent } from '../../../shared/events/email/disabled-email-address-generated.event.js';
import { EmailAddressesPurgedEvent } from '../../../shared/events/email/email-addresses-purged.event.js';
import { DeleteUserAction } from '../actions/user/delete-user.action.js';
import { EmailAddressMarkedForDeletionEvent } from '../../../shared/events/email/email-address-marked-for-deletion.event.js';
import { OxEmailAddressDeletedEvent } from '../../../shared/events/ox/ox-email-address-deleted.event.js';
import { OxAccountDeletedEvent } from '../../../shared/events/ox/ox-account-deleted.event.js';
import { KafkaEmailAddressChangedEvent } from '../../../shared/events/email/kafka-email-address-changed.event.js';
import { KafkaEmailAddressGeneratedEvent } from '../../../shared/events/email/kafka-email-address-generated.event.js';
import { PersonDeletedAfterDeadlineExceededEvent } from '../../../shared/events/person-deleted-after-deadline-exceeded.event.js';
import { KafkaPersonDeletedAfterDeadlineExceededEvent } from '../../../shared/events/kafka-person-deleted-after-deadline-exceeded.event.js';
import { KafkaOxUserChangedEvent } from '../../../shared/events/ox/kafka-ox-user-changed.event.js';
import { KafkaOxAccountDeletedEvent } from '../../../shared/events/ox/kafka-ox-account-deleted.event.js';
import { KafkaEmailAddressDisabledEvent } from '../../../shared/events/email/kafka-email-address-disabled.event.js';
import { KafkaEmailAddressAlreadyExistsEvent } from '../../../shared/events/email/kafka-email-address-already-exists.event.js';
import { KafkaDisabledEmailAddressGeneratedEvent } from '../../../shared/events/email/kafka-disabled-email-address-generated.event.js';
import { KafkaEmailAddressesPurgedEvent } from '../../../shared/events/email/kafka-email-addresses-purged.event.js';
import { KafkaEmailAddressMarkedForDeletionEvent } from '../../../shared/events/email/kafka-email-address-marked-for-deletion.event.js';
import { KafkaOxEmailAddressDeletedEvent } from '../../../shared/events/ox/kafka-ox-email-address-deleted.event.js';
import { KafkaPersonenkontextUpdatedEvent } from '../../../shared/events/kafka-personenkontext-updated.event.js';
import { PersonIdentifier } from '../../../core/logging/person-identifier.js';
import { OxNoSuchUserError } from '../error/ox-no-such-user.error.js';
import {
    AbstractOxEventHandler,
    generateDisabledOxUserChangedEvent,
    generateOxUserChangedEvent,
    OxUserChangedEventCreator,
} from './abstract-ox-event-handler.js';

/*type OxUserChangedEventCreator = (
    personId: PersonID,
    username: PersonReferrer,
    oxUserId: OXUserID,
    oxUserName: OXUserName,
    oxContextId: OXContextID,
    oxContextName: OXContextName,
    emailAddress: string,
) => [OxUserChangedEvent, KafkaOxUserChangedEvent];

const generateOxUserChangedEvent: OxUserChangedEventCreator = (
    personId: PersonID,
    username: PersonReferrer,
    oxUserId: OXUserID,
    oxUserName: OXUserName,
    oxContextId: OXContextID,
    oxContextName: OXContextName,
    emailAddress: string,
) => {
    return [
        new OxUserChangedEvent(
            personId,
            username,
            oxUserId,
            oxUserName, //strictEquals the new OxUsername
            oxContextId,
            oxContextName,
            emailAddress,
        ),
        new KafkaOxUserChangedEvent(
            personId,
            username,
            oxUserId,
            oxUserName, //strictEquals the new OxUsername
            oxContextId,
            oxContextName,
            emailAddress,
        ),
    ];
};

const generateDisabledOxUserChangedEvent: OxUserChangedEventCreator = (
    personId: PersonID,
    username: PersonReferrer,
    oxUserId: OXUserID,
    oxUserName: OXUserName,
    oxContextId: OXContextID,
    oxContextName: OXContextName,
    emailAddress: string,
) => {
    return [
        new DisabledOxUserChangedEvent(
            personId,
            username,
            oxUserId,
            oxUserName, //strictEquals the new OxUsername
            oxContextId,
            oxContextName,
            emailAddress,
        ),
        new KafkaDisabledOxUserChangedEvent(
            personId,
            username,
            oxUserId,
            oxUserName, //strictEquals the new OxUsername
            oxContextId,
            oxContextName,
            emailAddress,
        ),
    ];
};*/

@Injectable()
export class OxEventHandler extends AbstractOxEventHandler {
    /*    public ENABLED: boolean;

    private readonly authUser: string;

    private readonly authPassword: string;

    private readonly contextID: OXContextID;

    private readonly contextName: OXContextName;*/

    public constructor(
        protected override readonly logger: ClassLogger,
        protected override readonly oxService: OxService,
        protected readonly personRepository: PersonRepository,
        protected override readonly emailRepo: EmailRepo,
        protected override readonly eventService: EventRoutingLegacyKafkaService,
        protected override configService: ConfigService<ServerConfig>,
        //configService: ConfigService<ServerConfig>,
        // @ts-expect-error used by EnsureRequestContext decorator
        // Although not accessed directly, MikroORM's @EnsureRequestContext() uses this.em internally
        // to create the request-bound EntityManager context. Removing it would break context creation.
        private readonly em: EntityManager,
    ) {
        //const oxConfig: OxConfig = configService.getOrThrow<OxConfig>('OX');
        /*this.ENABLED = oxConfig.ENABLED;
        this.authUser = oxConfig.USERNAME;
        this.authPassword = oxConfig.PASSWORD;
        this.contextID = oxConfig.CONTEXT_ID;
        this.contextName = oxConfig.CONTEXT_NAME;*/
        super(logger, oxService, emailRepo, eventService, configService);
    }

    @EventHandler(EmailAddressChangedEvent)
    @KafkaEventHandler(KafkaEmailAddressChangedEvent)
    @EnsureRequestContext()
    public async handleEmailAddressChangedEvent(
        event: EmailAddressChangedEvent | KafkaEmailAddressChangedEvent,
    ): Promise<void> {
        this.logger.info(
            `Received EmailAddressChangedEvent, personId:${event.personId}, username:${event.username}, oldEmailAddressId:${event.oldEmailAddressId}, oldAddress:${event.oldAddress}, newEmailAddressId:${event.newEmailAddressId}, newAddress:${event.newAddress}`,
        );

        if (!this.ENABLED) {
            return this.logger.info('Not enabled, ignoring event');
        }

        await this.changeOxUser(event.personId, event.username, generateOxUserChangedEvent);
    }

    @EventHandler(EmailAddressGeneratedEvent)
    @KafkaEventHandler(KafkaEmailAddressGeneratedEvent)
    @EnsureRequestContext()
    public async handleEmailAddressGeneratedEvent(
        event: EmailAddressGeneratedEvent | KafkaEmailAddressGeneratedEvent,
    ): Promise<void> {
        this.logger.info(
            `Received EmailAddressGeneratedEvent, personId:${event.personId}, username:${event.username}, emailAddressId:${event.emailAddressId}, address:${event.address}`,
        );

        if (!this.ENABLED) {
            return this.logger.info('Not enabled, ignoring event');
        }

        await this.createOxUser(event.personId, event.username, event.orgaKennung);
    }

    @KafkaEventHandler(KafkaDisabledEmailAddressGeneratedEvent)
    @EventHandler(DisabledEmailAddressGeneratedEvent)
    @EnsureRequestContext()
    public async handleDisabledEmailAddressGeneratedEvent(event: DisabledEmailAddressGeneratedEvent): Promise<void> {
        this.logger.info(
            `Received EmailAddressGeneratedAndDisabledEvent, personId:${event.personId}, username:${event.username}, address:${event.address}, domain:${event.domain}`,
        );

        if (!this.ENABLED) {
            return this.logger.info('Not enabled, ignoring event');
        }

        await this.changeOxUser(event.personId, event.username, generateDisabledOxUserChangedEvent);
    }

    @KafkaEventHandler(KafkaEmailAddressAlreadyExistsEvent)
    @EventHandler(EmailAddressAlreadyExistsEvent)
    @EnsureRequestContext()
    public async handleEmailAddressAlreadyExistsEvent(event: EmailAddressAlreadyExistsEvent): Promise<void> {
        this.logger.info(
            `Received EmailAddressAlreadyExistsEvent, personId:${event.personId}, orgaKennung:${event.orgaKennung}`,
        );

        // Check if the functionality is enabled
        if (!this.ENABLED) {
            return this.logger.info('Not enabled, ignoring event');
        }

        // Fetch the person's details using their personId
        const person: Option<Person<true>> = await this.personRepository.findById(event.personId);
        if (!person) {
            return this.logger.error(`Person not found for personId:${event.personId}`);
        }

        // If the person doesn't have an OX user ID, log an error and stop the process
        if (!person.oxUserId) {
            return this.logger.error(
                `Person with personId:${event.personId} does not have an oxUserId. Cannot add to group.`,
            );
        }

        // Fetch or create the relevant OX group based on orgaKennung (group identifier)
        const oxGroupIdResult: Result<OXGroupID> = await this.getExistingOxGroupByNameOrCreateOxGroup(
            OxEventHandler.LEHRER_OX_GROUP_NAME_PREFIX + event.orgaKennung,
            OxEventHandler.LEHRER_OX_GROUP_DISPLAY_NAME_PREFIX + event.orgaKennung,
        );

        if (!oxGroupIdResult.ok) {
            return this.logger.error(
                `Get or create OX group failed, personId:${event.personId}, oxUserId:${person.oxUserId}, orgaKennung:${event.orgaKennung}`,
            );
        }

        // Add the user to the OX group
        const addUserToGroupResult: Result<AddMemberToGroupResponse> = await this.addOxUserToOxGroup(
            oxGroupIdResult.value,
            person.oxUserId,
            {
                personId: event.personId,
                username: undefined,
            },
        );

        if (!addUserToGroupResult.ok) {
            return this.logger.error(
                `Failed to add user to group, personId:${event.personId}, oxUserId:${person.oxUserId}, oxGroupId:${oxGroupIdResult.value}`,
            );
        }

        // Log the successful addition of the user to the group
        this.logger.info(
            `Successfully added user to group, personId:${event.personId}, oxUserId:${person.oxUserId}, oxGroupId:${oxGroupIdResult.value}`,
        );

        // Should always be true
        if (person.referrer && person.email) {
            // Publish an OxUserChangedEvent after successful addition to the group
            this.eventService.publish(
                new OxUserChangedEvent(
                    event.personId,
                    person.referrer,
                    person.oxUserId,
                    person.referrer,
                    this.contextID,
                    this.contextName,
                    person.email,
                ),
                new KafkaOxUserChangedEvent(
                    event.personId,
                    person.referrer,
                    person.oxUserId,
                    person.referrer,
                    this.contextID,
                    this.contextName,
                    person.email,
                ),
            );
        }
    }

    @KafkaEventHandler(KafkaEmailAddressDisabledEvent)
    @EventHandler(EmailAddressDisabledEvent)
    @EnsureRequestContext()
    public async handleEmailAddressDisabledEvent(event: EmailAddressDisabledEvent): Promise<void> {
        this.logger.info(`Received EmailAddressDisabledEvent, personId:${event.personId}, username:${event.username}`);
        if (!this.ENABLED) {
            return this.logger.info('Not enabled, ignoring event');
        }
        const person: Option<Person<true>> = await this.personRepository.findById(event.personId);
        if (!person) return this.logger.error(`Could Not Find Person For personId:${event.personId}`);
        if (!person.oxUserId) {
            return this.logger.error(
                `Could Not Remove Person From OxGroups, No OxUserId For personId:${event.personId}`,
            );
        }

        //remove oxUser as member from all its oxGroups
        //logging about success or errors is done inside removeOxUserFromAllItsOxGroups
        await this.removeOxUserFromAllItsOxGroups(person.oxUserId, {
            personId: event.personId,
            username: event.username,
        });
    }

    @KafkaEventHandler(KafkaPersonenkontextUpdatedEvent)
    @EventHandler(PersonenkontextUpdatedEvent)
    @EnsureRequestContext()
    public async handlePersonenkontextUpdatedEvent(event: PersonenkontextUpdatedEvent): Promise<void> {
        this.logger.info(
            `Received PersonenkontextUpdatedEvent, personId:${event.person.id}, username:${event.person.username}, newPKs:${event.newKontexte.length}, removedPKs:${event.removedKontexte.length}`,
        );
        if (!this.ENABLED) {
            return this.logger.info('Not enabled, ignoring event');
        }
        const person: Option<Person<true>> = await this.personRepository.findById(event.person.id);
        if (!person) {
            return this.logger.error(`Could Not Find Person For personId:${event.person.id}`);
        }
        if (!person.oxUserId) {
            return this.logger.error(`OxUserId Not Defined For personId:${event.person.id}`);
        }
        // For each removed personenkontext and if rollenart === LEHR
        const rollenArtLehrPKs: PersonenkontextEventKontextData[] = event.removedKontexte.filter(
            (pk: PersonenkontextEventKontextData) => pk.rolle === RollenArt.LEHR,
        );
        // Await the requests to OX explicitly to avoid transaction-exceptions on OX-side regarding concurrent modifications
        /* eslint-disable no-await-in-loop */
        for (const pk of rollenArtLehrPKs) {
            const oxGroupId: OXGroupID | DomainError = await this.getOxGroupByName(
                OxEventHandler.LEHRER_OX_GROUP_NAME_PREFIX + pk.orgaKennung,
            );
            if (oxGroupId instanceof DomainError) {
                return this.logger.error(
                    `Could Not Get OxGroupId For oxGroupName:${OxEventHandler.LEHRER_OX_GROUP_NAME_PREFIX + pk.orgaKennung}`,
                );
            }
            //Logging is done in removeOxUserFromOxGroup
            await this.removeOxUserFromOxGroup(oxGroupId, person.oxUserId, {
                personId: person.id,
                username: person.referrer,
            });
        }
    }

    @EventHandler(PersonDeletedAfterDeadlineExceededEvent)
    @KafkaEventHandler(KafkaPersonDeletedAfterDeadlineExceededEvent)
    @EnsureRequestContext()
    public async handlePersonDeletedAfterDeadlineExceededEvent(
        event: PersonDeletedAfterDeadlineExceededEvent | KafkaPersonDeletedAfterDeadlineExceededEvent,
    ): Promise<void> {
        this.logger.info(
            `Received PersonDeletedAfterDeadlineExceededEvent, personId:${event.personId}, username:${event.username}, oxUserId:${event.oxUserId}`,
        );
        if (!this.ENABLED) {
            return this.logger.info('Not enabled, ignoring event');
        }

        await this.handlePersonHasNotAnyPKWithRollenartLehr(event.personId, event.username, event.oxUserId);
    }

    public async handlePersonHasNotAnyPKWithRollenartLehr(
        personId: PersonID,
        username: PersonReferrer | undefined,
        oxUserId: OXUserID,
    ): Promise<void> {
        //change oxUserName to avoid conflicts for future OX-createUser-requests
        const params: ChangeUserParams = {
            contextId: this.contextID,
            contextName: this.contextName,
            userId: oxUserId,
            username: personId,
            login: this.authUser,
            password: this.authPassword,
        };

        const action: ChangeUserAction = new ChangeUserAction(params);

        const result: Result<void, DomainError> = await this.oxService.send(action);

        if (!result.ok) {
            return this.logger.error(
                `Could Not Change OxUsername, personId:${personId}, username:${username}, oxUserId:${oxUserId} After PersonDeletedAfterDeadlineExceededEvent, error:${result.error.message}`,
            );
        }

        return this.logger.info(
            `Successfully Changed OxUsername, personId:${personId}, username:${username}, oxUserId:${oxUserId} After PersonDeletedAfterDeadlineExceededEvent`,
        );
    }

    // this method cannot make use of handlePerson(personId) method, because personId is already null when event is received
    @KafkaEventHandler(KafkaPersonDeletedEvent)
    @EventHandler(PersonDeletedEvent)
    @EnsureRequestContext()
    public async handlePersonDeletedEvent(event: PersonDeletedEvent | KafkaPersonDeletedEvent): Promise<void> {
        this.logger.info(`Received PersonDeletedEvent, personId:${event.personId}`);

        // Check if the functionality is enabled
        if (!this.ENABLED) {
            return this.logger.info('Not enabled, ignoring event');
        }

        if (!event.emailAddress) {
            return this.logger.error('Cannot Create OX-delete-user-request, Email-Address Is Not Defined');
        }

        const emailAddress: Option<EmailAddress<true>> = await this.emailRepo.findByAddress(event.emailAddress);
        if (!emailAddress) {
            return this.logger.error(
                `Cannot Create OX-delete-user-request For address:${event.emailAddress} Could Not Be Found`,
            );
        }
        if (!emailAddress.oxUserID) {
            return this.logger.error(
                `Cannot Create OX-delete-user-request For address:${event.emailAddress}, OxUserId Is Not Defined`,
            );
        }

        return this.removeOxUserFromAllItsGroupsAndDeleteOxAccount(emailAddress.oxUserID, {
            personId: event.personId,
            username: event.username,
        });
    }

    @KafkaEventHandler(KafkaEmailAddressMarkedForDeletionEvent)
    @EventHandler(EmailAddressMarkedForDeletionEvent)
    @EnsureRequestContext()
    public async handleEmailAddressMarkedForDeletionEvent(event: EmailAddressMarkedForDeletionEvent): Promise<void> {
        this.logger.info(
            `Received EmailAddressDeletedEvent, personId:${event.personId}, username:${event.username}, oxUserId:${event.oxUserId}`,
        );

        // Check if the functionality is enabled
        if (!this.ENABLED) {
            return this.logger.info('Not enabled, ignoring event');
        }

        const idParams: UserIdParams = {
            contextId: this.contextID,
            userId: event.oxUserId,
            login: this.authUser,
            password: this.authPassword,
        };
        const getDataAction: GetDataForUserAction = new GetDataForUserAction(idParams);
        const getDataResult: Result<GetDataForUserResponse, DomainError> = await this.oxService.send(getDataAction);

        if (!getDataResult.ok && getDataResult.error instanceof OxNoSuchUserError) {
            this.publishEmailAddressDeletedEvent(event.personId, event.oxUserId, event.username, event.address);
            return this.logger.info(
                `User already deleted in OX, publishing (Kafka)OxEmailAddressDeleted-event, personId:${event.personId}, username:${event.username}`,
            );
        }

        if (!getDataResult.ok) {
            return this.logger.error(
                `Cannot get data for oxUsername:${event.username} from OX, Aborting Email-Address Removal, personId:${event.personId}, username:${event.username}`,
            );
        }
        let newAliasesArray: string[] = getDataResult.value.aliases;
        const aliasesLengthBeforeRemoval: number = newAliasesArray.length;
        this.logger.info(
            `Found Current aliases:${JSON.stringify(newAliasesArray)}, personId:${event.personId}, username:${event.username}`,
        );

        newAliasesArray = newAliasesArray.filter((a: string) => a !== event.address);
        if (aliasesLengthBeforeRemoval !== newAliasesArray.length) {
            this.logger.info(
                `Removed From alias:${event.address}, personId:${event.personId}, username:${event.username}`,
            );
        }
        const changeParams: ChangeUserParams = {
            contextId: this.contextID,
            contextName: this.contextName,
            userId: event.oxUserId,
            login: this.authUser,
            password: this.authPassword,
        };
        changeParams.aliases = newAliasesArray;
        const action: ChangeUserAction = new ChangeUserAction(changeParams);
        const result: Result<void, DomainError> = await this.oxService.send(action);

        if (!result.ok) {
            return this.logger.error(
                `Could Not Remove EmailAddress from OxAccount, personId:${event.personId}, username:${event.username}, oxUserId:${event.oxUserId}, error:${result.error.message}`,
            );
        }

        this.publishEmailAddressDeletedEvent(event.personId, event.oxUserId, event.username, event.address);
        return this.logger.info(
            `Successfully Removed EmailAddress from OxAccount, personId:${event.personId}, username:${event.username}, oxUserId:${event.oxUserId}`,
        );
    }

    private publishEmailAddressDeletedEvent(
        personId: PersonID | undefined,
        oxUserId: OXUserID,
        username: PersonReferrer | undefined,
        address: string,
    ): void {
        this.eventService.publish(
            new OxEmailAddressDeletedEvent(personId, oxUserId, username, address, this.contextID, this.contextName),
            new KafkaOxEmailAddressDeletedEvent(
                personId,
                oxUserId,
                username,
                address,
                this.contextID,
                this.contextName,
            ),
        );
    }

    @KafkaEventHandler(KafkaEmailAddressesPurgedEvent)
    @EventHandler(EmailAddressesPurgedEvent)
    @EnsureRequestContext()
    public async handleEmailAddressesPurgedEvent(event: EmailAddressesPurgedEvent): Promise<void> {
        this.logger.info(
            `Received EmailAddressesPurgedEvent, personId:${event.personId}, username:${event.username}, oxUserId:${event.oxUserId}`,
        );

        // Check if the functionality is enabled
        if (!this.ENABLED) {
            return this.logger.info('Not enabled, ignoring event');
        }

        return this.removeOxUserFromAllItsGroupsAndDeleteOxAccount(event.oxUserId, {
            personId: event.personId,
            username: event.username,
        });
    }

    private async removeOxUserFromAllItsGroupsAndDeleteOxAccount(
        oxUserId: OXUserID,
        personIdentifier: PersonIdentifier,
    ): Promise<void> {
        this.logger.infoPersonalized(
            `Remove OxUser from all its groups and delete OxAccount, oxUserId:${oxUserId}`,
            personIdentifier,
        );

        //remove oxUser as member from all its oxGroups
        //logging about success or errors is done inside removeOxUserFromAllItsOxGroups
        await this.removeOxUserFromAllItsOxGroups(oxUserId, personIdentifier);

        const params: UserIdParams = {
            contextId: this.contextID,
            userId: oxUserId,
            login: this.authUser,
            password: this.authPassword,
        };

        const action: DeleteUserAction = new DeleteUserAction(params);

        const result: Result<void, DomainError> = await this.oxService.send(action);

        if (!result.ok) {
            return this.logger.errorPersonalized(
                `Could Not Delete OxAccount For oxUserId:${oxUserId}, error:${result.error.message}`,
                personIdentifier,
            );
        }
        this.eventService.publish(
            new OxAccountDeletedEvent(personIdentifier.personId, personIdentifier.username, oxUserId),
            new KafkaOxAccountDeletedEvent(personIdentifier.personId, personIdentifier.username, oxUserId),
        );

        return this.logger.infoPersonalized(
            `Successfully Deleted OxAccount For oxUserId:${oxUserId}`,
            personIdentifier,
        );
    }

    private async removeOxUserFromAllItsOxGroups(
        oxUserId: OXUserID,
        personIdentifier: PersonIdentifier,
    ): Promise<void> {
        const listGroupsForUserResponse: Result<ListGroupsForUserResponse> =
            await this.getOxGroupsForOxUserId(oxUserId);
        if (!listGroupsForUserResponse.ok) {
            return this.logger.errorPersonalized(`Retrieving OxGroups For OxUser Failed`, personIdentifier);
        }
        //Removal from Standard-Group is possible even when user is member of other OxGroups
        const oxGroups: OXGroup[] = listGroupsForUserResponse.value.groups;
        // The sent Ox-request should be awaited explicitly to avoid failures due to async execution in OX-Database (SQL-exceptions)
        /* eslint-disable no-await-in-loop */
        for (const oxGroup of oxGroups) {
            //logging of results is done in removeOxUserFromOxGroup
            await this.removeOxUserFromOxGroup(oxGroup.id, oxUserId, personIdentifier);
        }
    }

    private async getMostRecentRequestedEmailAddress(personId: PersonID): Promise<Option<EmailAddress<true>>> {
        const requestedEmailAddresses: Option<EmailAddress<true>[]> =
            await this.emailRepo.findByPersonSortedByUpdatedAtDesc(personId, EmailAddressStatus.REQUESTED);
        if (!requestedEmailAddresses || !requestedEmailAddresses[0]) {
            this.logger.error(`No REQUESTED email-address found for personId:${personId}`);
            return undefined;
        }
        this.logger.info(
            `Found mostRecentRequested Email-Address:${JSON.stringify(requestedEmailAddresses[0].address)} for personId:${personId}`,
        );

        return requestedEmailAddresses[0];
    }

    private async addOxUserToOxGroup(
        oxGroupId: OXGroupID,
        oxUserId: OXUserID,
        personIdentifier: PersonIdentifier,
    ): Promise<Result<AddMemberToGroupResponse>> {
        const params: GroupMemberParams = {
            contextId: this.contextID,
            groupId: oxGroupId,
            memberId: oxUserId,
            login: this.authUser,
            password: this.authPassword,
        };

        const action: AddMemberToGroupAction = new AddMemberToGroupAction(params);
        const result: Result<AddMemberToGroupResponse, DomainError> = await this.oxService.send(action);

        if (!result.ok) {
            this.logger.errorPersonalized(
                `Could Not Add OxUser To OxGroup, oxUserId:${oxUserId}, oxGroupId:${oxGroupId}`,
                personIdentifier,
            );
        } else {
            this.logger.infoPersonalized(
                `Successfully Added OxUser To OxGroup, oxUserId:${oxUserId}, oxGroupId:${oxGroupId}`,
                personIdentifier,
            );
        }
        return result;
    }

    private async getOxGroupsForOxUserId(oxUserId: OXUserID): Promise<Result<ListGroupsForUserResponse>> {
        const params: ListGroupsForUserParams = {
            contextId: this.contextID,
            userId: oxUserId,
            login: this.authUser,
            password: this.authPassword,
        };
        const action: ListGroupsForUserAction = new ListGroupsForUserAction(params);
        const result: Result<ListGroupsForUserResponse, DomainError> = await this.oxService.send(action);
        if (!result.ok) {
            this.logger.error(`Could Not Retrieve OxGroups For OxUser, oxUserId:${oxUserId}`);
        } else {
            this.logger.info(`Successfully Retrieved OxGroups For OxUser, oxUserId:${oxUserId}`);
        }
        return result;
    }

    private async removeOxUserFromOxGroup(
        oxGroupId: OXGroupID,
        oxUserId: OXUserID,
        personIdentifier: PersonIdentifier,
    ): Promise<Result<RemoveMemberFromGroupResponse>> {
        const params: GroupMemberParams = {
            contextId: this.contextID,
            groupId: oxGroupId,
            memberId: oxUserId,
            login: this.authUser,
            password: this.authPassword,
        };
        const action: RemoveMemberFromGroupAction = new RemoveMemberFromGroupAction(params);
        const result: Result<RemoveMemberFromGroupResponse, DomainError> = await this.oxService.send(action);
        if (!result.ok) {
            this.logger.errorPersonalized(
                `Could Not Remove OxUser From OxGroup, oxUserId:${oxUserId}, oxGroupId:${oxGroupId}`,
                personIdentifier,
            );
        } else {
            this.logger.infoPersonalized(
                `Successfully Removed OxUser From OxGroup, oxUserId:${oxUserId}, oxGroupId:${oxGroupId}`,
                personIdentifier,
            );
        }

        return result;
    }

    private async createOxUser(
        personId: PersonID,
        username: PersonReferrer,
        orgaKennung: OrganisationKennung,
    ): Promise<void> {
        const personIdentifier: PersonIdentifier = {
            personId: personId,
            username: username,
        };
        const person: Option<Person<true>> = await this.personRepository.findById(personId);

        if (!person) {
            return this.logger.errorPersonalized(`Person not found`, personIdentifier);
        }
        if (!person.referrer) {
            return this.logger.errorPersonalized(
                `Person has no username: cannot create OXEmailAddress`,
                personIdentifier,
            );
        }

        const mostRecentRequestedEmailAddress: Option<EmailAddress<true>> =
            await this.getMostRecentRequestedEmailAddress(personId);
        if (!mostRecentRequestedEmailAddress) return;
        const requestedEmailAddressString: string = mostRecentRequestedEmailAddress.address;

        const existsParams: UserNameParams = {
            contextId: this.contextID,
            userName: person.referrer,
            login: this.authUser,
            password: this.authPassword,
        };

        const existsAction: ExistsUserAction = new ExistsUserAction(existsParams);

        const existsResult: Result<ExistsUserResponse, DomainError> = await this.oxService.send(existsAction);

        if (existsResult.ok && existsResult.value.exists) {
            this.logger.errorPersonalized(`Cannot create user in OX, user already exists`, personIdentifier);
            return;
        }

        const params: CreateUserParams = {
            contextId: this.contextID,
            displayName: person.referrer,
            email1: requestedEmailAddressString,
            username: person.referrer,
            firstname: person.vorname,
            mailEnabled: true,
            lastname: person.familienname,
            primaryEmail: requestedEmailAddressString,
            userPassword: 'TestPassword1',
            login: this.authUser,
            password: this.authPassword,
        };

        const action: CreateUserAction = new CreateUserAction(params);
        const createUserResult: Result<CreateUserResponse, DomainError> = await this.oxService.send(action);

        if (!createUserResult.ok) {
            mostRecentRequestedEmailAddress.failed();
            await this.emailRepo.save(mostRecentRequestedEmailAddress);

            return this.logger.errorPersonalized(
                `Could not create user in OX, error:${createUserResult.error.message}`,
                personIdentifier,
            );
        }

        this.logger.infoPersonalized(
            `User created in OX, oxUserId:${createUserResult.value.id}, oxEmail:${createUserResult.value.primaryEmail}`,
            personIdentifier,
        );

        mostRecentRequestedEmailAddress.oxUserID = createUserResult.value.id;
        const emailAddressUpdateResult: EmailAddress<true> | DomainError = await this.emailRepo.save(
            mostRecentRequestedEmailAddress,
        );
        if (emailAddressUpdateResult instanceof DomainError) {
            mostRecentRequestedEmailAddress.failed();
            await this.emailRepo.save(mostRecentRequestedEmailAddress);
            return this.logger.errorPersonalized(`Persisting oxUserId on emailAddress failed`, personIdentifier);
        }

        const oxGroupId: Result<OXGroupID> = await this.getExistingOxGroupByNameOrCreateOxGroup(
            OxEventHandler.LEHRER_OX_GROUP_NAME_PREFIX + orgaKennung,
            OxEventHandler.LEHRER_OX_GROUP_DISPLAY_NAME_PREFIX + orgaKennung,
        );
        if (!oxGroupId.ok) {
            mostRecentRequestedEmailAddress.failed();
            await this.emailRepo.save(mostRecentRequestedEmailAddress);
            return this.logger.logUnknownAsError(
                `Failed getting existing OxGroup by name or create new OxGroup if necessary, personId:${personIdentifier.personId}, username:${personIdentifier.username}`,
                oxGroupId.error,
            );
        }

        const addUserToGroupResult: Result<AddMemberToGroupResponse> = await this.addOxUserToOxGroup(
            oxGroupId.value,
            createUserResult.value.id,
            {
                personId: personIdentifier.personId,
                username: personIdentifier.username,
            },
        );
        if (!addUserToGroupResult.ok) {
            mostRecentRequestedEmailAddress.failed();
            await this.emailRepo.save(mostRecentRequestedEmailAddress);
            return this.logger.logUnknownAsError(
                `Failed adding user to OXGroup, personId:${personIdentifier.personId}, username:${personIdentifier.username}`,
                addUserToGroupResult.error,
            );
        }

        //adjust user infostore and globalAddressBook
        const changeByModuleAccessParams: ChangeByModuleAccessParams = {
            contextId: this.contextID,
            userId: createUserResult.value.id,
            globalAddressBookDisabled: true,
            infostore: false,
            login: this.authUser,
            password: this.authPassword,
        };
        const changeByModuleAccessAction: ChangeByModuleAccessAction = new ChangeByModuleAccessAction(
            changeByModuleAccessParams,
        );
        const changeByModuleAccessResult: Result<void, DomainError> =
            await this.oxService.send(changeByModuleAccessAction);

        if (!changeByModuleAccessResult.ok) {
            //only log error, do not set email-address status = FAILED, the ChangeByModuleAccessAction won't work against OX-DEV
            this.logger.errorPersonalized(
                `Could Not Adjust GlobalAddressBookDisabled For oxUserId:${createUserResult.value.id}, error:${changeByModuleAccessResult.error.message}`,
                personIdentifier,
            );
        }

        this.eventService.publish(
            new OxUserChangedEvent(
                personId,
                person.referrer,
                createUserResult.value.id,
                createUserResult.value.username,
                this.contextID,
                this.contextName,
                createUserResult.value.primaryEmail,
            ),
            new KafkaOxUserChangedEvent(
                personId,
                person.referrer,
                createUserResult.value.id,
                createUserResult.value.username,
                this.contextID,
                this.contextName,
                createUserResult.value.primaryEmail,
            ),
        );
    }

    private async changeOxUser(
        personId: PersonID,
        username: PersonReferrer,
        eventCreator: OxUserChangedEventCreator,
    ): Promise<void> {
        const personIdentifier: PersonIdentifier = {
            personId: personId,
            username: username,
        };
        const person: Option<Person<true>> = await this.personRepository.findById(personId);

        if (!person) {
            return this.logger.errorPersonalized(`Person not found`, personIdentifier);
        }
        if (!person.referrer) {
            return this.logger.errorPersonalized(
                `Person has no username: Cannot Change Email-Address In OX`,
                personIdentifier,
            );
        }
        if (!person.oxUserId) {
            return this.logger.errorPersonalized(`Person has no OXUserId`, personIdentifier);
        }

        const mostRecentRequestedEmailAddress: Option<EmailAddress<true>> =
            await this.getMostRecentRequestedEmailAddress(personId);
        if (!mostRecentRequestedEmailAddress) return; //logging is done in getMostRecentRequestedEmailAddress
        const requestedEmailAddressString: string = mostRecentRequestedEmailAddress.address;

        const getDataParams: UserIdParams = {
            contextId: this.contextID,
            userId: person.oxUserId,
            login: this.authUser,
            password: this.authPassword,
        };

        const getDataAction: GetDataForUserAction = new GetDataForUserAction(getDataParams);

        const getDataResult: Result<GetDataForUserResponse, DomainError> = await this.oxService.send(getDataAction);

        if (!getDataResult.ok) {
            mostRecentRequestedEmailAddress.failed();
            await this.emailRepo.save(mostRecentRequestedEmailAddress);
            return this.logger.error(
                `Cannot get data for oxUsername:${person.referrer} from OX, Aborting Email-Address Change, personId:${personIdentifier.personId}, username:${personIdentifier.username}`,
            );
        }
        const newAliasesArray: string[] = getDataResult.value.aliases;
        this.logger.info(
            `Found Current aliases:${JSON.stringify(newAliasesArray)}, personId:${personIdentifier.personId}, username:${personIdentifier.username}`,
        );

        newAliasesArray.push(requestedEmailAddressString);
        this.logger.info(
            `Added New alias:${requestedEmailAddressString}, personId:${personIdentifier.personId}, username:${personIdentifier.username}`,
        );

        const params: ChangeUserParams = {
            contextId: this.contextID,
            contextName: this.contextName,
            userId: person.oxUserId,
            username: person.referrer,
            givenname: person.vorname,
            surname: person.familienname,
            displayname: person.referrer, //IS EXPLICITLY NOT SET to vorname+familienname
            defaultSenderAddress: requestedEmailAddressString,
            email1: requestedEmailAddressString,
            aliases: newAliasesArray,
            primaryEmail: requestedEmailAddressString,
            login: this.authUser,
            password: this.authPassword,
        };

        const action: ChangeUserAction = new ChangeUserAction(params);

        const result: Result<void, DomainError> = await this.oxService.send(action);

        if (!result.ok) {
            mostRecentRequestedEmailAddress.failed();
            await this.emailRepo.save(mostRecentRequestedEmailAddress);

            return this.logger.errorPersonalized(
                `Could not change email-address for oxUserId:${person.oxUserId}, error:${result.error.message}`,
                personIdentifier,
            );
        }

        this.logger.infoPersonalized(
            `Changed primary email-address in OX for user, oxUserId:${person.oxUserId}, oxUsername:${person.referrer}, new email-address:${requestedEmailAddressString}`,
            personIdentifier,
        );

        const event: [OxUserChangedEvent, KafkaOxUserChangedEvent] = eventCreator(
            personId,
            person.referrer,
            person.oxUserId,
            person.referrer, //strictEquals the new OxUsername
            this.contextID,
            this.contextName,
            requestedEmailAddressString,
        );

        this.eventService.publish(...event);
    }
}
