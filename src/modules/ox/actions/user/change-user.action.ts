import { DomainError } from '../../../../shared/error/domain.error.js';
import { NS2_SCHEMA, NS6_SCHEMA, TNS_SCHEMA } from '../../schemas.js';
import { AuthParams, OxBaseAction } from '../ox-base-action.js';

// Incomplete
export type ChangeUserParams = AuthParams & {
    contextId: string;

    username: string;
    email1: string;
    primaryEmail: string;
    defaultSenderAddress: string;
    aliases: string[];
};

export type ChangeUserResponse = {
    id: string;
    firstname: string;
    lastname: string;
    username: string;
    primaryEmail: string;
    mailenabled: boolean;
};

export type ChangeUserResponseBody = {
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

type TnsUsrData = {
    [key: string]: any;
    'tns:aliases'?: object;
};
type TnsChange = {
    [key: string]: any;
    'tns:usrdata': TnsUsrData;
};
type ChangeRequestObj = {
    'tns:change': TnsChange;
};

export class ChangeUserAction extends OxBaseAction<ChangeUserResponseBody, ChangeUserResponse> {
    public override action: string = 'http://soap.admin.openexchange.com/change';

    public override soapServiceName: string = 'OXUserService';

    public constructor(private readonly params: ChangeUserParams) {
        super();
    }

    public override buildRequest(): object {
        const aliasesObj: object[] = [];
        for (const alias of this.params.aliases) {
            aliasesObj.push({
                'ns6:aliases': alias,
            });
        }
        const requestObj: ChangeRequestObj = {
            'tns:change': {
                '@_xmlns:tns': TNS_SCHEMA,
                '@_xmlns:ns2': NS2_SCHEMA,
                '@_xmlns:ns6': NS6_SCHEMA,

                'tns:ctx': {
                    'ns6:id': this.params.contextId,
                },

                'tns:usrdata': {
                    'ns6:email1': this.params.email1,
                    'ns6:name': this.params.username,
                    'ns6:primaryEmail': this.params.primaryEmail,
                    'ns6:defaultSenderAddress': this.params.defaultSenderAddress,
                },

                'tns:auth': {
                    'ns2:login': this.params.login,
                    'ns2:password': this.params.password,
                },
            },
        };
        requestObj['tns:change']['tns:usrdata']['tns:aliases'] = aliasesObj;

        return requestObj;
    }

    public override parseBody(body: ChangeUserResponseBody): Result<ChangeUserResponse, DomainError> {
        return {
            ok: true,
            value: {
                id: body.createResponse.return.id,
                firstname: body.createResponse.return.given_name,
                lastname: body.createResponse.return.sur_name,
                username: body.createResponse.return.name,
                primaryEmail: body.createResponse.return.primaryEmail,
                mailenabled: body.createResponse.return.mailenabled,
            },
        };
    }
}
