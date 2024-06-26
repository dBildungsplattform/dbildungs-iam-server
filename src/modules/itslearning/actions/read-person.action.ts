import { DomainError } from '../../../shared/error/domain.error.js';
import { IMS_COMMON_SCHEMA, IMS_PERSON_MAN_MESS_SCHEMA } from '../schemas.js';
import { IMSESAction } from './base-action.js';

type InstitutionRoleType =
    | 'Student'
    | 'Faculty'
    | 'Member'
    | 'Learner'
    | 'Instructor'
    | 'Mentor'
    | 'Staff'
    | 'Alumni'
    | 'ProspectiveStudent'
    | 'Guest'
    | 'Other'
    | 'Administrator'
    | 'Observer';

export type PersonResponse = {
    formatName?: string;
    institutionRole: InstitutionRoleType;
    primaryRoleType: boolean;
    userId: string;
};

// Incomplete
type ReadPersonResponseBody = {
    readPersonResponse: {
        person: {
            formatName?: string;
            name: {
                partName: {
                    namePartType: string;
                    namePartValue: string;
                }[];
            };
            email?: string;
            userId: {
                userIdValue: string;
            };
            institutionRole: {
                institutionRoleType: InstitutionRoleType;
                primaryRoleType: boolean;
            };
        };
    };
};

export class ReadPersonAction extends IMSESAction<ReadPersonResponseBody, PersonResponse> {
    public override action: string = 'http://www.imsglobal.org/soap/pms/readPerson';

    public constructor(private readonly id: string) {
        super();
    }

    public override isArrayOverride(tagName: string): boolean {
        return ['partName'].includes(tagName);
    }

    public override buildRequest(): object {
        return {
            'ims:readPersonRequest': {
                '@_xmlns:ims': IMS_PERSON_MAN_MESS_SCHEMA,
                '@_xmlns:ims1': IMS_COMMON_SCHEMA,

                'ims:sourcedId': {
                    'ims1:identifier': this.id,
                },
            },
        };
    }

    public override parseBody(body: ReadPersonResponseBody): Result<PersonResponse, DomainError> {
        return {
            ok: true,
            value: {
                formatName: body.readPersonResponse.person.formatName,
                institutionRole: body.readPersonResponse.person.institutionRole.institutionRoleType,
                primaryRoleType: body.readPersonResponse.person.institutionRole.primaryRoleType,
                userId: body.readPersonResponse.person.userId.userIdValue,
            },
        };
    }
}
