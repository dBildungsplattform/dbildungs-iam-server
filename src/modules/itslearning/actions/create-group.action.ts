import { DomainError } from '../../../shared/error/domain.error.js';
import { IMS_COMMON_SCHEMA, IMS_GROUP_MAN_DATA_SCHEMA, IMS_GROUP_MAN_MESS_SCHEMA } from '../schemas.js';
import { IMSESAction } from './base-action.js';
import { CreateGroupParams } from './create-group.params.js';

type CreateGroupResponseBody = {
    createGroupResponse: undefined;
};

export class CreateGroupAction extends IMSESAction<CreateGroupResponseBody, void> {
    public override action: string = 'http://www.imsglobal.org/soap/gms/createGroup';

    public constructor(private readonly params: CreateGroupParams) {
        super();
    }

    public override buildRequest(): object {
        let extension: object[] | undefined;
        if (this.params.type === 'Course') {
            extension = [
                {
                    'ims1:fieldName': 'course',
                    'ims1:fieldType': 'String',
                    'ims1:fieldValue': this.params.name,
                },
                {
                    'ims1:fieldName': 'course/code',
                    'ims1:fieldType': 'String',
                    'ims1:fieldValue': this.params.name,
                },
            ];
        }

        return {
            'ims:createGroupRequest': {
                '@_xmlns:ims': IMS_GROUP_MAN_MESS_SCHEMA,
                '@_xmlns:ims1': IMS_COMMON_SCHEMA,
                '@_xmlns:ims2': IMS_GROUP_MAN_DATA_SCHEMA,

                'ims:sourcedId': {
                    'ims1:identifier': this.params.id,
                },

                'ims:group': {
                    'ims2:groupType': {
                        'ims2:scheme': 'ItslearningOrganisationTypes',
                        'ims2:typeValue': {
                            'ims2:type': this.params.type,
                        },
                    },
                    'ims2:relationship': {
                        'ims2:relation': 'Parent',
                        'ims2:sourceId': {
                            'ims1:identifier': this.params.parentId,
                        },
                        'ims2:label': this.params.relationLabel,
                    },
                    'ims2:description': {
                        'ims2:descShort': this.params.name,
                        'ims2:descLong': this.params.longDescription,
                        'ims2:descFull': this.params.fullDescription,
                    },
                    'ims2:extension': extension && { 'ims1:extensionField': extension },
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
