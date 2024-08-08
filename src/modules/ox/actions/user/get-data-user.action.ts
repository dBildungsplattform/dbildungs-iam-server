import { DomainError } from '../../../../shared/error/domain.error.js';
import { NS2_SCHEMA, NS6_SCHEMA, TNS_SCHEMA } from '../../schemas.js';
import { AuthParams, OxBaseAction } from '../ox-base-action.js';

// Incomplete
export type GetDataForUserParams = AuthParams & {
    contextId: string;

    userId: string;
};

export type GetDataForUserResponse = {
    id: string;
    firstname: string;
    lastname: string;
    username: string;
    primaryEmail: string;
    mailenabled: boolean;
};

export type GetDataForUserResponseBody = {
    getDataResponse: {
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

export class GetDataForUserAction extends OxBaseAction<GetDataForUserResponseBody, GetDataForUserResponse> {
    public override action: string = 'http://soap.admin.openexchange.com/getData';

    public override soapServiceName: string = 'OXUserService';

    public constructor(private readonly params: GetDataForUserParams) {
        super();
    }

    public override buildRequest(): object {
        return {
            'tns:getData': {
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
                    login: this.params.login,
                    password: this.params.password,
                },
            },
        };
    }

    public override parseBody(body: GetDataForUserResponseBody): Result<GetDataForUserResponse, DomainError> {
        return {
            ok: true,
            value: {
                id: body.getDataResponse.return.id,
                firstname: body.getDataResponse.return.given_name,
                lastname: body.getDataResponse.return.sur_name,
                username: body.getDataResponse.return.name,
                primaryEmail: body.getDataResponse.return.primaryEmail,
                mailenabled: body.getDataResponse.return.mailenabled,
            },
        };
    }
}
