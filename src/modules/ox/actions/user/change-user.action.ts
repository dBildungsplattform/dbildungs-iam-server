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
    body: undefined,
};

/*type Alias = {
    'ns6:aliases': string;
}
type TnsUsrData = {
    [key: string]: string | object | undefined;
    aliases?: Alias[];
};
type TnsChange = {
    [key: string]: string | object;
    'tns:usrdata': TnsUsrData;
};
type ChangeRequestObj = {
    'tns:change': TnsChange;
};*/

export class ChangeUserAction extends OxBaseAction<ChangeUserResponseBody, void> {
    public override action: string = 'http://soap.admin.openexchange.com/change';

    public override soapServiceName: string = 'OXUserService';

    public constructor(private readonly params: ChangeUserParams) {
        super();
    }

    public override buildRequest(): object {
      /*  const aliasesObj: Alias[] = [];
        for (const alias of this.params.aliases) {
            aliasesObj.push({
                'ns6:aliases': alias,
            });
        }*/
        const requestObj: object = {
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
                    'ns6:aliases': this.params.aliases,
                },

                'tns:auth': {
                    'ns2:login': this.params.login,
                    'ns2:password': this.params.password,
                },
            },
        };
        //requestObj['tns:change']['tns:usrdata']
      /*  const usrDataWithoutAliasesObj = {
                'ns6:email1': this.params.email1,
                'ns6:name': this.params.username,
                'ns6:primaryEmail': this.params.primaryEmail,
                'ns6:defaultSenderAddress': this.params.defaultSenderAddress,
            };
        const usrDataObj: TnsUsrData = { usrDataWithoutAliasesObj, aliasesObj};
        requestObj['tns:change']['tns:usrdata'] = usrDataObj;*/

        return requestObj;
    }

    public override parseBody(): Result<void, DomainError> {
        // response does not contain relevant data
        return {
            ok: true,
            value: undefined,
        };
    }
}
