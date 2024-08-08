import { DomainError } from '../../../../shared/error/domain.error.js';
import { NS2_SCHEMA, NS6_SCHEMA, TNS_SCHEMA } from '../../schemas.js';
import { AuthParams, OxBaseAction, OXRequestStatus } from '../ox-base-action.js';

// Incomplete
export type AddMemberToGroupParams = AuthParams & {
    contextId: string;

    groupId: string;

    memberId: string;
};

export type AddMemberToGroupResponse = {
    status: OXRequestStatus;
    data: AddMemberToGroupResponseBody;
};

export type AddMemberToGroupResponseBody = {
    // body is empty
};

export class AddMemberToGroupAction extends OxBaseAction<AddMemberToGroupResponseBody, AddMemberToGroupResponse> {
    public override action: string = 'http://soap.admin.openexchange.com/addMember';

    public override soapServiceName: string = 'OXGroupService';

    public constructor(private readonly params: AddMemberToGroupParams) {
        super();
    }

    public override buildRequest(): object {
        return {
            'tns:addMember': {
                '@_xmlns:tns': TNS_SCHEMA,
                '@_xmlns:ns2': NS2_SCHEMA,
                '@_xmlns:ns6': NS6_SCHEMA,

                'tns:ctx': {
                    'ns6:id': this.params.contextId,
                },

                'tns:grp': {
                    //displayname and name could also be passed along
                    'ns6:id': this.params.groupId,
                },

                'tns:members': {
                    'ns6:id': this.params.memberId,
                },

                'tns:auth': {
                    'ns2:login': this.params.login,
                    'ns2:password': this.params.password,
                },
            },
        };
    }

    public override parseBody(body: AddMemberToGroupResponseBody): Result<AddMemberToGroupResponse, DomainError> {
        return {
            ok: true,
            value: {
                status: {
                    code: 'success',
                },
                data: body,
            },
        };
    }
}
