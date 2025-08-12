import {
    OXContextID,
    OXContextName,
    OXGroupID,
    OXGroupName,
    OXUserID,
    OXUserName,
} from '../../../shared/types/ox-ids.types.js';
import { ConfigService } from '@nestjs/config';
import { ServerConfig } from '../../../shared/config/server.config.js';
import { OxConfig } from '../../../shared/config/ox.config.js';
import { PersonID, PersonReferrer } from '../../../shared/types/aggregate-ids.types.js';
import { EmailAddress, EmailAddressStatus } from '../../email/domain/email-address.js';
import { EmailRepo } from '../../email/persistence/email.repo.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { EventRoutingLegacyKafkaService } from '../../../core/eventbus/services/event-routing-legacy-kafka.service.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { CreateGroupAction, CreateGroupParams, CreateGroupResponse } from '../actions/group/create-group.action.js';
import { ListGroupsAction, ListGroupsParams, ListGroupsResponse } from '../actions/group/list-groups.action.js';
import { OxGroupNotFoundError } from '../error/ox-group-not-found.error.js';
import { OxGroupNameAmbiguousError } from '../error/ox-group-name-ambiguous.error.js';
import { OxService } from './ox.service.js';
import { OxUserChangedEvent } from '../../../shared/events/ox/ox-user-changed.event.js';
import { KafkaOxUserChangedEvent } from '../../../shared/events/ox/kafka-ox-user-changed.event.js';
import { DisabledOxUserChangedEvent } from '../../../shared/events/ox/disabled-ox-user-changed.event.js';
import { KafkaDisabledOxUserChangedEvent } from '../../../shared/events/ox/kafka-disabled-ox-user-changed.event.js';
import {
    ListGroupsForUserAction,
    ListGroupsForUserParams,
    ListGroupsForUserResponse,
} from '../actions/group/list-groups-for-user.action.js';
import { PersonIdentifier } from '../../../core/logging/person-identifier.js';
import {
    RemoveMemberFromGroupAction,
    RemoveMemberFromGroupResponse,
} from '../actions/group/remove-member-from-group.action.js';
import { GroupMemberParams, OXGroup } from '../actions/group/ox-group.types.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';

export type OxUserChangedEventCreator = (
    personId: PersonID,
    username: PersonReferrer,
    oxUserId: OXUserID,
    oxUserName: OXUserName,
    oxContextId: OXContextID,
    oxContextName: OXContextName,
    emailAddress: string,
) => [OxUserChangedEvent, KafkaOxUserChangedEvent];

export const generateOxUserChangedEvent: OxUserChangedEventCreator = (
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

export const generateDisabledOxUserChangedEvent: OxUserChangedEventCreator = (
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

export abstract class AbstractOxEventHandler {
    protected static readonly LEHRER_OX_GROUP_NAME_PREFIX: string = 'lehrer-';

    protected static readonly LEHRER_OX_GROUP_DISPLAY_NAME_PREFIX: string = 'lehrer-';

    public ENABLED: boolean;

    protected readonly authUser: string;

    protected readonly authPassword: string;

    protected readonly contextID: OXContextID;

    protected readonly contextName: OXContextName;

    public constructor(
        protected readonly logger: ClassLogger,
        protected readonly oxService: OxService,
        protected readonly emailRepo: EmailRepo,
        protected readonly personRepository: PersonRepository,
        protected readonly eventService: EventRoutingLegacyKafkaService,
        protected configService: ConfigService<ServerConfig>,
    ) {
        const oxConfig: OxConfig = configService.getOrThrow<OxConfig>('OX');
        this.ENABLED = oxConfig.ENABLED;
        this.authUser = oxConfig.USERNAME;
        this.authPassword = oxConfig.PASSWORD;
        this.contextID = oxConfig.CONTEXT_ID;
        this.contextName = oxConfig.CONTEXT_NAME;
    }

    protected async getMostRecentEnabledOrRequestedEmailAddress(
        personId: PersonID,
    ): Promise<Option<EmailAddress<true>>> {
        const enabledEmailAddresses: Option<EmailAddress<true>[]> =
            await this.emailRepo.findByPersonSortedByUpdatedAtDesc(personId, EmailAddressStatus.ENABLED);
        if (!enabledEmailAddresses || !enabledEmailAddresses[0]) {
            this.logger.warning(`No ENABLED email-address found for personId:${personId}`);
        } else {
            this.logger.info(
                `Found mostRecentEnabled Email-Address:${JSON.stringify(enabledEmailAddresses[0].address)} for personId:${personId}`,
            );
            return enabledEmailAddresses[0];
        }

        const requestedEmailAddresses: Option<EmailAddress<true>[]> =
            await this.emailRepo.findByPersonSortedByUpdatedAtDesc(personId, EmailAddressStatus.REQUESTED);
        if (!requestedEmailAddresses || !requestedEmailAddresses[0]) {
            this.logger.error(`Neither REQUESTED nor ENABLED email-address found for personId:${personId}`);
            return undefined;
        }
        this.logger.info(
            `Found mostRecentRequested Email-Address:${JSON.stringify(requestedEmailAddresses[0].address)} for personId:${personId}`,
        );

        return requestedEmailAddresses[0];
    }

    protected async createOxGroup(oxGroupName: OXGroupName, displayName: string): Promise<Result<OXGroupID>> {
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

    protected async getOxGroupByName(oxGroupName: OXGroupName): Promise<OXGroupID | DomainError> {
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

    protected async getExistingOxGroupByNameOrCreateOxGroup(
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

    protected async getOxGroupsForOxUserId(oxUserId: OXUserID): Promise<Result<ListGroupsForUserResponse>> {
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

    protected async removeOxUserFromOxGroup(
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

    protected async removeOxUserFromAllItsOxGroups(
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
}
