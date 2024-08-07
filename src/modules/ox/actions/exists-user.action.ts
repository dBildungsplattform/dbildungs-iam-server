import { DomainError } from '../../../shared/error/domain.error.js';
import { NS2_SCHEMA, NS6_SCHEMA, TNS_SCHEMA } from '../schemas.js';
import { OxBaseAction } from './ox-base-action.js';

// Incomplete
export type ExistsUserParams = {
    contextId: string;

    username: string;

    login: string;
    password: string;
};

export type ExistsUserResponse = {
    exists: boolean;
};

export type ExistsUserResponseBody = {
    existsResponse: {
        return: boolean;
    };
};

export class ExistsUserAction extends OxBaseAction<ExistsUserResponseBody, ExistsUserResponse> {
    public override action: string = 'http://soap.admin.openexchange.com/exists';

    public constructor(private readonly params: ExistsUserParams) {
        super();
    }

    public override buildRequest(): object {
        return {
            'tns:exists': {
                '@_xmlns:tns': TNS_SCHEMA,
                '@_xmlns:ns2': NS2_SCHEMA,
                '@_xmlns:ns6': NS6_SCHEMA,

                'tns:ctx': {
                    'ns6:id': this.params.contextId,
                },

                'tns:user': {
                    //either display_name or name have to be provided to verify existence in OX
                    'ns6:name': this.params.username,
                },

                'tns:auth': {
                    'ns2:login': this.params.login,
                    'ns2:password': this.params.password,
                },
            },
        };
    }

    public override parseBody(body: ExistsUserResponseBody): Result<ExistsUserResponse, DomainError> {
        return {
            ok: true,
            value: {
                exists: body.existsResponse.return,
            },
        };
    }
}
