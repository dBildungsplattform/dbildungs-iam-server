import { DomainError } from '../../../../shared/error/domain.error.js';
import { NS2_SCHEMA, NS6_SCHEMA, TNS_SCHEMA } from '../../schemas.js';
import { AuthParams, OxBaseAction } from '../ox-base-action.js';

// Incomplete
export type CreateUserParams = AuthParams & {
    contextId: string;

    displayName: string; //has to be unique in OX
    email1: string; //has to be unique in OX
    username: string; //has to be unique in OX
    firstname: string;
    mailEnabled: boolean;
    lastname: string;
    primaryEmail: string; //has to be unique in OX
    userPassword: string;
};

export type CreateUserResponse = {
    id: string;
    firstname: string;
    lastname: string;
    username: string;
    primaryEmail: string;
    mailenabled: boolean;
};

export type CreateUserResponseBody = {
    createResponse: {
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
};

export class CreateUserAction extends OxBaseAction<CreateUserResponseBody, CreateUserResponse> {
    public override action: string = 'http://soap.admin.openexchange.com/create';

    public override soapServiceName: string = 'OXUserService';

    public constructor(private readonly params: CreateUserParams) {
        super();
    }

    public override buildRequest(): object {
        return {
            'tns:create': {
                '@_xmlns:tns': TNS_SCHEMA,
                '@_xmlns:ns2': NS2_SCHEMA,
                '@_xmlns:ns6': NS6_SCHEMA,

                'tns:ctx': {
                    'ns6:id': this.params.contextId,
                },

                'tns:usrdata': {
                    'ns6:display_name': this.params.displayName,
                    'ns6:email1': this.params.email1,
                    'ns6:given_name': this.params.firstname,
                    'ns6:mailenabled': this.params.mailEnabled,
                    'ns6:name': this.params.username,
                    'ns6:sur_name': this.params.lastname,
                    'ns6:primaryEmail': this.params.primaryEmail,
                    'ns6:password': this.params.userPassword,
                },

                'tns:auth': {
                    'ns2:login': this.params.login,
                    'ns2:password': this.params.password,
                },
            },
        };
    }

    public override parseBody(body: CreateUserResponseBody): Result<CreateUserResponse, DomainError> {
        return {
            ok: true,
            value: {
                id: String(body.createResponse.return.id),
                firstname: body.createResponse.return.given_name,
                lastname: body.createResponse.return.sur_name,
                username: body.createResponse.return.name,
                primaryEmail: body.createResponse.return.primaryEmail,
                mailenabled: body.createResponse.return.mailenabled,
            },
        };
    }
}
