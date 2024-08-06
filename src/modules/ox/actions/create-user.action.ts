import { DomainError } from '../../../shared/error/domain.error.js';
import { NS2_SCHEMA, NS6_SCHEMA, TNS_SCHEMA } from '../schemas.js';
import { OxBaseAction } from './ox-base-action.js';

// Incomplete
export type CreateUserParams = {
    contextId: string;

    displayName: string;
    email1: string;
    firstname: string;
    givenName: string;
    mailEnabled: boolean;
    lastname: string;
    primaryEmail: string;
    userPassword: string;

    login: string;
    password: string;
};

export type CreateUserResponse = {
    firstname: string;
    lastname: string;
    primaryEmail: string;
    mailenabled: boolean;
};

export type CreateUserResponseBody = {
    createResponse: {
        return: {
            'ns2:aliases': [];
            'ns2:email1': string;
            'ns2:email2': string;
            'ns2:email3': string;
            'ns2:primaryEmail': string;

            'ns2:name': string;
            'ns2:sur_name': string;
            'ns2:mailenabled': boolean;
        };
    };
};

export class CreateUserAction extends OxBaseAction<CreateUserResponseBody, CreateUserResponse> {
    public override action: string = 'http://soap.admin.openexchange.com/create';

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
                    'ns6:given_name': this.params.givenName,
                    'ns6:mailenabled': this.params.mailEnabled,
                    'ns6:name': this.params.firstname,
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
                firstname: body.createResponse.return['ns2:name'],
                lastname: body.createResponse.return['ns2:sur_name'],
                primaryEmail: body.createResponse.return['ns2:primaryEmail'],
                mailenabled: body.createResponse.return['ns2:mailenabled'],
            },
        };
    }
}
