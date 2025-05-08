import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EventHandler } from '../../../core/eventbus/decorators/event-handler.decorator.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { ServerConfig } from '../../../shared/config/server.config.js';
import { DomainError } from '../../../shared/error/index.js';
import { OxConfig } from '../../../shared/config/ox.config.js';
import { OxService } from './ox.service.js';
import { CreateUserAction, CreateUserParams, CreateUserResponse } from '../actions/user/create-user.action.js';
import { OrganisationKennung, PersonID, PersonReferrer } from '../../../shared/types/index.js';
import { Person } from '../../person/domain/person.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { EmailAddressGeneratedEvent } from '../../../shared/events/email/email-address-generated.event.js';
import { ExistsUserAction, ExistsUserResponse } from '../actions/user/exists-user.action.js';
import { EventRoutingLegacyKafkaService } from '../../../core/eventbus/services/event-routing-legacy-kafka.service.js';
import {
    OXContextID,
    OXContextName,
    OXGroupID,
    OXGroupName,
    OXUserID,
    OXUserName,
} from '../../../shared/types/ox-ids.types.js';
import { EmailAddressChangedEvent } from '../../../shared/events/email/email-address-changed.event.js';
import { ChangeUserAction, ChangeUserParams } from '../actions/user/change-user.action.js';
import { OxUserChangedEvent } from '../../../shared/events/ox/ox-user-changed.event.js';
import { GetDataForUserAction, GetDataForUserResponse } from '../actions/user/get-data-user.action.js';
import { UserIdParams, UserNameParams } from '../actions/user/ox-user.types.js';
import { EmailRepo } from '../../email/persistence/email.repo.js';
import { EmailAddress, EmailAddressStatus } from '../../email/domain/email-address.js';
import { AddMemberToGroupAction, AddMemberToGroupResponse } from '../actions/group/add-member-to-group.action.js';
import { GroupMemberParams, OXGroup } from '../actions/group/ox-group.types.js';
import { CreateGroupAction, CreateGroupParams, CreateGroupResponse } from '../actions/group/create-group.action.js';
import { OxGroupNotFoundError } from '../error/ox-group-not-found.error.js';
import { ListGroupsAction, ListGroupsParams, ListGroupsResponse } from '../actions/group/list-groups.action.js';
import { OxGroupNameAmbiguousError } from '../error/ox-group-name-ambiguous.error.js';
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
import { DisabledOxUserChangedEvent } from '../../../shared/events/ox/disabled-ox-user-changed.event.js';
import { EmailAddressesPurgedEvent } from '../../../shared/events/email/email-addresses-purged.event.js';
import { DeleteUserAction } from '../actions/user/delete-user.action.js';
import { EmailAddressDeletedEvent } from '../../../shared/events/email/email-address-deleted.event.js';
import { OxEmailAddressDeletedEvent } from '../../../shared/events/ox/ox-email-address-deleted.event.js';
import { OxAccountDeletedEvent } from '../../../shared/events/ox/ox-account-deleted.event.js';
import { KafkaEmailAddressChangedEvent } from '../../../shared/events/email/kafka-email-address-changed.event.js';
import { KafkaEmailAddressGeneratedEvent } from '../../../shared/events/email/kafka-email-address-generated.event.js';
import { PersonDeletedAfterDeadlineExceededEvent } from '../../../shared/events/person-deleted-after-deadline-exceeded.event.js';
import { KafkaPersonDeletedAfterDeadlineExceededEvent } from '../../../shared/events/kafka-person-deleted-after-deadline-exceeded.event.js';
import { KafkaOxUserChangedEvent } from '../../../shared/events/ox/kafka-ox-user-changed.event.js';
import { KafkaOxEmailAddressDeletedEvent } from '../../../shared/events/ox/kafka-ox-email-address-deleted.event.js';
import { KafkaEmailAddressesPurgedEvent } from '../../../shared/events/email/kafka-email-addresses-purged.event.js';
import { KafkaEmailAddressDeletedEvent } from '../../../shared/events/email/kafka-email-address-deleted.event.js';
import { KafkaEmailAddressDisabledEvent } from '../../../shared/events/email/kafka-email-address-disabled.event.js';
import { KafkaEmailAddressAlreadyExistsEvent } from '../../../shared/events/email/kafka-email-address-already-exists.event.js';
import { KafkaDisabledEmailAddressGeneratedEvent } from '../../../shared/events/email/kafka-disabled-email-address-generated.event.js';
import { KafkaOxAccountDeletedEvent } from '../../../shared/events/ox/kafka-ox-account-deleted.event.js';
import { KafkaDisabledOxUserChangedEvent } from '../../../shared/events/ox/kafka-disabled-ox-user-changed.event.js';

type OxUserChangedEventCreator = (
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
};

@Injectable()
export class OxEventHandler {
    public ENABLED: boolean;

    private readonly authUser: string;

    private readonly authPassword: string;

    private readonly contextID: OXContextID;

    private readonly contextName: OXContextName;

    private static readonly LEHRER_OX_GROUP_NAME_PREFIX: string = 'lehrer-';

    private static readonly LEHRER_OX_GROUP_DISPLAY_NAME_PREFIX: string = 'lehrer-';

    public constructor(
        private readonly logger: ClassLogger,
        private readonly oxService: OxService,
        private readonly personRepository: PersonRepository,
        private readonly emailRepo: EmailRepo,
        private readonly eventService: EventRoutingLegacyKafkaService,
        configService: ConfigService<ServerConfig>,
        // @ts-expect-error used by EnsureRequestContext decorator
        // Although not accessed directly, MikroORM's @EnsureRequestContext() uses this.em internally
        // to create the request-bound EntityManager context. Removing it would break context creation.
        private readonly em: EntityManager,
    ) {
        const oxConfig: OxConfig = configService.getOrThrow<OxConfig>('OX');
        this.ENABLED = oxConfig.ENABLED;
        this.authUser = oxConfig.USERNAME;
        this.authPassword = oxConfig.PASSWORD;
        this.contextID = oxConfig.CONTEXT_ID;
        this.contextName = oxConfig.CONTEXT_NAME;
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
        await this.removeOxUserFromAllItsOxGroups(person.oxUserId, person.id);
    }

    @EventHandler(PersonenkontextUpdatedEvent)
    //@KafkaEventHandler(KafkaPersonenkontextUpdatedEvent)
    //@EnsureRequestContext()
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
            await this.removeOxUserFromOxGroup(oxGroupId, person.oxUserId);
        }
        /* if (event.currentKontexte.some((pk: PersonenkontextEventKontextData) => pk.rolle === RollenArt.LEHR)) {
            return this.logger.info(
                `Person still has PKs with rollenart LEHR, skipping change of OxUsername, personId:${event.person.id}, username:${person.referrer}`,
            );
        } else {
            await this.handlePersonHasNotAnyPKWithRollenartLehr(person.id, person.referrer, person.oxUserId);
        }*/
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
        /* const person: Option<Person<true>> = await this.personRepository.findById(event.personId);
        if (!person) {
            return this.logger.error(
                `Could Not Find Person, Cannot Handle PersonDeletedAfterDeadlineExceededEvent, personId:${event.personId}, username:${event.username}, email:${event.emailAddress}, oxUserId:${event.oxUserId}`,
            );
        }*/
        /*if (!person.oxUserId) {
            return this.logger.error(
                `OxUserId Not Defined, Cannot Handle PersonDeletedAfterDeadlineExceededEvent, personId:${event.personId}, username:${event.username}, email:${event.emailAddress}, oxUserId:${event.oxUserId}`,
            );
        }*/
        await this.handlePersonHasNotAnyPKWithRollenartLehr(event.personId, event.username, event.oxUserId);
    }

    public async handlePersonHasNotAnyPKWithRollenartLehr(
        personId: PersonID,
        username: PersonReferrer | undefined,
        oxUserId: OXUserID,
    ): Promise<void> {
        //removing oxUser as member from all its oxGroups should have been done in the calling method already

        //change oxUserName to avoid conflicts for future OX-createUser-requests
        const params: ChangeUserParams = {
            contextId: this.contextID,
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

        return this.removeOxUserFromAllItsGroupsAndDeleteOxAccount(
            event.personId,
            event.username,
            emailAddress.oxUserID,
        );
    }

    @KafkaEventHandler(KafkaEmailAddressDeletedEvent)
    @EventHandler(EmailAddressDeletedEvent)
    @EnsureRequestContext()
    public async handleEmailAddressDeletedEvent(event: EmailAddressDeletedEvent): Promise<void> {
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

        const changeParams: ChangeUserParams = idParams;
        changeParams.aliases = newAliasesArray;
        const action: ChangeUserAction = new ChangeUserAction(changeParams);
        const result: Result<void, DomainError> = await this.oxService.send(action);

        if (!result.ok) {
            return this.logger.error(
                `Could Not Remove EmailAddress from OxAccount, personId:${event.personId}, username:${event.username}, oxUserId:${event.oxUserId}, error:${result.error.message}`,
            );
        }

        this.eventService.publish(
            new OxEmailAddressDeletedEvent(
                event.personId,
                event.oxUserId,
                event.username,
                event.address,
                this.contextID,
                this.contextName,
            ),
            new KafkaOxEmailAddressDeletedEvent(
                event.personId,
                event.oxUserId,
                event.username,
                event.address,
                this.contextID,
                this.contextName,
            ),
        );
        return this.logger.info(
            `Successfully Removed EmailAddress from OxAccount, personId:${event.personId}, username:${event.username}, oxUserId:${event.oxUserId}`,
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

        return this.removeOxUserFromAllItsGroupsAndDeleteOxAccount(event.personId, event.username, event.oxUserId);
    }

    private async removeOxUserFromAllItsGroupsAndDeleteOxAccount(
        personId: PersonID,
        username: PersonReferrer,
        oxUserId: OXUserID,
    ): Promise<void> {
        this.logger.info(
            `Remove OxUser from all its groups and delete OxAccount, personId:${personId}, username:${username}, oxUserId:${oxUserId}`,
        );

        //remove oxUser as member from all its oxGroups
        //logging about success or errors is done inside removeOxUserFromAllItsOxGroups
        await this.removeOxUserFromAllItsOxGroups(oxUserId, personId);

        const params: UserIdParams = {
            contextId: this.contextID,
            userId: oxUserId,
            login: this.authUser,
            password: this.authPassword,
        };

        const action: DeleteUserAction = new DeleteUserAction(params);

        const result: Result<void, DomainError> = await this.oxService.send(action);

        if (!result.ok) {
            return this.logger.error(
                `Could Not Delete OxAccount For oxUserId:${oxUserId}, error:${result.error.message}`,
            );
        }
        this.eventService.publish(
            new OxAccountDeletedEvent(personId, username, oxUserId),
            new KafkaOxAccountDeletedEvent(personId, username, oxUserId),
        );

        return this.logger.info(`Successfully Deleted OxAccount For oxUserId:${oxUserId}`);
    }

    private async removeOxUserFromAllItsOxGroups(oxUserId: OXUserID, personId: PersonID): Promise<void> {
        const listGroupsForUserResponse: Result<ListGroupsForUserResponse> =
            await this.getOxGroupsForOxUserId(oxUserId);
        if (!listGroupsForUserResponse.ok) {
            return this.logger.error(`Retrieving OxGroups For OxUser Failed, personId:${personId}`);
        }
        //Removal from Standard-Group is possible even when user is member of other OxGroups
        const oxGroups: OXGroup[] = listGroupsForUserResponse.value.groups;
        // The sent Ox-request should be awaited explicitly to avoid failures due to async execution in OX-Database (SQL-exceptions)
        /* eslint-disable no-await-in-loop */
        for (const oxGroup of oxGroups) {
            //logging of results is done in removeOxUserFromOxGroup
            await this.removeOxUserFromOxGroup(oxGroup.id, oxUserId);
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
            `Found mostRecentRequested Email-Address:${JSON.stringify(requestedEmailAddresses[0].address)} For personId:${personId}`,
        );

        return requestedEmailAddresses[0];
    }

    private async createOxGroup(oxGroupName: OXGroupName, displayName: string): Promise<Result<OXGroupID>> {
        const params: CreateGroupParams = {
            contextId: this.contextID,
            name: oxGroupName,
            displayname: displayName,
            login: this.authUser,
            password: this.authPassword,
        };

        const action: CreateGroupAction = new CreateGroupAction(params);
        const result: Result<CreateGroupResponse, DomainError> = await this.oxService.send(action);

        if (!result.ok) {
            this.logger.error(`Could Not Create OxGroup with name:${oxGroupName}, displayName:${displayName}`);

            return result;
        }

        this.logger.info(
            `Successfully Created OxGroup, oxGroupId:${result.value.id}, name:${oxGroupName}, displayName:${displayName}`,
        );

        return {
            ok: true,
            value: result.value.id,
        };
    }

    private async getOxGroupByName(oxGroupName: OXGroupName): Promise<OXGroupID | DomainError> {
        const params: ListGroupsParams = {
            contextId: this.contextID,
            pattern: `${oxGroupName}`,
            login: this.authUser,
            password: this.authPassword,
        };
        const action: ListGroupsAction = new ListGroupsAction(params);
        const result: Result<ListGroupsResponse, DomainError> = await this.oxService.send(action);

        if (!result.ok) {
            this.logger.error(`Could Not Retrieve Groups For Context, contextId:${this.contextID}`);
            return result.error;
        }
        if (!result.value.groups[0] || result.value.groups.length == 0) {
            this.logger.info(`Found No Matching OxGroup For OxGroupName:${oxGroupName}`);
            return new OxGroupNotFoundError(oxGroupName);
        }
        if (result.value.groups.length > 1) {
            this.logger.error(`Found multiple OX-groups For OxGroupName:${oxGroupName}, Cannot Proceed`);
            return new OxGroupNameAmbiguousError(oxGroupName);
        }

        this.logger.info(`Found existing oxGroup for oxGroupName:${oxGroupName}`);

        return result.value.groups[0].id;
    }

    private async getExistingOxGroupByNameOrCreateOxGroup(
        oxGroupName: OXGroupName,
        displayName: string,
    ): Promise<Result<OXGroupID>> {
        const oxGroupId: OXGroupID | DomainError = await this.getOxGroupByName(oxGroupName);

        if (oxGroupId instanceof OxGroupNotFoundError) {
            const createGroupResult: Result<OXGroupID> = await this.createOxGroup(oxGroupName, displayName);

            return createGroupResult;
        }

        //return if OxGroupNameAmbiguousError or any other error
        if (oxGroupId instanceof DomainError)
            return {
                ok: false,
                error: oxGroupId,
            };

        return {
            ok: true,
            value: oxGroupId,
        };
    }

    private async addOxUserToOxGroup(
        oxGroupId: OXGroupID,
        oxUserId: OXUserID,
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
            this.logger.error(`Could Not Add OxUser To OxGroup, oxUserId:${oxUserId}, oxGroupId:${oxGroupId}`);
        } else {
            this.logger.info(`Successfully Added OxUser To OxGroup, oxUserId:${oxUserId}, oxGroupId:${oxGroupId}`);
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
            this.logger.error(`Could Not Remove OxUser From OxGroup, oxUserId:${oxUserId}, oxGroupId:${oxGroupId}`);
        } else {
            this.logger.info(`Successfully Removed OxUser From OxGroup, oxUserId:${oxUserId}, oxGroupId:${oxGroupId}`);
        }

        return result;
    }

    private async createOxUser(
        personId: PersonID,
        username: PersonReferrer,
        orgaKennung: OrganisationKennung,
    ): Promise<void> {
        const person: Option<Person<true>> = await this.personRepository.findById(personId);

        if (!person) {
            return this.logger.error(`Person not found for personId:${personId}, username:${username}`);
        }
        if (!person.referrer) {
            return this.logger.error(`Person with personId:${personId} has no username: cannot create OXEmailAddress`);
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
            this.logger.error(
                `Cannot create user in OX, username:${person.referrer} already exists, personId:${personId}`,
            );
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

            return this.logger.error(
                `Could not create user in OX, personId:${personId}, username:${username}, error:${createUserResult.error.message}`,
            );
        }

        this.logger.info(
            `User created in OX, oxUserId:${createUserResult.value.id}, oxEmail:${createUserResult.value.primaryEmail}, personId:${personId}, username:${username}`,
        );

        mostRecentRequestedEmailAddress.oxUserID = createUserResult.value.id;
        const emailAddressUpdateResult: EmailAddress<true> | DomainError = await this.emailRepo.save(
            mostRecentRequestedEmailAddress,
        );
        if (emailAddressUpdateResult instanceof DomainError) {
            mostRecentRequestedEmailAddress.failed();
            await this.emailRepo.save(mostRecentRequestedEmailAddress);
            return this.logger.error(
                `Persisting oxUserId on emailAddress failed, personId:${personId}, username:${username}`,
            );
        }

        const oxGroupId: Result<OXGroupID> = await this.getExistingOxGroupByNameOrCreateOxGroup(
            OxEventHandler.LEHRER_OX_GROUP_NAME_PREFIX + orgaKennung,
            OxEventHandler.LEHRER_OX_GROUP_DISPLAY_NAME_PREFIX + orgaKennung,
        );
        if (!oxGroupId.ok) {
            mostRecentRequestedEmailAddress.failed();
            await this.emailRepo.save(mostRecentRequestedEmailAddress);
            return;
        }

        const addUserToGroupResult: Result<AddMemberToGroupResponse> = await this.addOxUserToOxGroup(
            oxGroupId.value,
            createUserResult.value.id,
        );
        if (!addUserToGroupResult.ok) {
            mostRecentRequestedEmailAddress.failed();
            await this.emailRepo.save(mostRecentRequestedEmailAddress);
            return;
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
            this.logger.error(
                `Could Not Adjust GlobalAddressBookDisabled For oxUserId:${createUserResult.value.id}, personId:${personId}, username:${username}, error:${changeByModuleAccessResult.error.message}`,
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
        const person: Option<Person<true>> = await this.personRepository.findById(personId);

        if (!person) {
            return this.logger.error(`Person not found for personId:${personId}, username:${username}`);
        }
        if (!person.referrer) {
            return this.logger.error(
                `Person with personId:${personId} has no username: Cannot Change Email-Address In OX`,
            );
        }
        if (!person.oxUserId) {
            return this.logger.error(`Person has no OXUserId, personId:${personId}, username:${username}`);
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
                `Cannot get data for oxUsername:${person.referrer} from OX, Aborting Email-Address Change, personId:${personId}, username:${username}`,
            );
        }
        const newAliasesArray: string[] = getDataResult.value.aliases;
        this.logger.info(
            `Found Current aliases:${JSON.stringify(newAliasesArray)}, personId:${personId}, username:${username}`,
        );

        newAliasesArray.push(requestedEmailAddressString);
        this.logger.info(`Added New alias:${requestedEmailAddressString}, personId:${personId}, username:${username}`);

        const params: ChangeUserParams = {
            contextId: this.contextID,
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

            return this.logger.error(
                `Could not change email-address for oxUserId:${person.oxUserId}, personId:${personId}, username:${username}, error:${result.error.message}`,
            );
        }

        this.logger.info(
            `Changed primary email-address in OX for user, personId:${personId}, username:${username}, oxUserId:${person.oxUserId}, oxUsername:${person.referrer}, new email-address:${requestedEmailAddressString}`,
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
