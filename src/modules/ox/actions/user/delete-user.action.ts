import { DomainError } from '../../../../shared/error/domain.error.js';
import { NS2_SCHEMA, NS6_SCHEMA, TNS_SCHEMA } from '../../schemas.js';
import { OxBaseAction } from '../ox-base-action.js';
import { UserIdParams } from './ox-user.types.js';

export type DeleteUserResponse2 = {
    exists: boolean;
};

export type DeleteUserResponseBody2 = {
    existsResponse: {
        return: boolean;
    };
};

export type DeleteUserResponseBody3 = {
    body: undefined;
};

/*export type DeleteUserResponse = {
    id: string;
    firstname: string;
    lastname: string;
    username: string;
    primaryEmail: string;
    mailenabled: boolean;
};

export type DeleteUserResponseBody = {
    deleteResponse: {
        return: {
            id: string;
            aliases: [];
            email1: string;
            email2: string;
            email3: string;
            primaryEmail: string;

            name: string;
            given_name: string;
            sur_name: string;
            mailenabled: boolean;
        };
    };
};*/

export class DeleteUserAction extends OxBaseAction<DeleteUserResponseBody3, void> {
    public override action: string = 'http://soap.admin.openexchange.com/delete';

    public override soapServiceName: string = 'OXUserService';

    public constructor(private readonly params: UserIdParams) {
        super();
    }

    public override buildRequest(): object {
        return {
            'tns:delete': {
                '@_xmlns:tns': TNS_SCHEMA,
                '@_xmlns:ns2': NS2_SCHEMA,
                '@_xmlns:ns6': NS6_SCHEMA,

                'tns:ctx': {
                    'ns6:id': this.params.contextId,
                },

                'tns:user': {
                    'ns6:id': this.params.userId,
                },

                'tns:auth': {
                    'ns2:login': this.params.login,
                    'ns2:password': this.params.password,
                },
            },
        };
    }

    public override parseBody(): Result<void, DomainError> {
        return {
            ok: true,
            value: undefined,
        };
        /*return {
            ok: true,
            value: {
                id: body.deleteResponse.return.id,
                firstname: body.deleteResponse.return.given_name,
                lastname: body.deleteResponse.return.sur_name,
                username: body.deleteResponse.return.name,
                primaryEmail: body.deleteResponse.return.primaryEmail,
                mailenabled: body.deleteResponse.return.mailenabled,
            },
        };*/
    }
}
