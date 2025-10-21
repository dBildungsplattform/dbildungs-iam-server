import { ConfigService } from '@nestjs/config';
import { ClassLogger } from '../../../../core/logging/class-logger.js';
import { EmailAppConfig } from '../../../../shared/config/email-app.config.js';
import { OXContextID, OXContextName, OXGroupID, OXUserID } from '../../../../shared/types/ox-ids.types.js';
import { AddMemberToGroupAction } from '../actions/group/add-member-to-group.action.js';
import {
    ChangeByModuleAccessAction,
    ChangeByModuleAccessParams,
} from '../actions/user/change-by-module-access.action.js';
import { ChangeUserAction, ChangeUserParams } from '../actions/user/change-user.action.js';
import { DeleteUserAction } from '../actions/user/delete-user.action.js';
import { ExistsUserAction } from '../actions/user/exists-user.action.js';
import { GetDataForUserAction } from '../actions/user/get-data-user.action.js';
import { OxConfig } from '../../../../shared/config/ox.config.js';
import { Injectable } from '@nestjs/common';
import { OxSendService } from './ox-send-service.js';
import { GroupMemberParams } from '../actions/group/ox-group.types.js';
import { UserIdParams, UserNameParams } from '../actions/user/ox-user.types.js';
import { PersonReferrer } from '../../../../shared/types/aggregate-ids.types.js';
import { CreateUserAction, CreateUserParams } from '../actions/user/create-user.action.js';

@Injectable()
export class OxService {
    public static readonly LEHRER_OX_GROUP_NAME_PREFIX: string = 'lehrer-';

    public static readonly LEHRER_OX_GROUP_DISPLAY_NAME_PREFIX: string = 'lehrer-';

    public ENABLED: boolean;

    public readonly authUser: string;

    public readonly authPassword: string;

    public readonly contextID: OXContextID;

    public readonly contextName: OXContextName;

    public readonly userPasswordDefault: string;

    public readonly emailAddressDeletedEventDelay: number;

    public constructor(
        protected readonly logger: ClassLogger,
        protected readonly oxSendService: OxSendService,
        protected configService: ConfigService<EmailAppConfig>,
    ) {
        const oxConfig: OxConfig = configService.getOrThrow<OxConfig>('OX');
        this.ENABLED = oxConfig.ENABLED;
        this.authUser = oxConfig.USERNAME;
        this.authPassword = oxConfig.PASSWORD;
        this.contextID = oxConfig.CONTEXT_ID;
        this.contextName = oxConfig.CONTEXT_NAME;
        this.userPasswordDefault = oxConfig.USER_PASSWORD_DEFAULT;
        this.emailAddressDeletedEventDelay = oxConfig.EMAIL_ADDRESS_DELETED_EVENT_DELAY ?? 0;
    }

    public createChangeUserAction(
        oxUserId: OXUserID,
        oxUserName?: string,
        aliases?: string[],
        givenname?: string,
        surname?: string,
        displayName?: string,
        defaultSenderAddress?: string,
        primaryEmail?: string,
    ): ChangeUserAction {
        //change oxUserName to avoid conflicts for future OX-createUser-requests
        const params: ChangeUserParams = {
            contextId: this.contextID,
            contextName: this.contextName,
            userId: oxUserId,
            username: oxUserName,
            aliases: aliases,

            givenname: givenname,
            surname: surname,
            displayname: displayName,
            defaultSenderAddress: defaultSenderAddress,
            email1: primaryEmail,
            primaryEmail: primaryEmail,

            login: this.authUser,
            password: this.authPassword,
        };

        const action: ChangeUserAction = new ChangeUserAction(params);
        return action;
    }

    public createGetDataForUserAction(oxUserId: OXUserID): GetDataForUserAction {
        const idParams: UserIdParams = {
            contextId: this.contextID,
            userId: oxUserId,
            login: this.authUser,
            password: this.authPassword,
        };

        const getDataAction: GetDataForUserAction = new GetDataForUserAction(idParams);
        return getDataAction;
    }

    public createDeleteUserAction(oxUserId: OXUserID): DeleteUserAction {
        const params: UserIdParams = {
            contextId: this.contextID,
            userId: oxUserId,
            login: this.authUser,
            password: this.authPassword,
        };

        const action: DeleteUserAction = new DeleteUserAction(params);
        return action;
    }

    public createAddMemberToGroupAction(oxGroupId: OXGroupID, oxUserId: OXUserID): AddMemberToGroupAction {
        const params: GroupMemberParams = {
            contextId: this.contextID,
            groupId: oxGroupId,
            memberId: oxUserId,
            login: this.authUser,
            password: this.authPassword,
        };

        const action: AddMemberToGroupAction = new AddMemberToGroupAction(params);
        return action;
    }

    public createExistsUserAction(username: PersonReferrer): ExistsUserAction {
        const existsParams: UserNameParams = {
            contextId: this.contextID,
            userName: username,
            login: this.authUser,
            password: this.authPassword,
        };

        const existsAction: ExistsUserAction = new ExistsUserAction(existsParams);
        return existsAction;
    }

    public createCreateUserAction(methodParams: {
        displayName: string;
        username: string;
        firstname: string;
        lastname: string;
        primaryEmail: string;
    }): CreateUserAction {
        const params: CreateUserParams = {
            contextId: this.contextID,
            displayName: methodParams.displayName,
            email1: methodParams.primaryEmail,
            username: methodParams.username,
            firstname: methodParams.firstname,
            mailEnabled: true,
            lastname: methodParams.lastname,
            primaryEmail: methodParams.primaryEmail,
            userPassword: this.userPasswordDefault,
            login: this.authUser,
            password: this.authPassword,
        };

        const action: CreateUserAction = new CreateUserAction(params);
        return action;
    }

    public createChangeByModuleAccessAction(userId: string): ChangeByModuleAccessAction {
        //adjust user infostore and globalAddressBook
        const changeByModuleAccessParams: ChangeByModuleAccessParams = {
            contextId: this.contextID,
            userId: userId,
            globalAddressBookDisabled: true,
            infostore: false,
            login: this.authUser,
            password: this.authPassword,
        };
        const changeByModuleAccessAction: ChangeByModuleAccessAction = new ChangeByModuleAccessAction(
            changeByModuleAccessParams,
        );
        return changeByModuleAccessAction;
    }
}
