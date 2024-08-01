import { DomainError } from '../../../shared/error/domain.error.js';
import { NS2_SCHEMA, NS6_SCHEMA, TNS_SCHEMA } from '../schemas.js';
import { OxBaseAction } from './ox-base-action.js';

// Incomplete
export type CreateUserParams = {
    contextId: string;

    anniversary: string;
    email1: string;
    givenname: string;
    mailenabled: boolean;
    name: string;

    login: string;
    password: string;
};

type CreateUserResponseBody = {
    createPersonResponse: undefined;
};

export class CreateUserAction extends OxBaseAction<CreateUserResponseBody, void> {
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
                    'ns6:anniversary': this.params.anniversary,
                    'ns6:email1': this.params.email1,
                    'ns6:givenname': this.params.givenname,
                    'ns6:mailenabled': this.params.mailenabled,
                    'ns6:name': this.params.name,
                },

                'tns:auth': {
                    'ns2:login': this.params.login,
                    'ns2:password': this.params.password,
                },
            },
        };
    }

    public override parseBody(): Result<void, DomainError> {
        // Response does not contain data
        return {
            ok: true,
            value: undefined,
        };
    }
}
